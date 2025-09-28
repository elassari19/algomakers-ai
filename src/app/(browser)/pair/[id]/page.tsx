import { notFound } from 'next/navigation';
import { BacktestChart } from '@/components/pair/BacktestChart';
import { StatsGrid } from '@/components/pair/StatsGridNew';
import { PairSubscribeWrapper } from '@/components/pair/PairSubscribeWrapper';
import { DisclaimerBox } from '@/components/pair/DisclaimerBox';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { mockPairs } from '@/lib/dummy-data';
import Link from 'next/link';

interface PairDetailPageProps {
  params: Promise<{ id: string }>;
}

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
  timeframe?: string;
  isPopular?: boolean;
  description?: string;
  subscription?: {
    status: 'active' | 'expiring' | 'expired' | 'pending';
    expiryDate?: string;
  };
  backtestData?: {
    startDate: string;
    endDate: string;
    initialBalance: number;
    finalBalance: number;
    equityCurve: Array<{ date: string; value: number }>;
  };
}

// Extended mock data with backtest information
const mockPairsWithBacktest = mockPairs.map((pair) => ({
  ...pair,
  description:
    pair.symbol === 'EURUSD'
      ? 'Professional trading strategy for EURUSD with consistent profitability and low drawdown.'
      : pair.symbol === 'GBPJPY'
      ? 'Aggressive trading strategy with high profit potential and moderate risk.'
      : pair.symbol === 'BTCUSD'
      ? 'Cryptocurrency trading strategy optimized for Bitcoin volatility patterns.'
      : `Advanced trading strategy for ${pair.symbol} with proven performance metrics.`,
  backtestData: {
    startDate: '2024-01-01',
    endDate: '2024-09-01',
    initialBalance: 10000,
    finalBalance: 10000 + (pair.metrics.profit || 0),
    equityCurve: Array.from({ length: 9 }, (_, i) => ({
      date: new Date(2024, i, 1).toISOString().split('T')[0],
      value: 10000 + ((pair.metrics.profit || 0) * (i + 1)) / 9,
    })),
  },
}));

async function getPairData(id: string): Promise<PairData | null> {
  // In a real app, this would fetch from the database
  // Example: const pair = await prisma.pair.findUnique({ where: { id } });
  const pair = mockPairsWithBacktest.find((p) => p.id === id);
  return pair || null;
}

export default async function PairDetailPage({ params }: PairDetailPageProps) {
  const { id } = await params;
  const pair = await getPairData(id);

  if (!pair) {
    notFound();
  }

  return (
    <GradientBackground>
      <div className="min-h-screen">
        {/* Header with strategy title and key metrics */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto px-6 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Strategy Title */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg border border-white/20">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      {pair.symbol}
                    </h1>
                    {pair.isPopular && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-orange-500/10 text-orange-400"
                      >
                        🔥 Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">{pair.name}</p>
                </div>
              </div>

              {/* Compact Metrics */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-white/60 text-xs">ROI</div>
                  <div
                    className={`font-bold ${
                      pair.metrics.roi > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {pair.metrics.roi > 0 ? '+' : ''}
                    {pair.metrics.roi.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white/60 text-xs">R/R</div>
                  <div className="text-orange-400 font-bold">
                    {pair.metrics.riskReward.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white/60 text-xs">Win Rate</div>
                  <div className="text-blue-400 font-bold">
                    {pair.metrics.winRate.toFixed(1)}%
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <Link
                    href={`https://www.tradingview.com/chart/?symbol=${pair.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    View
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-4 h-[calc(100vh-120px)] overflow-hidden">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-full">
            {/* Left Column - Chart and Performance */}
            <div className="xl:col-span-3 space-y-8 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {/* Chart */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <BacktestChart
                  data={pair.backtestData}
                  symbol={pair.symbol}
                  metrics={pair.metrics}
                />
              </div>

              {/* Performance Metrics */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <StatsGrid
                  metrics={pair.metrics}
                  backtestData={pair.backtestData}
                />
              </div>
            </div>

            {/* Right Column - Strategy Info and Actions */}
            <div className="xl:col-span-1 space-y-6 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {/* Subscribe Section */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  Subscribe to Strategy
                </h3>
                <PairSubscribeWrapper
                  pairId={pair.id}
                  pairSymbol={pair.symbol}
                />
              </div>

              {/* Performance Summary */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Performance Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total Profit</span>
                    <span
                      className={`font-semibold ${
                        pair.metrics.profit > 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      ${pair.metrics.profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Win Rate</span>
                    <span className="text-blue-400 font-semibold">
                      {pair.metrics.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Risk/Reward</span>
                    <span className="text-orange-400 font-semibold">
                      {pair.metrics.riskReward.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strategy Details */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Strategy Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {pair.description ||
                        `Advanced trading strategy for ${pair.symbol} with proven performance metrics and risk management.`}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm border-t border-white/10 pt-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Strategy ID</span>
                      <span className="text-white font-mono">
                        #{pair.id.padStart(6, '0')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Timeframe</span>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {pair.timeframe}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Last Updated</span>
                      <span className="text-white/80">7 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer at bottom */}
          <div className="mt-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <DisclaimerBox />
            </div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}

export async function generateMetadata({ params }: PairDetailPageProps) {
  const { id } = await params;
  const pair = await getPairData(id);

  if (!pair) {
    return {
      title: 'Pair Not Found',
    };
  }

  return {
    title: `${pair.symbol} - ${pair.name} | AlgoMakers.Ai`,
    description:
      pair.description ||
      `View detailed backtest results and subscribe to ${pair.symbol} trading signals.`,
  };
}
