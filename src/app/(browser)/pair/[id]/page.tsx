import { notFound } from 'next/navigation';
import { PairDetailHeader } from '@/components/pair/PairDetailHeader';
import { BacktestChart } from '@/components/pair/BacktestChart';
import { StatsGrid } from '@/components/pair/StatsGridNew';
import { PairSubscribeWrapper } from '@/components/pair/PairSubscribeWrapper';
import { DisclaimerBox } from '@/components/pair/DisclaimerBox';
import { AnalyticsTracker } from '@/components/pair/AnalyticsTracker';
import { ArrowUpRight, Heart, Share } from 'lucide-react';
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
  backtestData?: {
    startDate: string;
    endDate: string;
    initialBalance: number;
    finalBalance: number;
    equityCurve: Array<{ date: string; value: number }>;
  };
}

// Mock data - replace with actual database fetch
const mockPairs: PairData[] = [
  {
    id: '1',
    symbol: 'EURUSD',
    name: 'Euro vs US Dollar',
    description:
      'Professional trading strategy for EURUSD with consistent profitability and low drawdown.',
    metrics: {
      roi: 45.2,
      riskReward: 2.3,
      totalTrades: 124,
      winRate: 68.5,
      maxDrawdown: 8.2,
      profit: 15420,
    },
    timeframe: '1H',
    isPopular: true,
    backtestData: {
      startDate: '2024-01-01',
      endDate: '2024-09-01',
      initialBalance: 10000,
      finalBalance: 14520,
      equityCurve: [
        { date: '2024-01-01', value: 10000 },
        { date: '2024-02-01', value: 10500 },
        { date: '2024-03-01', value: 11200 },
        { date: '2024-04-01', value: 11800 },
        { date: '2024-05-01', value: 12500 },
        { date: '2024-06-01', value: 13100 },
        { date: '2024-07-01', value: 13800 },
        { date: '2024-08-01', value: 14200 },
        { date: '2024-09-01', value: 14520 },
      ],
    },
  },
  {
    id: '2',
    symbol: 'GBPJPY',
    name: 'British Pound vs Japanese Yen',
    description:
      'Aggressive trading strategy with high profit potential and moderate risk.',
    metrics: {
      roi: 32.1,
      riskReward: 1.8,
      totalTrades: 89,
      winRate: 72.0,
      maxDrawdown: 12.5,
      profit: 8950,
    },
    timeframe: '4H',
    backtestData: {
      startDate: '2024-01-01',
      endDate: '2024-09-01',
      initialBalance: 10000,
      finalBalance: 13210,
      equityCurve: [
        { date: '2024-01-01', value: 10000 },
        { date: '2024-02-01', value: 10200 },
        { date: '2024-03-01', value: 10800 },
        { date: '2024-04-01', value: 11500 },
        { date: '2024-05-01', value: 12100 },
        { date: '2024-06-01', value: 12300 },
        { date: '2024-07-01', value: 12800 },
        { date: '2024-08-01', value: 13000 },
        { date: '2024-09-01', value: 13210 },
      ],
    },
  },
  {
    id: '3',
    symbol: 'BTCUSD',
    name: 'Bitcoin vs US Dollar',
    description:
      'Cryptocurrency trading strategy optimized for Bitcoin volatility patterns.',
    metrics: {
      roi: 78.9,
      riskReward: 3.1,
      totalTrades: 67,
      winRate: 64.2,
      maxDrawdown: 15.8,
      profit: 22340,
    },
    timeframe: '1D',
    isPopular: true,
    backtestData: {
      startDate: '2024-01-01',
      endDate: '2024-09-01',
      initialBalance: 10000,
      finalBalance: 17890,
      equityCurve: [
        { date: '2024-01-01', value: 10000 },
        { date: '2024-02-01', value: 11200 },
        { date: '2024-03-01', value: 12800 },
        { date: '2024-04-01', value: 14100 },
        { date: '2024-05-01', value: 15600 },
        { date: '2024-06-01', value: 16200 },
        { date: '2024-07-01', value: 17100 },
        { date: '2024-08-01', value: 17500 },
        { date: '2024-09-01', value: 17890 },
      ],
    },
  },
];

