// Affiliate Email Template
export interface AffiliateCreatedEmailParams {
  name: string;
  email: string;
  referralCode: string;
  commissionRate: number;
  walletAddress?: string;
}

export function affiliateCreatedEmail({ name, email, referralCode, commissionRate, walletAddress }: AffiliateCreatedEmailParams) {
  const subject = '🎉 Welcome to the AlgoMakers.Ai Affiliate Program!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Affiliate Account Created</h1>
      <p>Hello${name ? ` ${name}` : ''},</p>
      <p>Congratulations! Your affiliate account has been created.</p>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Referral Code:</strong> <span style="color: #3182CE;">${referralCode}</span></li>
        <li><strong>Commission Rate:</strong> ${commissionRate * 100}%</li>
        ${walletAddress ? `<li><strong>Wallet Address:</strong> ${walletAddress}</li>` : ''}
      </ul>
      <p>Share your referral code to start earning commissions!</p>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        Need help? <a href="mailto:support@algomakers.ai" style="color: #3182CE; text-decoration: underline;">Contact Support</a>
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}
export interface VerifyEmailParams {
  code: string;
  name?: string;
}

export function verifyEmail({ name }: VerifyEmailParams) {
  const subject = 'Verify your AlgoMakers.Ai email address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Verify your email</h1>
      <p>Hello${name ? ` ${name}` : ''},</p>
      <p>Thank you for signing up! Please verify your email address to activate your account.</p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        Need help? <a href="mailto:support@algomakers.ai" style="color: #3182CE; text-decoration: underline;">Contact Support</a>
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}


export interface WelcomeEmailParams {
  tradingViewUsername: string;
  url: string;
}

export function welcomeEmail({ tradingViewUsername, url }: WelcomeEmailParams) {
  const subject = '🎉 Welcome to AlgoMakers.Ai – Let’s get started';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">You’re in!</h1>
      <p>Thank you for signing up with <strong>AlgoMakers.Ai</strong>!</p>
      <p>
        <strong>TradingView username on file:</strong> <span style="color: #3182CE;">${tradingViewUsername}</span>
      </p>
      <h2 style="color: #4A5568;">How to accept your TradingView invite:</h2>
      <ol>
        <li>Log in to your TradingView account.</li>
        <li>Check your notifications (bell icon at the top right).</li>
        <li>Find the invite from <strong>AlgoMakers.Ai</strong> and click <strong>Accept</strong>.</li>
        <li>Access your new indicators in the TradingView chart.</li>
      </ol>
      <p>Thank you for signing up! Please verify your email address to activate your account.</p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${url}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <p>If you have any questions, just reply to this email. Happy trading!</p>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}

export interface PaymentReceiptEmailParams {
  name: string;
  pair: string;
  period: string;
  amount: string;
  network: string;
  txHash: string;
  expiryDate: string;
  tradingViewUsername: string;
}

export function paymentReceiptEmail({ name, pair, period, amount, network, txHash, expiryDate, tradingViewUsername }: PaymentReceiptEmailParams) {
  const subject = `✅ Payment received for ${pair} subscription`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Your payment was successful!</h1>
      <p>Hello ${name},</p>
      <p>We’ve received your payment for <strong>${pair}</strong> – <strong>${period}</strong>.</p>
      <h2 style="color: #4A5568; font-size: 1.1em;">Details:</h2>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Amount:</strong> ${amount} USDT</li>
        <li><strong>Network:</strong> ${network}</li>
        <li><strong>Transaction ID:</strong> <span style="color: #3182CE;">${txHash}</span></li>
        <li><strong>Subscription:</strong> ${pair} (${period})</li>
        <li><strong>Expiry:</strong> ${expiryDate}</li>
      </ul>
      <p>Next step: 🎯 Our admin will send your TradingView invite shortly to <strong>${tradingViewUsername}</strong>.</p>
      <div style="margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
      </div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        Thank you for choosing AlgoMakers.Ai 🚀<br>
        Need help? <a href="mailto:support@algomakers.ai" style="color: #3182CE; text-decoration: underline;">Contact Support</a>
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}

