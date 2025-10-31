'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OverviewSection, type OverviewDataItem } from '@/components/dashboard/DashboardStats';
import { SearchInput } from '@/components/SearchInput';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FileText,
  Calendar,
  Activity,
  Clock,
  RefreshCw,
  Filter,
  ChevronDown,
  User,
  CreditCard,
  ShoppingCart,
  Bell,
  LogIn,
  LogOut,
  Settings,
  Star,
  Zap,
  TrendingUp,
  Eye,
  UserCheck,
} from 'lucide-react';
import { AuditAction } from '@/lib/audit';
import { ReusableSelect } from '@/components/ui/reusable-select';

// Types based on AuditLog
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
  timestamp: string;
}

interface AuditStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
}

// Helper function to format enum values for display
const formatEventType = (eventType: string) => {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to get event group
const getEventGroup = (eventType: string): string => {
  const eventLower = eventType.toLowerCase();
  
  if (eventLower.includes('account') || eventLower.includes('profile') || 
      eventLower.includes('email') || eventLower.includes('password')) {
    return 'Account';
  }
  if (eventLower.includes('login') || eventLower.includes('logout') || 
      eventLower.includes('session') || eventLower.includes('failed_login')) {
    return 'Authentication';
  }
  if (eventLower.includes('subscription')) {
    return 'Subscriptions';
  }
  if (eventLower.includes('payment') || eventLower.includes('invoice')) {
    return 'Payments';
  }
  if (eventLower.includes('tradingview')) {
    return 'TradingView';
  }
  if (eventLower.includes('notification')) {
    return 'Notifications';
  }
  if (eventLower.includes('system') || eventLower.includes('feature') || 
      eventLower.includes('backup') || eventLower.includes('restore') || 
      eventLower.includes('config') || eventLower.includes('maintenance')) {
    return 'System';
  }
  if (eventLower.includes('data') || eventLower.includes('export') || eventLower.includes('import')) {
    return 'Data Management';
  }
  if (eventLower.includes('role') || eventLower.includes('permission')) {
    return 'Security';
  }
  if (eventLower.includes('user') || eventLower.includes('create') || 
      eventLower.includes('update') || eventLower.includes('delete')) {
    return 'User Management';
  }
  if (eventLower.includes('pair')) {
    return 'Trading Pairs';
  }
  
  return 'Other';
};

// Generate event type options dynamically
const getEventTypeOptions = (availableTypes: string[]) => {
  const baseOptions = [{ value: 'all', label: 'All Events'}];
  
  // If we have available types from database, use those
  if (availableTypes.length > 0) {
    return [
      ...baseOptions,
      ...availableTypes.map(eventType => ({
        value: eventType,
        label: formatEventType(eventType),
        group: getEventGroup(eventType),
      })),
    ];
  }
  
  // Fallback to AuditAction enum
  return [
    ...baseOptions,
    ...Object.values(AuditAction).map(action => ({
      value: action,
      label: formatEventType(action),
      group: getEventGroup(action),
    })),
  ];
};

const EventsPage = () => {
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);

  const searchParams = useSearchParams();

  // Fetch audit logs (USER role only)
  const fetchEvents = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/audit-logs?role=USER&${searchParams.toString()}`);
      const data = await response.json();

      if (response.ok) {
        if (reset || pageNum === 1) {
          setEvents(data.auditLogs || data.events || []);
          setAvailableEventTypes(data.availableEventTypes || []);
          setStats(data.state)
        } else {
          setEvents(prev => [...prev, ...(data.auditLogs || data.events || [])]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      } else {
        toast.error('Failed to fetch events', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error loading events', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, true);
  }, [searchParams]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(page + 1);
    }
  };

  const handleRefresh = () => {
    fetchEvents(1, true);
  };

  // Get event icon
  const getEventIcon = (eventType: string) => {
    const eventLower = eventType.toLowerCase();
    
    // Account events
    if (eventLower.includes('account') || eventLower.includes('profile')) return User;
    if (eventLower.includes('email') || eventLower.includes('verified')) return UserCheck;
    if (eventLower.includes('password')) return Settings;
    
    // Auth events
    if (eventLower.includes('login')) return LogIn;
    if (eventLower.includes('logout') || eventLower.includes('session')) return LogOut;
    
    // Subscription events
    if (eventLower.includes('subscription')) return Star;
    if (eventLower.includes('renewed') || eventLower.includes('activated')) return Zap;
    
    // Payment events
    if (eventLower.includes('payment')) return CreditCard;
    if (eventLower.includes('invoice')) return FileText;
    
    // TradingView events
    if (eventLower.includes('tradingview')) return TrendingUp;
    
    // Notification events
    if (eventLower.includes('notification')) return Bell;
    
    // System events
    if (eventLower.includes('feature') || eventLower.includes('accessed')) return Eye;
    if (eventLower.includes('system')) return Settings;
    
    return Activity;
  };

  // Get event type colors
  const getEventTypeColors = (eventType: string) => {
    const eventLower = eventType.toLowerCase();
    
    if (eventLower.includes('payment') || eventLower.includes('invoice')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (eventLower.includes('subscription')) {
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
    if (eventLower.includes('login') || eventLower.includes('auth')) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
    if (eventLower.includes('tradingview')) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
    if (eventLower.includes('notification')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    if (eventLower.includes('expired') || eventLower.includes('failed') || eventLower.includes('cancelled')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // Overview data for stats
  const overviewData: OverviewDataItem[] = [
    {
      title: 'Total Events',
      currentValue: stats.total,
      icon: FileText,
      description: 'All your activity',
      pastValue: 'Account lifetime',
      color: 'text-blue-300',
      bgColor: 'bg-blue-400/20',
    },
    {
      title: 'This Month',
      currentValue: stats.thisMonth,
      icon: Calendar,
      description: 'Monthly activity',
      pastValue: 'Current month',
      color: 'text-green-300',
      bgColor: 'bg-green-400/20',
    },
    {
      title: 'This Week',
      currentValue: stats.thisWeek,
      icon: Activity,
      description: 'Weekly activity',
      pastValue: 'Last 7 days',
      color: 'text-purple-300',
      bgColor: 'bg-purple-400/20',
    },
    {
      title: 'Today',
      currentValue: stats.today,
      icon: Clock,
      description: 'Today\'s activity',
      pastValue: 'Current day',
      color: 'text-orange-300',
      bgColor: 'bg-orange-400/20',
    },
  ];

  return (
    <GradientBackground className='pb-16'>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Event Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              My Activity
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
              <span className="text-sm font-medium">{events?.length} Results</span>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <SearchInput placeholder="Search by event type or description..." />
            </div>

            {/* Event Type Filter */}
            <ReusableSelect
              type='action'
              options={getEventTypeOptions(availableEventTypes)}
            />

            {/* Filter by response status */}
            <ReusableSelect
              type='responseStatus'
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Success', value: 'success' },
                { label: 'Failed', value: 'failed' },
              ]}
            />

            {/* Period Filter */}
            <ReusableSelect
              type='period'
              options={[
                { label: 'All Periods', value: 'all' },
                { label: 'Last 1 Day', value: '1d' },
                { label: 'Last 3 Days', value: '3d' },
                { label: 'Last 7 Days', value: '7d' },
                { label: 'Last 30 Days', value: '30d' },
                { label: 'Last 90 Days', value: '90d' },
                { label: 'Last 6 Months', value: '6m' },
                { label: 'Last 1 Year', value: '1y' },
              ]}
            />
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
              <span className="ml-3 text-white/80">Loading your activity...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/80 mb-2">No activity found</h3>
              <p className="text-white/60">No events match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Accordion type="single" collapsible className="space-y-2">
                {events.map((event) => {
                  const EventIcon = getEventIcon(event.action);
                  // Prefer details/metadata for description, fallback to action/eventType
                  const description = event.details?.description || event.details?.message || event.details?.info || event.action;
                  const detailsText = event.details?.details || event.details?.info || 'User activity event';
                  return (
                    <AccordionItem
                      key={event.id}
                      value={event.id}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors [&[data-state=open]>div]:bg-white/10">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            {/* Event Type Badge */}
                            <Badge className={`${getEventTypeColors(event.action)} flex items-center gap-1`}>
                              <EventIcon size={12} />
                              {formatEventType(event.action)}
                            </Badge>

                            {/* Event Description */}
                            <div className="text-left">
                              <div className="font-medium text-white">
                                {description}
                              </div>
                              <div className="text-sm text-white/60">
                                {detailsText}
                              </div>
                            </div>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Calendar size={14} />
                            {new Date(event.timestamp).toLocaleDateString('en-US', {
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
                          {/* Event Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-white/70">Event Type:</span>
                              <span className="ml-2 text-white font-medium">
                                {formatEventType(event.action)}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/70">Timestamp:</span>
                              <span className="ml-2 text-white">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {/* Actor ID removed */}
                            {event.actorRole && (
                              <div>
                                <span className="text-white/70">Actor Role:</span>
                                <span className="ml-2 text-white">{event.actorRole}</span>
                              </div>
                            )}
                            {event.user && (
                              <div>
                                <span className="text-white/70">User:</span>
                                <span className="ml-2 text-white">{event.user.name || event.user.email}</span>
                              </div>
                            )}
                            {/* Target ID removed */}
                            {event.targetType && (
                              <div>
                                <span className="text-white/70">Target Type:</span>
                                <span className="ml-2 text-white">{event.targetType}</span>
                              </div>
                            )}
                            {event.responseStatus && (
                              <div>
                                <span className="text-white/70">Response Status:</span>
                                <span className="ml-2 text-white">{event.responseStatus}</span>
                              </div>
                            )}
                            {event.details?.ip && (
                              <div>
                                <span className="text-white/70">IP Address:</span>
                                <span className="ml-2 text-white font-mono text-xs">{event.details.ip}</span>
                              </div>
                            )}
                            {event.details?.userAgent && (
                              <div>
                                <span className="text-white/70">Browser:</span>
                                <span className="ml-2 text-white text-xs">{event.details.userAgent.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>

                          {/* Additional Metadata */}
                          {event.details && Object.keys(event.details).length > 0 && (
                            <div>
                              <span className="text-white/70 text-sm">Additional Details:</span>
                              <div className="mt-2 bg-black/20 p-3 rounded-lg border border-white/10">
                                <pre className="text-white/80 text-xs whitespace-pre-wrap font-mono">
                                  {JSON.stringify(event.details, null, 2)}
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

export default EventsPage;