async function getPairData(id: string): Promise<PairData | null> {
  // In a real app, this would fetch from the database
  // Example: const pair = await prisma.pair.findUnique({ where: { id } });
  const pair = mockPairs.find((p) => p.id === id);
  return pair || null;
}

export default async function PairDetailPage({ params }: PairDetailPageProps) {
  const { id } = await params;
  const pair = await getPairData(id);

  if (!pair) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Analytics tracking */}
      <AnalyticsTracker pairId={pair.id} />

      {/* Header with strategy title and key metrics */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Strategy Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                Backtest N°{pair.id.padStart(6, '0')}
              </h1>
            </div>

            {/* Key Metrics Bar */}
            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-slate-400">Risk Reward Ratio</div>
                <div className="text-orange-400 font-bold">
                  {pair.metrics.riskReward}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Total ROI</div>
                <div className="text-green-400 font-bold">
                  {pair.metrics.roi.toFixed(2)} %
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Max DrawDown</div>
                <div className="text-red-400 font-bold">
                  {pair.metrics.maxDrawdown.toFixed(1)} %
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Trades</div>
                <div className="text-white font-bold">
                  {pair.metrics.totalTrades}
                </div>
              </div>
            </div>
          </div>

          {/* Strategy subtitle */}
          <div className="mt-2 flex items-center gap-2 text-slate-400">
            <span>{pair.name}</span>
            <span>•</span>
            <span>@ {pair.timeframe}</span>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center">
            <button className="flex items-center px-3 py-1.5 cursor-pointer text-sm text-slate-300 hover:text-white transition-colors">
              <Heart className="w-4 h-4" />
            </button>

            <button className="flex items-center px-3 py-1.5 cursor-pointer text-sm text-slate-300 hover:text-white transition-colors">
              <Share className="w-4 h-4" />
            </button>

            <Link
              href={`https://www.tradingview.com/chart/?symbol=${pair.symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 ml-1 bg-slate-800 hover:bg-slate-500 border border-slate-500 rounded-sm text-sm text-white transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              View on TradingView
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Chart and Performance */}
          <div className="xl:col-span-3 space-y-6">
            {/* Chart */}
            <BacktestChart
              data={pair.backtestData}
              symbol={pair.symbol}
              metrics={pair.metrics}
            />

            {/* Performance Metrics */}
            <StatsGrid
              metrics={pair.metrics}
              backtestData={pair.backtestData}
            />
          </div>

          {/* Right Column - Strategy Info and Actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* Subscribe Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Subscribe to Strategy
              </h3>
              <PairSubscribeWrapper pairId={pair.id} pairSymbol={pair.symbol} />
            </div>

            {/* Updated Information */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="text-center space-y-2">
                <div className="text-slate-400 text-sm">Updated 7 days ago</div>
                <div className="text-slate-500 text-xs flex items-center justify-center gap-1">
                  <span>ℹ️</span>
                  <span>Why results may differ</span>
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500">
                <p>4/4</p>
                <p className="flex items-center justify-center gap-1 mt-2">
                  <span>❓</span>
                  <span>Why strategies may still repaint</span>
                  <span className="text-blue-400 underline cursor-pointer">
                    Report
                  </span>
                </p>
              </div>
            </div>

            {/* Strategy Description */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Strategy
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {pair.description ||
                      `Mean Reversion and Trendfollowing strategy for ${pair.symbol}. This script presents a hybrid trading strategy that combines mean reversion and trend following techniques.`}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Author</span>
                    <span className="text-white">I11L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last update</span>
                    <span className="text-white">7 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Report Created</span>
                    <span className="text-white">400 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Open Source</span>
                    <span className="text-white">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID</span>
                    <span className="text-white">
                      {pair.id.padStart(6, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer at bottom */}
        <div className="mt-8">
          <DisclaimerBox />
        </div>
      </div>
    </div>
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
