import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
// ...existing code...

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Token must not be expired
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    });

    if (!user) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: 'USER',
        action: AuditAction.PASSWORD_RESET,
        targetType: AuditTargetType.USER,
        responseStatus: 'FAILURE',
        details: {
          reason: 'invalid_or_expired_token',
          token,
        },
      });
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Get user role for audit log
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    const role = userWithRole?.role || 'USER';

    // Log successful password reset (unified audit log)
    await createAuditLog({
      actorId: user.id,
      actorRole: role,
      action: AuditAction.PASSWORD_RESET,
      targetType: AuditTargetType.USER,
      targetId: user.id,
      responseStatus: 'SUCCESS',
      details: {
        email: user.email,
        action: 'password_reset_completed',
        timestamp: new Date().toISOString(),
        tokenUsed: token,
        method: 'TOKEN_RESET',
        role,
      },
    });

    return NextResponse.json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof z.ZodError) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: 'USER',
        action: AuditAction.PASSWORD_RESET,
        targetType: AuditTargetType.USER,
        responseStatus: 'FAILURE',
        details: {
          reason: 'invalid_input',
          issues: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    await createAuditLog({
      actorId: 'unknown',
      actorRole: 'USER',
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

// Verify reset token endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    // Check if token is valid and not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        resetTokenExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      expiresAt: user.resetTokenExpiry,
    });
  } catch (error) {
    console.error('Token verification error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
