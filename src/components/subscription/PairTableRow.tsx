'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { PairMetricsCell } from './PairMetricsCell';
import { PairStatusBadge } from './PairStatusBadge';
import { SubscribeButton } from './SubscribeButton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface PairData {
  id: string;
  symbol: string;
  name: string;
  metrics: {
    roi: number;
    riskReward: number;
    totalTrades: number;
    winRate: number;
    maxDrawdown: number;
    profit: number;
  };
  subscription?: {
    status: 'active' | 'expiring' | 'expired' | 'pending';
    expiryDate?: Date;
  };
  timeframe?: string;
  isPopular?: boolean;
}

interface PairTableRowProps {
  pair: PairData;
  isUserLoggedIn: boolean;
  onSubscribe: (
    pairId: string,
    action: 'subscribe' | 'renew' | 'upgrade'
  ) => void;
}

export function PairTableRow({
  pair,
  isUserLoggedIn,
  onSubscribe,
}: PairTableRowProps) {
  const metrics = [
    {
      label: 'ROI',
      value: pair.metrics.roi,
      type: 'percentage' as const,
      isPositive: pair.metrics.roi > 0,
      trend:
        pair.metrics.roi > 20
          ? ('up' as const)
          : pair.metrics.roi < 0
          ? ('down' as const)
          : ('neutral' as const),
    },
    {
      label: 'Risk/Reward',
      value: pair.metrics.riskReward,
      type: 'ratio' as const,
      isPositive: pair.metrics.riskReward > 1.5,
    },
    {
      label: 'Trades',
      value: pair.metrics.totalTrades,
      type: 'number' as const,
    },
    {
      label: 'Win Rate',
      value: pair.metrics.winRate,
      type: 'percentage' as const,
      isPositive: pair.metrics.winRate > 60,
    },
    {
      label: 'Max DD',
      value: pair.metrics.maxDrawdown,
      type: 'percentage' as const,
      isPositive: pair.metrics.maxDrawdown < 10,
    },
    {
      label: 'Profit',
      value: pair.metrics.profit,
      type: 'currency' as const,
      isPositive: pair.metrics.profit > 0,
    },
  ];

  const userSubscriptionStatus = pair.subscription?.status || 'none';

  return (
    <TableRow className="border-slate-700 hover:bg-slate-800/30">
      {/* Subscription Status/Button */}
      <TableCell className="w-32">
        <div className="flex flex-col gap-1">
          <SubscribeButton
            pairId={pair.id}
            pairSymbol={pair.symbol}
            userSubscriptionStatus={userSubscriptionStatus}
            isUserLoggedIn={isUserLoggedIn}
            onSubscribe={onSubscribe}
          />
        </div>
      </TableCell>

      {/* Pair Info */}
      <TableCell className="font-medium">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/pair/${pair.id}`}
              className="text-white hover:text-blue-400 transition-colors font-semibold"
            >
              {pair.symbol}
            </Link>
            {pair.isPopular && (
              <Badge
                variant="secondary"
                className="text-xs bg-orange-500/10 text-orange-400"
              >
                🔥 Popular
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-400">{pair.name}</span>
        </div>
      </TableCell>

      {/* Metrics */}
      {metrics.map((metric, index) => (
        <TableCell key={index}>
          <PairMetricsCell metric={metric} />
        </TableCell>
      ))}

      {/* Timeframe */}
      <TableCell className="text-center">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-white">
            {pair.timeframe || 'N/A'}
          </span>
          <span className="text-xs text-slate-400">period</span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-20">
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-slate-800 border-slate-700"
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`/pair/${pair.id}`}
                  className="flex items-center cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(pair.symbol)}
                className="cursor-pointer"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Copy Symbol
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
