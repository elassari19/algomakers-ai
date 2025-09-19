import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  tradingviewUsername: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, tradingviewUsername } =
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
    if (tradingviewUsername) {
      const existingTVUser = await prisma.user.findFirst({
        where: { tradingviewUsername },
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
        tradingviewUsername,
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

    // Log user creation event
    await prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'USER_SIGNUP',
        metadata: {
          email: user.email,
          hasTraingViewUsername: !!tradingviewUsername,
        },
      },
    });

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
