'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '../SearchInput';

interface SortFilterBarProps {
  filterBy: string;
  onFilterChange: (filterBy: string) => void;
  totalResults: number;
  className?: string;
}

export function SortFilterBar({
  filterBy,
  onFilterChange,
  totalResults,
  className,
}: SortFilterBarProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Results Count */}
        <div className="text-sm text-white/80 font-medium">
          {totalResults} {totalResults === 1 ? 'pair' : 'pairs'} found
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <SearchInput placeholder={'Search pairs (min. 2 characters)...'} />

          {/* Filter */}
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={onFilterChange}>
              <SelectTrigger className="w-40 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-xl">
                <SelectItem
                  value="all"
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  All Pairs
                </SelectItem>
                <SelectItem
                  value="forex"
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  Forex
                </SelectItem>
                <SelectItem
                  value="crypto"
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  Crypto
                </SelectItem>
                <SelectItem
                  value="commodities"
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  Commodities
                </SelectItem>
                <SelectItem
                  value="profitable"
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  Profitable Only
                </SelectItem>
                <SelectItem
                  value="popular"
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  Popular Pairs
                </SelectItem>
                <SelectItem
                  value="subscribed"
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  My Subscriptions
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
