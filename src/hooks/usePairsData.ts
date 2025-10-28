'use client';

import { useState, useEffect } from 'react';
import { ProcessedPairData, processPairsData } from '@/lib/utils';

interface UsePairsDataReturn {
  pairs: ProcessedPairData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePairsData(): UsePairsDataReturn {
  const [pairs, setPairs] = useState<ProcessedPairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPairs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/backtest');
      if (!response.ok) {
        console.error(`Failed to fetch pairs: ${response.statusText}`);
        throw new Error(`Failed to fetch pairs: ${response.statusText}`);
      }

      const data = await response.json();
      const processedPairs = processPairsData(data.pairs || []);
      setPairs(processedPairs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching pairs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPairs();
  }, []);

  return {
    pairs,
    loading,
    error,
    refetch: fetchPairs,
  };
}