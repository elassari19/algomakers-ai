import {
  type WelcomeEmailParams,
  type PaymentReceiptEmailParams,
  type InvitePendingEmailParams,
  type InviteCompletedEmailParams,
  type RenewalReminderEmailParams,
  type PasswordResetEmailParams,
} from './email-template';

// Base URL for API calls
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

// Email service class for easy usage
export class EmailService {
  private static baseUrl = getBaseUrl();

  private static async sendRequest(payload: any) {
    // For server-side calls, use regular fetch
    const baseUrl =
      typeof window === 'undefined'
        ? process.env.NEXTAUTH_URL || 'http://localhost:3000'
        : this.baseUrl;

    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return response.json();
  }

  // Send welcome email
  static async sendWelcomeEmail(to: string, params: WelcomeEmailParams) {
    return this.sendRequest({
      template: 'welcome',
      to,
      params,
    });
  }

  // Send payment receipt email
  static async sendPaymentReceiptEmail(
    to: string,
    params: PaymentReceiptEmailParams
  ) {
    return this.sendRequest({
      template: 'payment_receipt',
      to,
      params,
    });
  }

  // Send invite pending email
  static async sendInvitePendingEmail(
    to: string,
    params: InvitePendingEmailParams
  ) {
    return this.sendRequest({
      template: 'invite_pending',
      to,
      params,
    });
  }

  // Send invite completed email
  static async sendInviteCompletedEmail(
    to: string,
    params: InviteCompletedEmailParams
  ) {
    return this.sendRequest({
      template: 'invite_completed',
      to,
      params,
    });
  }

  // Send renewal reminder email
  static async sendRenewalReminderEmail(
    to: string,
    params: RenewalReminderEmailParams
  ) {
    return this.sendRequest({
      template: 'renewal_reminder',
      to,
      params,
    });
  }

  // Send password reset email
  static async sendPasswordResetEmail(
    to: string,
    params: PasswordResetEmailParams
  ) {
    return this.sendRequest({
      template: 'password_reset',
      to,
      params,
    });
  }

  // Send custom email
  static async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    return this.sendRequest({
      template: 'custom',
      to,
      subject,
      html,
      text,
    });
  }

  // Check email service health
  static async checkHealth() {
    const response = await fetch(`${this.baseUrl}/api/send-email`);
    return response.json();
  }
}

// Convenience functions for direct usage
export const sendWelcomeEmail =
  EmailService.sendWelcomeEmail.bind(EmailService);
export const sendPaymentReceiptEmail =
  EmailService.sendPaymentReceiptEmail.bind(EmailService);
export const sendInvitePendingEmail =
  EmailService.sendInvitePendingEmail.bind(EmailService);
export const sendInviteCompletedEmail =
  EmailService.sendInviteCompletedEmail.bind(EmailService);
export const sendRenewalReminderEmail =
  EmailService.sendRenewalReminderEmail.bind(EmailService);
export const sendPasswordResetEmail =
  EmailService.sendPasswordResetEmail.bind(EmailService);
export const sendCustomEmail = EmailService.sendCustomEmail.bind(EmailService);

// Type exports for convenience
export type {
  WelcomeEmailParams,
  PaymentReceiptEmailParams,
  InvitePendingEmailParams,
  InviteCompletedEmailParams,
  RenewalReminderEmailParams,
  PasswordResetEmailParams,
} from './email-template';
