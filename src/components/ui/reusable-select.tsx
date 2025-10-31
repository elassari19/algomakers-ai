'use client';

import React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReusableSelectProps {
  options: { value: string; label: string }[];
  type: string;
}

export const ReusableSelect: React.FC<ReusableSelectProps> = ({
  options,
  type,
}) => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const currentValue = searchParams.get(type) || '';

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') { // Assuming 'all' is default, don't add to URL
      params.set(type, value);
    } else {
      params.delete(type);
    }
    replace(`${pathname}?${params}`);
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full sm:w-40 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
        <SelectValue placeholder={`Filter by ${type}`} />
      </SelectTrigger>
      <SelectContent className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-xl">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};