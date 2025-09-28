'use client';

import { Suspense } from 'react';
import { ClientSortFilterBar } from '@/components/subscription/ClientSortFilterBar';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockPairs } from '@/lib/dummy-data';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  Eye,
  MoreVertical,
  Star,
  Activity,
  Target,
  Calendar,
  BarChart3,
  DollarSign,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface PairData {
  id: string;
  symbol: string;
  name: string;
  metrics: {
    roi: number;
    riskReward: number;
    totalTrades: number;
    winRate: number;
    maxDrawdown: number;
    profit: number;
  };
  timeframe?: string;
  isPopular?: boolean;
  subscription?: {
    status: 'active' | 'expiring' | 'expired' | 'pending';
    expiryDate?: string;
  };
}

interface IProps {
  searchParams?: {
    search?: string;
    filter?: string;
    limit?: string;
    page?: string;
    q?: string;
  };
}

function SubscriptionsContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  const filter = searchParams.get('filter');
  const limit = searchParams.get('limit');
  const page = searchParams.get('page');
  const q = searchParams.get('q');

  // Extract URL params with defaults
  const searchQuery = search || '';
  const filterBy = filter || 'all';
  const currentPage = parseInt(page || '1');
  const itemsPerPage = parseInt(limit || '5');

  // Mock user state - replace with real auth
  const isUserLoggedIn = true;

  // Filter subscribed pairs based on URL params
  function getFilteredPairs() {
    let filtered = mockPairs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (pair) =>
          pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pair.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'active':
          filtered = filtered.filter(
            (pair) => pair.subscription?.status === 'active'
          );
          break;
        case 'expiring':
          filtered = filtered.filter(
            (pair) => pair.subscription?.status === 'expiring'
          );
          break;
        case 'pending':
          filtered = filtered.filter(
            (pair) => pair.subscription?.status === 'pending'
          );
          break;
        case 'forex':
          filtered = filtered.filter(
            (pair) =>
              !pair.symbol.includes('BTC') &&
              !pair.symbol.includes('ETH') &&
              !pair.symbol.includes('LTC') &&
              !pair.symbol.includes('ADA') &&
              !pair.symbol.includes('XAU')
          );
          break;
        case 'crypto':
          filtered = filtered.filter(
            (pair) =>
              pair.symbol.includes('BTC') ||
              pair.symbol.includes('ETH') ||
              pair.symbol.includes('LTC') ||
              pair.symbol.includes('ADA')
          );
          break;
        case 'commodities':
          filtered = filtered.filter(
            (pair) =>
              pair.symbol.includes('XAU') ||
              pair.symbol.includes('XAG') ||
              pair.symbol.includes('OIL')
          );
          break;
        case 'profitable':
          filtered = filtered.filter((pair) => pair.metrics.profit > 0);
          break;
        case 'popular':
          filtered = filtered.filter((pair) => pair.isPopular);
          break;
      }
    }

    // Sort by ROI (highest first) as default
    filtered.sort((a, b) => b.metrics.roi - a.metrics.roi);

    return filtered;
  }

  const filteredPairs = getFilteredPairs();

  // Calculate pagination
  const totalFilteredPairs = filteredPairs.length;
  const totalPages = Math.ceil(totalFilteredPairs / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPairs = filteredPairs.slice(startIndex, endIndex);

  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col justify-between p-4">
        {/* Header */}
        <div className="">
          <h1 className="text-3xl font-bold text-white mb-2">
            My Subscriptions
          </h1>
          <p className="text-white/70">
            Manage your subscribed trading pairs and monitor their performance.
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
              <ReusableTable<PairData>
                data={paginatedPairs}
                columns={[
                  {
                    key: 'subscription',
                    header: 'Status',
                    width: 'w-32',
                    render: (value: any, row: PairData) => {
                      const userSubscriptionStatus =
                        row.subscription?.status || 'none';
                      return (
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant={
                              userSubscriptionStatus === 'active'
                                ? 'default'
                                : 'outline'
                            }
                            className={`text-xs ${
                              userSubscriptionStatus === 'active'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : userSubscriptionStatus === 'expiring'
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
                            }`}
                          >
                            {userSubscriptionStatus === 'active'
                              ? 'Active'
                              : userSubscriptionStatus === 'expiring'
                              ? 'Renew'
                              : userSubscriptionStatus === 'expired'
                              ? 'Expired'
                              : 'Subscribe'}
                          </Button>
                        </div>
                      );
                    },
                  },
                  {
                    key: 'symbol',
                    header: 'Pair',
                    sortable: true,
                    render: (value: string, row: PairData) => (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/pair/${row.id}`}
                            className="text-white hover:text-blue-400 transition-colors font-semibold"
                          >
                            {value}
                          </Link>
                          {row.isPopular && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-orange-500/10 text-orange-400"
                            >
                              🔥 Popular
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {row.name}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'metrics.roi',
                    header: 'ROI',
                    sortable: true,
                    align: 'center',
                    accessor: (row: PairData) => row.metrics.roi,
                    render: (value: number) => {
                      const isPositive = value > 0;
                      return (
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-medium ${
                              isPositive ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {value.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-400">return</span>
                        </div>
                      );
                    },
                  },
                  {
                    key: 'metrics.riskReward',
                    header: 'R/R',
                    sortable: true,
                    align: 'center',
                    accessor: (row: PairData) => row.metrics.riskReward,
                    render: (value: number) => (
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-medium ${
                            value > 1.5 ? 'text-green-400' : 'text-white'
                          }`}
                        >
                          {value.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">ratio</span>
                      </div>
                    ),
                  },
                  {
                    key: 'metrics.totalTrades',
                    header: 'Trades',
                    sortable: true,
                    align: 'center',
                    accessor: (row: PairData) => row.metrics.totalTrades,
                    render: (value: number) => (
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-white">{value}</span>
                        <span className="text-xs text-slate-400">total</span>
                      </div>
                    ),
                  },
                  {
                    key: 'metrics.winRate',
                    header: 'Win Rate',
                    sortable: true,
                    align: 'center',
                    accessor: (row: PairData) => row.metrics.winRate,
                    render: (value: number) => (
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-medium ${
                            value > 60 ? 'text-green-400' : 'text-white'
                          }`}
                        >
                          {value.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-400">wins</span>
                      </div>
                    ),
                  },
                  {
                    key: 'metrics.maxDrawdown',
                    header: 'Max DD',
                    sortable: true,
                    align: 'center',
                    accessor: (row: PairData) => row.metrics.maxDrawdown,
                    render: (value: number) => (
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-medium ${
                            value < 10 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {value.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-400">drawdown</span>
                      </div>
                    ),
                  },
                  {
                    key: 'metrics.profit',
                    header: 'Profit',
                    sortable: true,
                    align: 'center',
                    accessor: (row: PairData) => row.metrics.profit,
                    render: (value: number) => (
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-medium ${
                            value > 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          ${value.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400">earned</span>
                      </div>
                    ),
                  },
                  {
                    key: 'timeframe',
                    header: 'Timeframe',
                    sortable: true,
                    align: 'center',
                    render: (value: string) => (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-white">
                          {value || 'N/A'}
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
                    render: (_, row: PairData) => (
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
                                href={`/pair/${row.id}`}
                                className="flex items-center cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard.writeText(row.symbol)
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
                isLoading={false}
                searchable={true}
                searchFields={['symbol', 'name', 'timeframe']}
                emptyStateTitle="No subscriptions found"
                emptyStateDescription="You don't have any active subscriptions yet"
                enableRowDetails={true}
                rowDetailTitle={(pair) => `${pair.symbol} - ${pair.name}`}
                excludeFromDetails={['id']}
                rowDetailContent={(pair) => (
                  <div className="space-y-6">
                    {/* Trading Performance */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Trading Performance
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">ROI</p>
                          <p
                            className={`font-semibold text-lg ${
                              pair.metrics.roi > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {pair.metrics.roi > 0 ? '+' : ''}
                            {pair.metrics.roi.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Win Rate</p>
                          <p className="text-blue-400 font-semibold text-lg">
                            {pair.metrics.winRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Risk/Reward</p>
                          <p className="text-white font-semibold">
                            {pair.metrics.riskReward.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Max Drawdown</p>
                          <p className="text-red-400 font-semibold">
                            {pair.metrics.maxDrawdown.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trading Stats */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Trading Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Total Trades:</span>
                          <span className="text-white font-semibold">
                            {pair.metrics.totalTrades}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Total Profit:</span>
                          <span
                            className={`font-semibold text-lg ${
                              pair.metrics.profit > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            ${pair.metrics.profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Timeframe:</span>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            {pair.timeframe}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Details */}
                    {pair.subscription && (
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Subscription Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/70">Status:</span>
                            <Badge
                              className={`${
                                pair.subscription.status === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : pair.subscription.status === 'expiring'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {pair.subscription.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Expires:</span>
                            <span className="text-white">
                              {pair.subscription.expiryDate
                                ? new Date(
                                    pair.subscription.expiryDate
                                  ).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                        <Target className="h-4 w-4 mr-2" />
                        View Signals
                      </Button>
                      {pair.subscription?.status === 'expiring' && (
                        <Button className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white">
                          <Clock className="h-4 w-4 mr-2" />
                          Renew
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

export default function SubscriptionsPage() {
  return (
    <Suspense
      fallback={
        <GradientBackground>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-3 text-white/80">Loading subscriptions...</span>
          </div>
        </GradientBackground>
      }
    >
      <SubscriptionsContent />
    </Suspense>
  );
}
