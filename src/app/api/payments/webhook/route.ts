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
  purchase_id?: string;
  outcome_amount: number;
  outcome_currency: string;
  invoice_id?: string; // present for invoice-based flows
  actually_paid?: number;
  created_at: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NOWPaymentsWebhook = await request.json();

    // Verify webhook signature from NOWPayments (skip in development if no keys)
    const signature = request.headers.get('x-nowpayments-sig');

    const isDevelopment = process.env.NODE_ENV === 'development';

    if (signature) {
      // Try with IPN key first (NOWPayments typically uses IPN key for webhooks)
      const ipnKey = process.env.NOWPAYMENTS_IPN_KEY;
      const apiKey = process.env.NOWPAYMENTS_API_KEY;

      let isValid = false;

      if (ipnKey) {
        isValid = verifySignature(signature, JSON.stringify(body), ipnKey);
      }

      if (!isValid && apiKey) {
        isValid = verifySignature(signature, JSON.stringify(body), apiKey);
      }

      if (!isValid && !isDevelopment) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      } else if (!isValid && isDevelopment) {
        console.warn('Invalid webhook signature in development - proceeding anyway');
      }
    } else if (!isDevelopment) {
      console.error('Missing webhook signature in production');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Get session for audit logging (optional for webhooks)
    const session = await getServerSession(authOptions);

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
    // Identify related payment(s)
    const whereClause: any = {
      OR: [
        webhook.invoice_id ? { invoiceId: webhook.invoice_id } : undefined,
        webhook.order_id ? { orderId: webhook.order_id } : undefined,
        webhook.purchase_id ? { orderId: webhook.purchase_id } : undefined,
      ].filter(Boolean),
    };

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: true,
        paymentItems: { include: { pair: true } },
      },
    });

    if (payments.length === 0) {
      console.warn('No payment records found for webhook:', {
        invoice_id: webhook.invoice_id,
        order_id: webhook.order_id,
        purchase_id: webhook.purchase_id,
        payment_id: webhook.payment_id,
      });
      return;
    }

    // Update matched payments
    await prisma.payment.updateMany({
      where: { id: { in: payments.map((p) => p.id) } },
      data: {
        status: PaymentStatus.PAID,
        txHash: webhook.payment_id,
        actuallyPaid: webhook.actually_paid ?? webhook.pay_amount,
      },
    });

    // Update subscription records for each payment/pair combination
    for (const payment of payments) {
      for (const paymentItem of payment.paymentItems) {
        try {
          await prisma.subscription.updateMany({
            where: {
              userId: payment.userId,
              pairId: paymentItem.pairId,
              status: SubscriptionStatus.PENDING,
            },
            data: {
              status: SubscriptionStatus.ACTIVE,
              inviteStatus: InviteStatus.PENDING,
              paymentId: payment.id,
            },
          });
        } catch (error) {
          console.error(
            `Failed to update subscription for payment ${payment.id} and pair ${paymentItem.pairId}:`,
            error
          );
        }
      }
    }
    // Send confirmation email to user
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
    // Identify related payment(s) using multi-field lookup
    const whereClause: any = {
      OR: [
        webhook.invoice_id ? { invoiceId: webhook.invoice_id } : undefined,
        webhook.order_id ? { orderId: webhook.order_id } : undefined,
        webhook.purchase_id ? { orderId: webhook.purchase_id } : undefined,
      ].filter(Boolean),
    };

    await prisma.payment.updateMany({
      where: whereClause,
      data: { status: PaymentStatus.EXPIRED },
    });
  } catch (error) {
    console.error('Error handling payment expiry:', error);
  }
}

async function handlePaymentFailed(webhook: NOWPaymentsWebhook) {
  try {
    // Identify related payment(s) using multi-field lookup
    const whereClause: any = {
      OR: [
        webhook.invoice_id ? { invoiceId: webhook.invoice_id } : undefined,
        webhook.order_id ? { orderId: webhook.order_id } : undefined,
        webhook.purchase_id ? { orderId: webhook.purchase_id } : undefined,
      ].filter(Boolean),
    };

    await prisma.payment.updateMany({
      where: whereClause,
      data: { status: PaymentStatus.FAILED },
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePartialPayment(webhook: NOWPaymentsWebhook) {
  try {
    // Identify related payment(s) using multi-field lookup
    const whereClause: any = {
      OR: [
        webhook.invoice_id ? { invoiceId: webhook.invoice_id } : undefined,
        webhook.order_id ? { orderId: webhook.order_id } : undefined,
        webhook.purchase_id ? { orderId: webhook.purchase_id } : undefined,
      ].filter(Boolean),
    };

    await prisma.payment.updateMany({
      where: whereClause,
      data: { status: PaymentStatus.UNDERPAID },
    });
  } catch (error) {
    console.error('Error handling partial payment:', error);
  }
}
