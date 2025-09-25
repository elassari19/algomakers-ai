'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useURLParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateURLParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const getParam = useCallback(
    (key: string, defaultValue?: string) => {
      return searchParams.get(key) || defaultValue || '';
    },
    [searchParams]
  );

  const getAllParams = useCallback(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  return {
    updateURLParams,
    getParam,
    getAllParams,
    searchParams,
  };
}
