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
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Update local state when URL search query changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // useDebouncedCallback for search delay
  const handleSearch = useDebouncedCallback((e: any) => {
    // update search params immediately
    const params = new URLSearchParams(searchParams);

    params.set('page', '1');

    if (e.target.value) {
      e.target.value.length > 2 && params.set('search', e.target.value);
    } else {
      params.delete('search');
    }
    replace(`${pathname}?${params}`);
  }, 1000);

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    // Create a synthetic event object for the debounced callback
    const syntheticEvent = { target: { value: query } };
    handleSearch(syntheticEvent);
  };

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
    <SortFilterBar
      searchQuery={localSearchQuery}
      onSearchChange={handleSearchChange}
      filterBy={filterBy}
      onFilterChange={handleFilterChange}
      totalResults={totalResults}
    />
  );
}
