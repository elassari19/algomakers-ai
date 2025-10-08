import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get aggregate statistics
    const [
      totalSignups,
      totalInvitations,
      acceptedInvitations,
      totalRewards,
      pendingPayouts,
      completedPayouts,
      topAffiliatesCount,
      affiliatesWithReferrals,
    ] = await Promise.all([
      // Total signups via referrals
      prisma.user.count({
        where: {
          referredBy: {
            not: null,
          },
        },
      }),

      // Total invitations sent (users with referral codes)
      prisma.affiliate.count(),

      // Accepted invitations (affiliates with referrals)
      prisma.affiliate.count({
        where: {
          user: {
            referrals: {
              some: {},
            },
          },
        },
      }),

      // Total rewards distributed
      prisma.commission.aggregate({
        _sum: {
          amount: true,
        },
      }),

      // Pending payouts
      prisma.commission.aggregate({
        where: {
          status: 'PENDING',
        },
        _sum: {
          amount: true,
        },
      }),

      // Completed payouts
      prisma.commission.aggregate({
        where: {
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      }),

      // Top affiliates (those with active referrals)
      prisma.affiliate.count({
        where: {
          user: {
            referrals: {
              some: {
                isActive: true,
              },
            },
          },
        },
      }),

      // All affiliates with any referrals
      prisma.affiliate.findMany({
        include: {
          user: {
            include: {
              referrals: true,
            },
          },
        },
      }),
    ]);

    // Calculate conversion rate
    const conversionRate = totalInvitations > 0 
      ? (acceptedInvitations / totalInvitations) * 100 
      : 0;

    const stats = {
      totalSignups,
      totalInvitations,
      acceptedInvitations,
      totalRewards: totalRewards._sum.amount || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      completedPayouts: completedPayouts._sum.amount || 0,
      topAffiliates: topAffiliatesCount,
      conversionRate,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}