import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentNetwork, PaymentStatus } from '@/generated/prisma';

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
  };
}

export async function POST(request: NextRequest) {
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

    // TODO: Get user session when auth is implemented
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // For now, use a placeholder user ID
    const userId = 'temp-user-id';

    // Validate environment variables
    if (!process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: 'NOWPayments API key not configured' },
        { status: 500 }
      );
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

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

    // Create payment with NOWPayments API (using /v1/payment endpoint)
    // Note: Using production API since sandbox requires different credentials
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

    const paymentData = {
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

    console.log('Creating NOWPayments invoice with data:', paymentData);

    // First, create an invoice to get the hosted checkout URL
    const invoiceResponse = await fetch(`${nowPaymentsUrl}/v1/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!invoiceResponse.ok) {
      const errorData = await invoiceResponse.text();
      console.error(
        'NOWPayments invoice API error:',
        invoiceResponse.status,
        errorData
      );
      throw new Error(
        `NOWPayments invoice API error: ${invoiceResponse.status} ${errorData}`
      );
    }

    const invoice = await invoiceResponse.json();
    console.log('NOWPayments invoice created:', invoice);

    // Second, create a payment to get the address and QR code
    const paymentResponse = await fetch(`${nowPaymentsUrl}/v1/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text();
      console.error(
        'NOWPayments payment API error:',
        paymentResponse.status,
        errorData
      );
      // If payment fails, still use invoice data but without address
    }

    let payment = null;
    try {
      payment = await paymentResponse.json();
      console.log('NOWPayments payment created:', payment);
    } catch (error) {
      console.log('Payment creation failed, using invoice only');
    }

    // Combine invoice and payment data
    const transformedInvoice = {
      id: invoice.id || orderId,
      amount:
        payment?.pay_amount || parseFloat(invoice.price_amount) || body.amount,
      currency:
        payment?.pay_currency ||
        invoice.pay_currency ||
        getCurrencyCode(body.network),
      network: body.network,
      address: payment?.pay_address || '',
      qrCode: payment?.pay_address
        ? generateQRCode(
            payment.pay_amount ||
              parseFloat(invoice.price_amount) ||
              body.amount,
            payment.pay_address,
            payment.pay_currency ||
              invoice.pay_currency ||
              getCurrencyCode(body.network)
          )
        : generateQRCode(
            parseFloat(invoice.price_amount) || body.amount,
            '',
            invoice.pay_currency || getCurrencyCode(body.network)
          ),
      expiresAt: invoice.created_at
        ? new Date(
            new Date(invoice.created_at).getTime() + 20 * 60 * 1000
          ).toISOString()
        : new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      status: 'pending',
      nowPaymentsId: payment?.payment_id || invoice.id,
      orderId: orderId,
      invoiceUrl: invoice.invoice_url,
    };

    // Create a single payment record with multiple pairs
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: userId,
        totalAmount: body.amount,
        network: mapNetworkToEnum(body.network),
        status: PaymentStatus.PENDING,
        invoiceId: transformedInvoice.nowPaymentsId,
        orderId: orderId,
        expiresAt: new Date(transformedInvoice.expiresAt),
        orderData: body.orderData,
      },
    });

    // Create PaymentItem records for each pair (schema.prisma compliant)
    const paymentItems = [];
    for (const pairSymbol of pairIds) {
      try {
        // Find or create the pair first
        let pair = await prisma.pair.findFirst({
          where: { symbol: pairSymbol },
        });

        if (!pair) {
          return NextResponse.json(
            { error: `Pair not found: ${pairSymbol}` },
            { status: 400 }
          );
        }

        const paymentItem = await prisma.paymentItem.create({
          data: {
            paymentId: paymentRecord.id,
            pairId: pair.id,
            basePrice: pair.priceOneMonth || body.amount / pairIds.length,
            discountRate: pair.discountOneMonth || 0,
            finalPrice:
              (Number(pair.priceOneMonth) || body.amount / pairIds.length) *
              (1 - (Number(pair.discountOneMonth) || 0) / 100),
            period: 'ONE_MONTH', // Default period
          },
        });
        paymentItems.push(paymentItem);
      } catch (error) {
        console.error(
          `Failed to create payment item record for ${pairSymbol}:`,
          error
        );
        // Continue with other pairs, don't fail the entire request
      }
    }

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

    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

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
