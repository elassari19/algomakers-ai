'use client';

import { useState, useMemo, Suspense, lazy } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  BarChart3,
  Target,
  DollarSign,
  Award,
  Eye,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';

// Dynamically import heavy components
const OverviewSection = dynamic(() => import('@/components/dashboard/DashboardStats').then(mod => ({ default: mod.OverviewSection })), {
  loading: () => <div className="animate-pulse h-32 bg-slate-800 rounded-lg"></div>
});

const ReusableTable = dynamic(() => import('@/components/ui/reusable-table').then(mod => ({ default: mod.ReusableTable })), {
  loading: () => <div className="animate-pulse h-96 bg-slate-800 rounded-lg"></div>
});

const SubscribeButton = dynamic(() => import('@/components/subscription/SubscribeButton').then(mod => ({ default: mod.SubscribeButton })), {
  loading: () => <div className="animate-pulse h-10 bg-slate-700 rounded"></div>
});

const ClientSortFilterBar = dynamic(() => import('@/components/subscription/ClientSortFilterBar').then(mod => ({ default: mod.ClientSortFilterBar })), {
  loading: () => <div className="animate-pulse h-12 bg-slate-800 rounded-lg"></div>
});

import type { Column } from '@/components/ui/reusable-table';

// Lazy load heavy content components
const AccordionContent = lazy(() => import('./AccordionContent'));
const RowDetailContent = lazy(() => import('./RowDetailContent'));
import { Subscription, SubscriptionStatus } from '@/generated/prisma';
import { ProcessedPairData } from '@/lib/utils';
import { SearchInput } from '@/components/SearchInput';

interface PairData {
  id: string;
  symbol: string;
  name: string;
  timeframe: string;
  version: string;
  performance: any;
  properties: any;
  riskPerformanceRatios: any;
  tradesAnalysis: any;
  createdAt: string;
  subscriptions?: Subscription[];
  metrics: {
    roi: number;
    riskReward: number;
    totalTrades: number;
    winRate: number;
    maxDrawdown: number;
    profit: number;
  };
  isPopular: boolean;
}

