import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/generated/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for user update
const userUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().optional(),
  tradingviewUsername: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPPORT', 'MANAGER']).optional(),
  image: z.string().url().optional().or(z.literal('')),
});

// GET /api/users/[id] - Fetch a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
            payments: true,
          },
        },
        subscriptions: {
          include: {
            pair: true,
          },
          take: 20,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'User fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Validate input data
    const validatedData = userUpdateSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // If email is being updated, check if new email is already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email is already taken by another user',
          },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.name !== undefined && { name: validatedData.name || null }),
        ...(validatedData.tradingviewUsername !== undefined && { 
          tradingviewUsername: validatedData.tradingviewUsername || null 
        }),
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.image !== undefined && { image: validatedData.image || null }),
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
            payments: true,
          },
        },
      },
    });

    // Audit log for user update
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.UPDATE_USER,
      targetType: AuditTargetType.USER,
      targetId: updatedUser.id,
      responseStatus: 'SUCCESS',
      details: {
        updatedFields: Object.keys(validatedData),
        previousValues: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          tradingviewUsername: existingUser.tradingviewUsername,
        },
        newValues: validatedData,
        actorEmail: session.user.email,
        actorName: session.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: session?.user.role as Role,
      action: AuditAction.UPDATE_USER,
      targetType: AuditTargetType.USER,
      responseStatus: 'FAILURE',
      details: { reason: 'exception', error: error instanceof Error ? error.message : 'Unknown error' },
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
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: 'User ID is required',
      },
      { status: 400 }
    );
  }

  try {  
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
            payments: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Check if user has active subscriptions or payments
    if (existingUser._count.subscriptions > 0 || existingUser._count.payments > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete user with existing subscriptions or payments. Please handle these first.',
        },
        { status: 409 }
      );
    }

    // Delete user (cascade will handle related data)
    await prisma.user.delete({
      where: { id },
    });

    // Audit log for user deletion
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.DELETE_USER,
      targetType: AuditTargetType.USER,
      targetId: id,
      responseStatus: 'SUCCESS',
      details: {
        deletedUser: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          tradingviewUsername: existingUser.tradingviewUsername,
          subscriptionCount: existingUser._count.subscriptions,
          paymentCount: existingUser._count.payments,
        },
        actorEmail: session.user.email,
        actorName: session.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    await createAuditLog({
      actorId: session?.user?.id || 'unknown',
      actorRole: session?.user?.role as Role || 'USER',
      action: AuditAction.DELETE_USER,
      targetType: AuditTargetType.USER,
      responseStatus: 'FAILURE',
      details: { reason: 'exception', error: error instanceof Error ? error.message : 'Unknown error' },
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}