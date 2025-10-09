import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { patchMetricsStats } from '@/lib/stats-service';
import { StatsType } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateRange = searchParams.get('dateRange');
    const search = searchParams.get('search');

    // Build where clause for filtering
    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
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

    // Calculate billing statistics
    const stats = {
      totalSpent: payments
        .filter((p) => p.status === 'PAID')
        .reduce((sum, p) => sum + Number(p.actuallyPaid || p.totalAmount), 0),
      totalPayments: payments.length,
      activeSubscriptions: payments.reduce(
        (count, p) =>
          count +
          (p.subscription ? (p.subscription.status === 'ACTIVE' ? 1 : 0) : 0),
        0
      ),
      pendingPayments: payments.filter((p) => p.status === 'PENDING').length,
    };

    // Transform payments for frontend
    const transformedPayments = filteredPayments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      invoiceId: payment.invoiceId,
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
      expiresAt: payment.expiresAt,
      subscriptions: payment.subscription
        ? [
            {
              id: payment.subscription.id,
              period: payment.subscription.period,
              startDate: payment.subscription.startDate,
              expiryDate: payment.subscription.expiryDate,
              status: payment.subscription.status,
            },
          ]
        : [],
    }));
    
    return NextResponse.json({
      payments: transformedPayments,
      stats,
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/billing - Create payment record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentData, subscriptionData } = body;

    // Create payment (simplified - in real implementation you'd validate payment with payment processor)
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        ...paymentData,
      },
    });

    // Log based on user role: USER -> audit, non-USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for USER role
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.PROCESS_PAYMENT,
        targetType: AuditTargetType.SUBSCRIPTION,
        targetId: payment.id,
        details: {
          paymentId: payment.id,
          amount: payment.totalAmount,
          userEmail: session.user.email,
        },
      });
    } else {
      // Create event for non-USER roles
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PAYMENT_CREATED',
          metadata: {
            paymentId: payment.id,
            amount: payment.totalAmount,
            userRole: session.user.role,
          },
        },
      });
    }

    // Track payment creation stats
    try {
      await patchMetricsStats(StatsType.BILLING_METRICS, {
        id: payment.id,
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        paymentAmount: Number(payment.totalAmount),
        paymentStatus: payment.status,
        network: payment.network,
        hasSubscription: !!subscriptionData,
        createdAt: new Date().toISOString(),
        type: 'PAYMENT_CREATED'
      });
    } catch (statsError) {
      console.error('Failed to track payment creation stats:', statsError);
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/billing - Update payment status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Log based on user role: USER -> audit, non-USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for USER role
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.PROCESS_PAYMENT,
        targetType: AuditTargetType.SUBSCRIPTION,
        targetId: payment.id,
        details: {
          paymentId: payment.id,
          newStatus: status,
          txHash: txHash,
          userEmail: session.user.email,
        },
      });
    } else {
      // Create event for non-USER roles
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PAYMENT_UPDATED',
          metadata: {
            paymentId: payment.id,
            newStatus: status,
            txHash: txHash,
            userRole: session.user.role,
          },
        },
      });
    }

    // Track payment update stats
    try {
      await patchMetricsStats(StatsType.BILLING_METRICS, {
        id: payment.id,
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        previousStatus: payment.status, // Note: this will be the new status since we already updated
        newStatus: status,
        txHash: txHash,
        paymentAmount: Number(payment.totalAmount),
        updatedAt: new Date().toISOString(),
        type: 'PAYMENT_UPDATED'
      });
    } catch (statsError) {
      console.error('Failed to track payment update stats:', statsError);
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
