import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentNetwork, PaymentStatus, SubscriptionStatus, InviteStatus } from '@/generated/prisma';
import type { PaymentItem, Role, Subscription } from '@/generated/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email-service';
import { revalidatePath } from 'next/cache';

interface CreateInvoiceRequest {
  amount: number;
  currency: string;
  network: string;
  pairIds?: string[];
  orderData: {
    pairIds?: string[];
    plan?: {
      period: string;
      months: number;
      price: number;
    };
    tradingViewUsername?: string;
    // Allow flexible structure for compatibility
    tier?: string;
    duration?: string;
    userId?: string;
    paymentItems?: {
      pairId: string;
      basePrice: number;
      discountRate: number;
      finalPrice: number;
      period: string;
      action?: 'subscribe' | 'upgrade'; // Flag to indicate if this is an upgrade
    }[];
  };
}

// Map network string to PaymentNetwork enum
function mapNetworkToEnum(network: string): PaymentNetwork {
  switch (network.toLowerCase()) {
    case 'usdt':
    case 'usdttrc20':
    case 'trc20':
      return PaymentNetwork.USDT_TRC20;
    case 'usdterc20':
    case 'erc20':
      return PaymentNetwork.USDT_ERC20;
    case 'usdtbsc':
    case 'usdtbep20':
    case 'bep20':
      return PaymentNetwork.USDT_BEP20;
    case 'btc':
    case 'bitcoin':
      return PaymentNetwork.BTC;
    case 'eth':
    case 'ethereum':
      return PaymentNetwork.ETH;
    default:
      // Default to USDT_TRC20 for unknown networks
      return PaymentNetwork.USDT_TRC20;
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: CreateInvoiceRequest = await request.json();

    // Validate request
    if (!body.amount || !body.currency || !body.network || !body.orderData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract pairIds from either location for backwards compatibility
    const pairIds = body.pairIds || body.orderData.pairIds || [];
    if (!pairIds.length) {
      return NextResponse.json({ error: 'Missing pairIds' }, { status: 400 });
    }

    // Validate minimum amount
    if (body.amount < 5) {
      return NextResponse.json(
        { error: 'Minimum amount is $5 USD for cryptocurrency payments' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NOWPAYMENTS_API_KEY) {
      await createAuditLog({
        actorId: session?.user?.id || 'system',
        actorRole: 'USER',
        action: AuditAction.CREATE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: { reason: 'nowpayments_api_key_missing' },
      });
      return NextResponse.json(
        { error: 'NOWPayments API key not configured' },
        { status: 500 }
      );
    }

    const userId = session.user.id;

    // Step 1: Create invoice with NOWPayments
    const invoice = await createNOWPaymentsInvoice(body, pairIds, userId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    // Step 2: Create invoice payment with NOWPayments
    const payment = await createNOWPaymentsInvoicePayment(invoice.id, body.network);
    if (!payment) {
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }
    // Step 3: Create payment record with subscriptions and payment items in one transaction
    const paymentRecord = await createPaymentWithSubscriptionsAndItems(body, userId, invoice, payment, pairIds);

    // Transform response
    const transformedInvoice = transformInvoiceResponse(invoice, payment, body);

    // Audit log
    await createAuditLog({
      actorId: userId,
      actorRole: 'USER',
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: paymentRecord.id,
      responseStatus: 'SUCCESS',
      details: {
        createdInvoice: {
          id: paymentRecord.id,
          invoiceId: invoice.id,
          paymentId: payment.payment_id,
          amount: body.amount,
          currency: body.currency,
          network: body.network,
          pairIds: pairIds,
          orderId: transformedInvoice.orderId,
          expiresAt: transformedInvoice.expiresAt,
        },
        actorEmail: session?.user?.email,
        actorName: session?.user?.name,
      },
    });

    // Send payment receipt emails for each subscription
    try {
      for (const subscription of paymentRecord.subscription) {
        const pair = await prisma.pair.findUnique({
          where: { id: subscription.pairId },
          select: { symbol: true }
        });

        if (pair) {
          await sendEmail({
            userId: userId,
            role: 'USER',
            template: 'payment_receipt',
            to: session?.user?.email || '',
            params: {
              name: session?.user?.name || 'User',
              pair: pair.symbol,
              period: subscription.period.toLowerCase().replace('_', ' '),
              amount: body.amount.toString(),
              network: body.network.toUpperCase(),
              txHash: payment.pay_address,
              expiryDate: subscription.expiryDate.toLocaleDateString(),
              tradingViewUsername: body.orderData.tradingViewUsername || '',
              dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
            },
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send payment receipt email:', emailError);
      // Don't fail the payment creation if email fails
    }

    return NextResponse.json({
      ...transformedInvoice,
      payment: {
        id: paymentRecord.id,
      },
    });
  } catch (error) {
    console.error('Error creating NOWPayments invoice:', error);

    await createAuditLog({
      actorId: 'system',
      actorRole: 'USER',
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper Functions

async function createNOWPaymentsInvoice(
  body: CreateInvoiceRequest,
  pairIds: string[],
  userId: string
) {
  const nowPaymentsUrl = process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io';
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getPeriodDescription = () => {
    if (body.orderData.plan?.period) return body.orderData.plan.period;
    if (body.orderData.duration) return body.orderData.duration;
    return 'subscription';
  };

  const getCurrencyCode = (network: string): string => {
    switch (network.toLowerCase()) {
      case 'trc20': return 'usdttrc20';
      case 'erc20': return 'usdterc20';
      case 'bep20': return 'usdtbsc';
      default: return 'usdttrc20';
    }
  };

  const invoiceData = {
    price_amount: body.amount,
    price_currency: 'usd',
    pay_currency: getCurrencyCode(body.network),
    order_id: orderId,
    order_description: `AlgoMarkers.Ai: ${pairIds.join(', ')} - ${getPeriodDescription()}`,
    ipn_callback_url: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
  };

  const response = await fetch(`${nowPaymentsUrl}/v1/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('NOWPayments invoice creation failed:', response.status, errorData);
    await createAuditLog({
      actorId: userId,
      actorRole: 'USER',
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: { reason: 'nowpayments_invoice_creation_failed', error: errorData },
    });
    return null;
  }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'page');
  return await response.json();
}

async function createNOWPaymentsInvoicePayment(invoiceId: string, network: string) {
  const nowPaymentsUrl = process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io';

  const getCurrencyCode = (network: string): string => {
    switch (network.toLowerCase()) {
      case 'trc20': return 'usdttrc20';
      case 'erc20': return 'usdterc20';
      case 'bep20': return 'usdtbsc';
      default: return 'usdttrc20';
    }
  };

  const paymentData = {
    iid: invoiceId,
    pay_currency: getCurrencyCode(network),
  };

  const response = await fetch(`${nowPaymentsUrl}/v1/invoice-payment`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('NOWPayments payment creation failed:', response.status, errorData);
    await createAuditLog({
      actorId: 'system',
      actorRole: 'USER',
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: { reason: 'nowpayments_payment_creation_failed', error: errorData },
    });
    return null;
  }

  return await response.json();
}

async function createPaymentWithSubscriptionsAndItems(
  body: CreateInvoiceRequest,
  userId: string,
  invoice: any,
  payment: any,
  pairIds: string[]
) {
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const subscriptionCreates: any[] = [];
  const paymentItemCreates: any[] = [];

  // Handle multiple pairs: Create one subscription per pair, all linked to the same payment
  if (body.orderData.paymentItems && body.orderData.paymentItems.length > 0) {
    // Use the detailed payment items from basket - each item represents one pair subscription
    for (const paymentItem of body.orderData.paymentItems) {
      const months = paymentItem.period === 'ONE_MONTH' ? 1 :
                    paymentItem.period === 'THREE_MONTHS' ? 3 :
                    paymentItem.period === 'SIX_MONTHS' ? 6 :
                    paymentItem.period === 'TWELVE_MONTHS' ? 12 : 1;

      let startDate: Date;
      let expiryDate: Date;
      let inviteStatus = 'PENDING';

      // Handle upgrades: extend existing subscription expiry date
      if (paymentItem.action === 'upgrade') {
        // Find the existing active subscription for this user+pair
        const existingSubscription = await prisma.subscription.findMany({
          where: {
            userId: userId,
            pairId: paymentItem.pairId,
            status: SubscriptionStatus.PAID,
            inviteStatus: InviteStatus.COMPLETED,
          },
          orderBy: {
            expiryDate: 'desc', // Get the latest expiry date
          },
        });

        if (existingSubscription.length > 0) {
          // Start the new subscription from the end of the existing one
          startDate = new Date(existingSubscription[0].expiryDate);
          expiryDate = calculateExpiryDate(startDate, months);
          inviteStatus = InviteStatus.PENDING;
        } else {
          // Fallback: if no existing subscription found, start from today
          startDate = new Date();
          expiryDate = calculateExpiryDate(startDate, months);
        }
      } else {
        // Regular new subscription: start from today
        startDate = new Date();
        expiryDate = calculateExpiryDate(startDate, months);
      }

      subscriptionCreates.push({
        userId: userId,
        pairId: paymentItem.pairId,
        period: paymentItem.period as any,
        startDate: startDate,
        expiryDate: expiryDate,
        status: SubscriptionStatus.PENDING,
        inviteStatus: inviteStatus,
        basePrice: paymentItem.basePrice,
        discountRate: paymentItem.discountRate,
      });

      paymentItemCreates.push({
        pairId: paymentItem.pairId,
        basePrice: paymentItem.basePrice,
        discountRate: paymentItem.discountRate,
        finalPrice: paymentItem.finalPrice,
        period: paymentItem.period,
      });
    }
  } else {
    // Fallback to old logic for backwards compatibility
    for (const pairSymbol of pairIds) {
      const pair = await prisma.pair.findFirst({ where: { symbol: pairSymbol } });
      if (!pair) continue;

      const paymentItem = body.orderData.paymentItems?.find(item => item.pairId === pair.id);
      const months = paymentItem?.period === 'ONE_MONTH' ? 1 :
              paymentItem?.period === 'THREE_MONTHS' ? 3 :
              paymentItem?.period === 'SIX_MONTHS' ? 6 :
              paymentItem?.period === 'TWELVE_MONTHS' ? 12 : 1;


      let expiryDate = new Date();
      let startDate = new Date();

      if (paymentItem?.action === 'upgrade') {
        await prisma.subscription.findMany({
          where: {
            userId: userId,
            pairId: pair.id,
            status: SubscriptionStatus.PAID,
            inviteStatus: InviteStatus.COMPLETED,
          },
          orderBy: {
            expiryDate: 'desc',
          },
        }).then(existingSubscriptions => {
          if (existingSubscriptions.length > 0) {
            const latestSubscription = existingSubscriptions[0];
            startDate = new Date(latestSubscription.expiryDate);
            expiryDate = calculateExpiryDate(startDate, months);
          } else {
            startDate = new Date();
            expiryDate = calculateExpiryDate(startDate, months);
          }
        });
      }

      const basePriceNumeric = Number(pair.priceOneMonth ?? (body.amount / pairIds.length));
      const discountNumeric = Number(pair.discountOneMonth ?? 0);

      subscriptionCreates.push({
        userId: userId,
        pairId: pair.id,
        period: 'ONE_MONTH' as any,
        startDate: new Date(),
        expiryDate: expiryDate,
        status: SubscriptionStatus.PENDING,
        inviteStatus: InviteStatus.PENDING,
        basePrice: basePriceNumeric,
        discountRate: discountNumeric,
      });

      paymentItemCreates.push({
        pairId: pair.id,
        basePrice: basePriceNumeric,
        discountRate: discountNumeric,
        finalPrice: basePriceNumeric * (1 - discountNumeric / 100),
        period: 'ONE_MONTH' as any,
      });
    }
  }

  // Step 1: Create payment record first
  const paymentRecord = await prisma.payment.create({
    data: {
      userId: userId,
      totalAmount: body.amount,
      network: mapNetworkToEnum(body.network),
      status: PaymentStatus.PENDING,
      orderId: orderId,
      invoiceId: invoice.id,
      paymentId: payment.payment_id,
      txHash: payment.pay_address,
      expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
      orderData: body.orderData,
    },
  });

  // Step 2: Create subscriptions linked to the payment
  const subscriptions = await Promise.all(
    subscriptionCreates.map(subscriptionData =>
      prisma.subscription.create({
        data: {
          ...subscriptionData,
          paymentId: paymentRecord.id,
        },
      })
    )
  );

  // Step 3: Create payment items linked to the payment
  const paymentItems = await Promise.all(
    paymentItemCreates.map(paymentItemData =>
      prisma.paymentItem.create({
        data: {
          ...paymentItemData,
          paymentId: paymentRecord.id,
        },
      })
    )
  );

  // Return the payment record with related data
  return {
    ...paymentRecord,
    subscription: subscriptions,
    paymentItems: paymentItems,
  };
}

function transformInvoiceResponse(invoice: any, payment: any, body: CreateInvoiceRequest) {
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: payment.id || invoice.id || orderId,
    amount: parseFloat(payment.pay_amount || payment.price_amount) || body.amount,
    currency: payment.pay_currency || getCurrencyCode(body.network),
    network: body.network,
    address: payment.pay_address || '',
    qrCode: '',
    expiresAt: payment.expiration_estimate
      ? new Date(payment.expiration_estimate).toISOString()
      : new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    status: 'pending',
    nowPaymentsId: payment.id,
    orderId: orderId,
    invoiceUrl: invoice.invoice_url,
    invoiceId: invoice.id,
    paymentId: payment.payment_id,
  };
}

function getCurrencyCode(network: string): string {
  switch (network.toLowerCase()) {
    case 'trc20': return 'usdttrc20';
    case 'erc20': return 'usdterc20';
    case 'bep20': return 'usdtbsc';
    default: return 'usdttrc20';
  }
}

function calculateExpiryDate(startDate: Date, months: number): Date {
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  return expiryDate;
}
