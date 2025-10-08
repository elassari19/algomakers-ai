import { NextRequest, NextResponse } from 'next/server';
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

    // Fetch all affiliates with related data
    const affiliates = await prisma.affiliate.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            referrals: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                isActive: true,
              },
            },
          },
        },
        commissions: {
          include: {
            subscription: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Calculate additional metrics for each affiliate
    const enrichedAffiliates = affiliates.map((affiliate) => {
      const totalCommissions = affiliate.commissions.reduce(
        (sum: number, commission: any) => sum + Number(commission.amount),
        0
      );

      const pendingCommissions = affiliate.commissions
        .filter((commission: any) => commission.status === 'PENDING')
        .reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);

      const paidCommissions = affiliate.commissions
        .filter((commission: any) => commission.status === 'PAID')
        .reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);

      const referrals = affiliate.user.referrals || [];
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(
        (referral: any) => referral.isActive
      ).length;

      return {
        ...affiliate,
        referrals,
        totalCommissions,
        pendingCommissions,
        paidCommissions,
        totalReferrals,
        activeReferrals,
      };
    });

    return NextResponse.json({
      affiliates: enrichedAffiliates,
    });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { userId, commissionRate, walletAddress } = await request.json();

    // Check if user already has an affiliate account
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (existingAffiliate) {
      return NextResponse.json(
        { message: 'User already has an affiliate account' },
        { status: 400 }
      );
    }

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await prisma.affiliate.findUnique({
        where: { referralCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { message: 'Failed to generate unique referral code' },
        { status: 500 }
      );
    }

    // Create affiliate account
    const affiliate = await prisma.affiliate.create({
      data: {
        userId,
        referralCode: referralCode!,
        commissionRate: commissionRate || 0.1, // Default 10%
        walletAddress: walletAddress || '',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Affiliate account created successfully',
      affiliate,
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}