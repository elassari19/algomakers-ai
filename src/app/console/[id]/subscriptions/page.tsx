'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { SortFilterBar } from '@/components/subscription/SortFilterBar';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import Link from 'next/link';
import { 
  Eye, 
  RefreshCw, 
  CreditCard, 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  ExternalLink,
  CircleCheckBig
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchInput } from '@/components/SearchInput';
import { SubscriptionForm, SubscriptionFormData } from '@/components/console/SubscriptionForm';
import { searchPairs, searchUsers } from '@/lib/subscription-services';

// Types for the form data
interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface PairOption {
  id: string;
  symbol: string;
  timeframe: string;
  version: string;
}
import { useSearchParams, useParams } from 'next/navigation';

// Status badge component
// function StatusBadge({ status }: { status: string }) {
//   const getStatusConfig = (status: string) => {
//     switch (status.toUpperCase()) {
//       case 'ACTIVE':
//         return { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle };
//       case 'PAID':
//         return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: CheckCircle };
//       case 'EXPIRED':
//         return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle };
//       case 'PENDING':
//         return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock };
//       case 'CANCELLED':
//         return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle };
//       default:
//         return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertCircle };
//     }
//   };

//   const config = getStatusConfig(status);
//   const Icon = config.icon;

//   return (
//     <Badge className={`${config.color} border flex items-center gap-1`}>
//       <Icon size={12} />
//       {status}
//     </Badge>
//   );
// }

// Payment status badge
function PaymentStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return { color: 'bg-green-500/30 text-green-400 border-green-500/50' };
      case 'PAID':
        return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'PENDING':
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case 'FAILED':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'EXPIRED':
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
      case 'UNDERPAID':
        return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      default:
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={`${config.color} border`}>
      {status}
    </Badge>
  );
}

