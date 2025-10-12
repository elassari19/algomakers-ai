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
  url: string;
}

export function verifyEmail({ name, url }: VerifyEmailParams) {
  const subject = 'Verify your AlgoMakers.Ai email address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Verify your email</h1>
      <p>Hello${name ? ` ${name}` : ''},</p>
      <p>Thank you for signing up! Please verify your email address to activate your account.</p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${url}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
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
  firstName: string;
  pair: string;
  period: string;
  amount: string;
  network: string;
  txHash: string;
  expiryDate: string;
  tradingViewUsername: string;
  dashboardUrl: string;
}

export function paymentReceiptEmail({ firstName, pair, period, amount, network, txHash, expiryDate, tradingViewUsername, dashboardUrl }: PaymentReceiptEmailParams) {
  const subject = `✅ Payment received for ${pair} subscription`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Your payment was successful!</h1>
      <p>Hello ${firstName},</p>
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
        <a href="${dashboardUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
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
  firstName: string;
  pair: string;
  period: string;
  tradingViewUsername: string;
  dashboardUrl: string;
}

export function invitePendingEmail({ firstName, pair, period, tradingViewUsername, dashboardUrl }: InvitePendingEmailParams) {
  const subject = '⏳ Your TradingView invite is being processed';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">We’re preparing your access</h1>
      <p>Hello ${firstName},</p>
      <p>Your subscription to <strong>${pair}</strong> – <strong>${period}</strong> is confirmed.</p>
      <p>Our admin is now processing your TradingView invite for username: <span style="color: #3182CE;">${tradingViewUsername}</span>.</p>
      <p>You’ll get another email once the invite is completed.</p>
      <div style="margin: 32px 0;">
        <a href="${dashboardUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Check Subscription Status</a>
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

export interface InviteCompletedEmailParams {
  firstName: string;
  tradingViewUsername: string;
  pair: string;
  period: string;
  expiryDate: string;
  tradingViewUrl: string;
}

export function inviteCompletedEmail({ firstName, tradingViewUsername, pair, period, expiryDate, tradingViewUrl }: InviteCompletedEmailParams) {
  const subject = '🎉 Your TradingView invite is ready!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Start using your subscription today</h1>
      <p>Hello ${firstName},</p>
      <p>Great news! We’ve sent a TradingView invite to your account: <span style="color: #3182CE;">${tradingViewUsername}</span>.</p>
      <h2 style="color: #4A5568; font-size: 1.1em;">Subscription details:</h2>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Pair:</strong> ${pair}</li>
        <li><strong>Period:</strong> ${period}</li>
        <li><strong>Active until:</strong> ${expiryDate}</li>
      </ul>
      <p>👉 Please log in to your TradingView account and accept the invite to begin.</p>
      <div style="margin: 32px 0;">
        <a href="${tradingViewUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open TradingView</a>
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

export interface RenewalReminderEmailParams {
  firstName: string;
  pair: string;
  period: string;
  expiryDate: string;
  renewalUrl: string;
}

export function renewalReminderEmail({ firstName, pair, period, expiryDate, renewalUrl }: RenewalReminderEmailParams) {
  const subject = '⏳ Your subscription is expiring soon – renew today';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Don't lose your access</h1>
      <p>Hello ${firstName},</p>
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
  firstName: string;
  resetUrl: string;
  expiryTime: string;
}

export function passwordResetEmail({ firstName, resetUrl, expiryTime }: PasswordResetEmailParams) {
  const subject = '🔐 Reset your AlgoMakers.Ai password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Reset your password</h1>
      <p>Hello ${firstName || 'there'},</p>
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
import { createAuditLog } from './audit';

export type SendEmailOptions = {
  userId?: string;
  role?: Role;
  template: 'affiliate_created' | 'verify_email' | 'welcome' | 'payment_receipt' | 'invite_pending' | 'invite_completed' | 'renewal_reminder' | 'password_reset' | 'custom';
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

function generateEmailContent(options: SendEmailOptions): EmailContent {
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
    case 'invite_completed': {
      const { subject, html } = inviteCompletedEmail(options.params);
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
      throw new Error(`Unknown email template: ${options.template}`);
  }
}

export async function sendEmail(options: SendEmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured');
  }
  const { subject, html, text } = generateEmailContent(options);
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject,
    html,
    ...(text ? { text } : {}),
  };
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
      },
    });
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
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
      },
    });
  }
}
