import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType, createEventLog } from '@/lib/audit';
import { StatsType } from '@/generated/prisma';
import { patchMetricsStats } from '@/lib/stats-service';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schema for user creation/update
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  tradingviewUsername: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPPORT', 'MANAGER']),
  image: z.string().url().optional().or(z.literal('')),
  password: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'UNVERIFIED']).optional(),
  emailVerified: z.union([z.date(), z.string().datetime(), z.string().optional(), z.null()]).optional().nullable(),
});

// GET /api/users - Fetch all users with optional filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const verified = searchParams.get('verified');
    const search = searchParams.get('q'); // Search query for name/email
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Build where clause for filtering
    const where: any = {};
    
    if (role && role !== 'all') {
      where.role = role.toUpperCase();
    }
    
    if (verified === 'true') {
      where.emailVerified = { not: null };
    } else if (verified === 'false') {
      where.emailVerified = null;
    }

    // Add search functionality for name and email
    if (search && search.trim() !== '') {
      where.OR = [
        {
          name: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    // Fetch users with counts of related data
    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    return NextResponse.json({
      success: true,
      users,
      totalCount,
      message: 'Users fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input data
    const validatedData = userSchema.parse(body);

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Hash password if provided
    let hashedPassword = undefined;
    if (validatedData.password) {
      hashedPassword = await bcrypt.hash(validatedData.password, 12);
    }

    // Normalize emailVerified to Date or null
    let emailVerifiedValue = null;
    if (validatedData.emailVerified) {
      if (validatedData.emailVerified instanceof Date) {
        emailVerifiedValue = validatedData.emailVerified;
      } else if (typeof validatedData.emailVerified === 'string') {
        const parsedDate = new Date(validatedData.emailVerified);
        if (!isNaN(parsedDate.getTime())) {
          emailVerifiedValue = parsedDate;
        }
      }
    }
    // Create new user
    const userData: any = {
      email: validatedData.email,
      name: validatedData.name || null,
      tradingviewUsername: validatedData.tradingviewUsername || null,
      role: validatedData.role,
      image: validatedData.image || null,
      status: validatedData.status || 'UNVERIFIED',
      emailVerified: emailVerifiedValue,
    };
    if (hashedPassword) {
      userData.passwordHash = hashedPassword;
    }
    const newUser = await prisma.user.create({
      data: userData,
      include: {
        _count: {
          select: {
            subscriptions: true,
            payments: true,
          },
        },
      },
    });

    // Track user creation stats
    try {
      await patchMetricsStats(StatsType.USER_METRICS, {
        id: newUser.id,
        userId: newUser.id,
        creatorUserId: session.user.id,
        creatorEmail: session.user.email,
        creatorRole: session.user.role,
        createdUserEmail: newUser.email,
        createdUserRole: newUser.role,
        hasPassword: !!hashedPassword,
        hasTradingViewUsername: !!newUser.tradingviewUsername,
        createdAt: new Date().toISOString(),
        type: 'USER_CREATED'
      });
    } catch (statsError) {
      console.error('Failed to track user creation stats:', statsError);
    }

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.CREATE_USER,
        targetType: AuditTargetType.USER,
        targetId: newUser.id,
        details: {
          createdUser: {
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            tradingviewUsername: newUser.tradingviewUsername,
          },
          adminEmail: session.user.email,
          adminName: session.user.name,
        },
      });
    } else if (session.user.role === 'USER') {
      // Create event for USER role
      await createEventLog({
        userId: session.user.id,
        eventType: 'USER_CREATED',
        metadata: {
          createdUserId: newUser.id,
          createdUserEmail: newUser.email,
          createdUserRole: newUser.role,
          userRole: session.user.role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
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
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update an existing user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...rawUpdateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

  const validatedData = userSchema.partial().parse(rawUpdateData);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for duplicate email if being updated
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Normalize emailVerified to Date or null
    let emailVerifiedValue = null;
    if (validatedData.emailVerified !== undefined) {
      if (validatedData.emailVerified instanceof Date) {
        emailVerifiedValue = validatedData.emailVerified;
      } else if (typeof validatedData.emailVerified === 'string') {
        const parsedDate = new Date(validatedData.emailVerified);
        if (!isNaN(parsedDate.getTime())) {
          emailVerifiedValue = parsedDate;
        }
      } else if (validatedData.emailVerified === null) {
        emailVerifiedValue = null;
      }
    }
    // Prepare update data
    const updateUserData: any = {
      email: validatedData.email,
      name: validatedData.name,
      tradingviewUsername: validatedData.tradingviewUsername,
      role: validatedData.role,
      image: validatedData.image,
      status: validatedData.status,
      emailVerified: emailVerifiedValue,
    };
    // Hash password if provided, else ignore
    if (validatedData.password) {
      updateUserData.passwordHash = await bcrypt.hash(validatedData.password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateUserData,
      include: {
        _count: {
          select: {
            subscriptions: true,
            payments: true,
          },
        },
      },
    });

    // Track user update stats
    try {
      await patchMetricsStats(StatsType.USER_METRICS, {
        id: updatedUser.id,
        userId: updatedUser.id,
        updaterUserId: session.user.id,
        updaterEmail: session.user.email,
        updaterRole: session.user.role,
        targetUserEmail: updatedUser.email,
        updatedFields: Object.keys(validatedData),
        previousValues: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          tradingviewUsername: existingUser.tradingviewUsername,
        },
        newValues: validatedData,
        passwordUpdated: !!validatedData.password,
        updatedAt: new Date().toISOString(),
        type: 'USER_UPDATED'
      });
    } catch (statsError) {
      console.error('Failed to track user update stats:', statsError);
    }

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.UPDATE_USER,
        targetType: AuditTargetType.USER,
        targetId: updatedUser.id,
        details: {
          updatedFields: Object.keys(validatedData),
          previousValues: {
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            tradingviewUsername: existingUser.tradingviewUsername,
          },
          newValues: validatedData,
          adminEmail: session.user.email,
          adminName: session.user.name,
        },
      });
    } else if (session.user.role === 'USER') {
      // Create event for USER role
      await createEventLog({
        userId: session.user.id,
        eventType: 'USER_UPDATED',
        metadata: {
          targetUserId: updatedUser.id,
          targetUserEmail: updatedUser.email,
          updatedFields: Object.keys(validatedData),
          userRole: session.user.role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
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

// DELETE /api/users - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists and get details for audit log
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
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has active subscriptions or payments
    if (existingUser._count.subscriptions > 0 || existingUser._count.payments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with active subscriptions or payments' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    // Track user deletion stats
    try {
      await patchMetricsStats(StatsType.USER_METRICS, {
        id: id,
        userId: id,
        deleterUserId: session.user.id,
        deleterEmail: session.user.email,
        deleterRole: session.user.role,
        deletedUserInfo: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          tradingviewUsername: existingUser.tradingviewUsername,
          subscriptionCount: existingUser._count.subscriptions,
          paymentCount: existingUser._count.payments,
        },
        deletedAt: new Date().toISOString(),
        type: 'USER_DELETED'
      });
    } catch (statsError) {
      console.error('Failed to track user deletion stats:', statsError);
    }

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.DELETE_USER,
        targetType: AuditTargetType.USER,
        targetId: id,
        details: {
          deletedUser: {
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            tradingviewUsername: existingUser.tradingviewUsername,
            subscriptionCount: existingUser._count.subscriptions,
            paymentCount: existingUser._count.payments,
          },
          adminEmail: session.user.email,
          adminName: session.user.name,
        },
      });
    } else if (session.user.role === 'USER') {
      // Create event for USER role
      await createEventLog({
        userId: session.user.id,
        eventType: 'USER_DELETED',
        metadata: {
          deletedUserId: id,
          deletedUserEmail: existingUser.email,
          deletedUserRole: existingUser.role,
          userRole: session.user.role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
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