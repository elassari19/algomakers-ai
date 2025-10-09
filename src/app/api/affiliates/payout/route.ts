import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { patchMetricsStats } from '@/lib/stats-service';
import { StatsType } from '@/generated/prisma';

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

    const { affiliateId, amount } = await request.json();

    if (!affiliateId || !amount || amount <= 0) {
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
      return NextResponse.json(
        { message: 'Payout amount exceeds pending commissions' },
        { status: 400 }
      );
    }

    // Track payout request stats
    try {
      await patchMetricsStats(StatsType.PAYOUT_METRICS, {
        id: affiliateId,
        affiliateName: affiliate.user.name || 'Unknown',
        affiliateEmail: affiliate.user.email,
        requestedAmount: Number(amount),
        totalPendingCommissions: Number(totalPending),
        pendingCommissionsCount: affiliate.commissions.length,
        requestedAt: new Date().toISOString(),
        requestedBy: user.id,
        status: 'PROCESSING',
        type: 'PAYOUT_REQUEST'
      });
    } catch (statsError) {
      console.error('Failed to track payout request stats:', statsError);
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

        // Update the paid commission amount
        await prisma.commission.update({
          where: { id: commission.id },
          data: {
            amount: remainingAmount,
            status: 'PAID',
            paidAt: new Date(),
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

    // Create payout record (you might want to add a Payout model to track this)
    // For now, we'll create an audit log entry
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'AFFILIATE_PAYOUT',
        details: {
          affiliateId,
          affiliateName: affiliate.user.name,
          affiliateEmail: affiliate.user.email,
          amount,
          processedAt: new Date(),
          commissionsUpdated: commissionsToUpdate.length,
        },
      },
    });

    // Track successful payout completion stats
    try {
      await patchMetricsStats(StatsType.PAYOUT_METRICS, {
        id: affiliateId,
        affiliateName: affiliate.user.name || 'Unknown',
        affiliateEmail: affiliate.user.email,
        payoutAmount: Number(amount),
        commissionsProcessed: commissionsToUpdate.length,
        totalPendingBefore: Number(totalPending),
        remainingPending: Number(totalPending - amount),
        processedAt: new Date().toISOString(),
        processedBy: user.id,
        processedByName: user.name || user.email,
        status: 'COMPLETED',
        type: 'PAYOUT_COMPLETION'
      });
      
    } catch (statsError) {
      console.error('Failed to update payout completion stats:', statsError);
    }

    return NextResponse.json({
      message: 'Payout processed successfully',
      amount,
      commissionsUpdated: commissionsToUpdate.length,
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}