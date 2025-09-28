import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        pair: {
          select: {
            name: true,
            symbol: true,
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
          payment.pair.name.toLowerCase().includes(searchLower) ||
          payment.pair.symbol.toLowerCase().includes(searchLower) ||
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
        .reduce((sum, p) => sum + Number(p.actuallyPaid || p.amount), 0),
      totalPayments: payments.length,
      activeSubscriptions: payments.filter(
        (p) => p.subscription?.status === 'ACTIVE'
      ).length,
      pendingPayments: payments.filter((p) => p.status === 'PENDING').length,
    };

    // Transform payments for frontend
    const transformedPayments = filteredPayments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      invoiceId: payment.invoiceId,
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
      expiresAt: payment.expiresAt,
      subscription: payment.subscription
        ? {
            id: payment.subscription.id,
            period: payment.subscription.period,
            startDate: payment.subscription.startDate,
            expiryDate: payment.subscription.expiryDate,
            status: payment.subscription.status,
          }
        : undefined,
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
