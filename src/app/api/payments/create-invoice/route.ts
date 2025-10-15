import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentNetwork, PaymentStatus, SubscriptionStatus, InviteStatus } from '@/generated/prisma';
import type { Role } from '@/generated/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    }[];
  };
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if(!session?.user?.id) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: 'USER',
        action: AuditAction.CREATE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: { reason: 'unauthorized' },
      });
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

    // Validate minimum amount (NOWPayments has minimum requirements)
    // USDT TRC20 minimum is approximately $20+ based on testing
    if (body.amount < 20) {
      return NextResponse.json(
        { error: 'Minimum amount is $20 USD for cryptocurrency payments' },
        { status: 400 }
      );
    }

    // Get user session for audit logging
    const session = await getServerSession(authOptions);
    
    // For now, use a placeholder user ID if no session
    const userId = session?.user?.id || 'temp-user-id';

    // Validate environment variables
    if (!process.env.NOWPAYMENTS_API_KEY) {
      await createAuditLog({
        actorId: session?.user?.id || 'system',
        actorRole: (session?.user?.role as Role) || 'USER',
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

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create subscriptions first for each pair
    const subscriptions = [];
    
    // Check if we have detailed payment items from basket
    if (body.orderData.paymentItems && body.orderData.paymentItems.length > 0) {
      // Use the detailed payment items from basket
      for (const paymentItem of body.orderData.paymentItems) {
        try {
          // Calculate expiry date based on the period from payment item
          const months = paymentItem.period === 'ONE_MONTH' ? 1 :
                        paymentItem.period === 'THREE_MONTHS' ? 3 :
                        paymentItem.period === 'SIX_MONTHS' ? 6 :
                        paymentItem.period === 'TWELVE_MONTHS' ? 12 : 1;
          const expiryDate = calculateExpiryDate(new Date(), months);

          const subscription = await prisma.subscription.create({
            data: {
              userId: userId,
              pairId: paymentItem.pairId,
              period: paymentItem.period as any, // Map string to enum
              startDate: new Date(),
              expiryDate: expiryDate,
              status: SubscriptionStatus.PENDING, // Will be activated when payment is confirmed
              inviteStatus: InviteStatus.PENDING,
              basePrice: paymentItem.basePrice,
              discountRate: paymentItem.discountRate,
            },
          });
          subscriptions.push(subscription);
        } catch (error) {
          console.error(
            `Failed to create subscription for pair ${paymentItem.pairId}:`,
            error
          );
          await createAuditLog({
            actorId: session?.user?.id || userId,
            actorRole: (session?.user?.role as Role) || 'USER',
            action: AuditAction.CREATE_PAYMENT,
            targetType: AuditTargetType.PAYMENT,
            responseStatus: 'FAILURE',
            details: {
              reason: `failed_to_create_subscription_for_${paymentItem.pairId}`,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    } else {
      // Fallback to old logic for backwards compatibility
      for (const pairSymbol of pairIds) {
        try {
          // Find the pair first
          let pair = await prisma.pair.findFirst({
            where: { symbol: pairSymbol },
          });

          if (!pair) {
            return NextResponse.json(
              { error: `Pair not found: ${pairSymbol}` },
              { status: 400 }
            );
          }

          // Calculate expiry date (default to 1 month)
          const expiryDate = calculateExpiryDate(new Date(), 1);

          const subscription = await prisma.subscription.create({
            data: {
              userId: userId,
              pairId: pair.id,
              period: (body?.orderData?.paymentItems && body.orderData.paymentItems.length > 0
                ? body.orderData.paymentItems[0].period
                : 'ONE_MONTH') as any, // Default period
              startDate: new Date(),
              expiryDate: expiryDate,
              status: SubscriptionStatus.PENDING, // Will be activated when payment is confirmed
              inviteStatus: InviteStatus.PENDING,
              basePrice: pair.priceOneMonth || body.amount / pairIds.length,
              discountRate: pair.discountOneMonth || 0,
            },
          });
          subscriptions.push(subscription);
        } catch (error) {
          console.error(
            `Failed to create subscription for ${pairSymbol}:`,
            error
          );
          await createAuditLog({
            actorId: session?.user?.id || userId,
            actorRole: (session?.user?.role as Role) || 'USER',
            action: AuditAction.CREATE_PAYMENT,
            targetType: AuditTargetType.PAYMENT,
            responseStatus: 'FAILURE',
            details: {
              reason: `failed_to_create_subscription_for_${pairSymbol}`,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    }

    // Now create the payment record
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: userId,
        totalAmount: body.amount,
        network: mapNetworkToEnum(body.network),
        status: PaymentStatus.PENDING,
        orderId: orderId,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
        orderData: body.orderData,
      },
    });

    // Create PaymentItem records for each subscription/pair combination
    const paymentItems = [];
    
    for (const subscription of subscriptions) {
      try {
        const pair = await prisma.pair.findUnique({
          where: { id: subscription.pairId },
        });

        if (!pair) continue;

        const paymentItem = await prisma.paymentItem.create({
          data: {
            paymentId: paymentRecord.id,
            pairId: subscription.pairId,
            basePrice: subscription.basePrice || pair.priceOneMonth || body.amount / subscriptions.length,
            discountRate: subscription.discountRate || pair.discountOneMonth || 0,
            finalPrice: Number(subscription.basePrice || pair.priceOneMonth || body.amount / subscriptions.length) * (1 - Number(subscription.discountRate || pair.discountOneMonth || 0) / 100),
            period: subscription.period,
          },
        });
        paymentItems.push(paymentItem);

        // Note: paymentId is no longer set on subscriptions
        // Subscriptions are linked to payments through paymentItems and pairs
      } catch (error) {
        console.error(
          `Failed to create payment item for subscription ${subscription.id}:`,
          error
        );
      }
    }

    // Map network to currency code (correct NOWPayments currency codes)
    const getCurrencyCode = (network: string): string => {
      switch (network.toLowerCase()) {
        case 'trc20':
          return 'usdttrc20';
        case 'erc20':
          return 'usdterc20';
        case 'bep20':
          return 'usdtbsc';
        default:
          return 'usdttrc20';
      }
    };

    // Create payment with NOWPayments API (using /v1/invoice endpoint)
    // The invoice endpoint creates a hosted checkout that handles payment
    const nowPaymentsUrl =
      process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io';

    // Create a description based on available data
    const getPeriodDescription = () => {
      if (body.orderData.plan?.period) {
        return body.orderData.plan.period;
      }
      if (body.orderData.duration) {
        return body.orderData.duration;
      }
      return 'subscription';
    };

    const invoiceData = {
      price_amount: body.amount,
      price_currency: 'usd',
      pay_currency: getCurrencyCode(body.network),
      order_id: orderId,
      order_description: `AlgoMarkers.Ai Subscription: ${pairIds.join(
        ', '
      )} - ${getPeriodDescription()}`,
      ipn_callback_url: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
    };

    // Create invoice with NOWPayments API
    const invoiceResponse = await fetch(`${nowPaymentsUrl}/v1/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!invoiceResponse.ok) {
      const errorData = await invoiceResponse.text();
      await createAuditLog({
        actorId: session?.user?.id || 'system',
        actorRole: (session?.user?.role as Role) || 'USER',
        action: AuditAction.CREATE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: { reason: 'nowpayments_invoice_creation_failed', error: errorData },
      });
      console.error(
        'NOWPayments invoice API error:',
        invoiceResponse.status,
        errorData
      );
      return NextResponse.json(
        { error: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    const invoice = await invoiceResponse.json();

    // Update payment record with invoice ID
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: { invoiceId: invoice.id },
    });

    // Transform the invoice response for our API
    const transformedInvoice = {
      id: invoice.id || orderId,
      amount: parseFloat(invoice.price_amount) || body.amount,
      currency: invoice.pay_currency || getCurrencyCode(body.network),
      network: body.network,
      address: '', // Invoice uses hosted checkout, no direct address
      qrCode: '', // Invoice uses hosted checkout, no QR code needed
      expiresAt: invoice.created_at
        ? new Date(
            new Date(invoice.created_at).getTime() + 20 * 60 * 1000
          ).toISOString()
        : new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      status: 'pending',
      nowPaymentsId: invoice.id,
      orderId: orderId,
      invoiceUrl: invoice.invoice_url,
    };

    // Audit log for all roles
    await createAuditLog({
      actorId: session?.user?.id || userId,
      actorRole: (session?.user?.role as Role) || 'USER',
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: paymentRecord.id,
      responseStatus: 'SUCCESS',
      details: {
        createdInvoice: {
          id: paymentRecord.id,
          invoiceId: transformedInvoice.id,
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

    return NextResponse.json({
      ...transformedInvoice,
      payment: {
        id: paymentRecord.id,
        pairs: paymentItems.map((pi) => ({
          pairId: pi.pairId,
          basePrice: pi.basePrice,
          discountRate: pi.discountRate,
          finalPrice: pi.finalPrice,
          period: pi.period,
        })),
      },
    });
  } catch (error) {
    console.error('Error creating NOWPayments invoice:', error);

    // Audit log for failure
    await createAuditLog({
      actorId: session?.user?.id || 'system',
      actorRole: (session?.user?.role as Role) || 'USER',
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

// Map network string to PaymentNetwork enum
function mapNetworkToEnum(network: string): PaymentNetwork {
  switch (network.toLowerCase()) {
    case 'trc20':
      return PaymentNetwork.USDT_TRC20;
    case 'erc20':
      return PaymentNetwork.USDT_ERC20;
    case 'bep20':
      return PaymentNetwork.USDT_BEP20;
    case 'usdt':
      return PaymentNetwork.USDT;
    case 'btc':
    case 'bitcoin':
      return PaymentNetwork.BTC;
    case 'eth':
    case 'ethereum':
      return PaymentNetwork.ETH;
    default:
      return PaymentNetwork.USDT_TRC20; // Default to TRC20
  }
}

// Generate QR code URL for payment using QR Server API
function generateQRCode(
  amount: number,
  address: string,
  currency: string
): string {
  // Create the payment URI for crypto wallets
  const paymentUri = `${currency.toLowerCase()}:${address}?amount=${amount}`;

  // Use QR Server API to generate QR code
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    paymentUri
  )}`;

  return qrApiUrl;
}

function calculateExpiryDate(startDate: Date, months: number): Date {
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  return expiryDate;
}
