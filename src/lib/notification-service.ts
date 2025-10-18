import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';
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

// Notification Service Functions

/**
 * Create a notification for a single user
 */
export async function createNotificationForUser(params: Omit<CreateNotificationParams, 'userIds' | 'targetRole'> & { userId: string }) {
  const template = params.template;

  await prisma.notification.create({
    data: {
      targetUsers: [params.userId],
      userId: params.userId,
      targetId: params.targetId,
      type: template.type,
      title: template.title,
      message: template.message,
      priority: template.priority || NotificationPriority.MEDIUM,
      channel: template.channel || NotificationChannel.IN_APP,
      data: template.data || {},
      expiresAt: params.expiresAt
    }
  });
  revalidatePath('/', 'layout');
  return revalidatePath('/', 'page');
}

/**
 * Create a notification for multiple specific users (creates one notification with targetUsers array)
 */
export async function createNotificationForUsers(params: Omit<CreateNotificationParams, 'userId' | 'targetUsers'> & { userIds: string[] }) {
  const template = params.template;

  await prisma.notification.create({
    data: {
      targetUsers: params.userIds,
      targetId: params.targetId,
      type: template.type,
      title: template.title,
      message: template.message,
      priority: template.priority || NotificationPriority.MEDIUM,
      channel: template.channel || NotificationChannel.IN_APP,
      data: template.data || {},
      expiresAt: params.expiresAt
    }
  });
  revalidatePath('/', 'layout');
  return revalidatePath('/', 'page');
}

/**
 * Create a notification for all users with a specific role
 */
export async function createNotificationForRole(params: Omit<CreateNotificationParams, 'userId' | 'userIds'> & { targetRole: Role }) {
  const template = params.template;

  // Get all users with the specified role
  const users = await prisma.user.findMany({
    where: { role: params.targetRole },
    select: { id: true }
  });

  const userIds = users.map(user => user.id);

  await prisma.notification.create({
    data: {
      targetUsers: userIds,
      targetId: params.targetId,
      type: template.type,
      title: template.title,
      message: template.message,
      priority: template.priority || NotificationPriority.MEDIUM,
      channel: template.channel || NotificationChannel.IN_APP,
      data: template.data || {},
      expiresAt: params.expiresAt
    }
  });
  revalidatePath('/', 'layout');
  return revalidatePath('/', 'page');
}

/**
 * Create a system-wide notification (visible to admins)
 */
export async function createSystemNotification(params: Omit<CreateNotificationParams, 'userId' | 'userIds' | 'targetRole'>) {
  const template = params.template;

  await prisma.notification.create({
    data: {
      targetId: params.targetId,
      type: template.type,
      title: template.title,
      message: template.message,
      priority: template.priority || NotificationPriority.MEDIUM,
      channel: template.channel || NotificationChannel.IN_APP,
      data: template.data || {},
      expiresAt: params.expiresAt
    }
  });
  revalidatePath('/', 'layout');
  return revalidatePath('/', 'page');
}

/**
 * Mark notification as read by removing userId from targetUsers array
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { targetUsers: true }
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  // Remove userId from targetUsers array
  const updatedTargetUsers = notification.targetUsers.filter(id => id !== userId);

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      targetUsers: updatedTargetUsers,
      updatedAt: new Date()
    }
  });
  revalidatePath('/', 'layout');
  return revalidatePath('/', 'page');
}

/**
 * Mark multiple notifications as read by removing userId from their targetUsers arrays
 */
export async function markMultipleNotificationsAsRead(notificationIds: string[], userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { id: { in: notificationIds } },
    select: { id: true, targetUsers: true }
  });

  const updatePromises = notifications.map(notification => {
    const updatedTargetUsers = notification.targetUsers.filter(id => id !== userId);
    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        targetUsers: updatedTargetUsers,
        updatedAt: new Date()
      }
    });
  });

  await Promise.all(updatePromises);
  revalidatePath('/', 'layout');
  return revalidatePath('/', 'page');
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  // Get notifications where userId is in targetUsers array and not expired
  const notifications = await prisma.notification.findMany({
    where: {
      targetUsers: {
        has: userId
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    select: { id: true }
  });

  return notifications.length;
}

/**
 * Get notifications for a user (with pagination)
 */
export async function getUserNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    includeRead?: boolean;
    type?: NotificationType;
  } = {}
) {
  const { page = 1, limit = 20, includeRead = true, type } = options;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    targetUsers: {
      has: userId
    }
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where: whereClause })
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Delete expired notifications
 */
export async function cleanupExpiredNotifications() {
  await prisma.notification.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  revalidatePath('/', 'layout');
  return revalidatePath('/', 'page');
}

// Convenience functions for common notification scenarios
export const createPaymentReceivedNotification = (userId: string, data: Parameters<typeof NotificationTemplates.PAYMENT_RECEIVED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.PAYMENT_RECEIVED(data) });

export const createPaymentFailedNotification = (userId: string, data: Parameters<typeof NotificationTemplates.PAYMENT_FAILED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.PAYMENT_FAILED(data) });

export const createPaymentExpiredNotification = (userId: string, data: Parameters<typeof NotificationTemplates.PAYMENT_EXPIRED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.PAYMENT_EXPIRED(data) });

export const createPaymentUnderpaidNotification = (userId: string, data: Parameters<typeof NotificationTemplates.PAYMENT_UNDERPAID>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.PAYMENT_UNDERPAID(data) });

export const createSubscriptionConfirmedNotification = (userId: string, data: Parameters<typeof NotificationTemplates.SUBSCRIPTION_CONFIRMED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.SUBSCRIPTION_CONFIRMED(data) });

export const createTradingViewInviteSentNotification = (userId: string, data: Parameters<typeof NotificationTemplates.TRADINGVIEW_INVITE_SENT>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.TRADINGVIEW_INVITE_SENT(data) });

export const createTradingViewInviteCompletedNotification = (userId: string, data: Parameters<typeof NotificationTemplates.TRADINGVIEW_INVITE_COMPLETED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.TRADINGVIEW_INVITE_COMPLETED(data) });

export const createRenewalReminderNotification = (userId: string, data: Parameters<typeof NotificationTemplates.RENEWAL_REMINDER>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.RENEWAL_REMINDER(data) });

export const createNewSubscriptionOrderNotification = (adminIds: string[], data: Parameters<typeof NotificationTemplates.NEW_SUBSCRIPTION_ORDER>[0], targetId?: string) =>
  createNotificationForUsers({ userIds: adminIds, targetId, template: NotificationTemplates.NEW_SUBSCRIPTION_ORDER(data) });

export const createSubscriptionExpiredNotification = (userId: string, data: Parameters<typeof NotificationTemplates.SUBSCRIPTION_EXPIRED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.SUBSCRIPTION_EXPIRED(data) });

export const createSubscriptionCancelledNotification = (userId: string, data: Parameters<typeof NotificationTemplates.SUBSCRIPTION_CANCELLED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.SUBSCRIPTION_CANCELLED(data) });

export const createSubscriptionRenewedNotification = (userId: string, data: Parameters<typeof NotificationTemplates.SUBSCRIPTION_RENEWED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.SUBSCRIPTION_RENEWED(data) });

export const createSubscriptionUpgradedNotification = (userId: string, data: Parameters<typeof NotificationTemplates.SUBSCRIPTION_UPGRADED>[0], targetId?: string) =>
  createNotificationForUser({ userId, targetId, template: NotificationTemplates.SUBSCRIPTION_UPGRADED(data) });