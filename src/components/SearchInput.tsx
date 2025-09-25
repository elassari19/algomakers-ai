'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export function SearchInput({ placeholder }: Props) {
  // get search params
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  // get current url pathname
  const pathname = usePathname();

  // useDebouncedCallback using for delay
  const handleSearch = useDebouncedCallback((e: any) => {
    // update search params immediately
    const params = new URLSearchParams(searchParams);

    params.set('page', '1');

    if (e.target.value && e.target.value.length > 2) {
      params.set('q', e.target.value);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params}`);
  }, 500);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
      <Input
        type="text"
        placeholder={placeholder}
        defaultValue={searchParams.get('q') || ''}
        onChange={handleSearch}
        className="pl-10 pr-10 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-slate-400 focus:border-white/40 focus:ring-white/20"
      />
    </div>
  );
}
