'use client';

import React, { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { getUnreadNotificationsCount, getUserNotifications, markNotificationAsRead } from '@/lib/notification-service';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  channel: string;
  data?: any;
  createdAt: Date;
  targetId?: string;
}

export function NotificationProvider() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications and unread count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const [unreadResult, notificationsResult] = await Promise.all([
          getUnreadNotificationsCount(session.user.id),
          getUserNotifications(session.user.id, { limit: 20 })
        ]);

        setUnreadCount(unreadResult);
        setNotifications(notificationsResult.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [session?.user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!session?.user?.id) return;

    try {
      await markNotificationAsRead(notificationId, session.user.id);

      // Remove the notification from the local state since it's now read
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <NotificationBell
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={handleMarkAsRead}
    />
  );
}