import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userSchema } from '@/lib/zode-schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { Role } from '@/generated/prisma';

// Individual field schemas
const updateNameSchema = z.object({
  action: z.literal('update-name'),
  name: userSchema.shape.name,
});

const updateEmailSchema = z.object({
  action: z.literal('update-email'),
  email: userSchema.shape.email,
});

const updateTradingViewSchema = z.object({
  action: z.literal('update-tradingview'),
  tradingviewUsername: z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]{3,15}$/,
      'TradingView username must be 3-15 characters long and contain only letters, numbers, underscores, and hyphens'
    )
    .optional()
    .or(z.literal('').transform(() => null)),
});

const updatePasswordSchema = z.object({
  action: z.literal('update-password'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});

const profileActionSchema = z.discriminatedUnion('action', [
  updateNameSchema,
  updateEmailSchema,
  updateTradingViewSchema,
  updatePasswordSchema,
  z.object({ action: z.literal('clear-tradingview') }),
  z.object({ action: z.literal('resend-verification') }),
  z.object({
    action: z.literal('delete-account'),
    password: z.string().min(1, 'Password is required'),
  }),
]);

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        tradingviewUsername: true,
        role: true,
        image: true,
        createdAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      await createAuditLog({
        actorId: session.user.id,
        actorRole: Role.USER,
        action: AuditAction.ACCOUNT_NOT_FOUND,
        targetType: AuditTargetType.USER,
        targetId: session.user.id,
        responseStatus: 'FAILURE',
        details: {
          reason: 'user_not_found',
        },
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile GET error:', error);
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: Role.USER,
      action: AuditAction.INTERNAL_ERROR,
      targetType: AuditTargetType.USER,
      responseStatus: 'FAILURE',
      details: {
        reason: 'internal_server_error',
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
        
    const body = await request.json();
    const validationResult = profileActionSchema.safeParse(body);

    if (!validationResult.success) {
      await createAuditLog({
        actorId: session.user.id,
        actorRole: Role.USER,
        action: AuditAction.INTERNAL_ERROR,
        targetType: AuditTargetType.USER,
        responseStatus: 'FAILURE',
        details: {
          reason: 'validation_failed',
        },
      });
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!currentUser) {
      await createAuditLog({
        actorId: session.user.id,
        actorRole: Role.USER,
        action: AuditAction.ACCOUNT_NOT_FOUND,
        targetType: AuditTargetType.USER,
        responseStatus: 'FAILURE',
        details: {
          reason: 'user_not_found',
        },
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};
    let successMessage = '';
    let updatedFields: string[] = [];

    switch (data.action) {
      case 'update-name':
        updateData.name = data.name;
        successMessage = 'Name updated successfully';
        updatedFields = ['name'];
        break;

      case 'update-email':
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
          select: { id: true },
        });

        if (existingUser && existingUser.id !== session.user.id) {
          return NextResponse.json(
            { error: 'Email is already taken' },
            { status: 409 }
          );
        }

        updateData.email = data.email;
        // Reset email verification when email changes
        if (data.email !== currentUser.email) {
          updateData.emailVerified = null;
        }
        successMessage = 'Email updated successfully';
        updatedFields = ['email'];
        break;

      case 'update-tradingview':
        updateData.tradingviewUsername = data.tradingviewUsername;
        successMessage = 'TradingView username updated successfully';
        updatedFields = ['tradingviewUsername'];
        break;

      case 'update-password':
        // Verify current password
        if (!currentUser.passwordHash) {
          await createAuditLog({
            actorId: session.user.id,
            actorRole: Role.USER,
            action: AuditAction.UPDATE_USER,
            targetType: AuditTargetType.USER,
            responseStatus: 'FAILURE',
            details: {
              reason: 'no_password_set',
            },
          });
          return NextResponse.json(
            { error: 'No password set. Please set a password first.' },
            { status: 400 }
          );
        }

        const isCurrentPasswordValid = await bcrypt.compare(
          data.currentPassword,
          currentUser.passwordHash
        );
        if (!isCurrentPasswordValid) {
          await createAuditLog({
            actorId: session.user.id,
            actorRole: Role.USER,
            action: AuditAction.UPDATE_USER,
            targetType: AuditTargetType.USER,
            responseStatus: 'FAILURE',
            details: {
              reason: 'invalid_current_password',
            },
          });
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 400 }
          );
        }

        // Hash new password
        const saltRounds = 12;
        updateData.passwordHash = await bcrypt.hash(
          data.newPassword,
          saltRounds
        );
        successMessage = 'Password updated successfully';
        updatedFields = ['password'];
        break;

      case 'clear-tradingview':
        updateData.tradingviewUsername = null;
        successMessage = 'TradingView username cleared successfully';
        updatedFields = ['tradingviewUsername'];
        break;

      case 'resend-verification':
        // Handle email verification resend
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true, emailVerified: true },
        });

        if (!user) {
          await createAuditLog({
            actorId: session.user.id,
            actorRole: Role.USER,
            action: AuditAction.ACCOUNT_NOT_FOUND,
            targetType: AuditTargetType.USER,
            responseStatus: 'FAILURE',
            details: {
              reason: 'user_not_found',
            },
          });
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        if (user.emailVerified) {
          await createAuditLog({
            actorId: session.user.id,
            actorRole: Role.USER,
            action: AuditAction.UPDATE_USER,
            targetType: AuditTargetType.USER,
            targetId: session.user.id,
            responseStatus: 'FAILURE',
            details: {
              reason: 'email_already_verified',
            },
          });
          return NextResponse.json(
            { error: 'Email is already verified' },
            { status: 400 }
          );
        }

        // TODO: Implement email verification sending logic
        return NextResponse.json({
          message: 'Verification email sent successfully',
        });

      case 'delete-account':
        // Get current user for password verification
        const userForDeletion = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { passwordHash: true },
        });

        if (!userForDeletion?.passwordHash) {
          await createAuditLog({
            actorId: session.user.id,
            actorRole: Role.USER,
            action: AuditAction.DELETE_USER,
            targetType: AuditTargetType.USER,
            targetId: session.user.id,
            responseStatus: 'FAILURE',
            details: {
              reason: 'user_not_found_or_no_password',
            },
          });
          return NextResponse.json(
            { error: 'User not found or no password set' },
            { status: 404 }
          );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          data.password,
          userForDeletion.passwordHash
        );
        if (!isPasswordValid) {
          await createAuditLog({
            actorId: session.user.id,
            actorRole: Role.USER,
            action: AuditAction.DELETE_USER,
            targetType: AuditTargetType.USER,
            targetId: session.user.id,
            responseStatus: 'FAILURE',
            details: {
              reason: 'invalid_password',
            },
          });
          return NextResponse.json(
            { error: 'Password is incorrect' },
            { status: 400 }
          );
        }

        // Soft delete: anonymize user data instead of hard delete
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            email: `deleted_${session.user.id}@deleted.com`,
            name: 'Deleted User',
            passwordHash: null,
            tradingviewUsername: null,
            image: null,
            resetToken: null,
            resetTokenExpiry: null,
          },
        });

        // Log the deletion event
        await createAuditLog({
          actorId: session.user.id,
          actorRole: Role.USER,
          action: AuditAction.DELETE_USER,
          targetType: AuditTargetType.USER,
          targetId: session.user.id,
          responseStatus: 'SUCCESS',
          details: {
            action: 'delete-account',
            deletionType: 'SOFT_DELETE',
            deletedBy: session.user.id,
            originalEmail: currentUser.email,
            timestamp: new Date().toISOString(),
            reason: 'USER_REQUESTED_DELETION',
          },
        });

        return NextResponse.json({
          message: 'Account deleted successfully',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update user in database (for non-special actions)
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          tradingviewUsername: true,
          role: true,
          image: true,
          emailVerified: true,
        },
      });

      // Log the update event
      await createAuditLog({
        actorId: session.user.id,
        actorRole: Role.USER,
        action: AuditAction.UPDATE_USER,
        targetType: AuditTargetType.USER,
        targetId: session.user.id,
        responseStatus: 'SUCCESS',
        details: {
          action: 'update-profile',
          updatedFields,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        message: successMessage,
        user: updatedUser,
      });
    }

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error('Profile PUT error:', error);
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: Role.USER,
      action: AuditAction.INTERNAL_ERROR,
      targetType: AuditTargetType.USER,
      responseStatus: 'FAILURE',
      details: {
        reason: 'internal_server_error',
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Keep PATCH for backward compatibility if needed
export async function PATCH(request: NextRequest) {
  // Redirect to PUT method
  return PUT(request);
}

export async function DELETE(request: NextRequest) {
  // Redirect to PUT method with delete action
  return PUT(request);
}
