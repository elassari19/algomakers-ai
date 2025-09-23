'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { PaymentModal } from '@/components/subscription/PaymentModal';
import { ClientPairTable } from '@/components/subscription/ClientPairTable';
import { ClientSortFilterBar } from '@/components/subscription/ClientSortFilterBar';

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
    subscription: undefined,
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
    subscription: undefined,
  },
  {
    id: '3',
    symbol: 'BTCUSD',
    name: 'Bitcoin vs US Dollar',
    metrics: {
      roi: 78.9,
      riskReward: 3.1,
      totalTrades: 67,
      winRate: 64.2,
      maxDrawdown: 15.8,
      profit: 22340,
    },
    timeframe: '1D',
    subscription: undefined,
  },
  {
    id: '4',
    symbol: 'XAUUSD',
    name: 'Gold vs US Dollar',
    metrics: {
      roi: 28.5,
      riskReward: 2.0,
      totalTrades: 45,
      winRate: 66.7,
      maxDrawdown: 9.3,
      profit: 5680,
    },
    timeframe: '4H',
    subscription: undefined,
    isPopular: true,
  },
  {
    id: '5',
    symbol: 'ETHUSD',
    name: 'Ethereum vs US Dollar',
    metrics: {
      roi: 56.3,
      riskReward: 2.7,
      totalTrades: 92,
      winRate: 70.8,
      maxDrawdown: 11.2,
      profit: 18750,
    },
    timeframe: '2H',
    subscription: undefined,
  },
];

interface SubscriptionFormData {
  pairIds: string[];
  plan: {
    id: string;
    period: string;
    months: number;
    price: number;
  };
  tradingViewUsername: string;
}

export default function SubscriptionsPage() {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPairIds, setSelectedPairIds] = useState<string[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Mock user authentication - replace with real auth
  const isUserLoggedIn = true;

  // Handle subscription button click from pair table
  const handleSubscribe = (pairId: string) => {
    setSelectedPairIds([pairId]);
    setSubscriptionModalOpen(true);
  };

  // Handle bulk subscribe button
  const handleBulkSubscribe = () => {
    setSelectedPairIds([]);
    setSubscriptionModalOpen(true);
  };

  // Handle subscription modal completion
  const handleSubscriptionComplete = (data: SubscriptionFormData) => {
    // Transform data for payment modal
    const paymentData = {
      pairIds: data.pairIds,
      pairNames: data.pairIds
        .map((id) => {
          const pair = mockPairs.find((p) => p.id === id);
          return pair ? pair.symbol : '';
        })
        .filter(Boolean),
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

  // Handle payment success
  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    // TODO: Update UI, redirect to dashboard, show success message
    setPaymentModalOpen(false);
    setSubscriptionData(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Strategies</h1>
          <p className="text-slate-400 mt-2">
            Subscribe to profitable trading pairs and get access to private
            TradingView signals.
          </p>
        </div>
        <Button
          onClick={handleBulkSubscribe}
          className="bg-blue-600 hover:bg-blue-500"
        >
          Subscribe to Multiple Pairs
        </Button>
      </div>

      {/* Filters and Search */}
      <ClientSortFilterBar
        searchQuery=""
        filterBy="all"
        totalResults={mockPairs.length}
      />

      {/* Pairs Table */}
      <ClientPairTable
        pairs={mockPairs}
        isUserLoggedIn={isUserLoggedIn}
        currentPage={1}
        totalPages={1}
        itemsPerPage={10}
        totalItems={mockPairs.length}
        onSubscribe={handleSubscribe}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        pairs={mockPairs.map((pair) => ({
          id: pair.id,
          symbol: pair.symbol,
          name: pair.name,
          metrics: {
            roi: pair.metrics.roi,
            winRate: pair.metrics.winRate,
            totalTrades: pair.metrics.totalTrades,
            profit: pair.metrics.profit,
          },
        }))}
        selectedPairIds={selectedPairIds}
        onSubscribe={handleSubscriptionComplete}
      />

      {/* Payment Modal */}
      {subscriptionData && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          subscriptionData={subscriptionData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
