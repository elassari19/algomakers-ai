import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  PaymentStatus,
  SubscriptionStatus,
  InviteStatus,
} from '@/generated/prisma';
import type { Role } from '@/generated/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface NOWPaymentsWebhook {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  actually_paid?: number;
  created_at: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    await createAuditLog({
      actorId: 'unknown',
      actorRole: 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: { reason: 'unauthorized' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body: NOWPaymentsWebhook = await request.json();

    // Verify webhook signature from NOWPayments
    const signature = request.headers.get('x-nowpayments-sig');
    if (signature && process.env.NOWPAYMENTS_API_KEY) {
      const isValid = verifySignature(
        signature,
        JSON.stringify(body),
        process.env.NOWPAYMENTS_API_KEY
      );
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Process different payment statuses
    switch (body.payment_status) {
      case 'finished':
        await handlePaymentSuccess(body);
        break;
      case 'confirmed':
        await handlePaymentConfirmed(body);
        break;
      case 'expired':
        await handlePaymentExpired(body);
        break;
      case 'failed':
        await handlePaymentFailed(body);
        break;
      case 'partially_paid':
        await handlePartialPayment(body);
        break;
      default:
    }

    // Audit log for webhook processing
    await createAuditLog({
      actorId: session?.user?.id || 'system',
      actorRole: (session?.user?.role as Role) || 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: body.payment_id,
      responseStatus: 'SUCCESS',
      details: {
        webhookProcessed: {
          paymentId: body.payment_id,
          paymentStatus: body.payment_status,
          orderId: body.order_id,
          amount: body.pay_amount,
          currency: body.pay_currency,
          processedAt: new Date().toISOString(),
        },
        actorEmail: session?.user?.email,
        actorName: session?.user?.name,
      },
    });

  return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Audit log for webhook failure
    await createAuditLog({
      actorId: 'system',
      actorRole: 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Verify NOWPayments webhook signature
function verifySignature(
  signature: string,
  body: string,
  apiKey: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha512', apiKey);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

async function handlePaymentSuccess(webhook: NOWPaymentsWebhook) {
  const session = await getServerSession(authOptions);
  try {
    // Update payment status in database
    const updatedPayments = await prisma.payment.updateMany({
      where: { invoiceId: webhook.payment_id },
      data: {
        status: PaymentStatus.PAID,
        txHash: webhook.payment_id,
        actuallyPaid: webhook.actually_paid || webhook.pay_amount,
      },
    });

    if (updatedPayments.count === 0) {
      console.warn('No payment records found for invoice:', webhook.payment_id);
      return;
    }

    // Get payment records with their pairs to create subscriptions
    const payments = await prisma.payment.findMany({
      where: { invoiceId: webhook.payment_id },
      include: {
        user: true,
        paymentItems: {
          include: {
            pair: true,
          },
        },
      },
    });

    // Create subscription records for each payment/pair combination
    for (const payment of payments) {
      for (const paymentItem of payment.paymentItems) {
        try {
          // Calculate expiry date based on the period from payment item
          const expiryDate = calculateExpiryDate(new Date(), Number(paymentItem.period));

          await prisma.subscription.create({
            data: {
              userId: payment.userId,
              pairId: paymentItem.pairId,
              period: paymentItem.period,
              startDate: new Date(),
              expiryDate: expiryDate,
              status: SubscriptionStatus.PENDING, // Admin needs to send TradingView invite
              paymentId: payment.id,
              inviteStatus: InviteStatus.PENDING,
              basePrice: paymentItem.basePrice,
              discountRate: paymentItem.discountRate,
            },
          });
        } catch (error) {
          console.error(
            `Failed to create subscription for payment ${payment.id} and pair ${paymentItem.pairId}:`,
            error
          );
        }
      }
    }

    // Send notification to admin
    await notifyAdmin({
      type: 'payment_success',
      orderId: webhook.order_id,
      paymentId: webhook.payment_id,
      amount: webhook.actually_paid || webhook.pay_amount,
      currency: webhook.pay_currency,
      paymentsCount: payments.length,
    });

    // Send confirmation email to user
    await sendPaymentConfirmationEmail(webhook);
  } catch (error) {
    console.error('Error handling payment success:', error);
    await createAuditLog({
      actorId: session?.user?.id || 'system',
      actorRole: (session?.user?.role as Role) || 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: { reason: 'payment_success_handling_failed', error },
    });
  }
}

async function handlePaymentConfirmed(webhook: NOWPaymentsWebhook) {
  await handlePaymentSuccess(webhook);
}

async function handlePaymentExpired(webhook: NOWPaymentsWebhook) {
  try {
    // Update payment status in database
    await prisma.payment.updateMany({
      where: { invoiceId: webhook.payment_id },
      data: {
        status: 'EXPIRED',
      },
    });

    // Send expired payment notification
    await notifyAdmin({
      type: 'payment_expired',
      orderId: webhook.order_id,
      paymentId: webhook.payment_id,
    });
  } catch (error) {
    console.error('Error handling payment expiry:', error);
  }
}

async function handlePaymentFailed(webhook: NOWPaymentsWebhook) {
  try {
    // Update payment status in database
    await prisma.payment.updateMany({
      where: { invoiceId: webhook.payment_id },
      data: {
        status: 'FAILED',
      },
    });

    // Send failed payment notification
    await notifyAdmin({
      type: 'payment_failed',
      orderId: webhook.order_id,
      paymentId: webhook.payment_id,
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePartialPayment(webhook: NOWPaymentsWebhook) {
  console.log('Partial payment received:', webhook.payment_id);
  try {
    // Update payment status in database
    await prisma.payment.updateMany({
      where: { invoiceId: webhook.payment_id },
      data: {
        status: 'UNDERPAID',
      },
    });

    // Send partial payment notification
    await notifyAdmin({
      type: 'payment_partial',
      orderId: webhook.order_id,
      paymentId: webhook.payment_id,
      amount: webhook.actually_paid || webhook.pay_amount,
      expectedAmount: webhook.price_amount,
    });
  } catch (error) {
    console.error('Error handling partial payment:', error);
  }
}

// Helper functions
async function notifyAdmin(notification: any) {
  console.log('Admin notification:', notification);
  // TODO: Implement admin notification (email, dashboard, etc.)
}

async function sendPaymentConfirmationEmail(webhook: NOWPaymentsWebhook) {
  console.log('Sending payment confirmation email for:', webhook.payment_id);
  // TODO: Implement email sending
}

function calculateExpiryDate(startDate: Date, months: number): Date {
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  return expiryDate;
}
