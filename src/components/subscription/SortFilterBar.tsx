'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SortAsc, SortDesc } from 'lucide-react';

interface SortFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterBy: string;
  onFilterChange: (filterBy: string) => void;
  totalResults: number;
  className?: string;
}

export function SortFilterBar({
  searchQuery,
  onSearchChange,
  filterBy,
  onFilterChange,
  totalResults,
  className,
}: SortFilterBarProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search pairs (min. 2 characters)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
          />
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <div className="absolute top-full left-0 mt-1 text-xs text-slate-400">
              Enter at least 2 characters to search
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={onFilterChange}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Pairs</SelectItem>
              <SelectItem value="forex">Forex</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="commodities">Commodities</SelectItem>
              <SelectItem value="profitable">Profitable Only</SelectItem>
              <SelectItem value="popular">Popular Pairs</SelectItem>
              <SelectItem value="subscribed">My Subscriptions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
