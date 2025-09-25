'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { SortFilterBar } from './SortFilterBar';

interface ClientSortFilterBarProps {
  searchQuery: string;
  filterBy: string;
  totalResults: number;
}

export function ClientSortFilterBar({
  searchQuery,
  filterBy,
  totalResults,
}: ClientSortFilterBarProps) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');

    if (filter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filter);
    }
    replace(`${pathname}?${params}`);
  };

  return (
    <div>
      <SortFilterBar
        filterBy={filterBy}
        onFilterChange={handleFilterChange}
        totalResults={totalResults}
      />
    </div>
  );
}
