import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await params;

    // Fetch payment with related data
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        pair: {
          select: {
            name: true,
            symbol: true,
          },
        },
        subscription: {
          select: {
            period: true,
            startDate: true,
            expiryDate: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Generate invoice PDF (simplified version)
    // In a real implementation, you would use a PDF library like puppeteer or jsPDF
    const invoiceData = {
      invoiceId: payment.invoiceId || payment.orderId,
      paymentId: payment.id,
      customerName: payment.user.name || 'N/A',
      customerEmail: payment.user.email,
      pairName: payment.pair.name,
      pairSymbol: payment.pair.symbol,
      amount: Number(payment.amount),
      actuallyPaid: payment.actuallyPaid
        ? Number(payment.actuallyPaid)
        : undefined,
      network: payment.network,
      status: payment.status,
      txHash: payment.txHash,
      createdAt: payment.createdAt,
      subscription: payment.subscription,
    };

    // For now, return invoice data as JSON
    // In production, this would generate and return a PDF
    return NextResponse.json({
      invoice: invoiceData,
      downloadUrl: `/api/billing/invoice/${paymentId}/pdf`, // Future PDF endpoint
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
