'use client';

import { Suspense, useState, useEffect } from 'react';
import { ClientSortFilterBar } from '@/components/subscription/ClientSortFilterBar';
import { ReusableTable } from '@/components/ui/reusable-table';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  Eye,
  MoreVertical,
  Target,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface SubscriptionData {
  id: string;
  period: string;
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  paymentId: string | null;
  inviteStatus: string;
  basePrice: number;
  discountRate: number;
  createdAt: string;
  updatedAt: string;
  pair: {
    id: string;
    symbol: string;
    version: string;
    timeframe: string;
    paymentItems: any[];
  };
}

interface SubscriptionsContentProps {
  initialData: SubscriptionData[];
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SubscriptionsContent({
  initialData,
  searchParams,
}: SubscriptionsContentProps) {
  const urlSearchParams = useSearchParams();
  const search = urlSearchParams.get('search');
  const filter = urlSearchParams.get('filter');
  const limit = urlSearchParams.get('limit');
  const page = urlSearchParams.get('page');
  const q = urlSearchParams.get('q');

  // Extract URL params with defaults
  const searchQuery = search || '';
  const filterBy = filter || 'all';
  const currentPage = parseInt(page || '1');
  const itemsPerPage = parseInt(limit || '20');

  // State for subscription pairs data
  const [subscriptionPairs, setSubscriptionPairs] = useState<SubscriptionData[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();

  // Update state when initialData changes (e.g., from server)
  useEffect(() => {
    setSubscriptionPairs(initialData);
  }, [initialData]);

  // Filter subscribed pairs based on URL params
  function getFilteredPairs() {
    let filtered = subscriptionPairs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (subscription) =>
          subscription.pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subscription.pair.version?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subscription.period.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'active':
          filtered = filtered.filter(
            (subscription) => subscription.status === 'ACTIVE'
          );
          break;
        case 'pending':
          filtered = filtered.filter(
            (subscription) => subscription.status === 'PENDING'
          );
          break;
        case 'expired':
          filtered = filtered.filter(
            (subscription) => subscription.status === 'EXPIRED'
          );
          break;
        case 'forex':
          filtered = filtered.filter(
            (subscription) =>
              !subscription.pair.symbol.includes('BTC') &&
              !subscription.pair.symbol.includes('ETH') &&
              !subscription.pair.symbol.includes('LTC') &&
              !subscription.pair.symbol.includes('ADA') &&
              !subscription.pair.symbol.includes('XAU')
          );
          break;
        case 'crypto':
          filtered = filtered.filter(
            (subscription) =>
              subscription.pair.symbol.includes('BTC') ||
              subscription.pair.symbol.includes('ETH') ||
              subscription.pair.symbol.includes('LTC') ||
              subscription.pair.symbol.includes('ADA')
          );
          break;
        case 'commodities':
          filtered = filtered.filter(
            (subscription) =>
              subscription.pair.symbol.includes('XAU') ||
              subscription.pair.symbol.includes('XAG') ||
              subscription.pair.symbol.includes('OIL')
          );
          break;
      }
    }

    // Sort by created date (newest first) as default
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }

  const filteredPairs = getFilteredPairs();

