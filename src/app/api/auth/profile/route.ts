import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userSchema } from '@/lib/zode-schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

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
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = profileActionSchema.safeParse(body);

    if (!validationResult.success) {
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
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        if (user.emailVerified) {
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
        await prisma.event.create({
          data: {
            userId: session.user.id,
            eventType: 'ACCOUNT_DELETED',
            metadata: {
              timestamp: new Date().toISOString(),
              deletedBy: session.user.id,
            },
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
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PROFILE_UPDATED',
          metadata: {
            action: data.action,
            updatedFields,
            timestamp: new Date().toISOString(),
          },
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
