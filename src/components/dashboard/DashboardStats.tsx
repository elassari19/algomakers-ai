'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { GlassmorphismCard } from '@/components/ui/glassmorphism-card';

export interface OverviewDataItem {
  icon: LucideIcon;
  title: string;
  currentValue: string | number;
  pastValue?: string;
  description?: string;
  color?: string;
  bgColor?: string;
}

interface OverviewSectionProps {
  overviewData: OverviewDataItem[];
  className?: string;
}

export function OverviewSection({
  overviewData,
  className,
}: OverviewSectionProps) {
  const getDefaultColors = (index: number) => {
    const colorSets = [
      { color: 'text-cyan-300', bgColor: 'bg-cyan-400/20' },
      { color: 'text-emerald-300', bgColor: 'bg-emerald-400/20' },
      { color: 'text-green-300', bgColor: 'bg-green-400/20' },
      { color: 'text-amber-300', bgColor: 'bg-amber-400/20' },
      { color: 'text-purple-300', bgColor: 'bg-purple-400/20' },
      { color: 'text-pink-300', bgColor: 'bg-pink-400/20' },
      { color: 'text-blue-300', bgColor: 'bg-blue-400/20' },
      { color: 'text-orange-300', bgColor: 'bg-orange-400/20' },
    ];
    return colorSets[index % colorSets.length];
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {overviewData.map((item, index) => {
        const IconComponent = item.icon;
        const defaultColors = getDefaultColors(index);
        const color = item.color || defaultColors.color;
        const bgColor = item.bgColor || defaultColors.bgColor;

        return (
          <GlassmorphismCard key={item.title} className="py-0 sm:py-3">
            <CardHeader className="flex flex-row items-center justify-between py-2 sm:pb-1">
              <CardTitle className="text-sm font-semibold text-white/90">
                {item.title}
              </CardTitle>
              <div
                className={`p-2 rounded-xl backdrop-blur-sm bg-white/20 border border-white/30 ${bgColor}`}
              >
                <IconComponent className={`h-4 w-4 ${color} drop-shadow-sm`} />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex flex-row justify-between sm:flex-col space-y-1">
                <span className="text-2xl font-bold text-white drop-shadow-sm">
                  {typeof item.currentValue === 'number'
                    ? item.currentValue.toLocaleString()
                    : item.currentValue}
                </span>
                <div>
                  {item.description && (
                    <p className="text-xs text-white/70 font-medium">
                      {item.description}
                    </p>
                  )}
                  {item.pastValue && (
                    <p
                      className={`text-xs font-semibold ${color} drop-shadow-sm`}
                    >
                      {item.pastValue}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </GlassmorphismCard>
        );
      })}
    </div>
  );
}

// Legacy component for backward compatibility
export function DashboardStats({
  totalPairs,
  profitablePairs,
  totalProfit,
  bestPerformer,
  className,
  labels,
}: {
  totalPairs: number;
  profitablePairs: number;
  totalProfit: number;
  bestPerformer: { symbol: string; roi: number };
  className?: string;
  labels?: {
    totalPairs?: string;
    profitablePairs?: string;
    totalProfit?: string;
    bestPerformer?: string;
  };
}) {
  const winRate =
    totalPairs > 0 ? ((profitablePairs / totalPairs) * 100).toFixed(1) : '0';

  // Import icons locally for legacy support
  const { BarChart3, Target, DollarSign, Award } = require('lucide-react');

  const overviewData: OverviewDataItem[] = [
    {
      title: labels?.totalPairs || 'Total Pairs',
      currentValue: totalPairs,
      icon: BarChart3,
      description:
        labels?.totalPairs === 'Total Portfolios'
          ? 'Created portfolios'
          : 'Available trading pairs',
      pastValue:
        labels?.totalPairs === 'Total Portfolios'
          ? '+1 new portfolio this month'
          : '+2 new pairs this month',
    },
    {
      title: labels?.profitablePairs || 'Profitable Pairs',
      currentValue: profitablePairs,
      icon: Target,
      description: `${winRate}% win rate`,
      pastValue: `${profitablePairs} out of ${totalPairs} ${
        labels?.profitablePairs === 'Profitable Portfolios'
          ? 'portfolios'
          : 'pairs'
      }`,
    },
    {
      title: labels?.totalProfit || 'Total Profit',
      currentValue: `$${totalProfit.toLocaleString()}`,
      icon: DollarSign,
      description:
        labels?.totalProfit === 'Total Portfolio Value'
          ? 'Combined portfolio value'
          : 'Combined performance',
      pastValue: '+15.2% this quarter',
    },
    {
      title: labels?.bestPerformer || 'Best Performer',
      currentValue: bestPerformer.symbol,
      icon: Award,
      description: `${bestPerformer.roi}% ROI`,
      pastValue:
        labels?.bestPerformer === 'Best Portfolio'
          ? 'Top performing portfolio'
          : 'Top performing pair',
    },
  ];

  return <OverviewSection overviewData={overviewData} className={className} />;
}
