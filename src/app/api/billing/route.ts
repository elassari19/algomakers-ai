import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { Role } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const period = searchParams.get('period');
    const search = searchParams.get('q');

    // Build where clause for filtering
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startDate = new Date(now.getTime() - 182 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      where.createdAt = {
        gte: startDate,
      };
    }

    // Fetch payments with related data
    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
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
            id: true,
            period: true,
            startDate: true,
            expiryDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by search query if provided
    let filteredPayments = payments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = payments.filter(
        (payment) =>
          payment.paymentItems.some(
            (pi) =>
              pi.pair.id.toLowerCase().includes(searchLower) ||
              pi.pair.symbol.toLowerCase().includes(searchLower)
          ) ||
          (payment.orderId &&
            payment.orderId.toLowerCase().includes(searchLower)) ||
          (payment.invoiceId &&
            payment.invoiceId.toLowerCase().includes(searchLower))
      );
    }

    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.GET_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'SUCCESS',
      details: {
        userEmail: session.user.email,
        user: session.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json({
      payments,
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.GET_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session.user.email,
        user: session.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/billing - Create payment record
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

    const body = await request.json();
    const { paymentData, subscriptionData } = body;

    // Create payment (simplified - in real implementation you'd validate payment with payment processor)
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        ...paymentData,
      },
    });

    // Unified audit log for all roles
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: payment.id,
      responseStatus: 'SUCCESS',
      details: {
        paymentId: payment.id,
        amount: payment.totalAmount,
        userEmail: session.user.email,
        user: session.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    
    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session.user.email,
        user: session.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/billing - Update payment status
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { paymentId, status, txHash } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: { id: paymentId, userId: session.user.id },
      data: {
        status,
        txHash,
        updatedAt: new Date(),
      },
    });

    // Unified audit log for all roles
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: payment.id,
      responseStatus: 'SUCCESS',
      details: {
        paymentId: payment.id,
        newStatus: status,
        txHash: txHash,
        userEmail: session.user.email,
        user: session.user.name,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session.user.email,
        user: session.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
