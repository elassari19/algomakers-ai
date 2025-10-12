import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail } from '@/lib/email-service';
import { randomBytes } from 'crypto';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';


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
  const body = await request.json();
  const { name, email, password, tradingViewUsername } =
    signupSchema.parse(body);

    try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await createAuditLog({
        actorId: existingUser.id,
        actorRole: existingUser.role,
        action: AuditAction.CREATE_USER,
        targetType: AuditTargetType.USER,
        targetId: existingUser.id,
        responseStatus: 'FAILURE',
        details: {
          email: existingUser.email,
          name: existingUser.name,
          hasTradingViewUsername: !!existingUser.tradingviewUsername,
          role: existingUser.role,
          action: 'self_registration',
          timestamp: new Date().toISOString(),
        },
      });
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

    // Generate verify token and expiry (24 hours)
    const verifyToken = randomBytes(32).toString('hex');
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with verify token
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        tradingviewUsername: tradingViewUsername,
        role: 'USER',
        resetToken: verifyToken,
        resetTokenExpiry: verifyTokenExpiry,
        status: 'UNVERIFIED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        tradingviewUsername: true,
        role: true,
        createdAt: true,
        resetToken: true,
        resetTokenExpiry: true,
        status: true,
      },
    });

    // Log user creation (always, for unified audit log)
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.CREATE_USER,
      targetType: AuditTargetType.USER,
      targetId: user.id,
      responseStatus: 'SUCCESS',
      details: {
        email: user.email,
        name: user.name,
        hasTradingViewUsername: !!tradingViewUsername,
        role: user.role,
        action: 'self_registration',
        timestamp: new Date().toISOString(),
      },
    });

    // Send welcome email
    try {
      const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verifyToken}`;
      await sendEmail({
        template: 'welcome',
        to: user.email,
        params: {
          code: verifyToken,
          name: user.name,
          url: verifyUrl,
        },
      });
    } catch (emailError) {
      // Log failed email send but don't fail the signup
      console.error('Failed to send welcome email:', emailError);
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
    // Audit log for validation or internal errors
    if (error instanceof z.ZodError) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: 'USER',
        action: AuditAction.CREATE_USER,
        targetType: AuditTargetType.USER,
        responseStatus: 'FAILURE',
        details: {
          reason: 'validation_failed',
          issues: error.issues,
        },
      });
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
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