// Action buttons component
function ActionButtons({
  row,
  onViewDetails,
  consoleId,
  handleStatusChange,
  loading
}: {
  row: any;
  onViewDetails: (row: any) => void;
  consoleId: string;
  handleStatusChange: (id: string, newStatus: string) => void;
  loading: boolean;
}) {

  return (
    <div className="flex gap-2 items-center">
      {/* Slide Sheet Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="hover:text-white text-white/70"
            variant={'ghost'}
            size="icon"
            title="Manage Subscription"
          >
            <CircleCheckBig size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px] bg-gradient-to-b from-white/5 to-white/20 backdrop-blur-2xl p-0 flex flex-col justify-end">
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle>
              <h2 className="text-lg font-semibold">Manage Subscription</h2>
            </SheetTitle>
          </SheetHeader>
          <Content row={row} />
          <div className="flex gap-2 mt-4 px-6 pb-6">
            <Button
              className="bg-amber-600 text-white font-semibold flex-1"
              disabled={row.inviteStatus === 'SENT' || row.inviteStatus === 'COMPLETED' || loading}
              onClick={() => handleStatusChange(row.id, 'SENT')}
            >
              SENT
            </Button>
            <Button
              className="bg-green-600 text-white font-semibold flex-1"
              disabled={row.inviteStatus === 'COMPLETED' || row.inviteStatus === 'PENDING' || loading}
              onClick={() => handleStatusChange(row.id, 'COMPLETED')}
            >
              COMPLETED
            </Button>
            <Button
              className="bg-red-600 text-white font-semibold flex-1"
              disabled={row.inviteStatus === 'PENDING' || loading}
              onClick={() => handleStatusChange(row.id, 'CANCELLED')}
            >
              Deactivate
            </Button>
          </div>
        </SheetContent>

      </Sheet>
      {/* Existing actions */}
      <Button
        className="hover:text-white text-white/70"
        variant={'ghost'}
        size="icon"
        onClick={() => onViewDetails(row)}
        title="View Details (Modal)"
      >
        <Eye size={20} />
      </Button>
      <Link href={`/console/${consoleId}/subscriptions/${row.id}`}>
        <Button
          className="hover:text-blue-400 text-blue-300"
          variant={'ghost'}
          size="icon"
          title="View Full Details"
        >
          <ExternalLink size={20} />
        </Button>
      </Link>
      {row.status === 'EXPIRED' && (
        <Button
          className="hover:text-green-600 text-green-500"
          variant={'ghost'}
          size="icon"
          title="Renew Subscription"
        >
          <RefreshCw size={20} />
        </Button>
      )}
    </div>
  );
}

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSubscriptionOpen, setNewSubscriptionOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Form data states
  const [users, setUsers] = useState<UserOption[]>([]);
  const [pairs, setPairs] = useState<PairOption[]>([]);
  
  // Get search params from URL
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  // Get console ID from URL params
  const params = useParams();
  const consoleId = params.id as string;
  
  // Stats state
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    expiringThisMonth: 0,
  });


  // Handler to activate/deactivate subscription
  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, inviteStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Subscription ${newStatus} successfully!`, {
          style: { background: '#22c55e', color: 'white' },
        });
        // Refresh the subscriptions list so UI reflects changes
        try { await fetchSubscriptions(); } catch (e) { console.warn('Refetch failed', e); }
      } else {
        toast.error(data.error || 'Failed to update status', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (err) {
      toast.error('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  // Table columns definition
  const columns: Column[] = [
    { 
      key: 'userEmail', 
      header: 'User', 
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.user?.email || 'N/A'}</div>
          <div className="text-xs text-gray-400">{row.user?.name || ''}</div>
        </div>
      )
    },
    { 
      key: 'pairSymbol', 
      header: 'Trading Pair', 
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.pair?.symbol || 'N/A'}</div>
          <div className="text-xs text-gray-400">{row.pair?.timeframe || ''}</div>
        </div>
      )
    },
    {
      key: 'period',
      header: 'Period',
      sortable: true,
      render: (value) => {
        const periodMap: { [key: string]: string } = {
          'ONE_MONTH': '1 Month',
          'THREE_MONTHS': '3 Months', 
          'SIX_MONTHS': '6 Months',
          'TWELVE_MONTHS': '12 Months'
        };
        return periodMap[value] || value;
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => <PaymentStatusBadge status={value} />
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: (value) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      render: (value) => {
        if (!value) return '';
        const date = new Date(value);
        const now = new Date();
        const isExpiringSoon = date.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
        
        return (
          <div className={isExpiringSoon ? 'text-orange-400' : ''}>
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        );
      }
    },
    {
      key: 'basePrice',
      header: 'Price',
      sortable: true,
      align: 'center',
      render: (_, row) => {
        const basePrice = row.basePrice || 0;
        const discountRate = row.discountRate || 0;
        const finalPrice = basePrice * (1 - discountRate / 100);
        
        return (
          <div className="text-center">
            <div className="font-medium">${finalPrice.toFixed(2)}</div>
            {discountRate > 0 && (
              <div className="text-xs text-green-400">{discountRate}% off</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'inviteStatus',
      header: 'Invite',
      sortable: true,
      render: (value) => {
        const statusMap: { [key: string]: string } = {
          'PENDING': 'Pending',
          'SENT': 'Sent',
          'COMPLETED': 'Completed'
        };
        const color = value === 'COMPLETED' ? 'text-green-400' : 
          value === 'SENT' ? 'text-blue-400' : 'text-yellow-400';
        return <span className={color}>{statusMap[value] || value}</span>;
      }
    },
    {
      key: 'action',
      header: 'Actions',
      sortable: false,
      render: (_: any, row: any) => (
        <ActionButtons
          row={row}
          onViewDetails={handleViewDetails}
          handleStatusChange={handleStatusChange}
          consoleId={consoleId}
          loading={loading}
        />
      ),
    },
  ];

  // Handle view details
  const handleViewDetails = (row: any) => {
    setSelectedSubscription(row);
    setDetailsModalOpen(true);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle new subscription form submission
  const handleNewSubscriptionSubmit = async (data: SubscriptionFormData) => {
    setLoading(true);
    
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (res.ok) {
        toast.success('Subscription created successfully!', {
          style: { background: '#22c55e', color: 'white' },
        });
        setNewSubscriptionOpen(false);
        fetchSubscriptions();
      } else {
        toast.error(result.error || 'Failed to create subscription', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error('Error creating subscription', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const calculateStats = (subscriptions: any[]) => {
    if (!subscriptions || subscriptions.length === 0) {
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        expiringThisMonth: 0,
      };
    }

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'ACTIVE').length;
    
    const totalRevenue = subscriptions.reduce((total, sub) => {
      const basePrice = parseFloat(sub.basePrice || '0');
      const discountRate = parseFloat(sub.discountRate || '0');
      const finalPrice = basePrice * (1 - discountRate / 100);
      return total + (sub.payment?.status === 'PAID' ? finalPrice : 0);
    }, 0);

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const expiringThisMonth = subscriptions.filter(sub => {
      if (!sub.expiryDate) return false;
      const expiryDate = new Date(sub.expiryDate);
      return expiryDate <= nextMonth && expiryDate >= now;
    }).length;

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions,
      totalRevenue,
      expiringThisMonth,
    };
  };

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      
      const url = params.toString() 
        ? `/api/subscriptions?${params.toString()}` 
        : '/api/subscriptions';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.subscriptions) {
        setSubscriptions(data.subscriptions);
        const calculatedStats = calculateStats(data.subscriptions);
        setStats(calculatedStats);
      } else {
        toast.error('Failed to fetch subscriptions', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (err) {
      toast.error('Error fetching subscriptions', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data for form dropdowns
  const fetchFormData = async () => {
    try {
      // Fetch users
      const usersData = await searchUsers('', 10);
      setUsers(usersData.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })));

      // Fetch pairs
      const pairsData = await searchPairs('', 10);
      setPairs(pairsData.map((pair) => ({
        id: pair.id,
        symbol: pair.symbol,
        timeframe: pair.timeframe,
        version: pair.version,
      })));
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  // Search users function
  const handleSearchUsers = async (query: string): Promise<UserOption[]> => {
    try {
      const results = await searchUsers(query, 20);
      return results.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Search pairs function
  const handleSearchPairs = async (query: string): Promise<PairOption[]> => {
    try {
      const results = await searchPairs(query, 20);
      return results.map((pair) => ({
        id: pair.id,
        symbol: pair.symbol,
        timeframe: pair.timeframe,
        version: pair.version,
      }));
    } catch (error) {
      console.error('Error searching pairs:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchFormData();
  }, [statusFilter, searchQuery]);

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Page Title & Stats */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
            Subscription Management
          </h1>
          <OverviewSection overviewData={[
            {
              title: 'Total Subscriptions',
              currentValue: stats.totalSubscriptions,
              icon: Users,
              description: 'All subscriptions',
              pastValue: 'Total registered',
              color: 'text-blue-300',
              bgColor: 'bg-blue-400/20',
            },
            {
              title: 'Active Subscriptions',
              currentValue: stats.activeSubscriptions,
              icon: CheckCircle,
              description: `${stats.totalSubscriptions > 0 ? ((stats.activeSubscriptions / stats.totalSubscriptions) * 100).toFixed(1) : '0'}% active rate`,
              pastValue: `${stats.activeSubscriptions} of ${stats.totalSubscriptions}`,
              color: 'text-green-300',
              bgColor: 'bg-green-400/20',
            },
            {
              title: 'Total Revenue',
              currentValue: `$${stats.totalRevenue.toLocaleString()}`,
              icon: DollarSign,
              description: 'From paid subscriptions',
              pastValue: 'Lifetime revenue',
              color: 'text-emerald-300',
              bgColor: 'bg-emerald-400/20',
            },
            {
              title: 'Expiring Soon',
              currentValue: stats.expiringThisMonth,
              icon: Calendar,
              description: 'Within 30 days',
              pastValue: 'Require attention',
              color: 'text-amber-300',
              bgColor: 'bg-amber-400/20',
            },
          ]} className="mb-0 opacity-95" />
        </div>

        {/* Actions Bar & Table Section */}
        <div className="flex flex-col mt-0">
          <div className="flex-1 min-h-0 space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="search" className="text-sm text-white whitespace-nowrap">Search:</Label>
                  <div className="w-64">
                    <SearchInput placeholder="Search by email, name, symbol..." />
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter" className="text-sm text-white whitespace-nowrap">Status:</Label>
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Results Counter */}
                <div className="text-sm text-gray-400">
                  {subscriptions.length} results
                  {searchQuery && ` for "${searchQuery}"`}
                  {statusFilter !== 'all' && ` (${statusFilter.toLowerCase()})`}
                </div>
              </div>
              
              <Sheet open={newSubscriptionOpen} onOpenChange={setNewSubscriptionOpen}>
                <SheetTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-2 rounded-xl shadow-lg">
                    + Add New Subscription
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] bg-gradient-to-b from-white/5 to-white/20 backdrop-blur-2xl p-0 flex flex-col">
                  <SheetHeader className="p-6 pb-4 flex-shrink-0">
                    <SheetTitle className="text-2xl font-bold text-white">Create New Subscription</SheetTitle>
                    <SheetDescription className="text-slate-400">
                      Add a new subscription for a user to access a trading version.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <SubscriptionForm
                      onSubmit={handleNewSubscriptionSubmit}
                      onCancel={() => setNewSubscriptionOpen(false)}
                      loading={loading}
                      users={users}
                      pairs={pairs}
                      onSearchUsers={handleSearchUsers}
                      onSearchPairs={handleSearchPairs}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Subscriptions Table */}
            <Card className="flex bg-white/5 backdrop-blur-md border-white/20 shadow-xl mt-0">
              <div className="flex-1 min-h-0 space-y-4">
                <ReusableTable
                  data={subscriptions}
                  columns={columns}
                  title="Subscriptions"
                  subtitle="Manage user subscriptions and payments."
                  itemsPerPage={15}
                  frozenColumnKey="userEmail"
                  className=""
                />

                {/* Subscription Details Modal */}
                <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Subscription Details</DialogTitle>
                    </DialogHeader>
                    {selectedSubscription && (
                      <div className="space-y-6">
                        {/* User Information */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-white mb-2">User Information</h4>
                            <div className="space-y-1 text-sm">
                              <div><span className="text-gray-400">Email:</span> {selectedSubscription.user?.email}</div>
                              <div><span className="text-gray-400">Name:</span> {selectedSubscription.user?.name || 'N/A'}</div>
                              <div><span className="text-gray-400">TradingView:</span> {selectedSubscription.user?.tradingviewUsername || 'N/A'}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">Trading Pair</h4>
                            <div className="space-y-1 text-sm">
                              <div><span className="text-gray-400">Symbol:</span> {selectedSubscription.pair?.symbol}</div>
                              <div><span className="text-gray-400">Timeframe:</span> {selectedSubscription.pair?.timeframe}</div>
                              <div><span className="text-gray-400">Version:</span> {selectedSubscription.pair?.version || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Subscription Details */}
                        <div>
                          <h4 className="font-semibold text-white mb-2">Subscription Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-400">Period:</span> {selectedSubscription.period?.replace('_', ' ')}</div>
                            <div><span className="text-gray-400">Status:</span> <PaymentStatusBadge status={selectedSubscription.status} /></div>
                            <div><span className="text-gray-400">Start Date:</span> {new Date(selectedSubscription.startDate).toLocaleDateString()}</div>
                            <div><span className="text-gray-400">Expiry Date:</span> {new Date(selectedSubscription.expiryDate).toLocaleDateString()}</div>
                            <div><span className="text-gray-400">Base Price:</span> ${selectedSubscription.basePrice}</div>
                            <div><span className="text-gray-400">Discount:</span> {selectedSubscription.discountRate}%</div>
                            <div><span className="text-gray-400">Invite Status:</span> {selectedSubscription.inviteStatus}</div>
                          </div>
                        </div>

                        {/* Payment Information */}
                        {selectedSubscription.payment && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Payment Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><span className="text-gray-400">Status:</span> <PaymentStatusBadge status={selectedSubscription.payment.status} /></div>
                              <div><span className="text-gray-400">Network:</span> {selectedSubscription.payment.network}</div>
                              <div><span className="text-gray-400">Total Amount:</span> ${selectedSubscription.payment.totalAmount}</div>
                              <div><span className="text-gray-400">Actually Paid:</span> ${selectedSubscription.payment.actuallyPaid || '0'}</div>
                              <div><span className="text-gray-400">Transaction Hash:</span> 
                                {selectedSubscription.payment.txHash ? (
                                  <span className="font-mono text-xs break-all">{selectedSubscription.payment.txHash}</span>
                                ) : 'N/A'}
                              </div>
                              <div><span className="text-gray-400">Created:</span> {new Date(selectedSubscription.payment.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )}

                        {/* Payment Items */}
                        {selectedSubscription.payment?.paymentItems?.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Payment Items</h4>
                            <div className="space-y-2">
                              {selectedSubscription.payment.paymentItems.map((item: any, index: number) => (
                                <div key={index} className="bg-gray-800/50 p-3 rounded-lg text-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><span className="text-gray-400">Base Price:</span> ${item.basePrice}</div>
                                    <div><span className="text-gray-400">Discount:</span> {item.discountRate}%</div>
                                    <div><span className="text-gray-400">Final Price:</span> ${item.finalPrice}</div>
                                    <div><span className="text-gray-400">Period:</span> {item.period?.replace('_', ' ')}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default SubscriptionsPage;
const Content = ({ row }: { row: any }) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 mt-8">
      <h4 className="font-semibold text-white mb-2">User</h4>
      <Card className="flex bg-inherent backdrop-blur-md border-white/10 shadow-xl mt-0 p-4 space-y-0">
        <div className="grid grid-cols-2 justify-between items-center text-sm">
          <div>id:</div>
          <div className='text-nowrap overflow-auto'>{row.user?.id}</div>
          <div className="">{row.user?.email}</div>
          <div className="">{row.user?.name}</div>
        </div>
      </Card>
      <h4 className="font-semibold text-white mb-2">Trading Pair</h4>
      <Card className="flex bg-inherent backdrop-blur-md border-white/10 shadow-xl mt-0 p-4 space-y-0">
        <div className="grid grid-cols-2 justify-between items-center text-sm">
          <div className="">{row.pair?.symbol} <br /> <span className="text-xs text-gray-400">{row.pair?.timeframe}</span></div>
          <div className="">{row.pair?.version}</div>
        </div>
      </Card>
      <h4 className="font-semibold text-white mb-2">Status</h4>
      <Card className="flex bg-inherent backdrop-blur-md border-white/10 shadow-xl mt-0 p-4">
        <div className="grid grid-cols-2 justify-between items-center space-y-2 text-sm">
          <h4 className="">Invite Status</h4>
          <p className="text-xs text-blue-400">{<PaymentStatusBadge status={row.inviteStatus} />}</p>
          <h4 className="">Period</h4>
          <div className="">{row.period}</div>
          <h4 className="">Start Date</h4>
          <p className="">{row.startDate ? new Date(row.startDate).toLocaleString() : 'N/A'}</p>
          <h4 className="">Expiry Date</h4>
          <p className="">{row.expiryDate ? new Date(row.expiryDate).toLocaleString() : 'N/A'}</p>
          <h4 className="">Base Price</h4>
          <p className="">${row.basePrice}</p>
          <h4 className="">Discount Rate</h4>
          <p className="">{row.discountRate}%</p>
        </div>
      </Card>
      {row.payment && (
        <div>
          <h4 className="font-semibold text-white mb-2">Payment Info</h4>
          <Card className="flex bg-inherent backdrop-blur-md border-white/10 shadow-xl mt-0 p-4">
            <div className="grid grid-cols-2 justify-between items-center space-y-2 text-sm">
              <div>Status:</div>
              <div><PaymentStatusBadge status={row.status} /></div>
              <div>Network:</div>
              <div>{row.payment.network}</div>
              <div>Total Amount:</div>
              <div>${row.payment.totalAmount}</div>
              <div>Actually Paid:</div>
              <div>${row.payment.actuallyPaid || '0'}</div>
              <div>Tx Hash:</div>
              <div>{row.payment.txHash ? <span className="font-mono text-xs break-all">{row.payment.txHash}</span> : 'N/A'}</div>
              <div>Created:</div>
              <div>{row.payment.createdAt ? new Date(row.payment.createdAt).toLocaleString() : 'N/A'}</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
