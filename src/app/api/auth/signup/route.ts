import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EmailService } from '@/lib/email-service';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { patchMetricsStats } from '@/lib/stats-service';
import { StatsType } from '@/generated/prisma';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  tradingViewUsername: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, tradingViewUsername } =
      signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if TradingView username is already taken
    if (tradingViewUsername) {
      const existingTVUser = await prisma.user.findFirst({
        where: { tradingviewUsername: tradingViewUsername },
      });

      if (existingTVUser) {
        return NextResponse.json(
          { error: 'TradingView username is already taken' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        tradingviewUsername: tradingViewUsername,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        tradingviewUsername: true,
        role: true,
        createdAt: true,
      },
    });

    // Log user creation event (existing Event model)
    await prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'USER_SIGNUP',
        metadata: {
          email: user.email,
          hasTraingViewUsername: !!tradingViewUsername,
        },
      },
    });

    // Create audit log only for non-USER roles (signup defaults to USER role, so no audit log)
    if (user.role !== 'USER') {
      await createAuditLog({
        adminId: user.id,
        action: AuditAction.CREATE_USER,
        targetType: AuditTargetType.USER,
        targetId: user.id,
        details: {
          email: user.email,
          name: user.name,
          hasTradingViewUsername: !!tradingViewUsername,
          role: user.role,
          action: 'self_registration',
        },
      });
    }

    // Send welcome email
    try {
      const dashboardUrl = `${
        process.env.NEXTAUTH_URL || 'http://localhost:3000'
      }/dashboard`;

      await EmailService.sendWelcomeEmail(user.email, {
        tradingViewUsername: tradingViewUsername || 'Not provided',
        dashboardUrl,
      });

      // Log successful email send
      await prisma.event.create({
        data: {
          userId: user.id,
          eventType: 'WELCOME_EMAIL_SENT',
          metadata: {
            email: user.email,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (emailError) {
      // Log failed email send but don't fail the signup
      console.error('Failed to send welcome email:', emailError);

      await prisma.event.create({
        data: {
          userId: user.id,
          eventType: 'WELCOME_EMAIL_FAILED',
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

    // Track user signup stats
    try {
      await patchMetricsStats(StatsType.USER_METRICS, {
        id: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        hasTradingViewUsername: !!tradingViewUsername,
        tradingViewUsername: tradingViewUsername || null,
        signupAt: new Date().toISOString(),
        welcomeEmailSent: true, // Assume success unless caught in email error
        hasAuditLog: user.role !== 'USER',
        registrationMethod: 'EMAIL_PASSWORD',
        type: 'USER_SIGNUP'
      });
    } catch (statsError) {
      console.error('Failed to track user signup stats:', statsError);
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tradingviewUsername: user.tradingviewUsername,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
