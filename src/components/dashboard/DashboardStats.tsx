'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, DollarSign, Target, Award } from 'lucide-react';

interface DashboardStatsProps {
  totalPairs: number;
  profitablePairs: number;
  totalProfit: number;
  bestPerformer: {
    symbol: string;
    roi: number;
  };
  className?: string;
}

export function DashboardStats({
  totalPairs,
  profitablePairs,
  totalProfit,
  bestPerformer,
  className,
}: DashboardStatsProps) {
  const winRate =
    totalPairs > 0 ? ((profitablePairs / totalPairs) * 100).toFixed(1) : '0';

  const stats = [
    {
      title: 'Total Pairs',
      value: totalPairs,
      icon: BarChart3,
      description: 'Available trading pairs',
      trend: '+2 new pairs this month',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Profitable Pairs',
      value: profitablePairs,
      icon: Target,
      description: `${winRate}% win rate`,
      trend: `${profitablePairs} out of ${totalPairs} pairs`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Profit',
      value: `$${totalProfit.toLocaleString()}`,
      icon: DollarSign,
      description: 'Combined performance',
      trend: '+15.2% this quarter',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Best Performer',
      value: bestPerformer.symbol,
      icon: Award,
      description: `${bestPerformer.roi}% ROI`,
      trend: 'Top performing pair',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={stat.title}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors py-2"
          >
            <CardHeader className="flex flex-row items-center justify-between py-0">
              <CardTitle className="text-sm font-medium text-slate-300">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col space-y-0.5">
                <span className="text-xl font-bold text-white">
                  {stat.value}
                </span>
                <p className="text-xs text-slate-400">{stat.description}</p>
                <p className={`text-xs ${stat.color}`}>{stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
