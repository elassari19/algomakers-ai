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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  onNavigate?: (pairId: string) => void;
  className?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (limit: number) => void;
  };
}

export function PairTable({
  pairs,
  isLoading = false,
  isUserLoggedIn,
  onNavigate,
  className,
  pagination,
}: PairTableProps) {
  const [sortField, setSortField] = useState<
    keyof PairData['metrics'] | 'symbol' | 'timeframe'
  >('roi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Use external pagination if provided, otherwise use internal state
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalItemsPerPage, setInternalItemsPerPage] = useState(5);

  const currentPage = pagination?.currentPage ?? internalCurrentPage;
  const itemsPerPage = pagination?.itemsPerPage ?? internalItemsPerPage;

  // Sort pairs based on current sort field and direction
  const sortedPairs = [...pairs].sort((a, b) => {
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

  // Calculate pagination for internal use or use external values
  const totalItemsCount = pagination?.totalItems ?? sortedPairs.length;
  const totalPages =
    pagination?.totalPages ?? Math.ceil(sortedPairs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPairs = pagination
    ? sortedPairs
    : sortedPairs.slice(startIndex, endIndex);

  // Reset to first page when sorting changes (only for internal pagination)
  const handleSort = (
    field: keyof PairData['metrics'] | 'symbol' | 'timeframe'
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    if (!pagination) {
      setInternalCurrentPage(1); // Reset to first page
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = Number(value);
    if (pagination) {
      pagination.onItemsPerPageChange(newItemsPerPage);
    } else {
      setInternalItemsPerPage(newItemsPerPage);
      setInternalCurrentPage(1); // Reset to first page
    }
  };

  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    if (pagination) {
      pagination.onPageChange(targetPage);
    } else {
      setInternalCurrentPage(targetPage);
    }
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

  const handlePairClick = (pairId: string) => {
    if (onNavigate) {
      onNavigate(pairId);
    }
  };
  if (isLoading) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">Trading Pairs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-slate-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pairs.length === 0) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
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
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 h-0">
          <TrendingUp className="h-5 w-5" />
          Trading Pairs
          <span className="text-sm text-slate-400 font-normal">
            ({pairs.length} pairs available)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 bg-slate-900/50">
                <TableHead className="text-slate-300 w-32">Status</TableHead>
                <TableHead className="text-slate-300">
                  <button
                    onClick={() => handleSort('symbol')}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    Pair
                    {getSortIcon('symbol')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <button
                    onClick={() => handleSort('roi')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    ROI
                    {getSortIcon('roi')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <button
                    onClick={() => handleSort('riskReward')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    R/R
                    {getSortIcon('riskReward')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <button
                    onClick={() => handleSort('totalTrades')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Trades
                    {getSortIcon('totalTrades')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <button
                    onClick={() => handleSort('winRate')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Win Rate
                    {getSortIcon('winRate')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <button
                    onClick={() => handleSort('maxDrawdown')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Max DD
                    {getSortIcon('maxDrawdown')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <button
                    onClick={() => handleSort('profit')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Profit
                    {getSortIcon('profit')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <button
                    onClick={() => handleSort('timeframe')}
                    className="flex items-center justify-center gap-2 hover:text-white transition-colors w-full"
                  >
                    Timeframe
                    {getSortIcon('timeframe')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 text-center w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPairs.map((pair) => (
                <PairTableRow
                  key={pair.id}
                  pair={pair}
                  isUserLoggedIn={isUserLoggedIn}
                  onSubscribe={() => console.log('Subscribe to', pair.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Rows per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-16 h-8 bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-400">
                Showing {startIndex + 1} to{' '}
                {Math.min(endIndex, totalItemsCount)} of {totalItemsCount} pairs
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore =
                      index > 0 && page - array[index - 1] > 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsisBefore && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === page
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-slate-800 border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
