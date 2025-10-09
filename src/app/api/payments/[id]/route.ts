import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { patchMetricsStats } from '@/lib/stats-service';
import { StatsType } from '@/generated/prisma';
import { z } from 'zod';

// Validation schema for payment update
const paymentUpdateSchema = z.object({
  network: z.enum(['USDT', 'BTC', 'ETH', 'USDT_TRC20', 'USDT_ERC20', 'USDT_BEP20']).optional(),
  status: z.enum(['PENDING', 'PAID', 'UNDERPAID', 'EXPIRED', 'FAILED']).optional(),
  txHash: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  actuallyPaid: z.number().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  orderData: z.any().optional().nullable(),
  orderId: z.string().optional().nullable(),
  totalAmount: z.number().positive().optional(),
});

// GET /api/payments/[id] - Get a specific payment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // For non-admin users, only allow access to their own payments
    const whereClause: any = { id };
    if (!['ADMIN', 'MANAGER', 'SUPPORT'].includes(session.user.role)) {
      whereClause.userId = session.user.id;
    }

    // Fetch payment with all related data
    const payment = await prisma.payment.findUnique({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        subscription: {
          select: {
            id: true,
            period: true,
            status: true,
            startDate: true,
            expiryDate: true,
            inviteStatus: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Calculate additional metrics
    const paymentMetrics = {
      itemsCount: payment.paymentItems.length,
      totalBasePrice: payment.paymentItems.reduce((sum, item) => sum + Number(item.basePrice), 0),
      totalDiscount: payment.paymentItems.reduce((sum, item) => 
        sum + (Number(item.basePrice) - Number(item.finalPrice)), 0
      ),
      averageDiscountRate: payment.paymentItems.length > 0 
        ? payment.paymentItems.reduce((sum, item) => sum + Number(item.discountRate), 0) / payment.paymentItems.length
        : 0,
    };

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        metrics: paymentMetrics,
      },
      message: 'Payment fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - Update a specific payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin roles to update payments
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const validatedData = paymentUpdateSchema.parse(body);

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updatePaymentData: any = {};
    
    Object.keys(validatedData).forEach((key) => {
      const value = validatedData[key as keyof typeof validatedData];
      if (value !== undefined) {
        if (key === 'expiresAt' && value) {
          updatePaymentData[key] = new Date(value as string);
        } else {
          updatePaymentData[key] = value;
        }
      }
    });

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updatePaymentData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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
            status: true,
          },
        },
      },
    });

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.UPDATE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        targetId: updatedPayment.id,
        details: {
          updatedFields: Object.keys(validatedData),
          previousValues: {
            status: existingPayment.status,
            network: existingPayment.network,
            totalAmount: existingPayment.totalAmount,
            txHash: existingPayment.txHash,
            actuallyPaid: existingPayment.actuallyPaid,
          },
          newValues: validatedData,
          userEmail: existingPayment.user.email,
          adminEmail: session.user.email,
          adminName: session.user.name,
        },
      });
    } else {
      // Create event for USER role
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PAYMENT_UPDATED',
          metadata: {
            paymentId: updatedPayment.id,
            targetUserId: updatedPayment.userId,
            updatedFields: Object.keys(validatedData),
            previousStatus: existingPayment.status,
            newStatus: validatedData.status,
            userRole: session.user.role,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    // Track payment update stats
    try {
      await patchMetricsStats(StatsType.BILLING_METRICS, {
        id: updatedPayment.id,
        paymentId: updatedPayment.id,
        updaterUserId: session.user.id,
        updaterEmail: session.user.email,
        updaterRole: session.user.role,
        targetUserId: updatedPayment.userId,
        targetUserEmail: updatedPayment.user.email,
        updatedFields: Object.keys(validatedData),
        previousValues: {
          status: existingPayment.status,
          network: existingPayment.network,
          totalAmount: Number(existingPayment.totalAmount),
          txHash: existingPayment.txHash,
          actuallyPaid: existingPayment.actuallyPaid ? Number(existingPayment.actuallyPaid) : null
        },
        newValues: validatedData,
        updatedAt: new Date().toISOString(),
        type: 'PAYMENT_UPDATED_BY_ID'
      });
    } catch (statsError) {
      console.error('Failed to track payment update stats:', statsError);
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/[id] - Delete a specific payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin roles to delete payments
    if (!['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Only admins can delete payments' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Check if payment exists and get details for audit log
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        paymentItems: {
          select: {
            id: true,
            pair: {
              select: {
                symbol: true,
              },
            },
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment has active subscription
    if (existingPayment.subscription && existingPayment.subscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot delete payment with active subscription' },
        { status: 400 }
      );
    }

    // Delete payment (this will cascade delete payment items due to onDelete: Cascade)
    await prisma.payment.delete({
      where: { id },
    });

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.DELETE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        targetId: id,
        details: {
          deletedPayment: {
            id: existingPayment.id,
            userId: existingPayment.userId,
            network: existingPayment.network,
            status: existingPayment.status,
            totalAmount: existingPayment.totalAmount,
            userEmail: existingPayment.user.email,
            userName: existingPayment.user.name,
            paymentItemsCount: existingPayment.paymentItems.length,
            hasSubscription: !!existingPayment.subscription,
          },
          adminEmail: session.user.email,
          adminName: session.user.name,
        },
      });
    } else {
      // Create event for USER role
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PAYMENT_DELETED',
          metadata: {
            paymentId: id,
            targetUserId: existingPayment.userId,
            deletedPaymentInfo: {
              network: existingPayment.network,
              status: existingPayment.status,
              totalAmount: existingPayment.totalAmount,
              paymentItemsCount: existingPayment.paymentItems.length,
              hasSubscription: !!existingPayment.subscription,
            },
            userRole: session.user.role,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    // Track payment deletion stats
    try {
      await patchMetricsStats(StatsType.BILLING_METRICS, {
        id: id,
        paymentId: id,
        deleterUserId: session.user.id,
        deleterEmail: session.user.email,
        deleterRole: session.user.role,
        targetUserId: existingPayment.userId,
        targetUserEmail: existingPayment.user.email,
        deletedPaymentInfo: {
          network: existingPayment.network,
          status: existingPayment.status,
          totalAmount: Number(existingPayment.totalAmount),
          paymentItemsCount: existingPayment.paymentItems.length,
          hasSubscription: !!existingPayment.subscription
        },
        deletedAt: new Date().toISOString(),
        type: 'PAYMENT_DELETED_BY_ID'
      });
    } catch (statsError) {
      console.error('Failed to track payment deletion stats:', statsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}