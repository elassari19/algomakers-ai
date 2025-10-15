import { Suspense } from 'react';
import { GradientBackground } from '@/components/ui/gradient-background';
import DashboardContent from './DashboardContent';
import { getPairs } from '@/app/api/services';

interface PairData {
  id: string;
  symbol: string;
  name: string;
  timeframe: string;
  performance: any;
  properties: any;
  riskPerformanceRatios: any;
  tradesAnalysis: any;
  createdAt: string;
  subscriptions?: any[];
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

async function getDashboardData(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    // Extract URL params with defaults
    const q = (searchParams.q as string) || '';
    const filter = (searchParams.filter as string) || 'all';
    const limit = parseInt((searchParams.limit as string) || '20');
    const page = parseInt((searchParams.page as string) || '1');

    // Fetch pairs data server-side
    const result = await getPairs({
      q,
      type: filter !== 'all' ? filter : undefined,
      limit,
      page
    });

    // Map pairs data with metrics calculation
    const mappedPairs: PairData[] = result.pairs.map((pair: any) => {
      const performance = JSON.parse(pair.performance || '[]');
      const properties = JSON.parse(pair.properties || '[]');
      const riskPerfRatios = JSON.parse(pair.riskPerformanceRatios || '[]');
      const tradesAnalysis = JSON.parse(pair.tradesAnalysis || '[]');

      return {
        ...pair,
        performance: [],
        properties: [],
        riskPerfRatios: [],
        tradesAnalysis: [],
        name: pair.symbol.split('/')[0] || pair.symbol, // Simple name extraction
        metrics: {
          roi: performance[1]?.['All USDT'] ? (10000 / performance[1]['All USDT']) * 100 : 0,
          riskReward: tradesAnalysis[9]?.['All USDT'] || 0,
          totalTrades: tradesAnalysis[0]?.['All USDT'] || 0,
          winRate: tradesAnalysis[0]?.['All USDT'] && tradesAnalysis[2]?.['All USDT']
            ? (tradesAnalysis[2]['All USDT'] / tradesAnalysis[0]['All USDT'] * 100)
            : 0,
          maxDrawdown: performance[7]?.['All USDT'] || 0,
          profit: performance[1]?.['All USDT'] || 0,
        },
        isPopular: false,
      };
    });

    return {
      pairs: mappedPairs,
      stats: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      },
      searchParams: {
        q,
        filterBy: filter,
        currentPage: page.toString(),
        itemsPerPage: limit.toString()
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      pairs: [],
      stats: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      },
      searchParams: {
        q: '',
        filterBy: 'all',
        currentPage: '1',
        itemsPerPage: '20'
      }
    };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const data = await getDashboardData(searchParams);

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
      <DashboardContent
        initialData={data.pairs}
        initialStats={data.stats}
        searchParams={data.searchParams}
      />
    </Suspense>
  );
}
