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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Find or create affiliate account
    let affiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id },
      include: {
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
          take: 10, // Latest 10 commissions
        },
        user: {
          include: {
            referrals: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                isActive: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    });

    if (!affiliate) {
      // Create affiliate account automatically
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

      affiliate = await prisma.affiliate.create({
        data: {
          userId: user.id,
          referralCode: referralCode!,
          commissionRate: 0.1, // Default 10%
          walletAddress: '',
        },
        include: {
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
            take: 10,
          },
          user: {
            include: {
              referrals: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  createdAt: true,
                  isActive: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
        },
      });
    }

    // Calculate statistics
    const totalEarnings = affiliate.commissions.reduce(
      (sum: number, commission: any) => sum + Number(commission.amount),
      0
    );

    const pendingEarnings = affiliate.commissions
      .filter((commission: any) => commission.status === 'PENDING')
      .reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);

    const paidEarnings = affiliate.commissions
      .filter((commission: any) => commission.status === 'PAID')
      .reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);

    const referrals = affiliate.user?.referrals || [];
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(
      (referral: any) => referral.isActive
    ).length;

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/signup?ref=${affiliate.referralCode}`;

    return NextResponse.json({
      affiliate: {
        ...affiliate,
        referrals,
        referralLink,
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        totalReferrals,
        activeReferrals,
      },
    });
  } catch (error) {
    console.error('Error fetching affiliate data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { walletAddress } = await request.json();

    // Update affiliate wallet address
    const affiliate = await prisma.affiliate.update({
      where: { userId: user.id },
      data: { walletAddress: walletAddress || '' },
    });

    return NextResponse.json({
      message: 'Wallet address updated successfully',
      affiliate,
    });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}