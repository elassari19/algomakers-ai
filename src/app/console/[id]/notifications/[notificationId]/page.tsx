import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, NotificationType, NotificationPriority, NotificationChannel } from '@/generated/prisma';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, User, Users, Calendar, Clock, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface PageProps {
  params: {
    notificationId: string;
  };
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.SUBSCRIPTION_CONFIRMED:
    case NotificationType.SUBSCRIPTION_EXPIRED:
      return <CheckCircle className="w-5 h-5" />;
    case NotificationType.PAYMENT_RECEIVED:
    case NotificationType.PAYMENT_FAILED:
      return <AlertCircle className="w-5 h-5" />;
    case NotificationType.ADMIN_ACTION_REQUIRED:
      return <AlertCircle className="w-5 h-5" />;
    case NotificationType.TRADINGVIEW_INVITE_SENT:
    case NotificationType.TRADINGVIEW_INVITE_COMPLETED:
      return <Info className="w-5 h-5" />;
    case NotificationType.RENEWAL_REMINDER:
      return <Clock className="w-5 h-5" />;
    case NotificationType.SYSTEM_MAINTENANCE:
    case NotificationType.NEW_FEATURE_ANNOUNCEMENT:
    case NotificationType.SECURITY_ALERT:
    case NotificationType.GENERAL:
      return <Bell className="w-5 h-5" />;
    case NotificationType.COMMISSION_EARNED:
    case NotificationType.PAYOUT_PROCESSED:
      return <CheckCircle className="w-5 h-5" />;
    case NotificationType.USER_REGISTRATION:
      return <User className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case NotificationType.SUBSCRIPTION_CONFIRMED:
    case NotificationType.PAYMENT_RECEIVED:
    case NotificationType.COMMISSION_EARNED:
    case NotificationType.PAYOUT_PROCESSED:
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case NotificationType.SUBSCRIPTION_EXPIRED:
    case NotificationType.PAYMENT_FAILED:
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case NotificationType.ADMIN_ACTION_REQUIRED:
    case NotificationType.SECURITY_ALERT:
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case NotificationType.TRADINGVIEW_INVITE_SENT:
    case NotificationType.TRADINGVIEW_INVITE_COMPLETED:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case NotificationType.RENEWAL_REMINDER:
    case NotificationType.SYSTEM_MAINTENANCE:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case NotificationType.NEW_FEATURE_ANNOUNCEMENT:
    case NotificationType.USER_REGISTRATION:
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case NotificationType.GENERAL:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function getPriorityColor(priority: NotificationPriority) {
  switch (priority) {
    case NotificationPriority.LOW:
      return 'bg-blue-500/20 text-blue-400';
    case NotificationPriority.MEDIUM:
      return 'bg-yellow-500/20 text-yellow-400';
    case NotificationPriority.HIGH:
      return 'bg-orange-500/20 text-orange-400';
    case NotificationPriority.URGENT:
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

function getChannelColor(channel: NotificationChannel) {
  switch (channel) {
    case NotificationChannel.IN_APP:
      return 'bg-blue-500/20 text-blue-400';
    case NotificationChannel.EMAIL:
      return 'bg-green-500/20 text-green-400';
    case NotificationChannel.PUSH:
      return 'bg-purple-500/20 text-purple-400';
    case NotificationChannel.SMS:
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

export default async function NotificationDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    notFound();
  }

  const user = session.user;

  // Check permissions - only admin, manager, or support can view notification details
  if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && user.role !== Role.SUPPORT) {
    notFound();
  }

  // Fetch notification with user relation
  const notification = await prisma.notification.findUnique({
    where: { id: params.notificationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!notification) {
    return null
  }

  // For support users, limit access to certain notification types
  if (user.role === Role.SUPPORT) {
    const allowedTypes = [
      NotificationType.GENERAL,
      NotificationType.RENEWAL_REMINDER,
      NotificationType.SYSTEM_MAINTENANCE,
      NotificationType.NEW_FEATURE_ANNOUNCEMENT,
    ] as NotificationType[];
  }

  return (
    <GradientBackground>
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-lg border border-white/20">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Link href={`/console/2/notifications`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Notifications
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Notification Details</h1>
              <p className="text-gray-400 text-sm">ID: {notification?.id}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Notification Details */}
            <div className="md:col-span-2 space-y-6 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-lg border border-white/20">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification?.type!)}`}>
                        {getNotificationIcon(notification?.type!)}
                      </div>
                      <div>
                        <CardTitle className="text-white text-xl">{notification?.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getNotificationColor(notification?.type!)}>
                            {notification?.type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(notification?.priority!)}>
                            {notification?.priority}
                          </Badge>
                          <Badge className={getChannelColor(notification?.channel!)}>
                            {notification?.channel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3>Target</h3>
                    <p className="text-gray-300">
                      {notification?.targetId
                        ? `Related to entity ID: ${notification?.targetId}`
                        : 'No specific target entity'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-2">Message</h3>
                    <p className="text-gray-300 leading-relaxed">{notification?.message}</p>
                  </div>

                  {notification?.data && Object.keys(notification?.data).length > 0 && (
                    <div>
                      <h3 className="text-white font-medium mb-2">Additional Data</h3>
                      <pre className="bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-300 overflow-x-auto">
                        {JSON.stringify(notification?.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Target Users */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Target Recipients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notification?.targetUsers && notification?.targetUsers.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        This notification? is targeted to {notification?.targetUsers.length} user(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {notification?.targetUsers.map((userId, index) => (
                          <Badge key={userId} variant="outline" className="border-white/20 text-gray-300">
                            User {index + 1}: {userId.slice(0, 8)}...
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">No specific target users (system-wide notification?)</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Metadata */}
              <Card className=" bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Created</p>
                      <p className="text-gray-400 text-xs">
                        {format(new Date(notification?.createdAt!), 'PPP p')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Last Updated</p>
                      <p className="text-gray-400 text-xs">
                        {format(new Date(notification?.updatedAt!), 'PPP p')}
                      </p>
                    </div>
                  </div>

                  {notification?.expiresAt && (
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-white text-sm font-medium">Expires</p>
                        <p className="text-gray-400 text-xs">
                          {format(new Date(notification?.expiresAt), 'PPP p')}
                        </p>
                      </div>
                    </div>
                  )}

                  {notification?.targetId && (
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-white text-sm font-medium">Related Entity</p>
                        <p className="text-gray-400 text-xs font-mono">{notification?.targetId}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Creator Info */}
              {notification?.user && (
                <Card className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-lg border border-white/20">
                  <CardHeader>
                    <div className='flex justify-between items-center'>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Created By
                      </CardTitle>
                      <Badge variant="outline" className="border-white/20 text-gray-300">
                        {notification?.user.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-white font-medium">{notification?.user.name || 'Unknown User'}</p>
                      <p className="text-gray-400 text-sm">{notification?.user.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
