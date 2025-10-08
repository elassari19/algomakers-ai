import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

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


    return NextResponse.json({
      affiliates
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

export async function PATCH(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('id');

    if (!affiliateId) {
      return NextResponse.json(
        { message: 'Affiliate ID is required. Use ?id=AFFILIATE_ID' },
        { status: 400 }
      );
    }

    const { commissionRate, walletAddress, isActive } = await request.json();

    // Check if affiliate exists
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!existingAffiliate) {
      return NextResponse.json(
        { message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update affiliate
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        commissions: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Get last 5 commissions
        },
      },
    });

    return NextResponse.json({
      message: 'Affiliate updated successfully',
      affiliate: updatedAffiliate,
    });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('id');
    const force = searchParams.get('force') === 'true';

    if (!affiliateId) {
      return NextResponse.json(
        { message: 'Affiliate ID is required. Use ?id=AFFILIATE_ID' },
        { status: 400 }
      );
    }

    // Check if affiliate exists
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        commissions: true,
      },
    });

    if (!existingAffiliate) {
      return NextResponse.json(
        { message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Check if affiliate has commissions (prevent accidental deletion)
    if (existingAffiliate.commissions.length > 0 && !force) {
      return NextResponse.json({
        message: 'Affiliate has commission records. Use ?force=true to delete anyway.',
        commissionsCount: existingAffiliate.commissions.length,
        affiliate: {
          id: existingAffiliate.id,
          referralCode: existingAffiliate.referralCode,
          commissionsTotal: existingAffiliate.commissions.reduce((sum, c) => sum + Number(c.amount), 0),
        },
      }, { status: 400 });
    }

    // If force delete, remove commissions first
    if (force && existingAffiliate.commissions.length > 0) {
      await prisma.commission.deleteMany({
        where: { affiliateId },
      });
    }

    // Delete the affiliate
    await prisma.affiliate.delete({
      where: { id: affiliateId },
    });

    return NextResponse.json({
      message: 'Affiliate deleted successfully',
      deletedAffiliate: {
        id: existingAffiliate.id,
        referralCode: existingAffiliate.referralCode,
        commissionsDeleted: force ? existingAffiliate.commissions.length : 0,
      },
    });
  } catch (error) {
    console.error('Error deleting affiliate:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}