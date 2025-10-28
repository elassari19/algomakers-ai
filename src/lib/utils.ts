import { Pair, Subscription } from '@/generated/prisma';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (value === 0) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return sign + (absValue / 1e9).toFixed(1) + 'B';
  } else if (absValue >= 1e6) {
    return sign + (absValue / 1e6).toFixed(1) + 'M';
  } else if (absValue >= 1e3) {
    return sign + (absValue / 1e3).toFixed(1) + 'k';
  } else if (absValue >= 1) {
    return sign + absValue.toFixed(0);
  } else {
    return sign + absValue.toFixed(0);
  }
}

export interface PairMetrics {
  roi: number;
  riskReward: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  profit: number;
}

export interface ProcessedPairData extends Pair {
  subscriptions: Subscription[];
  isPopular: boolean;
  metrics: PairMetrics;
}

export function processPairsData(pairs: any[]): ProcessedPairData[] {
  return pairs.map((pair: any) => {
    const performance = JSON.parse(pair.performance || '[]');
    const properties = JSON.parse(pair.properties || '[]');
    const riskPerfRatios = JSON.parse(pair.riskPerformanceRatios || '[]');
    const tradesAnalysis = JSON.parse(pair.tradesAnalysis || '[]');

    return {
      ...pair,
      performance: [],
      properties: [],
      riskPerformanceRatios: [],
      tradesAnalysis: [],
      listOfTrades: [],
      name: pair.symbol.split('/')[0] || pair.symbol, // Simple name extraction
      metrics: {
        roi: performance[1]?.['All USDT'] ? (10000 / performance[1]['All USDT']) * 100 : 0,
        riskReward: tradesAnalysis[9]?.['All USDT'] || 0,
        totalTrades: tradesAnalysis[0]?.['All USDT'] || 0,
        winRate: tradesAnalysis[0]?.['All USDT'] && tradesAnalysis[2]?.['All USDT']
          ? (tradesAnalysis[2]['All USDT'] / tradesAnalysis[0]['All USDT'] * 100)
          : 0,
        maxDrawdown: performance[7]?.['All USDT'] || 0,
        profit: performance[1]?.['All USDT'] || 0,
      },
      isPopular: false,
    };
  });
}
