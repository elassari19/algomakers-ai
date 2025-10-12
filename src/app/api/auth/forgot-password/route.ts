import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail } from '@/lib/email-service';
import { randomBytes } from 'crypto';
import { Role } from '@/generated/prisma';
import { AuditAction, AuditTargetType, createAuditLog } from '@/lib/audit';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Generate a secure reset token
function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = forgotPasswordSchema.parse(body);
  try {

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: Role.USER,
        action: AuditAction.PASSWORD_RESET,
        targetType: AuditTargetType.USER,
        responseStatus: 'FAILURE',
        details: {
          email,
          reason: 'user_not_found',
        },
      });
      return NextResponse.json({
        message:
          'If an account with that email exists, we have sent a password reset link.',
      });
    }

    // Generate reset token and expiry (24 hours)
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    await createAuditLog({
      actorId: user.id,
      actorRole: Role.USER,
      action: AuditAction.PASSWORD_RESET,
      targetId: user.id,
      targetType: AuditTargetType.USER,
      responseStatus: 'SUCCESS',
      details: {
        email: user.email,
      },
    });

    // Generate reset URL
    const resetUrl = `${
      process.env.NEXTAUTH_URL || 'http://localhost:3000'
    }/reset-password?token=${resetToken}`;
    const expiryTime =
      resetTokenExpiry.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }) + ' UTC';

    // Send password reset email using sendEmail
    try {
      await sendEmail({
        userId: user?.id || undefined,
        role: user?.role || Role.USER,
        template: 'password_reset',
        to: user.email,
        params: {
          firstName: user.name || 'there',
          resetUrl,
          expiryTime,
        },
      });
    } catch (emailError) {
      // Log failed email send but don't fail the request
      console.error('Failed to send password reset email:', emailError);
    }

    return NextResponse.json({
      message:
        'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    await createAuditLog({
      actorId: 'unknown',
      actorRole: Role.USER,
      action: AuditAction.PASSWORD_RESET,
      targetType: AuditTargetType.USER,
      responseStatus: 'ERROR',
      details: {
        email,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
