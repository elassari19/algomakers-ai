import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Generate a secure random password
function generatePassword(length: number = 12): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one character from each category
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message:
          'If an account with that email exists, we have sent a new password.',
      });
    }

    // Generate new password
    const newPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    // Send email with new password
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your New Password - AlgoMarkers',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Password - AlgoMarkers</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .password-box { background: #1f2937; color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 18px; letter-spacing: 2px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 New Password Generated</h1>
              <p>Your AlgoMarkers account password has been reset</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your AlgoMarkers account. Your new temporary password is:</p>
              
              <div class="password-box">
                <strong>${newPassword}</strong>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                  <li>This is a temporary password generated for security purposes</li>
                  <li>Please sign in immediately and change this password</li>
                  <li>Do not share this password with anyone</li>
                  <li>This email contains sensitive information - please delete it after use</li>
                </ul>
              </div>
              
              <p>To sign in with your new password:</p>
              <ol>
                <li>Go to the AlgoMarkers sign-in page</li>
                <li>Enter your email: <strong>${email}</strong></li>
                <li>Enter the temporary password above</li>
                <li>Immediately change your password in your account settings</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  process.env.NEXTAUTH_URL || 'http://localhost:3000'
                }/auth/signin" class="button">
                  Sign In Now
                </a>
              </div>
              
              <p>If you didn't request this password reset, please contact our support team immediately.</p>
              
              <p>Best regards,<br>The AlgoMarkers Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Password - AlgoMarkers
        
        Hello,
        
        We received a request to reset your password for your AlgoMarkers account.
        
        Your new temporary password is: ${newPassword}
        
        IMPORTANT SECURITY NOTICE:
        - This is a temporary password generated for security purposes
        - Please sign in immediately and change this password
        - Do not share this password with anyone
        - This email contains sensitive information - please delete it after use
        
        To sign in:
        1. Go to ${
          process.env.NEXTAUTH_URL || 'http://localhost:3000'
        }/auth/signin
        2. Enter your email: ${email}
        3. Enter the temporary password above
        4. Immediately change your password in account settings
        
        If you didn't request this password reset, please contact support immediately.
        
        Best regards,
        The AlgoMarkers Team
      `,
    };

    // Create the transporter and send the email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_SMTP_USER,
        pass: process.env.NEXT_PUBLIC_SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }

    // Log the password reset
    await prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'PASSWORD_RESET_COMPLETED',
        metadata: {
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message:
        'If an account with that email exists, we have sent a new password.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
