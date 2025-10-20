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
export interface InviteSentEmailParams {
  firstName: string;
  tradingViewUsername: string;
  pair: string;
  period: string;
  tradingViewUrl?: string;
  dashboardUrl?: string;
}

export function inviteSentEmail({ firstName, tradingViewUsername, pair, period, tradingViewUrl, dashboardUrl }: InviteSentEmailParams) {
  const subject = '📨 Your TradingView invite was sent';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Invite sent</h1>
      <p>Hello ${firstName},</p>
      <p>We’ve sent a TradingView invite to <strong>${tradingViewUsername}</strong> for <strong>${pair}</strong> (${period}).</p>
      <p>Please check your TradingView notifications and accept the invite to start using your indicators.</p>
      ${tradingViewUrl ? `<div style="margin: 32px 0;"><a href="${tradingViewUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open TradingView</a></div>` : ''}
      ${dashboardUrl ? `<div style="margin: 16px 0;"><a href="${dashboardUrl}" style="background: #EDF2F7; color: #2D3748; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Subscription</a></div>` : ''}
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #E2E8F0;">
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

export interface InviteCanceledEmailParams {
  firstName: string;
  pair: string;
  period: string;
  dashboardUrl: string;
}

export function inviteCanceledEmail({ firstName, pair, period, dashboardUrl }: InviteCanceledEmailParams) {
  const subject = '❌ Your TradingView invite was canceled';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #2D3748;">Invite canceled</h1>
      <p>Hello ${firstName},</p>
      <p>We wanted to inform you that your TradingView invite for <strong>${pair}</strong> – <strong>${period}</strong> has been canceled.</p>
      <p>If this was a mistake or you have any questions, please contact our support team.</p>
      <div style="margin: 32px 0;">
        <a href="${dashboardUrl}" style="background: #3182CE; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Subscription</a>
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
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="Layer_1" x="0px" y="0px" viewBox="0 0 1593.19 557.4" style="enable-background:new 0 0 1593.19 557.4; width: 200px; height: auto;" xml:space="preserve"><style type="text/css">	.st0{opacity:0.13;fill:#FFFFFF;}	.st1{opacity:0.02;}	.st2{fill:url(#SVGID_1_);}	.st3{fill:url(#SVGID_2_);}	.st4{fill:url(#SVGID_3_);}	.st5{fill:url(#SVGID_4_);}	.st6{fill:url(#SVGID_5_);}	.st7{fill:url(#SVGID_6_);}	.st8{fill:url(#SVGID_7_);}	.st9{fill:url(#SVGID_8_);}	.st10{fill:url(#SVGID_9_);}	.st11{fill:url(#SVGID_10_);}	.st12{fill:url(#SVGID_11_);}	.st13{fill:url(#SVGID_12_);}	.st14{fill:#3F94EA;}	.st15{fill:#225D92;}	.st16{fill:#1C5D9B;}	.st17{fill:#496083;}	.st18{opacity:0.2;fill:#3F94EA;}	.st19{opacity:0.2;fill:#496083;}	.st20{fill:url(#SVGID_13_);}	.st21{fill:url(#SVGID_14_);}	.st22{fill:url(#SVGID_15_);}	.st23{fill:url(#SVGID_16_);}	.st24{fill:url(#SVGID_17_);}	.st25{fill:url(#SVGID_18_);}	.st26{fill:url(#SVGID_19_);}	.st27{fill:url(#SVGID_20_);}	.st28{fill:url(#SVGID_21_);}	.st29{fill:url(#SVGID_22_);}	.st30{fill:url(#SVGID_23_);}	.st31{fill:url(#SVGID_24_);}	.st32{fill:#121823;}	.st33{fill:#FFFFFF;}	.st34{fill:#0F3E60;}	.st35{fill:none;stroke:#000000;stroke-width:0.1864;stroke-miterlimit:10;}	.st36{fill:none;stroke:#000000;stroke-width:0.1854;stroke-miterlimit:10;}	.st37{fill:#F96908;}	.st38{fill:#161515;}</style><g>	<path class="st33" d="M427.89,321.29h-14.37c1.25-2.16,52.15-89.68,53.47-91.96c2.12-3.93,6.27-6.37,10.86-6.37h8.4  c8.68,16.26,44.15,82.78,52.44,98.33H525.8c-2.72,0-5.23-1.5-6.51-3.91c-6.41-12.02-12.44-23.33-16.7-31.31l-24.21-45.4  c-28.83,48.66-45.64,77.02-46.32,78.19C431.22,320.36,429.63,321.29,427.89,321.29z"></path>	<path class="st33" d="M554.52,287.38v-64.44h7.67c4.23,0,7.68,3.35,7.68,7.47v56.95c0,10.19,7.5,19.24,21.81,19.32  c4.21,0,7.66,3.35,7.66,7.48v7.15c-12.29,0-11.6,0.05-12.27-0.11C568.76,319.82,554.52,305.09,554.52,287.38z"></path>	<path class="st33" d="M615.01,287.36c0-18.33,15.38-33.99,35.79-33.95c0.35,0,4.82,0,4.82,0c20.12-0.22,35.81,15.33,35.81,33.94  c0,18.94-16.25,33.95-35.2,33.95c-0.3,0-5.08,0-5.42,0C630.88,321.51,615.01,306.16,615.01,287.36z M680.47,328.41h7.37  c-0.37,15.32-9.47,22.5-19.62,23.36c-0.42,0.02-8.31,0.01-45.05,0.03v-7.15c0-4.12,3.44-7.48,7.67-7.48l36.1,0  c2.32-0.21,4.34-1.59,5.27-3.63C673.64,330.42,676.88,328.41,680.47,328.41z M650.37,306.67c0.81,0,5.67-0.01,5.67-0.01  c11.23,0,20.36-8.66,20.36-19.31c0-10.64-9.13-19.31-20.36-19.31l-5.65,0.01c-11.23,0-20.36,8.66-20.36,19.31  S639.15,306.67,650.37,306.67z"></path>	<path class="st33" d="M709.9,287.36c0-18.2,15.27-34.02,35.79-33.95c0.34,0,4.83,0,4.83,0c19.62-0.22,35.8,14.87,35.8,33.94  c0,19.24-16.71,34.1-35.23,33.95c-0.28,0-5.39,0-5.39,0C725.76,321.51,709.9,306.16,709.9,287.36z M745.26,306.67  c0.81,0,5.67-0.01,5.67-0.01c11.23,0,20.36-8.66,20.36-19.31c0-10.65-9.13-19.31-20.36-19.31l-5.65,0.01  c-11.23,0-20.36,8.66-20.36,19.31S734.04,306.67,745.26,306.67z"></path>	<path class="st33" d="M928.25,222.97h8.27l-0.16,97.83h-6.03c-5.04,0-9.14-3.41-9.14-7.59v-58.22l-37.66,61.54  c-1.8,2.94-5.39,4.77-9.37,4.77h-1.52c-3.98,0-7.57-1.83-9.38-4.78l-37.65-61.54v58.22c0,4.19-4.1,7.59-9.14,7.59h-6.03  l-0.16-97.84h8.27c3.15,0,5.98,1.43,7.39,3.74l47.46,79.23l47.42-79.17C922.27,224.41,925.1,222.97,928.25,222.97z"></path>	<path class="st33" d="M959.6,300.7c0-9.53,6.51-20.67,24.85-20.67c9.28,0,19.7,0.02,23.98-0.03c3.63,0,6.27,0.28,8.32,0.68  c-2.13-5.61-5.79-9.26-11.25-11.31c-2.66-1-4.59-1.32-27.44-1.32c-3.77,0-6.85-3-6.85-6.7v-7.94c10.5,0.01,1.87,0.09,26.91,0  c19.5,0,35.37,15.22,35.37,33.92c0,8.95,0,8.57,0,11.34h0.15l-0.2,3.42c-0.7,10.17-9.13,18.7-20.59,19.19  c-5.4-0.04-32.66,0-32.71,0C968.63,320.83,959.6,311.79,959.6,300.7z M981.04,306.64c13.69,0,23.04-0.01,31.47,0.03  c0.5-0.06,5.81-0.84,5.93-5.72c0.08-3.34-2.41-6.25-7.33-6.25c-2.25-0.04-14.77-0.13-29.74,0.04c-4.37,0-6.72,3.07-6.72,5.96  C974.65,303.97,977.52,306.64,981.04,306.64z"></path>	<path class="st33" d="M1086.36,289l-13.11,12.41v19.88h-17.62V216.67h17.62v63.17l36.52-33.84h21.15l-31.44,31.58l34.4,43.71  h-21.43L1086.36,289z"></path>	<path class="st33" d="M1172.81,253.84c4.07-0.62,19.05-0.44,20.75-0.42c11.78,0,21.4,9.25,21.4,20.63  c0,10.33-7.93,18.91-18.25,20.4c-10.5,0.35-0.9,0.14-32.24,0.25l0-6.04c0-4.78,3.98-8.61,8.87-8.61c14.55,0,20.18-0.03,20.18-0.03  c3.53,0,6.4-2.68,6.4-5.97c0-3.29-2.87-5.97-6.4-5.97c0,0-5.01-0.03-15.13-0.03c-11.22,0-20.36,8.66-20.36,19.31  c0,10.65,9.13,19.31,20.36,19.31l23.34,0c4.23,0,7.68,3.35,7.68,7.48v7.15c-35.38,0.01-32.38,0.24-36.6-0.41  C1132.76,314.83,1133.48,259.79,1172.81,253.84z"></path>	<path class="st33" d="M1235.54,287.27c-0.09-23.3,24.78-40.16,48.13-31.54l2.09,0.77c0,2.62,0.33,7.29-3.37,10.32  c-1.98,1.63-4.57,2.23-7.27,1.69c-12.92-2.57-24.55,7.07-24.55,19.3v26.05c0,4.12-3.44,7.48-7.68,7.48h-7.34  C1235.55,320.31,1235.55,288.15,1235.54,287.27z"></path>	<path class="st33" d="M1302.23,274.03c0.02-10.31,7.94-18.87,18.23-20.37c5.43-0.22,41.56-0.22,46.56-0.22v7.15  c0,4.12-3.44,7.48-7.68,7.48c-36.98,0-33.78-0.01-35.67,0.02c-3.53,0-6.4,2.68-6.4,5.97c0,3.03,2.42,5.76,5.51,6.2  c1.78,0.25,11.38-0.84,11.38,7.28v7.15h-10.22C1312.32,294.69,1302.21,285.57,1302.23,274.03z M1369.46,300.74  c-0.02,10.31-7.94,18.88-18.23,20.37c-5.49,0.22-42.22,0.22-47.17,0.22v-7.15c0-4.12,3.44-7.48,7.68-7.48  c37.5,0,34.4,0.01,36.23-0.02c3.58,0,6.45-2.68,6.45-5.97c0-3.1-2.39-6.17-7.02-6.27c-2.7-0.06-9.87-0.23-9.87-7.21v-7.15h10.22  C1359.35,280.08,1369.47,289.17,1369.46,300.74z"></path>	<path class="st37" d="M1395.78,321.29h-7.26v-14.66h15.05v7.08C1403.57,317.89,1400.08,321.29,1395.78,321.29z"></path>	<path class="st37" d="M1431.66,321.29h-14.37c1.25-2.16,52.15-89.68,53.47-91.96c2.12-3.93,6.27-6.37,10.86-6.37h8.4  c8.68,16.26,44.15,82.78,52.44,98.33h-12.89c-2.72,0-5.23-1.5-6.51-3.91c-6.41-12.02-12.44-23.33-16.7-31.31l-24.21-45.4  c-28.83,48.66-45.64,77.02-46.32,78.19C1434.99,320.36,1433.4,321.29,1431.66,321.29z"></path>	<path class="st37" d="M1577.39,230.56v90.73h-7.79c-4.3,0-7.8-3.41-7.8-7.59v-90.73h7.79  C1573.89,222.97,1577.39,226.37,1577.39,230.56z"></path></g><g>	<g>		<g>			<g>				<path class="st33" d="M364.5,334.9c-0.05-1.19-0.14-2.37-0.26-3.56c-2.17-22.52-4.39-45.04-6.56-67.56l-0.04-0.3     c-1.7-17.68-3.39-35.37-5-53.06c-0.33-3.64-0.96-7.2-1.86-10.65v-0.01c-7.17-27.49-31.64-47.83-60.62-48.82h-86.28     c-0.22,0.01-0.45,0.01-0.69,0.01c-0.96-0.01-1.92-0.01-2.88-0.01h-0.24c-18.75-0.09-37.52-0.03-56.27-0.06     c-1.14,0-2.27,0.01-3.41,0.06c-3.23,0.12-6.43,0.47-9.56,1.21c-26.83,6.36-42.34,24.33-48.9,50.02     c-4.21,16.48-3.96,33.74-5.7,50.66c-2.71,26.37-5.05,52.78-7.68,79.15c-0.88,8.82,1.64,11.85,10.6,11.85h265.3     c3.96,0,7.92,0.12,11.88-0.04C361.92,343.58,364.73,340.41,364.5,334.9z M154.37,306.21c-4.59-0.01-8.96-0.86-12.99-2.41     c-13.7-5.25-23.34-18.55-23.28-34.2c0.08-18.06,13.47-33.11,30.82-35.8v-0.01c1.8-0.27,3.65-0.42,5.53-0.42     c20.08-0.03,36.51,16.4,36.5,36.5C190.93,290.02,174.58,306.26,154.37,306.21z M289.56,304.46c-3.59,1.16-7.45,1.77-11.45,1.75     c-19.95-0.08-36.22-16.39-36.24-36.32c-0.01-20.06,16.46-36.52,36.53-36.51c1.19,0,2.37,0.06,3.53,0.18     c18.45,1.79,32.84,17.42,32.79,36.43C314.67,286.21,304.19,299.78,289.56,304.46z"></path>			</g>		</g>		<g>			<path class="st33" d="M290.17,150.95h-86.28c2.11-0.1,2.86-0.83,3.14-3.34c1.11-10.22,2.52-20.42,3.96-30.59    c0.29-2.05-0.14-2.88-2.16-3.72c-9.54-3.98-14.68-13.44-12.72-22.91c2.03-9.86,10.31-16.79,20.16-16.89    c9.74-0.1,18.42,6.94,20.44,16.58c2.04,9.7-3.05,19.16-12.8,23.27c-1.85,0.78-2.37,1.5-2.11,3.4    c1.45,10.72,2.85,21.44,4.14,32.17c0.3,2.53,1.97,1.98,3.46,1.98c19.53,0.01,39.07,0,58.6,0.01    C288.73,150.9,289.46,150.92,290.17,150.95z"></path>		</g>		<g>			<path class="st33" d="M381.66,486.61L381.66,486.61c-41.24,0-75.84-31.08-80.25-72.08L300,401.45H130.87l-1.41,13.08    c-4.41,41-39.02,72.08-80.25,72.08h0l9.17-85.16l6.93-42.6c0.62-3.81,3.91-6.6,7.76-6.6h284.75c3.86,0,7.15,2.8,7.76,6.61    l6.91,42.59L381.66,486.61z"></path>		</g>	</g></g></svg>`;
  const logoHtml = `<div style="text-align: center; margin-bottom: 20px;">${logoSvg}</div>`;
  const modifiedHtml = html ? html.replace('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">' + logoHtml) : '';

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject,
    html: modifiedHtml,
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
