'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection, OverviewDataItem } from '@/components/dashboard/DashboardStats';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/SearchInput';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Activity,
  Calendar,
  Clock,
  User,
  Settings,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  FileText,
  Crown,
  Users,
  Filter,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { AuditAction } from '@/lib/audit';

// Types based on Prisma schema
interface AuditLog {
  id: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'SUPPORT' | 'MANAGER';
  };
  actorId?: string;
  actorRole?: 'USER' | 'ADMIN' | 'SUPPORT' | 'MANAGER';
  action: string;
  targetId?: string;
  targetType?: string;
  responseStatus?: string;
  details?: any;
  timestamp: Date;
}

interface AuditStats {
  totalAudits: number;
  auditsThisMonth: number;
  auditsThisWeek: number;
  auditsToday: number;
}

// Action filter options derived from AuditAction enum (fully aligned)
const actionOptions = [
  { value: 'all', label: 'All Actions', group: null },
  // Affiliate management
  { value: AuditAction.CREATE_AFFILIATE, label: 'Create Affiliate', group: 'Affiliate Management' },
  { value: AuditAction.UPDATE_AFFILIATE, label: 'Update Affiliate', group: 'Affiliate Management' },
  { value: AuditAction.DELETE_AFFILIATE, label: 'Delete Affiliate', group: 'Affiliate Management' },
  { value: AuditAction.GET_AFFILIATE, label: 'Get Affiliate', group: 'Affiliate Management' },
  { value: AuditAction.APPROVE_AFFILIATE, label: 'Approve Affiliate', group: 'Affiliate Management' },
  { value: AuditAction.REJECT_AFFILIATE, label: 'Reject Affiliate', group: 'Affiliate Management' },
  // Backtest management
  { value: AuditAction.CREATE_BACKTEST, label: 'Create Backtest', group: 'Backtest Management' },
  { value: AuditAction.UPDATE_BACKTEST, label: 'Update Backtest', group: 'Backtest Management' },
  { value: AuditAction.DELETE_BACKTEST, label: 'Delete Backtest', group: 'Backtest Management' },
  { value: AuditAction.GET_BACKTEST, label: 'Get Backtest', group: 'Backtest Management' },
  // Payouts
  { value: AuditAction.INITIATE_PAYOUT, label: 'Initiate Payout', group: 'Payouts' },
  { value: AuditAction.COMPLETE_PAYOUT, label: 'Complete Payout', group: 'Payouts' },
  { value: AuditAction.CREATE_PAYOUT, label: 'Create Payout', group: 'Payouts' },
  { value: AuditAction.UPDATE_PAYOUT, label: 'Update Payout', group: 'Payouts' },
  { value: AuditAction.FAIL_PAYOUT, label: 'Fail Payout', group: 'Payouts' },
  // User management
  { value: AuditAction.CREATE_USER, label: 'Create User', group: 'User Management' },
  { value: AuditAction.UPDATE_USER, label: 'Update User', group: 'User Management' },
  { value: AuditAction.DELETE_USER, label: 'Delete User', group: 'User Management' },
  { value: AuditAction.GET_USER, label: 'Get User', group: 'User Management' },
  { value: AuditAction.ACCOUNT_CREATED, label: 'Account Created', group: 'User Management' },
  { value: AuditAction.ACCOUNT_NOT_FOUND, label: 'Account Not Found', group: 'User Management' },
  { value: AuditAction.PROFILE_UPDATED, label: 'Profile Updated', group: 'User Management' },
  { value: AuditAction.PASSWORD_CHANGED, label: 'Password Changed', group: 'User Management' },
  { value: AuditAction.EMAIL_VERIFIED, label: 'Email Verified', group: 'User Management' },
  // Authentication
  { value: AuditAction.LOGIN, label: 'Login', group: 'Authentication' },
  { value: AuditAction.LOGOUT, label: 'Logout', group: 'Authentication' },
  { value: AuditAction.FAILED_LOGIN, label: 'Failed Login', group: 'Authentication' },
  { value: AuditAction.PASSWORD_RESET, label: 'Password Reset', group: 'Authentication' },
  { value: AuditAction.SESSION_EXPIRED, label: 'Session Expired', group: 'Authentication' },
  // Pair management
  { value: AuditAction.CREATE_PAIR, label: 'Create Pair', group: 'Pair Management' },
  { value: AuditAction.UPDATE_PAIR, label: 'Update Pair', group: 'Pair Management' },
  { value: AuditAction.DELETE_PAIR, label: 'Delete Pair', group: 'Pair Management' },
  { value: AuditAction.GET_PAIR, label: 'Get Pair', group: 'Pair Management' },
  // Subscription management
  { value: AuditAction.CREATE_SUBSCRIPTION, label: 'Create Subscription', group: 'Subscription Management' },
  { value: AuditAction.UPDATE_SUBSCRIPTION, label: 'Update Subscription', group: 'Subscription Management' },
  { value: AuditAction.CANCEL_SUBSCRIPTION, label: 'Cancel Subscription', group: 'Subscription Management' },
  { value: AuditAction.DELETE_SUBSCRIPTION, label: 'Delete Subscription', group: 'Subscription Management' },
  { value: AuditAction.RENEW_SUBSCRIPTION, label: 'Renew Subscription', group: 'Subscription Management' },
  { value: AuditAction.PAUSE_SUBSCRIPTION, label: 'Pause Subscription', group: 'Subscription Management' },
  { value: AuditAction.RESUME_SUBSCRIPTION, label: 'Resume Subscription', group: 'Subscription Management' },
  { value: AuditAction.GET_SUBSCRIPTION, label: 'Get Subscription', group: 'Subscription Management' },
  // Payment management
  { value: AuditAction.CREATE_PAYMENT, label: 'Create Payment', group: 'Payment Management' },
  { value: AuditAction.UPDATE_PAYMENT, label: 'Update Payment', group: 'Payment Management' },
  { value: AuditAction.DELETE_PAYMENT, label: 'Delete Payment', group: 'Payment Management' },
  { value: AuditAction.GET_PAYMENT, label: 'Get Payment', group: 'Payment Management' },
  // TradingView integration
  { value: AuditAction.TRADINGVIEW_INVITED, label: 'TradingView Invited', group: 'TradingView' },
  { value: AuditAction.TRADINGVIEW_JOINED, label: 'TradingView Joined', group: 'TradingView' },
  { value: AuditAction.TRADINGVIEW_USERNAME_VERIFIED, label: 'TradingView Username Verified', group: 'TradingView' },
  // Notifications
  { value: AuditAction.CREATE_NOTIFICATION, label: 'Create Notification', group: 'Notifications' },
  { value: AuditAction.UPDATE_NOTIFICATION, label: 'Update Notification', group: 'Notifications' },
  { value: AuditAction.DELETE_NOTIFICATION, label: 'Delete Notification', group: 'Notifications' },
  { value: AuditAction.GET_NOTIFICATION, label: 'Get Notification', group: 'Notifications' },
  { value: AuditAction.NOTIFICATION_RECEIVED, label: 'Notification Received', group: 'Notifications' },
  { value: AuditAction.NOTIFICATION_READ, label: 'Notification Read', group: 'Notifications' },
  // Email
  { value: AuditAction.SEND_EMAIL, label: 'Send Email', group: 'Email' },
  { value: AuditAction.EMAIL_BOUNCED, label: 'Email Bounced', group: 'Email' },
  { value: AuditAction.EMAIL_COMPLAINT, label: 'Email Complaint', group: 'Email' },
  // System administration
  { value: AuditAction.SYSTEM_BACKUP, label: 'System Backup', group: 'System Administration' },
  { value: AuditAction.SYSTEM_RESTORE, label: 'System Restore', group: 'System Administration' },
  { value: AuditAction.CONFIG_UPDATE, label: 'Config Update', group: 'System Administration' },
  { value: AuditAction.SYSTEM_MAINTENANCE, label: 'System Maintenance', group: 'System Administration' },
  { value: AuditAction.FEATURE_ACCESSED, label: 'Feature Accessed', group: 'System Administration' },
  // Data management
  { value: AuditAction.DATA_EXPORT, label: 'Data Export', group: 'Data Management' },
  { value: AuditAction.DATA_IMPORT, label: 'Data Import', group: 'Data Management' },
  // Security
  { value: AuditAction.ROLE_CHANGE, label: 'Role Change', group: 'Security' },
  { value: AuditAction.PERMISSION_CHANGE, label: 'Permission Change', group: 'Security' },
  // Internal
  { value: AuditAction.INTERNAL_ERROR, label: 'Internal Error', group: 'Internal' },
];

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalAudits: 0,
    auditsThisMonth: 0,
    auditsThisWeek: 0,
    auditsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Fetch audit logs
  const fetchAuditLogs = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterAction !== 'all' && { action: filterAction }),
        role: 'NOTUSER',
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        if (reset || pageNum === 1) {
          setAuditLogs(data.auditLogs);
        } else {
          setAuditLogs(prev => [...prev, ...data.auditLogs]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      } else {
        toast.error('Failed to fetch audit logs', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Error loading audit logs', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-logs/stats');
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAuditLogs(1, true);
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchAuditLogs(1, true);
  }, [searchQuery, filterRole, filterAction]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchAuditLogs(page + 1);
    }
  };

  const handleRefresh = () => {
    fetchAuditLogs(1, true);
    fetchStats();
  };

  // Format action for display
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) return UserPlus;
    if (actionLower.includes('update') || actionLower.includes('edit')) return Pencil;
    if (actionLower.includes('delete') || actionLower.includes('remove')) return Trash2;
    if (actionLower.includes('view') || actionLower.includes('read')) return Eye;
    if (actionLower.includes('login') || actionLower.includes('auth')) return Shield;
    return Activity;
  };

  // Get role colors
  const getRoleColors = (role: string) => {
    const colors = {
      ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
      MANAGER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SUPPORT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      USER: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[role as keyof typeof colors] || colors.USER;
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    const icons = {
      ADMIN: Crown,
      MANAGER: Settings,
      SUPPORT: Users,
      USER: User,
    };
    return icons[role as keyof typeof icons] || User;
  };

  // Overview data for stats
  const overviewData: OverviewDataItem[] = [
    {
      title: 'Total Audits',
      currentValue: stats.totalAudits,
      icon: FileText,
      description: 'All audit records',
      pastValue: 'System-wide tracking',
      color: 'text-blue-300',
      bgColor: 'bg-blue-400/20',
    },
    {
      title: 'This Month',
      currentValue: stats.auditsThisMonth,
      icon: Calendar,
      description: 'Monthly activity',
      pastValue: 'Current month stats',
      color: 'text-green-300',
      bgColor: 'bg-green-400/20',
    },
    {
      title: 'This Week',
      currentValue: stats.auditsThisWeek,
      icon: Activity,
      description: 'Weekly tracking',
      pastValue: 'Last 7 days',
      color: 'text-purple-300',
      bgColor: 'bg-purple-400/20',
    },
    {
      title: 'Today',
      currentValue: stats.auditsToday,
      icon: Clock,
      description: 'Daily activity',
      pastValue: 'Current day',
      color: 'text-orange-300',
      bgColor: 'bg-orange-400/20',
    },
  ];

  return (
    <GradientBackground className='pb-16'>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Audit Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Audit Logs
            </h1>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <OverviewSection overviewData={overviewData} />
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-white/80">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <SearchInput placeholder="Search by action, admin name..." />
            </div>

            {/* Role Filter */}
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-40 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-slate-800/95 border border-white/30 rounded-xl">
                <SelectItem value="all" className="text-white hover:bg-white/20 focus:bg-white/20">
                  All Roles
                </SelectItem>
                <SelectItem value="ADMIN" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Admin
                </SelectItem>
                <SelectItem value="MANAGER" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Manager
                </SelectItem>
                <SelectItem value="SUPPORT" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Support
                </SelectItem>
                <SelectItem value="USER" className="text-white hover:bg-white/20 focus:bg-white/20">
                  User
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Action Filter */}
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full sm:w-48 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-slate-800/95 border border-white/30 rounded-xl max-h-80 overflow-y-auto">
                {actionOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value} 
                    className="text-white hover:bg-white/20 focus:bg-white/20"
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.group && (
                        <span className="text-xs text-white/50">{option.group}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-white/60">
              {auditLogs.length} results
            </div>
          </div>
        </div>

        {/* Audit Logs List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
              <span className="ml-3 text-white/80">Loading audit logs...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/80 mb-2">No audit logs found</h3>
              <p className="text-white/60">No audit logs match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Accordion type="single" collapsible className="space-y-2">
                {auditLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  const RoleIcon = getRoleIcon(log.user?.role || 'USER');
                  
                  return (
                    <AccordionItem
                      key={log.id}
                      value={log.id}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors [&[data-state=open]>div]:bg-white/10">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            {/* Role Badge */}
                            <Badge className={`${getRoleColors(log.user?.role || 'USER')} flex items-center gap-1`}>
                              <RoleIcon size={12} />
                              {log.user?.role || 'USER'}
                            </Badge>

                            {/* User Info */}
                            <div className="text-left">
                              <div className="font-medium text-white">
                                {log.user?.name || 'Unnamed User'}
                              </div>
                              <div className="text-sm text-white/60">
                                {log.user?.email || ''}
                              </div>
                            </div>

                            {/* Action */}
                            <div className="flex items-center gap-2 text-white/80">
                              <ActionIcon size={16} />
                              <span className="font-medium">{formatAction(log.action)}</span>
                            </div>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Calendar size={14} />
                            {new Date(log.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-4 pt-2">
                          {/* Action Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-white/70">Action:</span>
                              <span className="ml-2 text-white font-medium">
                                {formatAction(log.action)}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/70">Timestamp:</span>
                              <span className="ml-2 text-white">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {/* Actor ID removed */}
                            {log.actorRole && (
                              <div>
                                <span className="text-white/70">Actor Role:</span>
                                <span className="ml-2 text-white">{log.actorRole}</span>
                              </div>
                            )}
                            {log.responseStatus && (
                              <div>
                                <span className="text-white/70">Response Status:</span>
                                <span className="ml-2 text-white">{log.responseStatus}</span>
                              </div>
                            )}
                            {log.targetType && (
                              <div>
                                <span className="text-white/70">Target Type:</span>
                                <span className="ml-2 text-white">{log.targetType}</span>
                              </div>
                            )}
                            {/* Target ID removed */}
                          </div>

                          {/* Details */}
                          {log.details && (
                            <div>
                              <span className="text-white/70 text-sm">Details:</span>
                              <div className="mt-2 bg-black/20 p-3 rounded-lg border border-white/10">
                                <pre className="text-white/80 text-xs whitespace-pre-wrap font-mono">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Load More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </GradientBackground>
  );
};

export default AuditLogsPage;