export interface InvitePendingEmailParams {
  name: string;
  pair: string;
  period: string;
  tradingViewUsername: string;
}

export function invitePendingEmail({ name, pair, period, tradingViewUsername}: InvitePendingEmailParams) {
  const subject = '⏳ Your TradingView invite is being processed';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">We’re preparing your access</h1>
      <p>Hello ${name},</p>
      <p>Your subscription to <strong>${pair}</strong> – <strong>${period}</strong> is confirmed.</p>
      <p>Our admin is now processing your TradingView invite for username: <span style="color: #3182CE;">${tradingViewUsername}</span>.</p>
      <p>You’ll get another email once the invite is completed.</p>
      <div style="margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Check Subscription Status</a>
      </div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        AlgoMakers.Ai team
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}
export interface InviteSentEmailParams {
  name: string;
  tradingViewUsername: string;
  pairSymbol: string;
  period: string;
  tradingViewUrl?: string;
}

export function inviteSentEmail({ name, tradingViewUsername, pairSymbol, period, tradingViewUrl}: InviteSentEmailParams) {
  const subject = '📨 Your TradingView invite was sent';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Invite sent</h1>
      <p>Hello ${name},</p>
      <p>We’ve sent a TradingView invite to <strong>${tradingViewUsername}</strong> for <strong>${pairSymbol}</strong> (${period}).</p>
      <p>Please check your TradingView notifications and accept the invite to start using your indicators.</p>
      ${tradingViewUrl ? `<div style="margin: 32px 0;"><a href="${tradingViewUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open TradingView</a></div>` : ''}
      <div style="margin: 16px 0;"><a href="${process.env.NEXTAUTH_URL}/subscriptions" style="background: #EDF2F7; color: #2D3748; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Subscription</a></div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}

export interface InviteCompletedEmailParams {
  name: string;
  tradingViewUsername: string;
  pairSymbol: string;
  period: string;
  expiryDate: string;
}

export function inviteCompletedEmail({ name, tradingViewUsername, pairSymbol, period, expiryDate }: InviteCompletedEmailParams) {
  const subject = '🎉 Your TradingView invite is ready!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Start using your subscription today</h1>
      <p>Hello ${name},</p>
      <p>Great news! We’ve sent a TradingView invite to your account: <span style="color: #3182CE;">${tradingViewUsername}</span>.</p>
      <h2 style="color: #4A5568; font-size: 1.1em;">Subscription details:</h2>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Pair:</strong> ${pairSymbol}</li>
        <li><strong>Period:</strong> ${period}</li>
        <li><strong>Active until:</strong> ${expiryDate}</li>
      </ul>
      <p>👉 Please log in to your TradingView account and accept the invite to begin.</p>
      <div style="margin: 32px 0;">
        <a href="https://www.tradingview.com" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open TradingView</a>
      </div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        Happy trading with AlgoMakers.Ai 🚀
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}

export interface InviteCanceledEmailParams {
  name: string;
  pair: string;
  period: string;
}

export function inviteCanceledEmail({ name, pair, period}: InviteCanceledEmailParams) {
  const subject = '❌ Your TradingView invite was canceled';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Invite canceled</h1>
      <p>Hello ${name},</p>
      <p>We wanted to inform you that your TradingView invite for <strong>${pair}</strong> – <strong>${period}</strong> has been canceled.</p>
      <p>If this was a mistake or you have any questions, please contact our support team.</p>
      <div style="margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Subscription</a>
      </div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        AlgoMakers.Ai team
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}

export interface RenewalReminderEmailParams {
  name: string;
  pair: string;
  period: string;
  expiryDate: string;
  renewalUrl: string;
}

export function renewalReminderEmail({ name, pair, period, expiryDate, renewalUrl }: RenewalReminderEmailParams) {
  const subject = '⏳ Your subscription is expiring soon – renew today';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Don't lose your access</h1>
      <p>Hello ${name},</p>
      <p>Your subscription to <strong>${pair}</strong> – <strong>${period}</strong> will expire on <strong>${expiryDate}</strong>.</p>
      <p>Renew now to continue uninterrupted access to backtests and live performance updates.</p>
      <div style="margin: 32px 0;">
        <a href="${renewalUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Renew My Subscription</a>
      </div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        Thank you for being part of AlgoMakers.Ai 💡
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}

export interface PasswordResetEmailParams {
  name: string;
  resetUrl: string;
  expiryTime: string;
}

export function passwordResetEmail({ name, resetUrl, expiryTime }: PasswordResetEmailParams) {
  const subject = '🔐 Reset your AlgoMakers.Ai password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Reset your password</h1>
      <p>Hello ${name || 'there'},</p>
      <p>We received a request to reset your password for your AlgoMakers.Ai account.</p>
      <p>Click the button below to create a new password:</p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${resetUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset My Password</a>
      </div>
      <p style="color: #4A5568; font-size: 0.9em;">
        <strong>Important:</strong> This link will expire on ${expiryTime}. If you need a new reset link, please request another password reset.
      </p>
      <p style="color: #4A5568; font-size: 0.9em;">
        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
      <div style="color: #4A5568; font-size: 0.95em; margin-bottom: 16px;">
        Need help? <a href="mailto:support@algomakers.ai" style="color: #3182CE; text-decoration: underline;">Contact Support</a>
      </div>
      <small style="color: #A0AEC0;">&copy; ${new Date().getFullYear()} AlgoMakers.Ai</small>
    </div>
  `;
  return { subject, html };
}

// --- EMAIL SENDING LOGIC ---
import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { Role } from '@/generated/prisma';
import { AuditAction, AuditTargetType, createAuditLog } from './audit';

export type SendEmailOptions = {
  userId?: string;
  role?: Role;
  template: 'affiliate_created' | 'verify_email' | 'welcome' | 'payment_receipt' | 'invite_sent' | 'invite_pending' | 'invite_completed' | 'invite_canceled' | 'renewal_reminder' | 'password_reset' | 'custom';
  to: string;
  params?: any;
  subject?: string;
  html?: string;
  text?: string;
  session?: any;
};

type EmailContent = {
  subject: string | undefined;
  html: string | undefined;
  text?: string | undefined;
};

async function generateEmailContent(options: SendEmailOptions): Promise<EmailContent> {
  switch (options.template) {
    case 'affiliate_created': {
      const { subject, html } = affiliateCreatedEmail(options.params);
      return { subject, html };
    }
    case 'verify_email': {
      const { subject, html } = verifyEmail(options.params);
      return { subject, html };
    }
    case 'welcome': {
      const { subject, html } = welcomeEmail(options.params);
      return { subject, html };
    }
    case 'payment_receipt': {
      const { subject, html } = paymentReceiptEmail(options.params);
      return { subject, html };
    }
    case 'invite_pending': {
      const { subject, html } = invitePendingEmail(options.params);
      return { subject, html };
    }
    case 'invite_sent': {
      const { subject, html } = inviteSentEmail(options.params);
      return { subject, html };
    }
    case 'invite_completed': {
      const { subject, html } = inviteCompletedEmail(options.params);
      return { subject, html };
    }
    case 'invite_canceled': {
      const { subject, html } = inviteCanceledEmail(options.params);
      return { subject, html };
    }
    case 'renewal_reminder': {
      const { subject, html } = renewalReminderEmail(options.params);
      return { subject, html };
    }
    case 'password_reset': {
      const { subject, html } = passwordResetEmail(options.params);
      return { subject, html };
    }
    case 'custom':
      return {
        subject: options.subject,
        html: options.html,
        text: options.text,
      };
    default:
      await createAuditLog({
        actorId: options.userId,
        actorRole: options.role || 'USER',
        action: AuditAction.SEND_EMAIL,
        targetId: options.userId,
        targetType: AuditTargetType.SUBSCRIPTION,
        responseStatus: 'FAILED',
        details: { reason: 'Unknown email template', template: options.template },
      });
      console.log('options.template', options.template)
      throw new Error(`Unknown email template: ${options.template}`);
  }
}

export async function sendEmail(options: SendEmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured');
  }
  const { subject, html, text } = await generateEmailContent(options);

  // Add logo to the top of the email
  const logoHtml = `<div style="text-align: center; margin-bottom: 20px; background-color: #1a1a1a; padding: 20px; border-radius: 8px;"><img src="/logo.png" alt="AlgoMarkers AI Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>`;
  const modifiedHtml = html ? html.replace('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">' + logoHtml) : '';

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject,
    html: modifiedHtml,
    ...(text ? { text } : {}),
  };

  // Create email record in database
  const emailRecord = await prisma.email.create({
    data: {
      to: options.to,
      from: mailOptions.from,
      subject: subject || '',
      body: modifiedHtml || text || '',
      status: 'PENDING',
      userId: options.userId,
      metadata: {
        template: options.template,
        params: options.params,
      },
    },
  });

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
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Update email record on success
    await prisma.email.update({
      where: { id: emailRecord.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    await createAuditLog({
      actorId: options.userId || 'system',
      actorRole: options?.role || 'USER',
      action: 'EMAIL_SENT',
      targetId: options.userId,
      targetType: options.role,
      details: {
        template: options.template,
        to: options.to,
        subject: options.subject,
        emailId: emailRecord.id,
      },
    });
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // Update email record on failure
    await prisma.email.update({
      where: { id: emailRecord.id },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    await createAuditLog({
      actorId: options.userId || 'system',
      actorRole: options?.role || 'USER',
      action: 'EMAIL_FAILED',
      targetId: options.userId,
      targetType: options.role,
      details: {
        template: options.template,
        to: options.to,
        subject: options.subject,
        reason: error instanceof Error ? error.stack : undefined,
        emailId: emailRecord.id,
      },
    });
  }
}

export async function sendEmailCampaign(campaignId: string, userId?: string) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured');
    }

    // Get campaign details
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Update campaign status to SENDING
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENDING',
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    });

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

    // Email wrapper with logo
    const wrappedContent = campaign.content.replace('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">');

    let sentCount = 0;
    let failedCount = 0;
    let recipients: string[] = [];

    if (campaign.recipients != null) {
      if (Array.isArray(campaign.recipients)) {
        recipients = campaign.recipients as string[];
      } else if (typeof campaign.recipients === 'string') {
        try {
          recipients = JSON.parse(campaign.recipients) as string[];
        } catch (err) {
          console.error('Failed to parse campaign.recipients:', err);
          recipients = [];
        }
      } else {
        // fallback: attempt to coerce other JSON shapes to an array of strings
        try {
          recipients = (campaign.recipients as any) ?? [];
        } catch {
          recipients = [];
        }
      }
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: `${recipients.join(', ')}`,
        subject: campaign.subject,
        html: wrappedContent,
      };

      await transporter.sendMail(mailOptions);
      sentCount++;
    } catch (error) {
      console.error(`Failed to send email to recipients:`, error);
      failedCount++;
    }

    // Update campaign with final counts
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        sentCount: campaign.sentCount + 1,
        status: 'SENT',
        deliveredCount: sentCount - failedCount,
        bouncedCount: failedCount,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      actorId: userId || campaign.userId || 'system',
      actorRole: 'USER',
      action: 'EMAIL_CAMPAIGN_SENT',
      targetId: campaignId,
      targetType: 'EMAIL',
      details: {
        subject: campaign.subject,
        sentCount: sentCount,
        failedCount: failedCount,
        totalRecipients: recipients.length,
      },
    });

    return {
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
    };
  } catch (error) {
    console.log('send Campaign failed', error);
    await createAuditLog({
      actorId: userId || 'system',
      actorRole: 'USER',
      action: 'EMAIL_CAMPAIGN_FAILED',
      targetId: campaignId,
      targetType: 'EMAIL',
      details: {
        reason: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
}
