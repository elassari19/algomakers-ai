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

// Types
interface EventUser {
  id: string;
  name: string | null;
  email: string;
}

interface Event {
  id: string;
  eventType: string;
  timestamp: string;
  metadata: any;
  user: EventUser;
}

interface EventStats {
  totalEvents: number;
  eventsThisMonth: number;
  eventsThisWeek: number;
  eventsToday: number;
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
  const baseOptions = [{ value: 'all', label: 'All Events', group: null }];
  
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
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    eventsThisMonth: 0,
    eventsThisWeek: 0,
    eventsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);
  
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Fetch events
  const fetchEvents = async (pageNum: number = 1, reset: boolean = false) => {
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
        ...(filterEventType !== 'all' && { eventType: filterEventType }),
      });

      console.log('Fetching events with params:', Object.fromEntries(params.entries()));
      
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      console.log('API Response:', data);

      if (response.ok) {
        if (reset || pageNum === 1) {
          setEvents(data.events);
        } else {
          setEvents(prev => [...prev, ...data.events]);
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

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/events/stats');
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching event stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchEvents(1, true);
    
    // Debug: Check what event types exist in the database
    fetch('/api/events/types')
      .then(res => res.json())
      .then(data => {
        console.log('Existing event types in database:', data);
        if (data.success && data.uniqueEventTypes) {
          setAvailableEventTypes(data.uniqueEventTypes);
        }
      })
      .catch(err => console.error('Error fetching event types:', err));
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchEvents(1, true);
  }, [searchQuery, filterEventType]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(page + 1);
    }
  };

  const handleRefresh = () => {
    fetchEvents(1, true);
    fetchStats();
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
      currentValue: stats.totalEvents,
      icon: FileText,
      description: 'All your activity',
      pastValue: 'Account lifetime',
      color: 'text-blue-300',
      bgColor: 'bg-blue-400/20',
    },
    {
      title: 'This Month',
      currentValue: stats.eventsThisMonth,
      icon: Calendar,
      description: 'Monthly activity',
      pastValue: 'Current month',
      color: 'text-green-300',
      bgColor: 'bg-green-400/20',
    },
    {
      title: 'This Week',
      currentValue: stats.eventsThisWeek,
      icon: Activity,
      description: 'Weekly activity',
      pastValue: 'Last 7 days',
      color: 'text-purple-300',
      bgColor: 'bg-purple-400/20',
    },
    {
      title: 'Today',
      currentValue: stats.eventsToday,
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
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <SearchInput placeholder="Search by event type or description..." />
            </div>

            {/* Event Type Filter */}
            <Select value={filterEventType} onValueChange={setFilterEventType}>
              <SelectTrigger className="w-full sm:w-48 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-slate-800/95 border border-white/30 rounded-xl max-h-80 overflow-y-auto">
                {getEventTypeOptions(availableEventTypes).map((option) => (
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
              {events.length} results
            </div>
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
                  const EventIcon = getEventIcon(event.eventType);
                  
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
                            <Badge className={`${getEventTypeColors(event.eventType)} flex items-center gap-1`}>
                              <EventIcon size={12} />
                              {formatEventType(event.eventType)}
                            </Badge>

                            {/* Event Description */}
                            <div className="text-left">
                              <div className="font-medium text-white">
                                {event.metadata?.description || formatEventType(event.eventType)}
                              </div>
                              <div className="text-sm text-white/60">
                                {event.metadata?.details || 'User activity event'}
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
                                {formatEventType(event.eventType)}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/70">Timestamp:</span>
                              <span className="ml-2 text-white">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {event.metadata?.ip && (
                              <div>
                                <span className="text-white/70">IP Address:</span>
                                <span className="ml-2 text-white font-mono text-xs">
                                  {event.metadata.ip}
                                </span>
                              </div>
                            )}
                            {event.metadata?.userAgent && (
                              <div>
                                <span className="text-white/70">Browser:</span>
                                <span className="ml-2 text-white text-xs">
                                  {event.metadata.userAgent.split(' ')[0]}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Additional Metadata */}
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div>
                              <span className="text-white/70 text-sm">Additional Details:</span>
                              <div className="mt-2 bg-black/20 p-3 rounded-lg border border-white/10">
                                <pre className="text-white/80 text-xs whitespace-pre-wrap font-mono">
                                  {JSON.stringify(event.metadata, null, 2)}
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
