import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, SubscriptionStatus, InviteStatus } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    // Validate environment variables
    if (!process.env.NOWPAYMENTS_API_KEY) {
      console.error('NOWPAYMENTS_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'NOWPayments API key not configured' },
        { status: 500 }
      );
    }
    // Get payment status from NOWPayments API
    const nowPaymentsUrl =
      process.env.NOWPAYMENTS_API_URL || 'https://api-sandbox.nowpayments.io';

    // First, look up the payment in our database to get all identifiers
    const dbPayment = await prisma.payment.findFirst({
      where: { invoiceId },
      include: {
        paymentItems: true,
      },
    });

    // If payment doesn't exist in database, it means the invoice was never created
    if (!dbPayment) {
      return NextResponse.json({
        status: 'not_found',
        invoiceId,
        message: 'Invoice not found in database',
        updatedAt: new Date().toISOString(),
      });
    }

    // Try multiple approaches to check payment status with NOWPayments
    let paymentStatus = null;
    let usedIdentifier = '';

    // Approach 2: Try using paymentId directly
    if (!paymentStatus && dbPayment.paymentId) {
      try {
        const response = await fetch(`${nowPaymentsUrl}/v1/payment/${dbPayment.paymentId}`, {
          method: 'GET',
          headers: {
            'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          paymentStatus = await response.json();
          usedIdentifier = `paymentId: ${dbPayment.paymentId}`;
        } else {
          console.error('PaymentId fallback failed:', response.status);
        }
      } catch (error) {
        console.error('PaymentId fallback error:', error);
      }
    }

    // If no payment status found, it might be a pending hosted checkout payment
    if (!paymentStatus) {
      return NextResponse.json({
        status: 'pending',
        invoiceId,
        message: 'Payment not yet initiated or pending',
        updatedAt: new Date().toISOString(),
        dbStatus: dbPayment.status,
      });
    }

    // Map NOWPayments status to our internal status
    const mapStatus = (nowPaymentsStatus: string): string => {
      switch (nowPaymentsStatus.toLowerCase()) {
        case 'waiting':
        case 'sending':
          return 'pending';
        case 'confirming':
          return 'confirming';
        case 'confirmed':
        case 'finished':
          return 'confirmed';
        case 'failed':
          return 'failed';
        case 'refunded':
        case 'expired':
          return 'expired';
        default:
          return 'pending';
      }
    };

    const status = mapStatus(paymentStatus.payment_status || 'waiting');

    // Update payment status in database if status has changed
    try {
      const currentStatus = dbPayment.status;
      const newStatus = mapStatusToEnum(status);

      if (currentStatus !== newStatus) {
        // Fetch pending subscriptions for this payment to update them
        const pendingSubscriptions = await prisma.subscription.findMany({
          where: {
            paymentId: dbPayment.id,
            status: SubscriptionStatus.PENDING,
          },
        });

        // Update payment and all its pending subscriptions in one transaction
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: newStatus,
            txHash: paymentStatus.pay_address || paymentStatus.tx_hash || dbPayment.txHash,
            actuallyPaid: paymentStatus.actually_paid || dbPayment.actuallyPaid,
          },
        });
        await prisma.subscription.updateMany({
          where: {
            paymentId: dbPayment.id,
            status: SubscriptionStatus.PENDING,
          },
          data: {
            status: mapPaymentToSubscriptionStatus(newStatus)
          },
        });

        // Revalidate relevant paths after status update
        revalidatePath('/dashboard');
      } else {
        console.log('Payment status unchanged:', currentStatus);
      }
    } catch (dbError) {
      console.error('Failed to update payment status in database:', dbError);
      // Don't fail the request if DB update fails
    }

    return NextResponse.json({
      status,
      invoiceId,
      nowPaymentsStatus: paymentStatus.payment_status,
      updatedAt: new Date().toISOString(),
      amount: paymentStatus.pay_amount,
      currency: paymentStatus.pay_currency,
      actuallyPaid: paymentStatus.actually_paid,
      usedIdentifier,
      dbStatus: dbPayment.status,
    });
  } catch (error) {
    console.error('Error getting payment status:', error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to get payment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Map status to PaymentStatus enum
function mapStatusToEnum(status: string): PaymentStatus {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'confirming':
      return PaymentStatus.PENDING;
    case 'confirmed':
      return PaymentStatus.PAID;
    case 'underpaid':
      return PaymentStatus.UNDERPAID;
    case 'expired':
      return PaymentStatus.EXPIRED;
    case 'failed':
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
}
// Map PaymentStatus to SubscriptionStatus
function mapPaymentToSubscriptionStatus(paymentStatus: PaymentStatus): SubscriptionStatus {
  console.log('payment status:', paymentStatus)
  switch (paymentStatus) {
    case PaymentStatus.PAID:
      return SubscriptionStatus.PAID;
    case PaymentStatus.EXPIRED:
      return SubscriptionStatus.EXPIRED;
    case PaymentStatus.FAILED:
      return SubscriptionStatus.FAILED;
    case PaymentStatus.UNDERPAID:
      return SubscriptionStatus.PENDING;
    case PaymentStatus.PENDING:
    default:
      return SubscriptionStatus.PENDING;
  }
}