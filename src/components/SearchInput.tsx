'use client';

import React, { useRef, useState } from 'react';
import { Input } from './ui/input';

export function SearchInput() {
  const [value, setValue] = useState('');
  const [bouncing, setBouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setBouncing(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setBouncing(false), 1000);
  };

  return (
    <Input
      className={`flex-1 h-9 max-w-md rounded-lg bg-muted/40 border-none text-sm transition-transform duration-300 ${
        bouncing ? 'animate-bounce' : ''
      }`}
      placeholder="Search pair for anything"
      type="text"
      aria-label="Search"
      value={value}
      onChange={handleChange}
    />
  );
}
