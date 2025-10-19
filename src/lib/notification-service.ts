'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';
import { NotificationType, NotificationPriority, NotificationChannel, Role } from '@/generated/prisma';
import { NotificationTemplates, NotificationTemplate, CreateNotificationParams } from './notification-constants';

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
  revalidatePath('/dashboard', 'layout');
  return revalidatePath('/console', 'layout');
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
