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

// Types based on Prisma schema
interface AuditLog {
  id: string;
  admin: {
    id: string;
    name?: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'SUPPORT' | 'MANAGER';
  };
  action: string;
  targetId?: string;
  targetType?: string;
  timestamp: Date;
  details?: any;
}

interface AuditStats {
  totalAudits: number;
  auditsThisMonth: number;
  auditsThisWeek: number;
  auditsToday: number;
}

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
    <GradientBackground>
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
              <SelectTrigger className="w-full sm:w-40 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-slate-800/95 border border-white/30 rounded-xl">
                <SelectItem value="all" className="text-white hover:bg-white/20 focus:bg-white/20">
                  All Actions
                </SelectItem>
                <SelectItem value="CREATE_USER" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Create User
                </SelectItem>
                <SelectItem value="UPDATE_USER" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Update User
                </SelectItem>
                <SelectItem value="DELETE_USER" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Delete User
                </SelectItem>
                <SelectItem value="LOGIN" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Login
                </SelectItem>
                <SelectItem value="LOGOUT" className="text-white hover:bg-white/20 focus:bg-white/20">
                  Logout
                </SelectItem>
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
                  const RoleIcon = getRoleIcon(log.admin.role);
                  
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
                            <Badge className={`${getRoleColors(log.admin.role)} flex items-center gap-1`}>
                              <RoleIcon size={12} />
                              {log.admin.role}
                            </Badge>

                            {/* Admin Info */}
                            <div className="text-left">
                              <div className="font-medium text-white">
                                {log.admin.name || 'Unnamed User'}
                              </div>
                              <div className="text-sm text-white/60">
                                {log.admin.email}
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
                            {log.targetType && (
                              <div>
                                <span className="text-white/70">Target Type:</span>
                                <span className="ml-2 text-white">{log.targetType}</span>
                              </div>
                            )}
                            {log.targetId && (
                              <div>
                                <span className="text-white/70">Target ID:</span>
                                <span className="ml-2 text-white font-mono text-xs">
                                  {log.targetId}
                                </span>
                              </div>
                            )}
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
