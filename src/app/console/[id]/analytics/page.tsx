'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GradientBackground } from '@/components/ui/gradient-background';
import { OverviewSection, OverviewDataItem } from '@/components/dashboard/DashboardStats';
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Target,
  Clock,
  Shield,
  CreditCard,
  UserCheck,
  RefreshCw,
  Download,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Analytics data interfaces
interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
  previousYear?: number;
}

interface EventData {
  date: string;
  userActions: number;
  adminActions: number;
  systemEvents: number;
  errors: number;
}

interface SubscriptionProgress {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface UserActivity {
  hour: string;
  activeUsers: number;
  newSignups: number;
  logins: number;
}

interface PaymentMethod {
  method: string;
  value: number;
  percentage: number;
  color: string;
}

// Mock data for analytics
const mockRevenueData: RevenueData[] = [
  { month: 'Jan', revenue: 12400, subscriptions: 45, previousYear: 10200 },
  { month: 'Feb', revenue: 15600, subscriptions: 52, previousYear: 12100 },
  { month: 'Mar', revenue: 18900, subscriptions: 67, previousYear: 14500 },
  { month: 'Apr', revenue: 22300, subscriptions: 78, previousYear: 17800 },
  { month: 'May', revenue: 25800, subscriptions: 89, previousYear: 19200 },
  { month: 'Jun', revenue: 31200, subscriptions: 104, previousYear: 23400 },
  { month: 'Jul', revenue: 28600, subscriptions: 95, previousYear: 21800 },
  { month: 'Aug', revenue: 34500, subscriptions: 112, previousYear: 26700 },
  { month: 'Sep', revenue: 39800, subscriptions: 128, previousYear: 31200 },
  { month: 'Oct', revenue: 42100, subscriptions: 135, previousYear: 33500 },
];

const mockEventData: EventData[] = [
  { date: '2024-10-01', userActions: 1250, adminActions: 45, systemEvents: 23, errors: 8 },
  { date: '2024-10-02', userActions: 1420, adminActions: 52, systemEvents: 31, errors: 12 },
  { date: '2024-10-03', userActions: 1180, adminActions: 38, systemEvents: 19, errors: 5 },
  { date: '2024-10-04', userActions: 1680, adminActions: 67, systemEvents: 42, errors: 15 },
  { date: '2024-10-05', userActions: 1520, adminActions: 59, systemEvents: 28, errors: 9 },
  { date: '2024-10-06', userActions: 1750, adminActions: 71, systemEvents: 35, errors: 18 },
];

const mockSubscriptionProgress: SubscriptionProgress[] = [
  { status: 'Active', count: 342, percentage: 68.4, color: '#10b981' },
  { status: 'Trial', count: 89, percentage: 17.8, color: '#f59e0b' },
  { status: 'Expired', count: 45, percentage: 9.0, color: '#ef4444' },
  { status: 'Cancelled', count: 24, percentage: 4.8, color: '#6b7280' },
];

const mockUserActivity: UserActivity[] = [
  { hour: '00:00', activeUsers: 45, newSignups: 2, logins: 12 },
  { hour: '02:00', activeUsers: 32, newSignups: 1, logins: 8 },
  { hour: '04:00', activeUsers: 28, newSignups: 0, logins: 5 },
  { hour: '06:00', activeUsers: 56, newSignups: 3, logins: 18 },
  { hour: '08:00', activeUsers: 124, newSignups: 8, logins: 45 },
  { hour: '10:00', activeUsers: 189, newSignups: 12, logins: 67 },
  { hour: '12:00', activeUsers: 234, newSignups: 15, logins: 89 },
  { hour: '14:00', activeUsers: 278, newSignups: 18, logins: 102 },
  { hour: '16:00', activeUsers: 312, newSignups: 22, logins: 134 },
  { hour: '18:00', activeUsers: 289, newSignups: 19, logins: 98 },
  { hour: '20:00', activeUsers: 198, newSignups: 14, logins: 76 },
  { hour: '22:00', activeUsers: 123, newSignups: 7, logins: 43 },
];

const mockPaymentMethods: PaymentMethod[] = [
  { method: 'USDT (ERC-20)', value: 245600, percentage: 62.5, color: '#8b5cf6' },
  { method: 'USDT (BEP-20)', value: 98400, percentage: 25.0, color: '#06b6d4' },
  { method: 'Bitcoin', value: 37200, percentage: 9.5, color: '#f59e0b' },
  { method: 'Other', value: 11800, percentage: 3.0, color: '#6b7280' },
];

const mockAuditData = [
  { action: 'LOGIN', count: 1250, percentage: 45.2, color: '#10b981' },
  { action: 'PAYMENT', count: 342, percentage: 12.4, color: '#8b5cf6' },
  { action: 'SUBSCRIPTION', count: 189, percentage: 6.8, color: '#06b6d4' },
  { action: 'USER_UPDATE', count: 156, percentage: 5.6, color: '#f59e0b' },
  { action: 'SYSTEM', count: 823, percentage: 29.7, color: '#ef4444' },
  { action: 'ERROR', count: 12, percentage: 0.4, color: '#6b7280' },
];

// Custom tooltip components
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.dataKey}: {typeof entry.value === 'number' && entry.dataKey.includes('revenue') 
              ? formatCurrency(entry.value) 
              : entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  // Calculate key metrics
  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSubscriptions = mockRevenueData.reduce((sum, item) => sum + item.subscriptions, 0);
  const totalEvents = mockEventData.reduce((sum, item) => sum + item.userActions + item.adminActions + item.systemEvents, 0);
  const totalErrors = mockEventData.reduce((sum, item) => sum + item.errors, 0);
  const activeSubscriptions = mockSubscriptionProgress.find(s => s.status === 'Active')?.count || 0;
  const averageActivity = Math.round(mockUserActivity.reduce((sum, item) => sum + item.activeUsers, 0) / mockUserActivity.length);

  const overviewData: OverviewDataItem[] = [
    {
      title: 'Total Revenue',
      currentValue: formatCurrency(totalRevenue),
      icon: DollarSign,
      description: 'YTD Revenue',
      pastValue: '+12.5% from last year',
    },
    {
      title: 'Active Subscriptions',
      currentValue: activeSubscriptions,
      icon: Users,
      description: `${mockSubscriptionProgress.find(s => s.status === 'Active')?.percentage}% of total`,
      pastValue: '+8.2% this month',
    },
    {
      title: 'Total Events',
      currentValue: totalEvents.toLocaleString(),
      icon: Activity,
      description: 'Last 7 days',
      pastValue: `${totalErrors} errors logged`,
    },
    {
      title: 'Avg. Daily Users',
      currentValue: averageActivity,
      icon: UserCheck,
      description: 'Peak: 312 users',
      pastValue: '+15.3% vs last week',
    },
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <GradientBackground>
      <div className="min-h-screen p-4 md:p-6 md:pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-white/70 mt-1">Monitor your platform's performance and user behavior</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="mb-8">
          <OverviewSection overviewData={overviewData} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trends */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="mr-2" size={20} />
                Revenue & Subscription Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockRevenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="subscriptionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="month" stroke="#ffffff70" />
                  <YAxis yAxisId="revenue" orientation="left" stroke="#ffffff70" />
                  <YAxis yAxisId="subscriptions" orientation="right" stroke="#ffffff70" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    fill="url(#revenueGradient)"
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="subscriptions"
                    type="monotone"
                    dataKey="subscriptions"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                    name="Subscriptions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Activity Heatmap */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="mr-2" size={20} />
                Daily User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockUserActivity}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="hour" stroke="#ffffff70" />
                  <YAxis stroke="#ffffff70" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#10b981"
                    fill="url(#activityGradient)"
                    name="Active Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="newSignups"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                    name="New Signups"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="mr-2" size={20} />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {mockSubscriptionProgress.map((item) => (
                  <div key={item.status} className="text-center">
                    <div className="text-2xl font-bold text-white">{item.count}</div>
                    <div className="text-sm text-white/70">{item.status}</div>
                    <div className="text-xs" style={{ color: item.color }}>
                      {item.percentage}%
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={mockSubscriptionProgress as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {mockSubscriptionProgress.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Event Analytics and Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Events & Audit Logs */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="mr-2" size={20} />
                Events & Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockEventData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff70" />
                  <YAxis stroke="#ffffff70" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="userActions" stackId="a" fill="#10b981" name="User Actions" />
                  <Bar dataKey="adminActions" stackId="a" fill="#8b5cf6" name="Admin Actions" />
                  <Bar dataKey="systemEvents" stackId="a" fill="#06b6d4" name="System Events" />
                  <Bar dataKey="errors" stackId="a" fill="#ef4444" name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="mr-2" size={20} />
                Payment Methods Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {mockPaymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: method.color }}
                      />
                      <span className="text-white/90">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {formatCurrency(method.value)}
                      </div>
                      <div className="text-white/60 text-sm">
                        {method.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={mockPaymentMethods as any[]}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mockPaymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Audit Actions Breakdown */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="mr-2" size={20} />
              Audit Actions Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {mockAuditData.map((action) => (
                <div key={action.action} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/90 font-medium">{action.action}</span>
                    <Badge
                      className="border-0"
                      style={{ backgroundColor: `${action.color}20`, color: action.color }}
                    >
                      {action.percentage}%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {action.count.toLocaleString()}
                  </div>
                  <div
                    className="w-full bg-white/10 rounded-full h-2"
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${action.percentage}%`,
                        backgroundColor: action.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockAuditData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis type="number" stroke="#ffffff70" />
                <YAxis dataKey="action" type="category" stroke="#ffffff70" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </GradientBackground>
  );
};

export default AnalyticsPage;