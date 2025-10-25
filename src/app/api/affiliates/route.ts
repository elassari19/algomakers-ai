import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { patchMetricsStats } from '@/lib/stats-service';
import { Role, StatsType } from '@/generated/prisma';
import { AuditAction, AuditTargetType, createAuditLog } from '@/lib/audit';

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
                status: true,
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: Role.USER,
        action: AuditAction.CREATE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        responseStatus: 'FAILURE',
        details: {
          email: session.user.email,
          reason: 'user_not_found',
        },
      });
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId, commissionRate, walletAddress } = await request.json();

    // Check if user already has an affiliate account
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (existingAffiliate) {
      await createAuditLog({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.CREATE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        targetId: existingAffiliate.id,
        responseStatus: 'FAILURE',
        details: {
          email: user.email,
          reason: 'affiliate_account_exists',
        },
      });
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

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.CREATE_AFFILIATE,
      targetType: AuditTargetType.AFFILIATE,
      targetId: affiliate.id,
      responseStatus: 'SUCCESS',
      details: {
        email: user.email,
        affiliateId: affiliate.id,
        referralCode: affiliate.referralCode,
      },
    });

    return NextResponse.json({
      message: 'Affiliate account created successfully',
      affiliate,
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    await createAuditLog({
      actorId: session?.user?.id || 'unknown',
      actorRole: (session?.user?.role as Role) || Role.USER,
      action: AuditAction.CREATE_AFFILIATE,
      targetType: AuditTargetType.AFFILIATE,
      responseStatus: 'FAILURE',
      details: {
        email: session?.user.email,
        reason: 'internal_server_error',
      },
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      await createAuditLog({
        actorId: session?.user?.id || 'unknown',
        actorRole: (session?.user?.role as Role) || Role.USER,
        action: AuditAction.UPDATE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        responseStatus: 'FAILURE',
        details: {
          email: session?.user?.email,
          reason: 'forbidden',
        },
      });
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

    const { commissionRate, walletAddress, status } = await request.json();

    // Check if affiliate exists
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!existingAffiliate) {
      await createAuditLog({
        actorId: session?.user?.id || 'unknown',
        actorRole: (session?.user?.role as Role) || Role.USER,
        action: AuditAction.UPDATE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        responseStatus: 'FAILURE',
        details: {
          email: session?.user?.email,
          reason: 'not_found',
        },
      });
      return NextResponse.json(
        { message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
    if (status !== undefined) updateData.status = status;

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
    
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.UPDATE_AFFILIATE,
      targetType: AuditTargetType.AFFILIATE,
      targetId: updatedAffiliate.id,
      responseStatus: 'SUCCESS',
      details: {
        email: user.email,
        affiliateId: updatedAffiliate.id,
        changes: updateData,
      },
    });

    return NextResponse.json({
      message: 'Affiliate updated successfully',
      affiliate: updatedAffiliate,
    });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    await createAuditLog({
      actorId: session?.user?.id || 'unknown',
      actorRole: (session?.user?.role as Role) || Role.USER,
      action: AuditAction.UPDATE_AFFILIATE,
      targetType: AuditTargetType.AFFILIATE,
      responseStatus: 'FAILURE',
      details: {
        email: session?.user?.email,
        reason: 'internal_error',
      },
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      await createAuditLog({
        actorId: session?.user?.id || 'unknown',
        actorRole: (session?.user?.role as Role) || Role.USER,
        action: AuditAction.DELETE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        responseStatus: 'FAILURE',
        details: {
          email: session?.user?.email,
          reason: 'forbidden',
        },
      });
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('id');
    const force = searchParams.get('force') === 'true';

    if (!affiliateId) {
      await createAuditLog({
        actorId: session?.user?.id || 'unknown',
        actorRole: (session?.user?.role as Role) || Role.USER,
        action: AuditAction.DELETE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        responseStatus: 'FAILURE',
        details: {
          email: session?.user?.email,
          reason: 'bad_request',
        },
      });
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
      await createAuditLog({
        actorId: session?.user?.id || 'unknown',
        actorRole: (session?.user?.role as Role) || Role.USER,
        action: AuditAction.DELETE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        responseStatus: 'FAILURE',
        details: {
          email: session?.user?.email,
          reason: 'not_found',
        },
      });
      return NextResponse.json(
        { message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Check if affiliate has commissions (prevent accidental deletion)
    if (existingAffiliate.commissions.length > 0 && !force) {
      await createAuditLog({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.DELETE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        targetId: existingAffiliate.id,
        responseStatus: 'FAILURE',
        details: {
          email: user.email,
          reason: 'has_commissions',
          commissionsCount: existingAffiliate.commissions.length,
        },
      });
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
      await createAuditLog({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.DELETE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        targetId: existingAffiliate.id,
        responseStatus: 'SUCCESS',
        details: {
          email: user.email,
          affiliateId: existingAffiliate.id,
          commissionsDeleted: existingAffiliate.commissions.length,
          forceDelete: true,
        },
      });
    }

    // Delete the affiliate
    await prisma.affiliate.delete({
      where: { id: affiliateId },
    });
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.DELETE_AFFILIATE,
      targetType: AuditTargetType.AFFILIATE,
      targetId: existingAffiliate.id,
      responseStatus: 'SUCCESS',
      details: {
        email: user.email,
        affiliateId: existingAffiliate.id,
        forceDelete: force,
      },
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
      await createAuditLog({
        actorId: session?.user.id || 'unknown',
        actorRole: session?.user.role as Role || Role.USER,
        action: AuditAction.DELETE_AFFILIATE,
        targetType: AuditTargetType.AFFILIATE,
        responseStatus: 'FAILURE',
        details: {
          email: session?.user.email,
          reason: 'internal_error',
        },
      });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}