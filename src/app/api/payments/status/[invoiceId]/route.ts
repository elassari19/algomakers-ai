import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@/generated/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    // Validate environment variables
    if (!process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: 'NOWPayments API key not configured' },
        { status: 500 }
      );
    }

    console.log(
      'Using API key:',
      process.env.NOWPAYMENTS_API_KEY?.substring(0, 8) + '...'
    );

    // Get payment status from NOWPayments API
    const nowPaymentsUrl =
      process.env.NOWPAYMENTS_API_URL || 'https://api-sandbox.nowpayments.io';

    console.log('Checking payment status for ID:', invoiceId);

    // Try to get payment status - first try as payment ID, then as invoice ID
    let response = await fetch(`${nowPaymentsUrl}/v1/payment/${invoiceId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    // If payment ID doesn't work, try to find the payment in our database
    if (!response.ok && response.status === 403) {
      // Try to find the payment ID from our database using the invoice ID
      const dbPayment = await prisma.payment.findFirst({
        where: {
          OR: [{ invoiceId: invoiceId }, { orderId: { contains: invoiceId } }],
        },
      });

      if (dbPayment?.invoiceId && dbPayment.invoiceId !== invoiceId) {
        // Retry with the actual payment ID from database
        response = await fetch(
          `${nowPaymentsUrl}/v1/payment/${dbPayment.invoiceId}`,
          {
            method: 'GET',
            headers: {
              'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        'NOWPayments status API error:',
        response.status,
        errorData
      );

      // If payment not found, it might be pending
      if (response.status === 404) {
        return NextResponse.json({
          status: 'pending',
          invoiceId,
          updatedAt: new Date().toISOString(),
        });
      }

      throw new Error(`NOWPayments API error: ${response.status} ${errorData}`);
    }

    const paymentStatus = await response.json();
    console.log('NOWPayments status response:', paymentStatus);

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

    // Update payment status in database
    try {
      await prisma.payment.updateMany({
        where: { invoiceId: invoiceId },
        data: {
          status: mapStatusToEnum(status),
          txHash: paymentStatus.payment_id || paymentStatus.tx_hash,
        },
      });
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