interface DashboardContentProps {
  initialData: ProcessedPairData[];
  initialStats: {
    total: number;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function DashboardContent({
  initialData,
  initialStats,
  searchParams,
}: DashboardContentProps) {
  const [pairs, setPairs] = useState<ProcessedPairData[]>(initialData);
  const [stats] = useState(initialStats);
  const [loading] = useState(false);
  const [filterBy, setFilterBy] = useState<string>('');

  const totalFilteredPairs = pairs.length;

  const columns: Column<PairData>[] = useMemo(() => [
    {
      key: 'subscription',
      header: 'Status',
      width: 'w-32',
      render: (value: any, row: PairData) => {
        const paymentStatus = row.subscriptions?.[0]?.status!;
        const inviteStatus = row.subscriptions?.[0]?.inviteStatus!;
        const expiryDate = row.subscriptions?.[0]?.expiryDate!;
        const expiryTs = expiryDate ? (expiryDate instanceof Date ? expiryDate.getTime() : new Date(expiryDate).getTime()) : undefined;
        let userSubscriptionStatus = 
          paymentStatus === 'PAID' && inviteStatus === 'COMPLETED' ? SubscriptionStatus.ACTIVE
          : paymentStatus === 'PAID' && inviteStatus === 'SENT' ? 'INVITED'
          : inviteStatus === 'PENDING' ? SubscriptionStatus.PENDING
          : expiryTs !== undefined && Math.floor((expiryTs - Date.now()) / (24 * 60 * 60 * 1000)) <= 3 ? SubscriptionStatus.RENEWING
          : SubscriptionStatus.TRIAL;

        return (
          <div className="flex flex-col gap-1">
            <SubscribeButton
              userSubscriptionStatus={userSubscriptionStatus as SubscriptionStatus}
              isUserLoggedIn={true}
              pair={row as any}
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
      key: 'version',
      header: 'Version',
      sortable: true,
      align: 'center',
      accessor: (row: PairData) => row.version,
      render: (value: string) => (
        <div className="flex flex-col items-center">
          <span className="font-medium text-white">
            {value || 'N/A'}
          </span>
          <span className="text-xs text-slate-400">
            version
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
            ${value.toFixed(1)}
          </span>
          {/* <span className="text-xs text-slate-400">
            {(value / 100).toFixed(2)}%
          </span> */}
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
          <Link href={`/dashboard/${row.id}`} title='View Details'>
            <Eye className="h-4 w-4 mr-2" />
          </Link>
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
              {(() => {
                const totalPairs = pairs.length;
                const profitableCount = pairs.reduce((count, pair) => count + (pair.metrics.roi > 0 ? 1 : 0), 0);
                const totalProfit = pairs.reduce((sum, pair) => sum + pair.metrics.profit, 0);
                const bestRoiPair = totalPairs > 0
                  ? pairs.reduce((best, p) => (p.metrics.roi > best.metrics.roi ? p : best), pairs[0])
                  : null;

                return (
                  <OverviewSection
                    overviewData={[
                      {
                        title: 'Total Pairs',
                        currentValue: stats.total,
                        icon: BarChart3,
                        description: 'Available trading pairs',
                        pastValue: '+2 new pairs this month',
                      },
                      {
                        title: 'Profitable Pairs',
                        currentValue: profitableCount,
                        icon: Target,
                        description: `${totalPairs > 0 ? ((profitableCount / totalPairs) * 100).toFixed(1) + '%' : 'N/A'} win rate`,
                        pastValue: `${profitableCount} pairs`,
                      },
                      {
                        title: 'Total Profit',
                        currentValue: `$${totalProfit.toLocaleString()}`,
                        icon: DollarSign,
                        description: 'Combined performance',
                        pastValue: '+15.2% this quarter',
                      },
                      {
                        title: 'Best Performer',
                        // Return the pair symbol with the highest ROI (or 'N/A' when no pairs)
                        currentValue: bestRoiPair ? `${bestRoiPair.metrics.roi.toFixed(2)}% ROI` : 'No pairs available',
                        icon: Award,
                        description: bestRoiPair ? bestRoiPair.symbol : 'N/A',
                        pastValue: 'Top performing pair',
                      },
                    ]}
                    className="mb-0 grid-cols-2 md:grid-cols-4 w-[200%] md:w-full"
                  />
                );
              })()}
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
                  <div className="flex items-center gap-4">
                    <p className='text-sm text-gray-200'>{`${pairs.length} pairs`}</p>
                    <div className='w-full sm:w-xs'>
                      <SearchInput
                        placeholder="Search trading pairs..."
                        className="mb-4 w-full sm:max-w-96"
                      />
                    </div>
                  </div>
                  {/* <ClientSortFilterBar
                    filterBy={filterBy}
                    totalResults={totalFilteredPairs}
                    className="w-[200%] md:w-full flex-row!"
                  /> */}
                  <ReusableTable
                    data={pairs}
                    columns={columns as Column<any>[]}
                    title="Trading Pairs"
                    icon={TrendingUp}
                    isLoading={loading}
                    searchable={true}
                    searchFields={['symbol', 'name', 'timeframe']}
                    emptyStateTitle="No trading pairs found"
                    emptyStateDescription="We couldn't find any trading pairs matching your criteria"
                    enableRowDetails={true}
                    rowDetailTitle={(pair: any) => `${pair.symbol} - ${pair.name}`}
                    excludeFromDetails={['id']}
                    enableColumnSelector={true}
                    defaultVisibleColumns={[
                      'subscription',
                      'symbol',
                      'timeframe',
                      'metrics.totalTrades',
                      'metrics.winRate',
                      'metrics.roi',
                      'metrics.riskReward',
                      'metrics.maxDrawdown',
                      'metrics.profit',
                      'actions',
                    ]}
                    enableAccordion={true}
                    // accordionTitle={(pair) => `Subscriptions for ${pair.symbol}`}
                    accordionContent={(pair) => (
                      <Suspense fallback={<div className="animate-pulse h-32 bg-slate-800 rounded-lg"></div>}>
                        <AccordionContent pair={pair} />
                      </Suspense>
                    )}
                    rowDetailContent={(pair) => (
                      <Suspense fallback={<div className="animate-pulse h-64 bg-slate-800 rounded-lg"></div>}>
                        <RowDetailContent pair={pair} />
                      </Suspense>
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