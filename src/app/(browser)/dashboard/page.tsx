'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { ClientSortFilterBar } from '@/components/subscription/ClientSortFilterBar';
import { GradientBackground } from '@/components/ui/gradient-background';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubscribeButton } from '@/components/subscription/SubscribeButton';
import { getPairs } from '@/app/api/services';
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
  Award,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Pair, Subscription } from '@/generated/prisma';

interface PairData extends Pair {
  name: string;
  metrics: {
    roi: number;
    riskReward: number;
    totalTrades: number;
    winRate: number;
    maxDrawdown: number;
    profit: number;
  };
  isPopular: boolean;
  subscriptions?: Subscription[];
}

function DashboardContent() {
  // Force desktop layout by setting min-width and disabling responsive scaling
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  const filter = searchParams.get('filter');
  const limit = searchParams.get('limit');
  const page = searchParams.get('page');
  const q = searchParams.get('q');

  // Extract URL params with defaults
  const searchQuery = q || '';
  const filterBy = filter || 'all';
  const currentPage = parseInt(page || '1');
  const itemsPerPage = parseInt(limit || '20');

  // State for pairs data
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch pairs data
  useEffect(() => {
    const fetchPairs = async () => {
      setLoading(true);
      try {
        const result = await getPairs({ limit: 20 });
        // console.log('pairs', JSON.parse(result.pairs[0].tradesAnalysis)[9]['All USDT']);
        const mappedPairs: PairData[] = result.pairs.map((pair: any) => {
          const performance = JSON.parse(pair.performance);
          const properties = JSON.parse(pair.properties);
          const riskPerfRatios = JSON.parse(pair.riskPerformanceRatios);
          const tradesAnalysis = JSON.parse(pair.tradesAnalysis);
          return({
          ...pair,
          performance: [],
          properties: [],
          riskPerfRatios: [],
          tradesAnalysis: [],
          metrics: {
            roi: (10000 / performance[1]['All USDT']) * 100 || 0,
            riskReward: tradesAnalysis[9]['All USDT'] || 0,
            totalTrades: tradesAnalysis[0]['All USDT'] || 0,
            winRate: (tradesAnalysis[2]['All USDT'] / tradesAnalysis[0]['All USDT'] * 100) || 0,
            maxDrawdown: performance[7]['All USDT'] || 0,
            profit: performance[1]['All USDT'] || 0,
          },
          isPopular: false,
        })});
        setPairs(mappedPairs);
        setStats({
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        });
      } catch (error) {
        console.error('Error fetching pairs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPairs();
  }, [q, filterBy, currentPage, itemsPerPage]);

  // Calculate pagination
  const totalFilteredPairs = stats.total;

const columns: Column<PairData>[] = useMemo(() => [
  {
    key: 'subscription',
    header: 'Status',
    width: 'w-32',
    render: (value: any, row: PairData) => {
      const userSubscriptionStatus = row.subscriptions?.some((s: any) => row.id === s.pairId && s.status === 'ACTIVE') ? 'active' : 'none';
      return (
        <div className="flex flex-col gap-1">
          <SubscribeButton
            userSubscriptionStatus={userSubscriptionStatus}
            isUserLoggedIn={true}
            pair={row}
          />
        </div>
      );
    },
  },
  {
    key: 'symbol',
    header: 'Symbol',
    sortable: true,
    render: (value: string, row: PairData) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/${row.id}`}
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
    key: 'timeframe',
    header: 'Timeframe',
    sortable: true,
    align: 'center',
    accessor: (row: PairData) => row.timeframe,
    render: (value: string) => (
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-white">
          {value || 'N/A'}
        </span>
        <span className="text-xs text-slate-400">
          period
        </span>
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
        <span className="font-medium text-white">
          {value}
        </span>
        <span className="text-xs text-slate-400">
          total
        </span>
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
    key: 'metrics.roi',
    header: 'ROI',
    sortable: true,
    align: 'center',
    accessor: (row: PairData) => row.metrics.roi,
    render: (value: number) => {
      const isPositive = value > 0;
      return (
        <div className="flex items-center gap-1 justify-start">
          {value > 0 ? <TrendingUp className="h-4 w-4 text-green-400" /> : value < 0 ? <TrendingUp className="h-4 w-4 -rotate-180 text-red-400" /> : <span className="h-4 w-4" />}
          <span
            className={`font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {value.toFixed(2)}%
          </span>
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
        <span className="text-xs text-slate-400">
          ratio
        </span>
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
        <span className="text-xs text-slate-400">
          drawdown
        </span>
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
        <span className="text-xs text-slate-400">
          earned
        </span>
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
                href={`/dashboard/${row.id}`}
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
], []);

  return (
    <>
      <Head>
        {/* Force desktop viewport */}
        <meta name="viewport" content="width=1280" />
      </Head>
      <GradientBackground>
        <div
          className="min-h-screen flex flex-col justify-between p-0 md:p-4"
          style={{
            margin: '0 auto',
            transition: 'transform 0.2s',
          }}
        >
          <style>{`
            @media (max-width: 900px) {
              .dashboard-scale {
                transform: scale(0.5);
                transform-origin: top left;
              }
            }
          `}</style>
          <div className="dashboard-scale">
            {/* Dashboard Statistics */}
            <div className="">
              <OverviewSection
                overviewData={[
                  {
                    title: 'Total Pairs',
                    currentValue: stats.total,
                    icon: BarChart3,
                    description: 'Available trading pairs',
                    pastValue: '+2 new pairs this month',
                  },
                  // {
                  //   title: 'Profitable Pairs',
                  //   currentValue: dashboardStats.profitablePairs,
                  //   icon: Target,
                  //   description: `${dashboardStats.totalPairs > 0 ? ((dashboardStats.profitablePairs / dashboardStats.totalPairs) * 100).toFixed(1) : '0'}% win rate`,
                  //   pastValue: `${dashboardStats.profitablePairs} out of ${dashboardStats.totalPairs} pairs`,
                  // },
                  // {
                  //   title: 'Total Profit',
                  //   currentValue: `$${dashboardStats.totalProfit.toLocaleString()}`,
                  //   icon: DollarSign,
                  //   description: 'Combined performance',
                  //   pastValue: '+15.2% this quarter',
                  // },
                  // {
                  //   title: 'Best Performer',
                  //   currentValue: dashboardStats.bestPerformer.symbol,
                  //   icon: Award,
                  //   description: `${dashboardStats.bestPerformer.roi}% ROI`,
                  //   pastValue: 'Top performing pair',
                  // },
                ]}
                className="mb-0 grid-cols-2 md:grid-cols-4 w-[200%] md:w-full"
              />
            </div>

            {/* Trading Pairs Table Section */}
            <div className="flex flex-col justify-end my-12">
              {/* Main Pairs Table */}
              <div className="flex-1 min-h-0 space-y-4">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                      <span className="ml-3 text-white/80">
                        Loading trading pairs...
                      </span>
                    </div>
                  }
                >
                  {/* Search and Filter Bar */}
                  <ClientSortFilterBar
                    filterBy={filterBy}
                    totalResults={totalFilteredPairs}
                    className="w-[200%] md:w-full flex-row!"
                  />
                  <ReusableTable<PairData>
                    data={pairs}
                    columns={columns}
                    title="Trading Pairs"
                    icon={TrendingUp}
                    isLoading={loading}
                    searchable={true}
                    searchFields={['symbol', 'name', 'timeframe']}
                    emptyStateTitle="No trading pairs found"
                    emptyStateDescription="We couldn't find any trading pairs matching your criteria"
                    enableRowDetails={true}
                    rowDetailTitle={(pair) => `${pair.symbol} - ${pair.name}`}
                    excludeFromDetails={['id']}
                    enableColumnSelector={true}
                    defaultVisibleColumns={[
                      'subscription',
                      'symbol',
                      'metrics.roi',
                      'metrics.winRate',
                      'actions',
                    ]}
                    rowDetailContent={(pair) => (
                      <div className="space-y-6">
                        {/* Trading Performance */}
                        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Trading Performance
                            {pair.isPopular && (
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            )}
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
                              <span className="text-white/70">
                                Total Trades:
                              </span>
                              <span className="text-white font-semibold">
                                {pair.metrics.totalTrades}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Total Profit:
                              </span>
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
                        {pair.subscriptions?.some(s => s.status === 'ACTIVE') ? (() => {
                          const activeSubscription = pair.subscriptions?.find(s => s.status === 'ACTIVE');
                          return (
                            <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Subscription Details
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/70">Status:</span>
                                  <Badge className="bg-green-500/20 text-green-400">
                                    {activeSubscription?.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Expires:</span>
                                  <span className="text-white">
                                    {activeSubscription?.expiryDate
                                      ? new Date(activeSubscription.expiryDate).toLocaleDateString()
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Subscription Available
                            </h3>
                            <p className="text-white/70 text-sm mb-3">
                              Subscribe to get access to trading signals for{' '}
                              {pair.symbol}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                          {pair.subscriptions?.some(s => s.status === 'ACTIVE') ? (() => {
                            const activeSubscription = pair.subscriptions?.find(s => s.status === 'ACTIVE');
                            return (
                              <>
                                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                                  <Target className="h-4 w-4 mr-2" />
                                  View Signals
                                </Button>
                                {activeSubscription && new Date(activeSubscription.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                                  <Button className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Renew
                                  </Button>
                                )}
                              </>
                            );
                          })() : (
                            <SubscribeButton
                              isUserLoggedIn={true}
                              pair={pair}
                              className="flex-1"
                            />
                          )}
                        </div>
                      </div>
                    )}
                    className="w-[200%] md:w-full"
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </GradientBackground>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <GradientBackground>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-3 text-white/80">Loading dashboard...</span>
          </div>
        </GradientBackground>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
