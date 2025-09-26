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
    expiryDate?: string;
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
}

export function ClientPairTable({
  pairs,
  isUserLoggedIn,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
}: ClientPairTableProps) {
  return (
    <div className="space-y-4">
      <PairTable
        pairs={pairs}
        isLoading={false}
        isUserLoggedIn={isUserLoggedIn}
        pagination={{
          currentPage,
          totalPages,
          itemsPerPage,
          totalItems,
        }}
      />
    </div>
  );
}
