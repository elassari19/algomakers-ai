import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createEventLog } from '@/lib/audit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email-service';
import { randomBytes } from 'crypto';

const verifySchema = z.object({
  code: z.string().min(6, 'Verification code is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  url: z.string().url('Invalid URL').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { email } = verifySchema.parse(body);

    // 1. Request verification email (send code)
      let userEmail = email;
      if (!userEmail && session?.user?.email) userEmail = session.user.email;
      if (!userEmail) {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!user) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      if (user.emailVerified) {
        return NextResponse.json({ error: 'Email already verified.' }, { status: 400 });
      }

    // Generate reset token and expiry (24 hours)
    const resetToken = randomBytes(32).toString('hex');
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
    }/verify-email?token=${resetToken}`;
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

    // Send verification email using shared utility
    try {
      await sendEmail({
        template: 'verify_email',
        to: user.email,
        params: {
          code: resetToken,
          name: user.name || undefined,
          url: resetUrl,
        },
        session,
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email.' },
        { status: 500 }
      );
    }

    // Log event
    await createEventLog({
      userId: user.id,
      eventType: 'EMAIL_VERIFIED',
      metadata: { email: user.email },
    });

    return NextResponse.json({ message: 'Your email has been verified.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 });
    }
    // Find user by resetToken and check expiry
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
        emailVerified: null,
        status: { in: ['UNVERIFIED', 'INACTIVE'] },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
    }
    // Mark user as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        status: 'ACTIVE',
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    await createEventLog({
      userId: user.id,
      eventType: 'EMAIL_VERIFIED',
      metadata: { email: user.email },
    });
    return NextResponse.json({ message: 'Your email has been verified.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }
}