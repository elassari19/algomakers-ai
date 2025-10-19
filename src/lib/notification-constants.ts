import { NotificationType, NotificationPriority, NotificationChannel, Role } from '@/generated/prisma';

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  data?: Record<string, any>;
}

export interface CreateNotificationParams {
  userId?: string;
  userIds?: string[]; // For multiple users - will populate targetUsers array
  targetUsers?: string[]; // Direct array of user IDs to target
  targetId?: string; // ID of the related entity for navigation
  template: NotificationTemplate;
  expiresAt?: Date;
}

// Notification Templates
export const NotificationTemplates = {
  // User Notifications
  PAYMENT_RECEIVED: (data: { pairName: string; period: string; amount: string; network: string; txHash: string }) => ({
    type: NotificationType.PAYMENT_RECEIVED,
    title: 'Payment Received ✅',
    message: `Your payment of ${data.amount} USDT (${data.network}) for ${data.pairName} - ${data.period} has been received. Transaction: ${data.txHash}`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  SUBSCRIPTION_CONFIRMED: (data: { pairName: string; period: string; startDate: string; expiryDate: string }) => ({
    type: NotificationType.SUBSCRIPTION_CONFIRMED,
    title: 'Subscription Confirmed 🎉',
    message: `Your subscription to ${data.pairName} for ${data.period} is now active. Access starts on ${data.startDate} and expires on ${data.expiryDate}.`,
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.IN_APP,
    data
  }),

  TRADINGVIEW_INVITE_SENT: (data: { pairName: string; tradingViewUsername: string }) => ({
    type: NotificationType.TRADINGVIEW_INVITE_SENT,
    title: 'TradingView Invite Sent 📩',
    message: `A TradingView invitation has been sent to ${data.tradingViewUsername} for ${data.pairName}. Please check your TradingView notifications.`,
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.IN_APP,
    data
  }),

  TRADINGVIEW_INVITE_COMPLETED: (data: { pairName: string; expiryDate: string }) => ({
    type: NotificationType.TRADINGVIEW_INVITE_COMPLETED,
    title: 'TradingView Access Granted ✅',
    message: `Your TradingView invitation for ${data.pairName} has been accepted. Full access granted until ${data.expiryDate}.`,
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.IN_APP,
    data
  }),

  RENEWAL_REMINDER: (data: { pairName: string; expiryDate: string; daysLeft: number }) => ({
    type: NotificationType.RENEWAL_REMINDER,
    title: 'Subscription Expiring Soon ⏰',
    message: `Your subscription to ${data.pairName} expires on ${data.expiryDate} (${data.daysLeft} days remaining). Renew now to maintain access.`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  PAYMENT_FAILED: (data: { message: string }) => ({
    type: NotificationType.PAYMENT_FAILED,
    title: 'Payment Failed ❌',
    message: data.message,
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.IN_APP,
    data
  }),

  PAYMENT_EXPIRED: (data: { pairName: string }) => ({
    type: NotificationType.GENERAL,
    title: 'Payment Expired ⏰',
    message: `Your payment for ${data.pairName} has expired. Please create a new payment to complete your subscription.`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  PAYMENT_UNDERPAID: (data: { pairName: string; expectedAmount: string; receivedAmount: string }) => ({
    type: NotificationType.GENERAL,
    title: 'Payment Underpaid ⚠️',
    message: `Your payment for ${data.pairName} was underpaid. Expected: ${data.expectedAmount} USDT, Received: ${data.receivedAmount} USDT. Please complete the payment.`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  SUBSCRIPTION_EXPIRED: (data: { pairName: string }) => ({
    type: NotificationType.SUBSCRIPTION_EXPIRED,
    title: 'Subscription Expired ⏰',
    message: `Your subscription to ${data.pairName} has expired. Renew now to regain access to backtests and live performance.`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  SUBSCRIPTION_CANCELLED: (data: { pairName: string; reason?: string }) => ({
    type: NotificationType.GENERAL,
    title: 'Subscription Cancelled ❌',
    message: `Your subscription to ${data.pairName} has been cancelled${data.reason ? `. Reason: ${data.reason}` : ''}. You can renew at any time.`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  SUBSCRIPTION_RENEWED: (data: { pairName: string; newExpiryDate: string }) => ({
    type: NotificationType.GENERAL,
    title: 'Subscription Renewed 🔄',
    message: `Your subscription to ${data.pairName} has been successfully renewed. New expiry date: ${data.newExpiryDate}.`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  SUBSCRIPTION_UPGRADED: (data: { pairName: string; oldPeriod: string; newPeriod: string; newExpiryDate: string }) => ({
    type: NotificationType.GENERAL,
    title: 'Subscription Upgraded ⬆️',
    message: `Your subscription to ${data.pairName} has been upgraded from ${data.oldPeriod} to ${data.newPeriod}. New expiry date: ${data.newExpiryDate}.`,
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.IN_APP,
    data
  }),

  // Admin Notifications
  NEW_SUBSCRIPTION_ORDER: (data: { userName: string; userEmail: string; tradingViewUsername: string; pairName: string; period: string; expiryDate: string }) => ({
    type: NotificationType.ADMIN_ACTION_REQUIRED,
    title: 'New Subscription Order 📋',
    message: `New subscription: ${data.userName} (${data.userEmail}) - ${data.pairName} ${data.period}. TradingView: ${data.tradingViewUsername}. Expiry: ${data.expiryDate}`,
    priority: NotificationPriority.URGENT,
    channel: NotificationChannel.IN_APP,
    data
  }),

  SUBSCRIPTION_CONFIRMED_ADMIN: (data: { userId: string; userEmail: string; pairName: string; period: string; startDate: string; expiryDate: string }) => ({
    type: NotificationType.ADMIN_ACTION_REQUIRED,
    title: 'Subscription Activated ✅',
    message: `Subscription confirmed for ${data.userEmail} (${data.userId}) - ${data.pairName} ${data.period}. Active from ${data.startDate} to ${data.expiryDate}.`,
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.IN_APP,
    data
  }),

  COMMISSION_EARNED: (data: { amount: string; affiliateName: string; userEmail: string }) => ({
    type: NotificationType.COMMISSION_EARNED,
    title: 'Commission Earned 💰',
    message: `You earned ${data.amount} commission from ${data.affiliateName}'s referral to ${data.userEmail}.`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  PAYOUT_PROCESSED: (data: { amount: string; payoutId: string }) => ({
    type: NotificationType.PAYOUT_PROCESSED,
    title: 'Payout Processed ✅',
    message: `Your payout of ${data.amount} has been processed. Payout ID: ${data.payoutId}`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  // System Notifications
  SYSTEM_MAINTENANCE: (data: { startTime: string; endTime: string; reason: string }) => ({
    type: NotificationType.SYSTEM_MAINTENANCE,
    title: 'System Maintenance 🔧',
    message: `Scheduled maintenance from ${data.startTime} to ${data.endTime}. ${data.reason}`,
    priority: NotificationPriority.MEDIUM,
    channel: NotificationChannel.IN_APP,
    data
  }),

  NEW_FEATURE_ANNOUNCEMENT: (data: { featureName: string; description: string }) => ({
    type: NotificationType.NEW_FEATURE_ANNOUNCEMENT,
    title: 'New Feature Available ✨',
    message: `${data.featureName}: ${data.description}`,
    priority: NotificationPriority.LOW,
    channel: NotificationChannel.IN_APP,
    data
  }),

  SECURITY_ALERT: (data: { action: string; ipAddress: string; timestamp: string }) => ({
    type: NotificationType.SECURITY_ALERT,
    title: 'Security Alert ⚠️',
    message: `Security event detected: ${data.action} from IP ${data.ipAddress} at ${data.timestamp}`,
    priority: NotificationPriority.URGENT,
    channel: NotificationChannel.IN_APP,
    data
  }),

  GENERAL: (data: { title: string; message: string }) => ({
    type: NotificationType.GENERAL,
    title: data.title,
    message: data.message,
    priority: NotificationPriority.LOW,
    channel: NotificationChannel.IN_APP,
    data
  })
};