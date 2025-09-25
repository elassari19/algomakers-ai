import { Suspense } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ClientSortFilterBar } from '@/components/subscription/ClientSortFilterBar';
import { GradientBackground } from '@/components/ui/gradient-background';
import { PairTable } from '../../../components/subscription/PairTable';

// Mock data - replace with real API calls
export const mockPairs = [
  {
    id: '1',
    symbol: 'EURUSD',
    name: 'Euro vs US Dollar',
    metrics: {
      roi: 45.2,
      riskReward: 2.3,
      totalTrades: 124,
      winRate: 68.5,
      maxDrawdown: 8.2,
      profit: 15420,
    },
    timeframe: '1H',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-10-15T00:00:00.000Z',
    },
    isPopular: true,
  },
  {
    id: '2',
    symbol: 'GBPJPY',
    name: 'British Pound vs Japanese Yen',
    metrics: {
      roi: 32.1,
      riskReward: 1.8,
      totalTrades: 89,
      winRate: 72.0,
      maxDrawdown: 12.5,
      profit: 8950,
    },
    timeframe: '4H',
    subscription: {
      status: 'expiring' as const,
      expiryDate: '2025-09-28T00:00:00.000Z',
    },
  },
  {
    id: '3',
    symbol: 'BTCUSD',
    name: 'Bitcoin vs US Dollar',
    metrics: {
      roi: 128.7,
      riskReward: 3.2,
      totalTrades: 67,
      winRate: 61.2,
      maxDrawdown: 18.9,
      profit: 34560,
    },
    timeframe: '15M',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-12-15T00:00:00.000Z',
    },
    isPopular: true,
  },
  {
    id: '4',
    symbol: 'XAUUSD',
    name: 'Gold vs US Dollar',
    metrics: {
      roi: 28.4,
      riskReward: 2.1,
      totalTrades: 156,
      winRate: 65.4,
      maxDrawdown: 9.8,
      profit: 12340,
    },
    timeframe: '1D',
    subscription: {
      status: 'expired' as const,
      expiryDate: '2025-09-15T00:00:00.000Z',
    },
  },
  {
    id: '5',
    symbol: 'USDJPY',
    name: 'US Dollar vs Japanese Yen',
    metrics: {
      roi: -8.2,
      riskReward: 1.2,
      totalTrades: 198,
      winRate: 48.5,
      maxDrawdown: 15.3,
      profit: -2340,
    },
    timeframe: '30M',
    subscription: {
      status: 'expired' as const,
      expiryDate: '2025-09-10T00:00:00.000Z',
    },
  },
  {
    id: '6',
    symbol: 'AUDUSD',
    name: 'Australian Dollar vs US Dollar',
    metrics: {
      roi: 18.7,
      riskReward: 1.9,
      totalTrades: 142,
      winRate: 59.2,
      maxDrawdown: 11.3,
      profit: 8750,
    },
    timeframe: '2H',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-30T00:00:00.000Z',
    },
  },
  {
    id: '7',
    symbol: 'NZDUSD',
    name: 'New Zealand Dollar vs US Dollar',
    metrics: {
      roi: 22.1,
      riskReward: 2.4,
      totalTrades: 98,
      winRate: 63.3,
      maxDrawdown: 9.7,
      profit: 6420,
    },
    timeframe: '1W',
    subscription: {
      status: 'pending' as const,
    },
  },
  {
    id: '8',
    symbol: 'USDCAD',
    name: 'US Dollar vs Canadian Dollar',
    metrics: {
      roi: 35.8,
      riskReward: 2.7,
      totalTrades: 187,
      winRate: 67.9,
      maxDrawdown: 7.8,
      profit: 14230,
    },
    timeframe: '30M',
    isPopular: true,
  },
  {
    id: '9',
    symbol: 'USDCHF',
    name: 'US Dollar vs Swiss Franc',
    metrics: {
      roi: 12.4,
      riskReward: 1.6,
      totalTrades: 156,
      winRate: 55.8,
      maxDrawdown: 13.2,
      profit: 4560,
    },
    timeframe: '1H',
    subscription: {
      status: 'pending' as const,
    },
  },
  {
    id: '10',
    symbol: 'EURGBP',
    name: 'Euro vs British Pound',
    metrics: {
      roi: 41.3,
      riskReward: 2.8,
      totalTrades: 134,
      winRate: 71.6,
      maxDrawdown: 8.9,
      profit: 16780,
    },
    timeframe: '1H',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-20T00:00:00.000Z',
    },
  },
  {
    id: '11',
    symbol: 'EURJPY',
    name: 'Euro vs Japanese Yen',
    metrics: {
      roi: 29.6,
      riskReward: 2.2,
      totalTrades: 176,
      winRate: 64.2,
      maxDrawdown: 10.5,
      profit: 11340,
    },
    timeframe: '2H',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-12-01T00:00:00.000Z',
    },
  },
  {
    id: '12',
    symbol: 'GBPUSD',
    name: 'British Pound vs US Dollar',
    metrics: {
      roi: 37.9,
      riskReward: 2.5,
      totalTrades: 143,
      winRate: 69.2,
      maxDrawdown: 9.1,
      profit: 13890,
    },
    timeframe: '1D',
    subscription: {
      status: 'expiring' as const,
      expiryDate: '2025-10-01T00:00:00.000Z',
    },
    isPopular: true,
  },
  {
    id: '13',
    symbol: 'ETHUSD',
    name: 'Ethereum vs US Dollar',
    metrics: {
      roi: 89.2,
      riskReward: 3.1,
      totalTrades: 78,
      winRate: 58.9,
      maxDrawdown: 22.4,
      profit: 28540,
    },
    timeframe: '1H',
    isPopular: true,
  },
  {
    id: '14',
    symbol: 'LTCUSD',
    name: 'Litecoin vs US Dollar',
    metrics: {
      roi: 15.7,
      riskReward: 1.8,
      totalTrades: 92,
      winRate: 52.2,
      maxDrawdown: 18.7,
      profit: 5230,
    },
    timeframe: '4H',
    subscription: {
      status: 'expiring' as const,
      expiryDate: '2025-10-05T00:00:00.000Z',
    },
  },
  {
    id: '15',
    symbol: 'ADAUSD',
    name: 'Cardano vs US Dollar',
    metrics: {
      roi: 67.3,
      riskReward: 2.9,
      totalTrades: 65,
      winRate: 60.0,
      maxDrawdown: 25.1,
      profit: 19870,
    },
    timeframe: '1D',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-15T00:00:00.000Z',
    },
  },
  {
    id: '16',
    symbol: 'USDNOK',
    name: 'US Dollar vs Norwegian Krone',
    metrics: {
      roi: 67.3,
      riskReward: 2.9,
      totalTrades: 65,
      winRate: 60.0,
      maxDrawdown: 25.1,
      profit: 19870,
    },
    timeframe: '1D',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-15T00:00:00.000Z',
    },
  },
  {
    id: '17',
    symbol: 'BGPAUD',
    name: 'British Gas vs Australian Dollar',
    metrics: {
      roi: 67.3,
      riskReward: 2.9,
      totalTrades: 65,
      winRate: 60.0,
      maxDrawdown: 25.1,
      profit: 19870,
    },
    timeframe: '1D',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-15T00:00:00.000Z',
    },
  },
  {
    id: '18',
    symbol: 'XAGUSD',
    name: 'Silver vs US Dollar',
    metrics: {
      roi: 67.3,
      riskReward: 2.9,
      totalTrades: 65,
      winRate: 60.0,
      maxDrawdown: 25.1,
      profit: 19870,
    },
    timeframe: '1D',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-15T00:00:00.000Z',
    },
  },
  {
    id: '19',
    symbol: 'CLUSD',
    name: 'Crude Oil vs US Dollar',
    metrics: {
      roi: 67.3,
      riskReward: 2.9,
      totalTrades: 65,
      winRate: 60.0,
      maxDrawdown: 25.1,
      profit: 19870,
    },
    timeframe: '1D',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-15T00:00:00.000Z',
    },
  },
  {
    id: '20',
    symbol: 'EURCAD',
    name: 'Euro vs Canadian Dollar',
    metrics: {
      roi: 67.3,
      riskReward: 2.9,
      totalTrades: 65,
      winRate: 60.0,
      maxDrawdown: 25.1,
      profit: 19870,
    },
    timeframe: '1D',
    subscription: {
      status: 'active' as const,
      expiryDate: '2025-11-15T00:00:00.000Z',
    },
  },
];

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
