import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await params;

    // For admin users, allow viewing any payment
    // For regular users, only allow viewing their own payments
    const isAdmin = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(session.user.role);
    
    const whereClause = isAdmin 
      ? { id: paymentId }
      : { id: paymentId, userId: session.user.id };

    // Fetch payment with all related data
    const payment = await prisma.payment.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        paymentItems: {
          include: {
            pair: {
              select: {
                id: true,
                symbol: true,
                version: true,
                timeframe: true,
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
    });

    if (!payment) {
      await createAuditLog({
        actorId: session.user.id,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.GET_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: {
          userEmail: session.user.email,
          user: session.user.name,
          reason: 'Payment not found or access denied',
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment not found or you do not have permission to view it' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}

// Update payment details (for admin users)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Only allow admin users to update payments
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      await createAuditLog({
        actorId: session.user.id,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.UPDATE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: {
          userEmail: session.user.email,
          user: session.user.name,
          reason: 'Unauthorized access attempt',
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { paymentId } = await params;
    const body = await request.json();

    const allowedUpdates = [
      'status',
      'txHash',
      'actuallyPaid',
      'network',
      'orderData'
    ];

    // Filter only allowed fields
    const updateData: any = {};
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        paymentItems: {
          include: {
            pair: {
              select: {
                id: true,
                symbol: true,
                version: true,
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
    });

    // Create audit log for admin payment update
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: payment.id,
      details: {
        paymentId: payment.id,
        paymentUserId: payment.user.id,
        paymentUserEmail: payment.user.email,
        adminRole: session.user.role,
        adminEmail: session.user.email,
        updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt'),
        newStatus: updateData.status,
        newTxHash: updateData.txHash,
        newActuallyPaid: updateData.actuallyPaid,
        newNetwork: updateData.network,
        paymentAmount: Number(payment.totalAmount),
        reason: body.reason || 'Administrative update',
        actionType: 'ADMIN_PAYMENT_UPDATE'
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      message: 'Payment updated successfully',
    });

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
        reason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}