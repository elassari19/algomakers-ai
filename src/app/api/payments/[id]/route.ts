import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import type { Role } from '@/generated/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';

import { z } from 'zod';

// Validation schema for payment update
const paymentUpdateSchema = z.object({
  network: z.enum(['USDT_TRC20', 'USDT_ERC20', 'USDT_BEP20']).optional(),
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
    await createAuditLog({
      actorId: 'system',
      actorRole: 'USER',
      action: AuditAction.GET_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Only allow admin roles to update payments
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      await createAuditLog({
        actorId: session?.user.id!,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.UPDATE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: {
          userEmail: session?.user.email,
          user: session?.user.name,
          timestamp: new Date().toISOString(),
        },
      });
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
      await createAuditLog({
        actorId: session?.user.id!,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.UPDATE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: {
          userEmail: session?.user.email,
          user: session?.user.name,
          timestamp: new Date().toISOString(),
        },
      });
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

    // Audit log for all roles
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: updatedPayment.id,
      responseStatus: 'SUCCESS',
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
        actorEmail: session.user.email,
        actorName: session.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.DELETE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    
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
      await createAuditLog({
        actorId: session?.user.id!,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.DELETE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: {
          userEmail: session?.user.email,
          user: session?.user.name,
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment has active subscription
    if (existingPayment.subscription && existingPayment.subscription.some(sub => sub.status === 'ACTIVE')) {
      return NextResponse.json(
        { error: 'Cannot delete payment with active subscriptions' },
        { status: 400 }
      );
    }

    // Delete payment (this will cascade delete payment items due to onDelete: Cascade)
    await prisma.payment.delete({
      where: { id },
    });

    // Audit log for all roles
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.DELETE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: id,
      responseStatus: 'SUCCESS',
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
        actorEmail: session.user.email,
        actorName: session.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.DELETE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });
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