import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { z } from 'zod';
import { Role } from '@/generated/prisma';

// Validation schema for payment creation/update
const paymentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  network: z.enum(['USDT', 'BTC', 'ETH', 'USDT_TRC20', 'USDT_ERC20', 'USDT_BEP20']),
  status: z.enum(['PENDING', 'PAID', 'UNDERPAID', 'EXPIRED', 'FAILED']).optional(),
  txHash: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  createdAt: z.string().datetime().optional(),
  actuallyPaid: z.number().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  orderData: z.any().optional().nullable(),
  orderId: z.string().optional().nullable(),
  totalAmount: z.number().positive('Total amount must be positive'),
});

// GET /api/payments - Fetch all payments with optional filtering and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - Please log in to access this resource' 
      }, { status: 401 });
    }

    if (session.user.role === 'USER') {
      return NextResponse.json({
        success: false,
        error: `Forbidden - ${session.user.role} role does not have permission to view payments. Required roles: ADMIN, MANAGER, or SUPPORT`,
        userRole: session.user.role,
        requiredRoles: ['ADMIN', 'MANAGER', 'SUPPORT']
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const network = searchParams.get('network');
    const userId = searchParams.get('userId');
    const search = searchParams.get('q'); // Search query
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause for filtering
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (network && network !== 'all') {
      where.network = network.toUpperCase();
    }

    if (userId) {
      where.userId = userId;
    }

    // Add search functionality across multiple fields
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        {
          user: {
            OR: [
              {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
        {
          txHash: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          invoiceId: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          orderId: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'user') {
      orderBy.user = { email: sortOrder };
    } else if (sortBy === 'totalAmount') {
      orderBy.totalAmount = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Fetch payments with related data
    const payments = await prisma.payment.findMany({
      where,
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
      orderBy,
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    // Get total count for pagination
    const totalCount = await prisma.payment.count({ where });

    return NextResponse.json({
      success: true,
      payments,
      totalCount,
      message: 'Payments fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch payments',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
      if (!session?.user?.id) {
        await createAuditLog({
          actorId: 'unknown',
          actorRole: 'USER',
          action: AuditAction.CREATE_PAYMENT,
          targetType: AuditTargetType.PAYMENT,
          responseStatus: 'FAILURE',
          details: { reason: 'unauthorized' },
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

  try {  

    const body = await request.json();
    
    // Validate input data
    const validatedData = paymentSchema.parse(body);

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Create new payment
    const newPayment = await prisma.payment.create({
      data: {
        userId: validatedData.userId,
        network: validatedData.network,
        status: validatedData.status || 'PENDING',
        txHash: validatedData.txHash,
        invoiceId: validatedData.invoiceId,
        actuallyPaid: validatedData.actuallyPaid,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        orderData: validatedData.orderData,
        orderId: validatedData.orderId,
        totalAmount: validatedData.totalAmount,
      },
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
      },
    });

    // Audit log for all roles
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.CREATE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      targetId: newPayment.id,
      responseStatus: 'SUCCESS',
      details: {
        createdPayment: {
          id: newPayment.id,
          userId: newPayment.userId,
          network: newPayment.network,
          status: newPayment.status,
          totalAmount: newPayment.totalAmount,
          userEmail: newPayment.user.email,
        },
        actorEmail: session.user.email,
        actorName: session.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      payment: newPayment,
      message: 'Payment created successfully',
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.CREATE_PAYMENT,
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
        message: 'Failed to create payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/payments - Update an existing payment
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
      if (!session?.user?.id) {
        await createAuditLog({
          actorId: 'unknown',
          actorRole: 'USER',
          action: AuditAction.CREATE_PAYMENT,
          targetType: AuditTargetType.PAYMENT,
          responseStatus: 'FAILURE',
          details: { reason: 'unauthorized' },
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  try {

    // Only allow admin roles to update payments
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const validatedData = paymentSchema.partial().parse(updateData);

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

    // If userId is being updated, check if new user exists
    if (validatedData.userId && validatedData.userId !== existingPayment.userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });

      if (!userExists) {
        return NextResponse.json(
          { error: 'New user not found' },
          { status: 404 }
        );
      }
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
      actorId: session?.user.id || 'unknown',
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

// DELETE /api/payments - Delete a payment
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {  
    // Only allow admin roles to delete payments
    if (!['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Only admins can delete payments' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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
    if (existingPayment.subscription && existingPayment.subscription.some(sub => sub.status === 'ACTIVE')) {
      await createAuditLog({
        actorId: session?.user.id || 'unknown',
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.DELETE_PAYMENT,
        targetType: AuditTargetType.PAYMENT,
        responseStatus: 'FAILURE',
        details: {
          userEmail: session?.user.email,
          user: session?.user.name,
          timestamp: new Date().toISOString(),
          reason: 'active_subscription',
        },
      });
      return NextResponse.json(
        { error: 'Cannot delete payment with active subscription' },
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
      actorId: session?.user.id || 'unknown',
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.DELETE_PAYMENT,
      targetType: AuditTargetType.PAYMENT,
      responseStatus: 'FAILURE',
      details: {
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
        reason: 'unknown_error',
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