'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ClientSortFilterBar } from '@/components/subscription/ClientSortFilterBar';
import { ClientPairTable } from '@/components/subscription/ClientPairTable';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { PaymentModal } from '@/components/subscription/PaymentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Mock data - replace with real API calls
const mockPairs = [
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
      expiryDate: new Date('2025-10-15'),
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
      expiryDate: new Date('2025-09-28'),
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
      expiryDate: new Date('2025-09-15'),
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
      expiryDate: new Date('2025-11-20'),
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
      expiryDate: new Date('2025-10-01'),
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
  },
];

export default function DashboardPage() {
  const searchParams = useSearchParams();

  // Extract URL params with defaults
  const searchQuery = searchParams.get('search') || '';
  const filterBy = searchParams.get('filter') || 'all';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const itemsPerPage = parseInt(searchParams.get('limit') || '10');
  // Modal state
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPairIds, setSelectedPairIds] = useState<string[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

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

  const handleSubscribe = (pairId: string) => {
    // Find the pair data
    const pair = filteredPairs.find((p) => p.id === pairId);
    if (pair) {
      setSelectedPairIds([pairId]);
      setSubscriptionModalOpen(true);
    }
  };

  const handleBulkSubscribe = (pairIds: string[]) => {
    if (pairIds.length > 0) {
      setSelectedPairIds(pairIds);
      setSubscriptionModalOpen(true);
    }
  };

  const handleRenew = (pairId: string) => {
    // Find the pair data
    const pair = filteredPairs.find((p) => p.id === pairId);
    if (pair) {
      setSelectedPairIds([pairId]);
      setSubscriptionModalOpen(true);
    }
  };

  const handleUpgrade = (pairId: string) => {
    // Find the pair data
    const pair = filteredPairs.find((p) => p.id === pairId);
    if (pair) {
      setSelectedPairIds([pairId]);
      setSubscriptionModalOpen(true);
    }
  };

  const handleSubscriptionSubmit = (data: any) => {
    // Transform the subscription data to match PaymentModal interface
    const paymentData = {
      pairIds: data.pairIds,
      pairNames: data.pairIds.map((id: string) => {
        const pair = filteredPairs.find((p) => p.id === id);
        return pair ? pair.symbol : '';
      }),
      plan: {
        period: data.plan.period,
        months: data.plan.months,
        price: data.plan.price,
      },
      tradingViewUsername: data.tradingViewUsername,
      totalAmount: data.plan.price * data.pairIds.length,
    };

    setSubscriptionData(paymentData);
    setSubscriptionModalOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSubscriptionData(null);
    setSelectedPairIds([]);
    // TODO: Refresh user subscription data
    // You might want to refetch the user's subscriptions here
  };

  const handleCloseSubscriptionModal = () => {
    setSubscriptionModalOpen(false);
    setSelectedPairIds([]);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSubscriptionData(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0 bg-slate-900 min-h-screen">
      {/* Dashboard Statistics */}
      <DashboardStats
        totalPairs={dashboardStats.totalPairs}
        profitablePairs={dashboardStats.profitablePairs}
        totalProfit={dashboardStats.totalProfit}
        bestPerformer={dashboardStats.bestPerformer}
        className="mb-2"
      />

      {/* Trading Pairs Table Section */}
      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <Suspense fallback={<div>Loading filters...</div>}>
          <ClientSortFilterBar
            searchQuery={searchQuery}
            filterBy={filterBy}
            totalResults={totalFilteredPairs}
          />
        </Suspense>

        {/* Quick Actions */}
        {totalFilteredPairs > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-slate-300">
                  <span className="font-medium">Quick Actions:</span>
                  <span className="text-slate-400 ml-2">
                    {totalFilteredPairs} pairs available
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleBulkSubscribe(
                        filteredPairs
                          .filter((p) => p.isPopular)
                          .map((p) => p.id)
                      )
                    }
                    disabled={
                      filteredPairs.filter((p) => p.isPopular).length === 0
                    }
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                  >
                    Subscribe to Popular (
                    {filteredPairs.filter((p) => p.isPopular).length})
                  </Button>
                  <Button
                    onClick={() =>
                      handleBulkSubscribe(
                        filteredPairs
                          .filter((p) => p.metrics.profit > 0)
                          .slice(0, 5)
                          .map((p) => p.id)
                      )
                    }
                    disabled={
                      filteredPairs.filter((p) => p.metrics.profit > 0)
                        .length === 0
                    }
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-400 hover:bg-green-600/10"
                  >
                    Subscribe to Top 5 Profitable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Pairs Table */}
        <Suspense fallback={<div>Loading table...</div>}>
          <ClientPairTable
            pairs={paginatedPairs}
            isUserLoggedIn={isUserLoggedIn}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalFilteredPairs}
            onSubscribe={handleSubscribe}
            onRenew={handleRenew}
            onUpgrade={handleUpgrade}
          />
        </Suspense>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={handleCloseSubscriptionModal}
        pairs={filteredPairs}
        selectedPairIds={selectedPairIds}
        onSubscribe={handleSubscriptionSubmit}
      />

      {/* Payment Modal */}
      {subscriptionData && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={handleClosePaymentModal}
          subscriptionData={subscriptionData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
