import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Clock, TrendingUp } from 'lucide-react';

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
}

interface PairDetailHeaderProps {
  pair: PairData;
}

export function PairDetailHeader({ pair }: PairDetailHeaderProps) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left section - Main info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{pair.symbol}</h1>
              {pair.isPopular && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-900/30 text-yellow-400 border-yellow-600"
                >
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Popular
                </Badge>
              )}
            </div>

            <h2 className="text-xl text-slate-300">{pair.name}</h2>

            {pair.description && (
              <p className="text-slate-400 max-w-2xl leading-relaxed">
                {pair.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm">
              {pair.timeframe && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Timeframe: {pair.timeframe}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-slate-400">
                <TrendingUp className="w-4 h-4" />
                <span>{pair.metrics.totalTrades} trades analyzed</span>
              </div>
            </div>
          </div>

          {/* Right section - Key metrics */}
          <div className="lg:w-80">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {pair.metrics.roi}%
                </div>
                <div className="text-sm text-slate-400">ROI</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {pair.metrics.winRate}%
                </div>
                <div className="text-sm text-slate-400">Win Rate</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {pair.metrics.riskReward}
                </div>
                <div className="text-sm text-slate-400">Risk/Reward</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {pair.metrics.maxDrawdown}%
                </div>
                <div className="text-sm text-slate-400">Max DD</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
