import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { StatsType } from '@/generated/prisma';
import { patchMetricsStats } from '@/lib/stats-service';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  welcomeEmail,
  paymentReceiptEmail,
  invitePendingEmail,
  inviteCompletedEmail,
  renewalReminderEmail,
  passwordResetEmail,
  type WelcomeEmailParams,
  type PaymentReceiptEmailParams,
  type InvitePendingEmailParams,
  type InviteCompletedEmailParams,
  type RenewalReminderEmailParams,
  type PasswordResetEmailParams,
} from '@/lib/email-template';

// Email request schema
const sendEmailSchema = z.discriminatedUnion('template', [
  z.object({
    template: z.literal('welcome'),
    to: z.string().email(),
    params: z.object({
      tradingViewUsername: z.string(),
      dashboardUrl: z.string(),
    }) satisfies z.ZodType<WelcomeEmailParams>,
  }),
  z.object({
    template: z.literal('payment_receipt'),
    to: z.string().email(),
    params: z.object({
      firstName: z.string(),
      pair: z.string(),
      period: z.string(),
      amount: z.string(),
      network: z.string(),
      txHash: z.string(),
      expiryDate: z.string(),
      tradingViewUsername: z.string(),
      dashboardUrl: z.string(),
    }) satisfies z.ZodType<PaymentReceiptEmailParams>,
  }),
  z.object({
    template: z.literal('invite_pending'),
    to: z.string().email(),
    params: z.object({
      firstName: z.string(),
      pair: z.string(),
      period: z.string(),
      tradingViewUsername: z.string(),
      dashboardUrl: z.string(),
    }) satisfies z.ZodType<InvitePendingEmailParams>,
  }),
  z.object({
    template: z.literal('invite_completed'),
    to: z.string().email(),
    params: z.object({
      firstName: z.string(),
      tradingViewUsername: z.string(),
      pair: z.string(),
      period: z.string(),
      expiryDate: z.string(),
      tradingViewUrl: z.string(),
    }) satisfies z.ZodType<InviteCompletedEmailParams>,
  }),
  z.object({
    template: z.literal('renewal_reminder'),
    to: z.string().email(),
    params: z.object({
      firstName: z.string(),
      pair: z.string(),
      period: z.string(),
      expiryDate: z.string(),
      renewalUrl: z.string(),
    }) satisfies z.ZodType<RenewalReminderEmailParams>,
  }),
  z.object({
    template: z.literal('password_reset'),
    to: z.string().email(),
    params: z.object({
      firstName: z.string(),
      resetUrl: z.string(),
      expiryTime: z.string(),
    }) satisfies z.ZodType<PasswordResetEmailParams>,
  }),
  z.object({
    template: z.literal('custom'),
    to: z.string().email(),
    subject: z.string(),
    html: z.string(),
    text: z.string().optional(),
  }),
]);

type SendEmailRequest = z.infer<typeof sendEmailSchema>;

// Generate email content based on template
function generateEmailContent(request: SendEmailRequest) {
  const { template } = request;

  switch (template) {
    case 'welcome':
      return welcomeEmail(request.params);

    case 'payment_receipt':
      return paymentReceiptEmail(request.params);

    case 'invite_pending':
      return invitePendingEmail(request.params);

    case 'invite_completed':
      return inviteCompletedEmail(request.params);

    case 'renewal_reminder':
      return renewalReminderEmail(request.params);

    case 'password_reset':
      return passwordResetEmail(request.params);

    case 'custom':
      return {
        subject: request.subject,
        html: request.html,
        text: request.text,
      };

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session for audit logging
    const session = await getServerSession(authOptions);
    
    // Validate request body
    const body = await request.json();
    const emailRequest = sendEmailSchema.parse(body);

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP credentials not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate email content
    const { subject, html } = generateEmailContent(emailRequest);

    // Create mail options
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emailRequest.to,
      subject,
      html,
    };

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const info = await transporter.sendMail(mailOptions);

    console.log(
      `Email sent successfully to ${emailRequest.to}:`,
      info.messageId
    );

    // Track email sending stats
    try {
      await patchMetricsStats(StatsType.NOTIFICATION_METRICS, {
        id: info.messageId,
        messageId: info.messageId,
        template: emailRequest.template,
        to: emailRequest.to,
        senderUserId: session?.user?.id,
        senderEmail: session?.user?.email,
        senderRole: session?.user?.role,
        emailSubject: subject,
        emailType: emailRequest.template,
        sentAt: new Date().toISOString(),
        type: 'EMAIL_SENT'
      });
    } catch (statsError) {
      console.error('Failed to track email sending stats:', statsError);
    }

    // Log based on user role: non-USER -> audit, USER -> event
    if (session?.user?.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session?.user?.id || 'system',
        action: AuditAction.SEND_EMAIL,
        targetType: AuditTargetType.USER,
        targetId: emailRequest.to,
        details: {
          sentEmail: {
            messageId: info.messageId,
            template: emailRequest.template,
            to: emailRequest.to,
            subject: subject,
            sentAt: new Date().toISOString(),
          },
          adminEmail: session?.user?.email,
          adminName: session?.user?.name,
        },
      });
    } else if (session?.user?.role === 'USER') {
      // Create event for USER role
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'EMAIL_SENT',
          metadata: {
            messageId: info.messageId,
            template: emailRequest.template,
            to: emailRequest.to,
            subject: subject,
            userRole: session.user.role,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      template: emailRequest.template,
      to: emailRequest.to,
    });
  } catch (error) {
    console.error('Send email error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid email request',
          details: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('SMTP')) {
      return NextResponse.json(
        { error: 'Email delivery failed' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check SMTP configuration
    const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (!isConfigured) {
      return NextResponse.json({
        status: 'error',
        message: 'SMTP not configured',
        configured: false,
      });
    }

    // Test SMTP connection
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    await transporter.verify();

    return NextResponse.json({
      status: 'ok',
      message: 'Email service is ready',
      configured: true,
      templates: [
        'welcome',
        'payment_receipt',
        'invite_pending',
        'invite_completed',
        'renewal_reminder',
        'custom',
      ],
    });
  } catch (error) {
    console.error('Email service health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'SMTP connection failed',
        configured: true,
      },
      { status: 503 }
    );
  }
}
