'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/SearchInput';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import {
  BarChart3,
  Target,
  DollarSign,
  Clock,
  Bell,
  CheckCircle,
  Eye,
  Mail,
  MailOpen,
  Plus,
  Trash2,
  Users,
  AlertCircle,
  CreditCard,
  RefreshCw,
  MessageSquare,
  Calendar,
  Pencil,
  Settings,
  UserCheck
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationType, Role } from '@/generated/prisma';
import { AccessDeniedCard } from '@/components/console/AccessDeniedCard';
import Link from 'next/link';

// Types based on Prisma schema
interface Notification {
  id: string;
  userId: string | null;
  targetUsers: string[];
  targetId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  priority: string;
  channel: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface NotificationFormData {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  targetUsers?: string;
  targetId?: string;
  priority?: string;
  channel?: string;
  expiresAt?: string;
  data?: any;
}

// Zod validation schema
const notificationFormSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  userId: z.string().optional(),
  targetUsers: z.string().optional(),
  targetId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  channel: z.enum(['IN_APP', 'EMAIL', 'PUSH', 'SMS']).optional(),
  expiresAt: z.string().optional(),
  data: z.any().optional(),
});

type ValidationErrors = Partial<Record<keyof NotificationFormData, string>>;

// Helper functions
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SUBSCRIPTION_CONFIRMED:
    case NotificationType.SUBSCRIPTION_EXPIRED:
      return <RefreshCw className="w-4 h-4" />;
    case NotificationType.PAYMENT_RECEIVED:
    case NotificationType.PAYMENT_FAILED:
      return <CreditCard className="w-4 h-4" />;
    case NotificationType.ADMIN_ACTION_REQUIRED:
      return <AlertCircle className="w-4 h-4" />;
    case NotificationType.TRADINGVIEW_INVITE_SENT:
    case NotificationType.TRADINGVIEW_INVITE_COMPLETED:
      return <MessageSquare className="w-4 h-4" />;
    case NotificationType.RENEWAL_REMINDER:
      return <Clock className="w-4 h-4" />;
    case NotificationType.GENERAL:
      return <Bell className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SUBSCRIPTION_CONFIRMED:
    case NotificationType.PAYMENT_RECEIVED:
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case NotificationType.SUBSCRIPTION_EXPIRED:
    case NotificationType.PAYMENT_FAILED:
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case NotificationType.ADMIN_ACTION_REQUIRED:
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case NotificationType.TRADINGVIEW_INVITE_SENT:
    case NotificationType.TRADINGVIEW_INVITE_COMPLETED:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case NotificationType.RENEWAL_REMINDER:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case NotificationType.GENERAL:
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Action buttons component
function ActionButtons({
  row,
  onUpdate,
  onDelete,
  canEdit,
  canDelete,
}: {
  row: Notification;
  onUpdate: (row: Notification) => void;
  onDelete: (row: Notification) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Link href={`/console/2/notifications/${row.id}`}>
        <Button
          className="hover:text-white text-white/70"
          variant={'ghost'}
          size="icon"
          title="View Details"
        >
          <Eye size={16} />
        </Button>
      </Link>
      {canEdit && (
        <Button
          className="hover:text-white text-white/70"
          variant={'ghost'}
          size="icon"
          onClick={() => onUpdate(row)}
          title="Edit Notification"
        >
          <Pencil size={16} />
        </Button>
      )}
      {canDelete && (
        <Button
          className="hover:text-red-600 text-red-500"
          variant={'ghost'}
          size="icon"
          onClick={() => onDelete(row)}
          title="Delete Notification"
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}

// Notification form component
function NotificationForm({
  notification,
  onSubmit,
  onCancel,
  isLoading,
}: {
  notification?: Notification;
  onSubmit: (data: NotificationFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<NotificationFormData>({
    type: notification?.type || NotificationType.GENERAL,
    title: notification?.title || '',
    message: notification?.message || '',
    userId: notification?.userId || '',
    targetUsers: notification?.targetUsers?.join(', ') || '',
    targetId: notification?.targetId || '',
    priority: notification?.priority || 'MEDIUM',
    channel: notification?.channel || 'IN_APP',
    expiresAt: notification?.expiresAt ? new Date(notification.expiresAt).toISOString().slice(0, 16) : '',
    data: notification?.data || null,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateForm = () => {
    try {
      setIsValidating(true);
      notificationFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof NotificationFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleFieldChange = (field: keyof NotificationFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="type" className="text-white/90">Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => handleFieldChange('type', value)}
          >
            <SelectTrigger className={`bg-white/10 border-white/20 text-white ${
              errors.type ? 'border-red-500 focus:border-red-500' : ''
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              {Object.values(NotificationType).map((type) => (
                <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-red-400 text-sm mt-1">{errors.type}</p>
          )}
        </div>

        <div>
          <Label htmlFor="title" className="text-white/90">Title *</Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            required
            className={`bg-white/10 border-white/20 text-white ${
              errors.title ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Notification title"
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="message" className="text-white/90">Message *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleFieldChange('message', e.target.value)}
            required
            className={`bg-white/10 border-white/20 text-white ${
              errors.message ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Notification message"
            rows={4}
          />
          {errors.message && (
            <p className="text-red-400 text-sm mt-1">{errors.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="userId" className="text-white/90">User ID (optional)</Label>
          <Input
            id="userId"
            type="text"
            value={formData.userId}
            onChange={(e) => handleFieldChange('userId', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.userId ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Leave empty for system-wide notification"
          />
          {errors.userId && (
            <p className="text-red-400 text-sm mt-1">{errors.userId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="targetUsers" className="text-white/90">Target Users (optional)</Label>
          <Textarea
            id="targetUsers"
            value={formData.targetUsers}
            onChange={(e) => handleFieldChange('targetUsers', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.targetUsers ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Comma-separated list of user IDs (e.g., user1, user2, user3)"
            rows={2}
          />
          {errors.targetUsers && (
            <p className="text-red-400 text-sm mt-1">{errors.targetUsers}</p>
          )}
        </div>

        <div>
          <Label htmlFor="targetId" className="text-white/90">Target ID (optional)</Label>
          <Input
            id="targetId"
            type="text"
            value={formData.targetId}
            onChange={(e) => handleFieldChange('targetId', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.targetId ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="ID of related entity (subscription, payment, etc.)"
          />
          {errors.targetId && (
            <p className="text-red-400 text-sm mt-1">{errors.targetId}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority" className="text-white/90">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => handleFieldChange('priority', value)}
            >
              <SelectTrigger className={`bg-white/10 border-white/20 text-white ${
                errors.priority ? 'border-red-500 focus:border-red-500' : ''
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                <SelectItem value="LOW" className="text-white hover:bg-white/10">Low</SelectItem>
                <SelectItem value="MEDIUM" className="text-white hover:bg-white/10">Medium</SelectItem>
                <SelectItem value="HIGH" className="text-white hover:bg-white/10">High</SelectItem>
                <SelectItem value="URGENT" className="text-white hover:bg-white/10">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-red-400 text-sm mt-1">{errors.priority}</p>
            )}
          </div>

          <div>
            <Label htmlFor="channel" className="text-white/90">Channel</Label>
            <Select 
              value={formData.channel} 
              onValueChange={(value) => handleFieldChange('channel', value)}
            >
              <SelectTrigger className={`bg-white/10 border-white/20 text-white ${
                errors.channel ? 'border-red-500 focus:border-red-500' : ''
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                <SelectItem value="IN_APP" className="text-white hover:bg-white/10">In App</SelectItem>
                <SelectItem value="EMAIL" className="text-white hover:bg-white/10">Email</SelectItem>
                <SelectItem value="PUSH" className="text-white hover:bg-white/10">Push</SelectItem>
                <SelectItem value="SMS" className="text-white hover:bg-white/10">SMS</SelectItem>
              </SelectContent>
            </Select>
            {errors.channel && (
              <p className="text-red-400 text-sm mt-1">{errors.channel}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="expiresAt" className="text-white/90">Expires At (optional)</Label>
          <Input
            id="expiresAt"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => handleFieldChange('expiresAt', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.expiresAt ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          {errors.expiresAt && (
            <p className="text-red-400 text-sm mt-1">{errors.expiresAt}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white"
        >
          {isLoading ? 'Saving...' : notification ? 'Update Notification' : 'Create Notification'}
        </Button>
      </div>
    </form>
  );
}

const NotificationsPage = () => {
  const { data: session, update } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState<Notification | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Role checks
  const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.MANAGER;
  const isSupport = session?.user?.role === Role.SUPPORT;
  const canCreate = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canViewAll = isAdmin || isSupport;

  // Function to refresh session
  const refreshSession = async () => {
    try {
      setSessionLoading(true);
      await update();
      toast.success('Session refreshed successfully!', {
        style: { background: '#22c55e', color: 'white' },
      });
    } catch (error) {
      toast.error('Failed to refresh session', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setSessionLoading(false);
    }
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (canViewAll) {
        params.append('adminView', 'true');
      }
      
      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();
      
      if (response.ok && data.notifications) {
        setNotifications(data.notifications);
      } else {
        console.error('Failed to fetch notifications:', data.error || 'Unknown error');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [canViewAll]);

  // Filter notifications based on selected filter and search query
  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply category filter first
    switch (filterBy) {
      case 'unread':
        filtered = notifications.filter((notification) => notification.targetUsers.length > 0);
        break;
      case 'read':
        filtered = notifications.filter((notification) => notification.targetUsers.length <= 0);
        break;
      case 'subscription':
        filtered = notifications.filter((notification) => 
          notification.type === NotificationType.SUBSCRIPTION_CONFIRMED ||
          notification.type === NotificationType.SUBSCRIPTION_EXPIRED
        );
        break;
      case 'payment':
        filtered = notifications.filter((notification) => 
          notification.type === NotificationType.PAYMENT_RECEIVED ||
          notification.type === NotificationType.PAYMENT_FAILED
        );
        break;
      case 'admin':
        filtered = notifications.filter((notification) => 
          notification.type === NotificationType.ADMIN_ACTION_REQUIRED
        );
        break;
      case 'tradingview':
        filtered = notifications.filter((notification) => 
          notification.type === NotificationType.TRADINGVIEW_INVITE_SENT ||
          notification.type === NotificationType.TRADINGVIEW_INVITE_COMPLETED
        );
        break;
      case 'general':
        filtered = notifications.filter((notification) => 
          notification.type === NotificationType.GENERAL
        );
        break;
      case 'recent':
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        filtered = notifications.filter((notification) => new Date(notification.createdAt) >= oneDayAgo);
        break;
      default:
        filtered = notifications;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((notification) => 
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query) ||
        (notification.user?.email && notification.user.email.toLowerCase().includes(query)) ||
        (notification.user?.name && notification.user.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  // CRUD Operations
  const handleCreateNotification = () => {
    setEditingNotification(null);
    setIsSheetOpen(true);
  };

  const handleUpdateNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setIsSheetOpen(true);
  };

  const handleDeleteNotification = (notification: Notification) => {
    setDeleteNotification(notification);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteNotification) return;

    try {
      const response = await fetch(`/api/notifications/${deleteNotification.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Notification deleted successfully!', {
          style: { background: '#22c55e', color: 'white' },
        });
        fetchNotifications();
      } else {
        const error = await response.json();
        toast.error(error.error || error.message || 'Failed to delete notification', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error('Error deleting notification', {
        style: { background: '#ef4444', color: 'white' },
      });
    }

    setDeleteModalOpen(false);
    setDeleteNotification(null);
  };

  const handleFormSubmit = async (formData: NotificationFormData) => {
    setIsFormLoading(true);

    try {
      const isUpdate = !!editingNotification;
      const url = isUpdate ? `/api/notifications/${editingNotification.id}` : '/api/notifications';
      const method = isUpdate ? 'PATCH' : 'POST';

      // Process form data for API
      const processedData = {
        ...formData,
        targetUsers: formData.targetUsers 
          ? formData.targetUsers.split(',').map(id => id.trim()).filter(id => id.length > 0)
          : [],
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        // Remove empty strings for optional fields
        userId: formData.userId || null,
        targetId: formData.targetId || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Notification ${isUpdate ? 'updated' : 'created'} successfully!`, {
          style: { background: '#22c55e', color: 'white' },
        });
        setIsSheetOpen(false);
        setEditingNotification(null);
        fetchNotifications();
      } else {
        toast.error(result.error || result.message || `Failed to ${isUpdate ? 'update' : 'create'} notification`, {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error(`Error ${editingNotification ? 'updating' : 'creating'} notification`, {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingNotification(null);
  };

  // Calculate stats
  const stats = {
    totalNotifications: notifications.length,
    unreadNotifications: notifications.filter(n => n.targetUsers.length <= 0).length,
    adminNotifications: notifications.filter(n => n.type === NotificationType.ADMIN_ACTION_REQUIRED).length,
    recentNotifications: notifications.filter(n => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return new Date(n.createdAt) >= oneDayAgo;
    }).length,
  };

  // Define columns
  const columns: Column<Notification>[] = [
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (type: NotificationType, notification: Notification) => (
        <Badge className={getNotificationColor(type)}>
          <div className="flex items-center gap-1">
            {getNotificationIcon(type)}
            {type.replace(/_/g, ' ')}
          </div>
        </Badge>
      ),
    },
    {
      key: 'title',
      header: 'Notification',
      sortable: true,
      render: (title: string, notification: Notification) => (
        <div className="max-w-xs">
          <div className="font-medium text-white truncate">{title}</div>
          <div className="text-sm text-gray-400 truncate">{notification.message}</div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      sortable: false,
      render: (user: Notification['user'], notification: Notification) => (
        <div>
          {user ? (
            <div>
              <div className="font-medium text-white">{user.name || 'Unnamed User'}</div>
              <div className="text-sm text-gray-400">{user.email}</div>
            </div>
          ) : (
            <span className="text-gray-400">System-wide</span>
          )}
        </div>
      ),
    },
    {
      key: 'isRead',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (isRead: boolean) => (
        <Badge className={isRead ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
          {isRead ? (
            <>
              <MailOpen size={12} className="mr-1" />
              Read
            </>
          ) : (
            <>
              <Mail size={12} className="mr-1" />
              Unread
            </>
          )}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (date: string) => (
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_, notification: Notification) => (
        <ActionButtons
          row={notification}
          onUpdate={handleUpdateNotification}
          onDelete={handleDeleteNotification}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  // Don't show the page if user doesn't have permission
  if (!canViewAll) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 max-w-md w-full text-center shadow-xl">
            <Bell className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-300 mb-6">You don't have permission to view notifications.</p>
            <div className="text-sm text-gray-400 mb-6">
              Current role: {session?.user?.role || 'Unknown'}
            </div>
            <div className="space-y-3">
              <Button
                onClick={refreshSession}
                disabled={sessionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sessionLoading ? 'Refreshing...' : 'Refresh Session'}
              </Button>
              <div className="text-sm text-gray-400">
                If your role was recently updated, try refreshing your session.
              </div>
            </div>
          </div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Notification Management Stats */}
        <div className="mb-4">
          <OverviewSection
            overviewData={[
              {
                title: 'Total Notifications',
                currentValue: stats.totalNotifications,
                icon: BarChart3,
                description: 'All notifications',
                pastValue: '+1 new notification this hour',
              },
              {
                title: 'Unread Notifications',
                currentValue: stats.unreadNotifications,
                icon: Target,
                description: `${stats.totalNotifications > 0 ? ((stats.unreadNotifications / stats.totalNotifications) * 100).toFixed(1) : '0'}% unread rate`,
                pastValue: `${stats.unreadNotifications} out of ${stats.totalNotifications} notifications`,
              },
              {
                title: 'Admin Actions',
                currentValue: stats.adminNotifications,
                icon: DollarSign,
                description: 'Require attention',
                pastValue: '+5.2% this week',
              },
              {
                title: 'Recent Notifications',
                currentValue: stats.recentNotifications,
                icon: Clock,
                description: 'Last 24 hours',
                pastValue: 'Recent activity',
              },
            ]}
            className="mb-0 opacity-95"
          />
        </div>

        <div className="flex flex-col justify-end mb-12">
          {/* Main Notifications Table */}
          <div className="flex-1 min-h-0 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {/* Refresh Button */}
                <Button
                  onClick={fetchNotifications}
                  variant="outline"
                  className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                {/* Search Input */}
                <div className="w-full sm:w-64">
                  <SearchInput placeholder="Search notifications..." />
                </div>

                {/* Filter */}
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-full sm:w-40 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-xl">
                    <SelectItem value="all" className="text-white hover:bg-white/20 focus:bg-white/20">
                      All Notifications
                    </SelectItem>
                    <SelectItem value="unread" className="text-white hover:bg-white/20 focus:bg-white/20">
                      Unread
                    </SelectItem>
                    <SelectItem value="read" className="text-white hover:bg-white/20 focus:bg-white/20">
                      Read
                    </SelectItem>
                    <SelectItem value="subscription" className="text-white hover:bg-white/20 focus:bg-white/20">
                      Subscription
                    </SelectItem>
                    <SelectItem value="payment" className="text-white hover:bg-white/20 focus:bg-white/20">
                      Payment
                    </SelectItem>
                    <SelectItem value="admin" className="text-white hover:bg-white/20 focus:bg-white/20">
                      Admin Actions
                    </SelectItem>
                    <SelectItem value="tradingview" className="text-white hover:bg-white/20 focus:bg-white/20">
                      TradingView
                    </SelectItem>
                    <SelectItem value="general" className="text-white hover:bg-white/20 focus:bg-white/20">
                      General
                    </SelectItem>
                    <SelectItem value="recent" className="text-white hover:bg-white/20 focus:bg-white/20">
                      Recent (24h)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {canCreate && (
                <Button
                  onClick={handleCreateNotification}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-2 rounded-xl shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Notification
                </Button>
              )}
            </div>

            <ReusableTable
              data={filteredNotifications}
              columns={columns}
              title="Notification Management"
              icon={Bell}
              isLoading={loading}
              searchable={true}
              searchFields={['title', 'message', 'type']}
              emptyStateTitle="No notifications found"
              emptyStateDescription="No notifications found matching your criteria"
              enableRowDetails={true}
              rowDetailTitle={(notification) => `${notification.title}`}
              excludeFromDetails={['id', 'data']}
            />
          </div>
        </div>
      </div>

      {/* Notification Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full md:w-[32rem] max-w-none bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl p-6">
          <SheetHeader className="px-2 mb-6">
            <SheetTitle className="text-2xl font-bold text-white">
              {editingNotification ? 'Edit Notification' : 'Create New Notification'}
            </SheetTitle>
            <SheetDescription className="text-white/70">
              {editingNotification 
                ? 'Update the notification details below.' 
                : 'Fill in the details to create a new notification.'
              }
            </SheetDescription>
          </SheetHeader>
          <div className="px-2">
            <NotificationForm
              notification={editingNotification || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleSheetClose}
              isLoading={isFormLoading}
            />
          </div>
        </SheetContent>
      </Sheet>


      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Notification</DialogTitle>
          </DialogHeader>
          {deleteNotification && (
            <div className="space-y-4">
              <p className="text-white/70">
                Are you sure you want to delete this notification? This action cannot be undone.
              </p>
              <div className="bg-white/5 p-3 rounded">
                <div className="font-medium text-white">{deleteNotification.title}</div>
                <div className="text-sm text-gray-400">{deleteNotification.message}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Notification
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GradientBackground>
  );
};

export default NotificationsPage;
