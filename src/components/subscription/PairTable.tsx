'use client';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PairTableRow } from './PairTableRow';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { PaginationControls } from '../ui/pagination-controls';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

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
  isPopular?: boolean;
}

interface PairTableProps {
  pairs: PairData[];
  isLoading?: boolean;
  isUserLoggedIn: boolean;
  onSubscribe?: (
    pairId: string,
    action: 'subscribe' | 'renew' | 'upgrade'
  ) => void;
  className?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
  };
}

export function PairTable({
  pairs,
  isLoading = false,
  isUserLoggedIn,
  className,
  pagination,
}: PairTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [sortField, setSortField] = useState<
    keyof PairData['metrics'] | 'symbol' | 'timeframe'
  >('roi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get pagination and search values from URL params or use external pagination or defaults
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlLimit = parseInt(searchParams.get('limit') || '5');
  const searchQuery = searchParams.get('q') || '';

  const currentPage = pagination?.currentPage ?? urlPage;
  const itemsPerPage = pagination?.itemsPerPage ?? urlLimit;

  // Filter pairs based on search query
  const filteredPairs = searchQuery
    ? pairs.filter(
        (pair) =>
          pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pair.timeframe &&
            pair.timeframe.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : pairs;

  // Sort pairs based on current sort field and direction
  const sortedPairs = [...filteredPairs].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortField === 'symbol') {
      aValue = a.symbol;
      bValue = b.symbol;
    } else if (sortField === 'timeframe') {
      aValue = a.timeframe || '';
      bValue = b.timeframe || '';
    } else {
      aValue = a.metrics[sortField];
      bValue = b.metrics[sortField];
    }

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Calculate pagination - always use internal pagination unless external is provided
  const totalItemsCount = pagination?.totalItems ?? sortedPairs.length;
  const totalPages =
    pagination?.totalPages ?? Math.ceil(sortedPairs.length / itemsPerPage);

  // Always slice the data for display unless external pagination is managing it
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPairs = pagination
    ? sortedPairs // External pagination manages the data
    : sortedPairs.slice(startIndex, endIndex); // Internal pagination slices the data

  // Reset to page 1 if current page is beyond available pages due to search filtering
  useEffect(() => {
    if (!pagination && currentPage > totalPages && totalPages > 0) {
      const params = new URLSearchParams(searchParams);
      params.set('page', '1');
      router.replace(`${pathname}?${params}`);
    }
  }, [currentPage, totalPages, pagination, searchParams, router, pathname]);

  // Reset to first page when sorting changes
  const handleSort = (
    field: keyof PairData['metrics'] | 'symbol' | 'timeframe'
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    // Note: Page reset is handled by PaginationControls via URL params
  };

  const getSortIcon = (
    field: keyof PairData['metrics'] | 'symbol' | 'timeframe'
  ) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-500" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-400" />
    );
  };

  if (isLoading) {
    return (
      <Card
        className={`bg-white/10 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-white">Trading Pairs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pairs.length === 0) {
    return (
      <Card
        className={`bg-white/10 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-white py-2">Trading Pairs</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Search}
            title="No trading pairs found"
            description="We couldn't find any trading pairs matching your criteria."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white/5 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 ${className}`}
    >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 h-0">
          <TrendingUp className="h-5 w-5" />
          Trading Pairs
          <span className="text-sm text-white/70 font-normal">
            ({pairs.length} pairs available)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 sm:px-3">
        <div className="rounded-lg border border-white/20 overflow-hidden bg-white/5 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 bg-white/5 backdrop-blur-sm">
                <TableHead className="text-white/80 w-32">Status</TableHead>
                <TableHead className="text-white/80">
                  <button
                    onClick={() => handleSort('symbol')}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    Pair
                    {getSortIcon('symbol')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center">
                  <button
                    onClick={() => handleSort('roi')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    ROI
                    {getSortIcon('roi')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center">
                  <button
                    onClick={() => handleSort('riskReward')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    R/R
                    {getSortIcon('riskReward')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center">
                  <button
                    onClick={() => handleSort('totalTrades')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Trades
                    {getSortIcon('totalTrades')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center">
                  <button
                    onClick={() => handleSort('winRate')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Win Rate
                    {getSortIcon('winRate')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center">
                  <button
                    onClick={() => handleSort('maxDrawdown')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Max DD
                    {getSortIcon('maxDrawdown')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center">
                  <button
                    onClick={() => handleSort('profit')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Profit
                    {getSortIcon('profit')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center">
                  <button
                    onClick={() => handleSort('timeframe')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Timeframe
                    {getSortIcon('timeframe')}
                  </button>
                </TableHead>
                <TableHead className="text-white/80 text-center w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPairs.map((pair) => (
                <PairTableRow
                  key={pair.id}
                  pair={pair}
                  allPairs={pairs}
                  isUserLoggedIn={isUserLoggedIn}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls - only show if there are multiple pages */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItemsCount}
            className="mt-4"
          />
        )}
      </CardContent>
    </Card>
  );
}
