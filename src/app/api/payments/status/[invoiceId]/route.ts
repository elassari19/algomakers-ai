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
      console.error('NOWPAYMENTS_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'NOWPayments API key not configured' },
        { status: 500 }
      );
    }

    console.log('NOWPAYMENTS_API_KEY found, length:', process.env.NOWPAYMENTS_API_KEY.length);
    console.log('NOWPAYMENTS_API_URL:', process.env.NOWPAYMENTS_API_URL);

    // Get payment status from NOWPayments API
    const nowPaymentsUrl =
      process.env.NOWPAYMENTS_API_URL || 'https://api-sandbox.nowpayments.io';

    console.log('Using NOWPayments URL:', nowPaymentsUrl);
    console.log('Checking payment status for ID:', invoiceId)

    // For NOWPayments invoices, we need to check status differently
    // Let's try different endpoints and see what works

    console.log('Trying different NOWPayments endpoints...');

    // Use invoiceId as the payment ID to check
    const paymentIdToCheck = invoiceId;

    // Fetch payment from database for possible orderId usage
    const dbPayment = await prisma.payment.findFirst({
      where: { invoiceId: paymentIdToCheck },
    });

    // First try: payment status
    let response = await fetch(`${nowPaymentsUrl}/v1/payment/${paymentIdToCheck}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    console.log('Payment endpoint response status:', response.status, `${nowPaymentsUrl}/v1/payment/${paymentIdToCheck}`);

    // For hosted checkout invoices, if payment doesn't exist yet, it's pending
    if (response.status === 404) {
      console.log('Payment not found - likely pending payment on hosted checkout');
      return NextResponse.json({
        status: 'pending',
        invoiceId,
        message: 'Payment not yet initiated',
        updatedAt: new Date().toISOString(),
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        'NOWPayments status API error:',
        response.status,
        errorData
      );

      // For invoices that haven't been paid yet, return pending status
      // This is normal for hosted checkout invoices
      if (response.status === 404) {
        console.log('Payment/Invoice not found - likely pending payment');
        return NextResponse.json({
          status: 'pending',
          invoiceId,
          message: 'Payment not yet initiated',
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
      // Update by the ID we used to check status
      await prisma.payment.updateMany({
        where: { invoiceId: paymentIdToCheck },
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
