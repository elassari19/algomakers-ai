'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PairTable } from './PairTable';

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
  subscription?: {
    status: 'active' | 'expiring' | 'expired' | 'pending';
    expiryDate?: Date;
  };
  isPopular?: boolean;
}

interface ClientPairTableProps {
  pairs: PairData[];
  isUserLoggedIn: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onSubscribe?: (pairId: string) => void;
  onRenew?: (pairId: string) => void;
  onUpgrade?: (pairId: string) => void;
}

export function ClientPairTable({
  pairs,
  isUserLoggedIn,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onSubscribe,
  onRenew,
  onUpgrade,
}: ClientPairTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateURLParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`?${params.toString()}`);
  };

  const handleNavigateToPair = (pairId: string) => {
    router.push(`/pair/${pairId}`);
  };

  const handlePageChange = (page: number) => {
    updateURLParams({ page: page.toString() });
  };

  const handleItemsPerPageChange = (limit: number) => {
    updateURLParams({
      limit: limit.toString(),
      page: '1', // Reset to first page when changing items per page
    });
  };

  const handleSubscribe = (
    pairId: string,
    action: 'subscribe' | 'renew' | 'upgrade'
  ) => {
    if (action === 'subscribe' && onSubscribe) {
      onSubscribe(pairId);
    } else if (action === 'renew' && onRenew) {
      onRenew(pairId);
    } else if (action === 'upgrade' && onUpgrade) {
      onUpgrade(pairId);
    }
  };

  // Create a modified PairTable that accepts pagination props
  return (
    <div className="space-y-4">
      <PairTable
        pairs={pairs}
        isLoading={false}
        isUserLoggedIn={isUserLoggedIn}
        onNavigate={handleNavigateToPair}
        onSubscribe={handleSubscribe}
        // Pass pagination data as additional props
        pagination={{
          currentPage,
          totalPages,
          itemsPerPage,
          totalItems,
          onPageChange: handlePageChange,
          onItemsPerPageChange: handleItemsPerPageChange,
        }}
      />
    </div>
  );
}
