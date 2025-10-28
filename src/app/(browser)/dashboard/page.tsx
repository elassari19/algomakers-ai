import { Suspense } from 'react';
import { GradientBackground } from '@/components/ui/gradient-background';
import DashboardContent from './DashboardContent';
import { getPairs } from '@/app/api/services';
import { processPairsData, type ProcessedPairData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard – AlgoMakers',
  description: 'Explore trading pairs, backtests and performance metrics on AlgoMakers.',
  keywords: ['dashboard', 'trading pairs', 'backtests', 'performance metrics', 'algorithmic trading', 'trading strategies', 'market analysis', 'AlgoMakers'],
  openGraph: {
    title: 'Dashboard – AlgoMakers',
    description: 'Explore trading pairs, backtests and performance metrics on AlgoMakers.',
    url: `${process.env.NEXTAUTH_URL || ''}/dashboard`,
    siteName: 'AlgoMakers',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${process.env.NEXTAUTH_URL || ''}/dashboard`,
  },
};

interface PairData extends ProcessedPairData {}

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

    // Map pairs data with metrics calculation using reusable utility
    const mappedPairs: PairData[] = processPairsData(result.pairs);

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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getDashboardData(resolvedSearchParams);

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
