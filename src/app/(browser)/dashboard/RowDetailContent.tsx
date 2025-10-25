import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Activity,
  Calendar,
  DollarSign,
  Target,
  Clock,
  Star,
} from 'lucide-react';
import { Subscription, SubscriptionStatus } from '@/generated/prisma';

// Lazy load SubscribeButton
import dynamic from 'next/dynamic';
const SubscribeButton = dynamic(() => import('@/components/subscription/SubscribeButton').then(mod => ({ default: mod.SubscribeButton })), {
  loading: () => <div className="animate-pulse h-10 bg-slate-700 rounded"></div>
});

interface RowDetailContentProps {
  pair: any;
}

export default function RowDetailContent({ pair }: RowDetailContentProps) {
  return (
    <div className="space-y-6">
      {/* Trading Performance */}
      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Trading Performance
          {pair.isPopular && (
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
          )}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/70">ROI</p>
            <p
              className={`font-semibold text-lg ${
                pair.metrics.roi > 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {pair.metrics.roi > 0 ? '+' : ''}
              {pair.metrics.roi.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-white/70">Win Rate</p>
            <p className="text-blue-400 font-semibold text-lg">
              {pair.metrics.winRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-white/70">Risk/Reward</p>
            <p className="text-white font-semibold">
              {pair.metrics.riskReward.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-white/70">Max Drawdown</p>
            <p className="text-red-400 font-semibold">
              {pair.metrics.maxDrawdown.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Trading Stats */}
      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Trading Statistics
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/70">
              Total Trades:
            </span>
            <span className="text-white font-semibold">
              {pair.metrics.totalTrades}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/70">
              Total Profit:
            </span>
            <span
              className={`font-semibold text-lg ${
                pair.metrics.profit > 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              ${pair.metrics.profit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/70">Timeframe:</span>
            <Badge className="bg-blue-500/20 text-blue-400">
              {pair.timeframe}
            </Badge>
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      {pair.subscriptions?.some((s: Subscription) => s.status === 'ACTIVE') ? (() => {
        const activeSubscription = pair.subscriptions?.find((s: Subscription) => s.status === 'ACTIVE');
        return (
          <div className="bg-white/10 p-4 rounded-lg border border-white/20">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Subscription Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Status:</span>
                <Badge className="bg-green-500/20 text-green-400">
                  {activeSubscription?.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Expires:</span>
                <span className="text-white">
                  {activeSubscription?.expiryDate
                    ? new Date(activeSubscription.expiryDate).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        );
      })() : (
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Subscription Available
          </h3>
          <p className="text-white/70 text-sm mb-3">
            Subscribe to get access to trading signals for{' '}
            {pair.symbol}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {pair.subscriptions?.some((s: Subscription) => s.status === 'ACTIVE') ? (() => {
          const activeSubscription = pair.subscriptions?.find((s: Subscription) => s.status === 'ACTIVE');
          return (
            <>
              <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <Target className="h-4 w-4 mr-2" />
                View Signals
              </Button>
              {activeSubscription && new Date(activeSubscription.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <Button className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white">
                  <Clock className="h-4 w-4 mr-2" />
                  Renew
                </Button>
              )}
            </>
          );
        })() : (
          <SubscribeButton
            isUserLoggedIn={true}
            pair={pair as any}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}