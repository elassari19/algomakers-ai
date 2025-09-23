import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Percent,
  DollarSign,
  Calendar,
  Activity,
} from 'lucide-react';

interface Metrics {
  roi: number;
  riskReward: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  profit: number;
}

interface BacktestData {
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  equityCurve: Array<{ date: string; value: number }>;
}

interface StatsGridProps {
  metrics: Metrics;
  backtestData?: BacktestData;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'positive' | 'negative' | 'neutral';
  description?: string;
}

function StatCard({
  title,
  value,
  icon,
  variant = 'neutral',
  description,
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'positive':
        return 'border-green-600/30 bg-green-900/20';
      case 'negative':
        return 'border-red-600/30 bg-red-900/20';
      default:
        return 'border-slate-700 bg-slate-800/50';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <Card className={`${getVariantStyles()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-slate-400">{icon}</div>
              <p className="text-sm font-medium text-slate-300">{title}</p>
            </div>
            <p className={`text-2xl font-bold ${getValueColor()}`}>{value}</p>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatItem {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant: 'positive' | 'negative' | 'neutral';
  description: string;
}

export function StatsGrid({ metrics, backtestData }: StatsGridProps) {
  const calculateBacktestPeriod = () => {
    if (!backtestData) return null;
    const start = new Date(backtestData.startDate);
    const end = new Date(backtestData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.round(diffDays / 30);
    return `${months} months`;
  };

  const profitFactor = backtestData
    ? (
        ((backtestData.finalBalance - backtestData.initialBalance) /
          backtestData.initialBalance) *
        100
      ).toFixed(1)
    : metrics.roi.toFixed(1);

  const stats: StatItem[] = [
    {
      title: 'Total Return (ROI)',
      value: `${metrics.roi}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      variant: metrics.roi > 0 ? 'positive' : 'negative',
      description: 'Overall profitability',
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate}%`,
      icon: <Target className="w-5 h-5" />,
      variant:
        metrics.winRate >= 60
          ? 'positive'
          : metrics.winRate >= 50
          ? 'neutral'
          : 'negative',
      description: 'Percentage of winning trades',
    },
    {
      title: 'Risk/Reward Ratio',
      value: metrics.riskReward.toFixed(1),
      icon: <BarChart3 className="w-5 h-5" />,
      variant:
        metrics.riskReward >= 2
          ? 'positive'
          : metrics.riskReward >= 1.5
          ? 'neutral'
          : 'negative',
      description: 'Average win vs average loss',
    },
    {
      title: 'Max Drawdown',
      value: `${metrics.maxDrawdown}%`,
      icon: <TrendingDown className="w-5 h-5" />,
      variant:
        metrics.maxDrawdown <= 10
          ? 'positive'
          : metrics.maxDrawdown <= 20
          ? 'neutral'
          : 'negative',
      description: 'Largest peak-to-trough decline',
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades.toString(),
      icon: <Activity className="w-5 h-5" />,
      variant: 'neutral',
      description: 'Number of completed trades',
    },
    {
      title: 'Profit Generated',
      value: formatCurrency(metrics.profit),
      icon: <DollarSign className="w-5 h-5" />,
      variant: metrics.profit > 0 ? 'positive' : 'negative',
      description: 'Total profit from strategy',
    },
  ];

  if (backtestData) {
    stats.push({
      title: 'Backtest Period',
      value: calculateBacktestPeriod() || 'N/A',
      icon: <Calendar className="w-5 h-5" />,
      variant: 'neutral',
      description: `${backtestData.startDate} to ${backtestData.endDate}`,
    });

    stats.push({
      title: 'Final Balance',
      value: formatCurrency(backtestData.finalBalance),
      icon: <Percent className="w-5 h-5" />,
      variant: 'positive',
      description: `From ${formatCurrency(
        backtestData.initialBalance
      )} initial`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
        <Badge variant="outline" className="text-slate-300 border-slate-600">
          Backtest Results
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            description={stat.description}
          />
        ))}
      </div>

      <div className="text-center text-sm text-slate-500 mt-8">
        <p>
          * Past performance does not guarantee future results. All trading
          involves risk.
        </p>
      </div>
    </div>
  );
}
