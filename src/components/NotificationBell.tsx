import React from 'react';
import { Bell } from 'lucide-react';
import { NotificationDismissButton } from './NotificationDismissButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUserNotifications } from '@/lib/notification-service';
import Link from 'next/link';

interface NotificationBellProps {
  userId: string;
  role: string;
}

export async function NotificationBell({ userId, role }: NotificationBellProps) {

  const [notificationsResult] = await Promise.all([
    getUserNotifications(userId, { limit: 20 })
  ]);

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      SUBSCRIPTION_CONFIRMED: '🎉',
      SUBSCRIPTION_EXPIRED: '⏰',
      PAYMENT_RECEIVED: '💰',
      PAYMENT_FAILED: '❌',
      ADMIN_ACTION_REQUIRED: '⚠️',
      TRADINGVIEW_INVITE_SENT: '📩',
      TRADINGVIEW_INVITE_COMPLETED: '✅',
      RENEWAL_REMINDER: '🔄',
      SYSTEM_MAINTENANCE: '🔧',
      NEW_FEATURE_ANNOUNCEMENT: '✨',
      SECURITY_ALERT: '🚨',
      COMMISSION_EARNED: '💵',
      PAYOUT_PROCESSED: '💳',
      USER_REGISTRATION: '👤',
      GENERAL: '💡',
    };
    return icons[type] || '💡';
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-white/80 hover:text-white hover:bg-white/10"
        >
          <Bell className="h-5 w-5" />
          {notificationsResult.notifications.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationsResult.notifications.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[28rem] max-w-none bg-gradient-to-b from-purple-950 to-pink-950 backdrop-blur-md border-white/20 p-6">
        <SheetHeader className="px-2">
          <SheetTitle className="text-white">Notifications</SheetTitle>
          <SheetDescription className="text-white/70">
            Stay updated with your trading alerts and account activity
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-6 px-2">
          <div className="space-y-4">
            {notificationsResult.notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/70">No notifications</p>
              </div>
            ) : (
              notificationsResult.notifications.map((notification) => (
                <Link
                  href={role !== 'USER' ? `/console/2/notifications/${notification.id}` : '#'}
                  key={notification.id}
                  className="block p-3 rounded-lg border bg-white/10 border-white/20 transition-all cursor-pointer hover:bg-white/15"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/50 mt-2">
                        {formatTimestamp(new Date(notification.createdAt))}
                      </p>
                    </div>
                    <NotificationDismissButton notificationId={notification.id} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}