  // Calculate pagination
  const totalFilteredPairs = filteredPairs.length;
  const totalPages = Math.ceil(totalFilteredPairs / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPairs = filteredPairs.slice(startIndex, endIndex);

  // Show loading state while session is being determined
  if (!session) {
    return (
      <GradientBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <span className="ml-3 text-white/80">Loading...</span>
        </div>
      </GradientBackground>
    );
  }

  // Show error state if user is not authenticated
  if (!session.user?.id) {
    return (
      <GradientBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-white/70">Please sign in to view your subscriptions.</p>
          </div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">
            My Subscriptions
          </h1>
          <p className="text-white/70">
            Manage your trading pair subscriptions and monitor their status.
          </p>
        </div>

        {/* Trading Pairs Table Section */}
        <div className="flex flex-col justify-end mb-12">
          {/* Main Pairs Table */}
          <div className="flex-1 min-h-0 space-y-5">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                  <span className="ml-3 text-white/80">
                    Loading subscriptions...
                  </span>
                </div>
              }
            >
              {/* Search and Filter Bar */}
              <ClientSortFilterBar
                filterBy={filterBy}
                totalResults={totalFilteredPairs}
              />
              <ReusableTable<SubscriptionData>
                data={paginatedPairs}
                columns={[
                  {
                    key: 'status',
                    header: 'Status',
                    width: 'w-32',
                    render: (value: string, row: SubscriptionData) => {
                      const status = row.status;
                      return (
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant={
                              status === 'ACTIVE'
                                ? 'default'
                                : status === 'PENDING'
                                ? 'outline'
                                : 'destructive'
                            }
                            className={`text-xs ${
                              status === 'ACTIVE'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : status === 'PENDING'
                                ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {status === 'ACTIVE'
                              ? 'Active'
                              : status === 'PENDING'
                              ? 'Pending'
                              : 'Expired'}
                          </Button>
                        </div>
                      );
                    },
                  },
                  {
                    key: 'pair.symbol',
                    header: 'Pair',
                    sortable: true,
                    render: (value: string, row: SubscriptionData) => (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/pair/${row.pair.id}`}
                            className="text-white hover:text-blue-400 transition-colors font-semibold"
                          >
                            {row.pair.symbol}
                          </Link>
                        </div>
                        <span className="text-xs text-slate-400">
                          {row.pair.version}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'period',
                    header: 'Period',
                    sortable: true,
                    align: 'center',
                    render: (value: string) => (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-white">
                          {value.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">plan</span>
                      </div>
                    ),
                  },
                  {
                    key: 'basePrice',
                    header: 'Price',
                    sortable: true,
                    align: 'center',
                    render: (value: number) => (
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-green-400">
                          ${value}
                        </span>
                        <span className="text-xs text-slate-400">base</span>
                      </div>
                    ),
                  },
                  {
                    key: 'discountRate',
                    header: 'Discount',
                    sortable: true,
                    align: 'center',
                    render: (value: number) => (
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-blue-400">
                          {value}%
                        </span>
                        <span className="text-xs text-slate-400">off</span>
                      </div>
                    ),
                  },
                  {
                    key: 'startDate',
                    header: 'Start Date',
                    sortable: true,
                    align: 'center',
                    render: (value: string) => (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-white">
                          {new Date(value).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-400">started</span>
                      </div>
                    ),
                  },
                  {
                    key: 'expiryDate',
                    header: 'Expiry Date',
                    sortable: true,
                    align: 'center',
                    render: (value: string) => (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-white">
                          {new Date(value).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-400">expires</span>
                      </div>
                    ),
                  },
                  {
                    key: 'pair.timeframe',
                    header: 'Timeframe',
                    sortable: true,
                    align: 'center',
                    render: (value: string, row: SubscriptionData) => (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-white">
                          {row.pair.timeframe || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400">period</span>
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    align: 'center',
                    width: 'w-20',
                    render: (_, row: SubscriptionData) => (
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-2 h-8 w-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-slate-300" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-slate-800 border-slate-700"
                          >
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/subscriptions/${row.id}`}
                                className="flex items-center cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard.writeText(row.pair.symbol)
                              }
                              className="cursor-pointer"
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Copy Symbol
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ),
                  },
                ]}
                title="My Subscriptions"
                icon={TrendingUp}
                isLoading={isLoading}
                searchable={true}
                searchFields={['pair.symbol', 'pair.version', 'period']}
                emptyStateTitle="No subscriptions found"
                emptyStateDescription="You don't have any active subscriptions yet"
                enableRowDetails={true}
                rowDetailTitle={(subscription) => `${subscription.pair.symbol} - ${subscription.period.replace('_', ' ')}`}
                excludeFromDetails={['id']}
                rowDetailContent={(subscription) => (
                  <div className="space-y-6">
                    {/* Subscription Details */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Subscription Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Status</p>
                          <Badge
                            className={`mt-1 ${
                              subscription.status === 'ACTIVE'
                                ? 'bg-green-500/20 text-green-400'
                                : subscription.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {subscription.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-white/70">Period</p>
                          <p className="text-white font-semibold">
                            {subscription.period.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Start Date</p>
                          <p className="text-white font-semibold">
                            {new Date(subscription.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Expiry Date</p>
                          <p className="text-white font-semibold">
                            {new Date(subscription.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Base Price</p>
                          <p className="text-green-400 font-semibold">
                            ${subscription.basePrice}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Discount Rate</p>
                          <p className="text-blue-400 font-semibold">
                            {subscription.discountRate}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pair Information */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Trading Pair Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Symbol:</span>
                          <span className="text-white font-semibold">
                            {subscription.pair.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Version:</span>
                          <span className="text-white font-semibold">
                            {subscription.pair.version || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Timeframe:</span>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            {subscription.pair.timeframe}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                        <Target className="h-4 w-4 mr-2" />
                        View Signals
                      </Button>
                      {subscription.status === 'PENDING' && (
                        <Button className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white">
                          <Clock className="h-4 w-4 mr-2" />
                          Complete Payment
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}