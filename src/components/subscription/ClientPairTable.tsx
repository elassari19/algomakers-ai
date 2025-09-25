import { PairTable } from './PairTable';
import { PaginationControls } from '@/components/ui/pagination-controls';

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
      />

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        className="mt-4"
      />
    </div>
  );
}
