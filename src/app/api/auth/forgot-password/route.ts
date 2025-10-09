import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EmailService } from '@/lib/email-service';
import { randomBytes } from 'crypto';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { patchMetricsStats } from '@/lib/stats-service';
import { StatsType } from '@/generated/prisma';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Generate a secure reset token
function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user) {
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

    // Send password reset email
    try {
      await EmailService.sendPasswordResetEmail(user.email, {
        firstName: user.name || 'there',
        resetUrl,
        expiryTime,
      });

      // Log successful email send
      await prisma.event.create({
        data: {
          userId: user.id,
          eventType: 'PASSWORD_RESET_EMAIL_SENT',
          metadata: {
            email: user.email,
            resetTokenExpiry: resetTokenExpiry.toISOString(),
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (emailError) {
      // Log failed email send but don't fail the request
      console.error('Failed to send password reset email:', emailError);

      await prisma.event.create({
        data: {
          userId: user.id,
          eventType: 'PASSWORD_RESET_EMAIL_FAILED',
          metadata: {
            email: user.email,
            error:
              emailError instanceof Error
                ? emailError.message
                : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    // Log the password reset request (existing Event model)
    await prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'PASSWORD_RESET_REQUESTED',
        metadata: {
          email: user.email,
          resetTokenExpiry: resetTokenExpiry.toISOString(),
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Get user role to determine if audit log should be created
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    // Create audit log only for non-USER roles
    if (userWithRole?.role && userWithRole.role !== 'USER') {
      await createAuditLog({
        adminId: user.id,
        action: AuditAction.PASSWORD_RESET,
        targetType: AuditTargetType.USER,
        targetId: user.id,
        details: {
          email: user.email,
          resetTokenExpiry: resetTokenExpiry.toISOString(),
          action: 'password_reset_requested',
          role: userWithRole.role,
        },
      });
    }

    // Track password reset request stats
    try {
      await patchMetricsStats(StatsType.USER_METRICS, {
        id: user.id,
        userName: user.name || 'Unknown',
        userEmail: user.email,
        userRole: userWithRole?.role || 'USER',
        resetTokenExpiry: resetTokenExpiry.toISOString(),
        requestedAt: new Date().toISOString(),
        emailSentSuccessfully: true, // Assume success unless caught in email error
        hasAuditLog: userWithRole?.role !== 'USER',
        type: 'PASSWORD_RESET_REQUEST'
      });
    } catch (statsError) {
      console.error('Failed to track password reset stats:', statsError);
    }

    return NextResponse.json({
      message:
        'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

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
