import { Suspense } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ClientSortFilterBar } from '@/components/subscription/ClientSortFilterBar';
import { GradientBackground } from '@/components/ui/gradient-background';
import { PairTable } from '../../../components/subscription/PairTable';
import { mockPairs } from '@/lib/dummy-data';

interface IProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    limit?: string;
    page?: string;
    q?: string;
  }>;
}

export default async function DashboardPage(props: IProps) {
  const { search, filter, limit, page, q } = await props.searchParams;

  // Extract URL params with defaults
  const searchQuery = search || '';
  const filterBy = filter || 'all';
  const currentPage = parseInt(page || '1');
  const itemsPerPage = parseInt(limit || '5');

  // Mock user state - replace with real auth
  const isUserLoggedIn = true;

  // Calculate stats from pairs data
  const totalPairs = mockPairs.length;
  const profitablePairs = mockPairs.filter(
    (pair) => pair.metrics.profit > 0
  ).length;
  const totalProfit = mockPairs.reduce(
    (sum, pair) => sum + pair.metrics.profit,
    0
  );

  // Find best performer by ROI
  const bestPerformer = mockPairs.reduce((best, current) =>
    current.metrics.roi > best.metrics.roi ? current : best
  );

  const dashboardStats = {
    totalPairs,
    profitablePairs,
    totalProfit,
    bestPerformer: {
      symbol: bestPerformer.symbol,
      roi: bestPerformer.metrics.roi,
    },
  };

  // Filter pairs based on URL params
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
        case 'subscribed':
          filtered = filtered.filter(
            (pair) =>
              pair.subscription &&
              (pair.subscription.status === 'active' ||
                pair.subscription.status === 'expiring')
          );
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
      <div className="flex flex-1 flex-col gap-6  md:p-6 pt-0">
        {/* Dashboard Statistics */}
        <div className="mb-2">
          <DashboardStats
            totalPairs={dashboardStats.totalPairs}
            profitablePairs={dashboardStats.profitablePairs}
            totalProfit={dashboardStats.totalProfit}
            bestPerformer={dashboardStats.bestPerformer}
            className="mb-0 opacity-95"
          />
        </div>

        {/* Trading Pairs Table Section */}
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="mb-4">
            <Suspense
              fallback={
                <div className="animate-pulse h-16 bg-white/10 rounded-md"></div>
              }
            >
              <ClientSortFilterBar
                filterBy={filterBy}
                totalResults={totalFilteredPairs}
              />
            </Suspense>
          </div>

          {/* Main Pairs Table */}
          <div className="">
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
              <PairTable
                pairs={paginatedPairs}
                isLoading={false}
                isUserLoggedIn={isUserLoggedIn}
                pagination={{
                  currentPage,
                  totalPages,
                  itemsPerPage,
                  totalItems: totalFilteredPairs,
                }}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
