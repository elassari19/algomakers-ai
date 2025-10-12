import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditAction, AuditTargetType, createAuditLog } from '@/lib/audit';
import { Role } from '@/generated/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  try {

    if (!session?.user?.email) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: Role.USER,
        action: AuditAction.INITIATE_PAYOUT,
        targetType: AuditTargetType.PAYOUT,
        responseStatus: 'FAILURE',
        details: {
          email: session?.user.email || 'unknown',
          reason: 'user_not_found',
        },
      });
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      await createAuditLog({
        actorId: user?.id || 'unknown',
        actorRole: user?.role || Role.USER,
        action: AuditAction.INITIATE_PAYOUT,
        targetType: AuditTargetType.PAYOUT,
        responseStatus: 'FAILURE',
        details: {
          email: session.user.email || 'unknown',
          reason: 'forbidden_not_admin',
        },
      });
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { affiliateId, amount } = await request.json();

    if (!affiliateId || !amount || amount <= 0) {
      await createAuditLog({
        actorId: user?.id || 'unknown',
        actorRole: user?.role || Role.USER,
        action: AuditAction.INITIATE_PAYOUT,
        targetType: AuditTargetType.PAYOUT,
        responseStatus: 'FAILURE',
        details: {
          email: session.user.email || 'unknown',
          reason: 'invalid_request',
        },
      });
      return NextResponse.json(
        { message: 'Invalid affiliate ID or amount' },
        { status: 400 }
      );
    }

    // Verify affiliate exists and has pending commissions
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        commissions: {
          where: { status: 'PENDING' },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!affiliate) {
      await createAuditLog({
        actorId: user?.id || 'unknown',
        actorRole: user?.role || Role.USER,
        action: AuditAction.INITIATE_PAYOUT,
        targetType: AuditTargetType.PAYOUT,
        responseStatus: 'FAILURE',
        details: {
          email: session.user.email || 'unknown',
          reason: 'affiliate_not_found',
        },
      });
      return NextResponse.json(
        { message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    const totalPending = affiliate.commissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0
    );

    if (amount > totalPending) {
      await createAuditLog({
        actorId: user?.id || 'unknown',
        actorRole: user?.role || Role.USER,
        action: AuditAction.CREATE_PAYOUT,
        targetType: AuditTargetType.PAYOUT,
        responseStatus: 'FAILURE',
        details: {
          email: session.user.email || 'unknown',
          reason: 'amount_exceeds_pending',
          requestedAmount: amount,
          totalPending,
        },
      });
      return NextResponse.json(
        { message: 'Payout amount exceeds pending commissions' },
        { status: 400 }
      );
    }

    // Process payout by updating commission statuses
    // Find commissions to pay (oldest first)
    let remainingAmount = amount;
    const commissionsToUpdate = [];

    for (const commission of affiliate.commissions.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )) {
      if (remainingAmount <= 0) break;

      const commissionAmount = Number(commission.amount);
      
      if (commissionAmount <= remainingAmount) {
        // Full commission can be paid
        commissionsToUpdate.push({
          id: commission.id,
          status: 'PAID',
          paidAt: new Date(),
        });
        remainingAmount -= commissionAmount;
      } else {
        // Partial payment - split the commission
        // Mark original as paid
        commissionsToUpdate.push({
          id: commission.id,
          status: 'PAID',
          paidAt: new Date(),
        });

        // Create new commission for remaining amount
        await prisma.commission.create({
          data: {
            affiliateId: commission.affiliateId,
            subscriptionId: commission.subscriptionId,
            amount: commissionAmount - remainingAmount,
            status: 'PENDING',
            type: commission.type || 'REFERRAL',
          },
        });
        await createAuditLog({
          actorId: user?.id || 'unknown',
          actorRole: user?.role || Role.USER,
          action: AuditAction.CREATE_PAYOUT,
          targetType: AuditTargetType.PAYOUT,
          responseStatus: 'SUCCESS',
          details: {
            email: session.user.email || 'unknown',
            message: 'Partial commission payment processed',
            originalCommissionId: commission.id,
            paidAmount: remainingAmount,
            newPendingAmount: commissionAmount - remainingAmount,
          },
        });

        // Update the paid commission amount
        await prisma.commission.update({
          where: { id: commission.id },
          data: {
            amount: remainingAmount,
            status: 'PAID',
            paidAt: new Date(),
          },
        });
        await createAuditLog({
          actorId: user?.id || 'unknown',
          actorRole: user?.role || Role.USER,
          action: AuditAction.UPDATE_PAYOUT,
          targetType: AuditTargetType.PAYOUT,
          responseStatus: 'SUCCESS',
          details: {
            email: session.user.email || 'unknown',
            message: 'Commission fully paid with partial payment',
            commissionId: commission.id,
            paidAmount: remainingAmount,
          },
        });

        remainingAmount = 0;
        break;
      }
    }

    // Update commissions in batch (for full payments)
    for (const update of commissionsToUpdate) {
      if (update.id) {
        await prisma.commission.update({
          where: { id: update.id },
          data: {
            status: update.status as any,
            paidAt: update.paidAt,
          },
        });
      }
    }

    // For now, we'll create an audit log entry
    await createAuditLog({
      actorId: user?.id || 'unknown',
      actorRole: user?.role || Role.USER,
      action: AuditAction.CREATE_PAYOUT,
      targetType: AuditTargetType.PAYOUT,
      responseStatus: 'SUCCESS',
      details: {
        email: session.user.email || 'unknown',
        affiliateId: affiliate.id,
        affiliateEmail: affiliate.user.email,
        amount,
        commissionsPaid: commissionsToUpdate.map(c => c.id),
      },
    });

    return NextResponse.json({
      message: 'Payout processed successfully',
      amount,
      commissionsUpdated: commissionsToUpdate.length,
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: session?.user.role as Role || Role.USER,
      action: AuditAction.INITIATE_PAYOUT,
      targetType: AuditTargetType.PAYOUT,
      responseStatus: 'FAILURE',
      details: {
        reason: 'internal_server_error',
        error: (error as Error).message,
      },
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}