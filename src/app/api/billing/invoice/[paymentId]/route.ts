import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditAction, AuditTargetType, createAuditLog } from '@/lib/audit';
import { Role } from '@/generated/prisma/edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

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
        paymentItems: {
          include: {
            pair: {
              select: {
                id: true,
                symbol: true,
              },
            },
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
      await createAuditLog({
        actorId: session.user.id,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.GET_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        targetId: paymentId,
        responseStatus: 'FAILURE',
        details: {
          reason: 'Payment not found or access denied',
        },
      });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Generate invoice PDF (simplified version)
    // In a real implementation, you would use a PDF library like puppeteer or jsPDF
    const invoiceData = {
      invoiceId: payment.invoiceId || payment.orderId,
      paymentId: payment.id,
      customerName: payment.user.name || 'N/A',
      customerEmail: payment.user.email,
      pairs: payment.paymentItems.map((pi) => ({
        id: pi.pair.id,
        symbol: pi.pair.symbol,
        basePrice: Number(pi.basePrice),
        discountRate: Number(pi.discountRate),
        finalPrice: Number(pi.finalPrice),
      })),
      totalAmount: Number(payment.totalAmount),
      actuallyPaid: payment.actuallyPaid
        ? Number(payment.actuallyPaid)
        : undefined,
      network: payment.network,
      status: payment.status,
      txHash: payment.txHash,
      createdAt: payment.createdAt,
      subscriptions: payment.subscription,
    };

    await createAuditLog({
      actorId: session.user.id,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.GET_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: payment.id,
      responseStatus: 'SUCCESS',
      details: {
        userEmail: session.user.email,
        user: session.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    // For now, return invoice data as JSON
    // In production, this would generate and return a PDF
    return NextResponse.json({
      invoice: invoiceData,
      downloadUrl: `/api/billing/invoice/${paymentId}/pdf`, // Future PDF endpoint
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.GET_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session.user.email,
        user: session.user.name,
        reason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
