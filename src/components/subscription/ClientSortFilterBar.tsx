'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SortFilterBar } from './SortFilterBar';

interface ClientSortFilterBarProps {
  filterBy: string;
  totalResults: number;
  className?: string;
}

export function ClientSortFilterBar({
  filterBy,
  totalResults,
  className,
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
        className={className}
      />
    </div>
  );
}
