'use client';

import { useState, useEffect } from 'react';

interface CurrencyQuote {
  symbol: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  datetime: string;
}

interface UseTwelveDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useTwelveDataQuote(
  symbol: string,
  options: UseTwelveDataOptions = {}
) {
  const { enabled = true, refetchInterval = 30000 } = options; // Default 30 seconds
  const [data, setData] = useState<CurrencyQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async () => {
    if (!symbol || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/twelvedata/quote?symbol=${symbol}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch quote: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching TwelveData quote:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();

    if (refetchInterval > 0) {
      const interval = setInterval(fetchQuote, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, enabled, refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchQuote,
  };
}

export function useTwelveDataSymbols(searchTerm?: string) {
  const [symbols, setSymbols] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSymbols = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = searchTerm
        ? `/api/twelvedata/symbols?search=${encodeURIComponent(searchTerm)}`
        : '/api/twelvedata/symbols';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch symbols: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setSymbols(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching TwelveData symbols:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymbols();
  }, [searchTerm]);

  return {
    symbols,
    loading,
    error,
    refetch: fetchSymbols,
  };
}
