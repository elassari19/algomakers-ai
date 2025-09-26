'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, DollarSign, Target, Award } from 'lucide-react';
import { GlassmorphismCard } from '@/components/ui/glassmorphism-card';

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
      color: 'text-cyan-300',
      bgColor: 'bg-cyan-400/20',
    },
    {
      title: 'Profitable Pairs',
      value: profitablePairs,
      icon: Target,
      description: `${winRate}% win rate`,
      trend: `${profitablePairs} out of ${totalPairs} pairs`,
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-400/20',
    },
    {
      title: 'Total Profit',
      value: `$${totalProfit.toLocaleString()}`,
      icon: DollarSign,
      description: 'Combined performance',
      trend: '+15.2% this quarter',
      color: 'text-green-300',
      bgColor: 'bg-green-400/20',
    },
    {
      title: 'Best Performer',
      value: bestPerformer.symbol,
      icon: Award,
      description: `${bestPerformer.roi}% ROI`,
      trend: 'Top performing pair',
      color: 'text-amber-300',
      bgColor: 'bg-amber-400/20',
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <GlassmorphismCard key={stat.title} className="py-0 sm:py-3">
            <CardHeader className="flex flex-row items-center justify-between py-2 sm:pb-1">
              <CardTitle className="text-sm font-semibold text-white/90">
                {stat.title}
              </CardTitle>
              <div
                className={`p-2 rounded-xl backdrop-blur-sm bg-white/20 border border-white/30 ${stat.bgColor}`}
              >
                <IconComponent
                  className={`h-4 w-4 ${stat.color} drop-shadow-sm`}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex flex-row justify-between sm:flex-col space-y-1">
                <span className="text-2xl font-bold text-white drop-shadow-sm">
                  {stat.value}
                </span>
                <div>
                  <p className="text-xs text-white/70 font-medium">
                    {stat.description}
                  </p>
                  <p
                    className={`text-xs font-semibold ${stat.color} drop-shadow-sm`}
                  >
                    {stat.trend}
                  </p>
                </div>
              </div>
            </CardContent>
          </GlassmorphismCard>
        );
      })}
    </div>
  );
}
