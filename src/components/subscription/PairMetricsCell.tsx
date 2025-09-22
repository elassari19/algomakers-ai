'use client';

import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PairMetricsCellProps {
  metric: {
    label: string;
    value: string | number;
    type: 'percentage' | 'ratio' | 'number' | 'currency';
    trend?: 'up' | 'down' | 'neutral';
    isPositive?: boolean;
  };
  className?: string;
}

export function PairMetricsCell({ metric, className }: PairMetricsCellProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-400" />;
      default:
        return <Minus className="h-3 w-3 text-slate-400" />;
    }
  };

  const getValueColor = () => {
    if (metric.isPositive === undefined) return 'text-white';
    return metric.isPositive ? 'text-green-400' : 'text-red-400';
  };

  const formatValue = () => {
    switch (metric.type) {
      case 'percentage':
        return `${metric.value}%`;
      case 'ratio':
        return `${metric.value}:1`;
      case 'currency':
        return `$${metric.value}`;
      default:
        return metric.value;
    }
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-1">
        <span className={`text-sm font-semibold ${getValueColor()}`}>
          {formatValue()}
        </span>
        {metric.trend && getTrendIcon()}
      </div>
      <p className="text-xs text-slate-400 mt-1">{metric.label}</p>
    </div>
  );
}
