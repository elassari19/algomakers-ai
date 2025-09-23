import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

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

export function StatsGrid({ metrics, backtestData }: StatsGridProps) {
  const calculateBacktestPeriod = () => {
    if (!backtestData) return null;
    const start = new Date(backtestData.startDate);
    const end = new Date(backtestData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} years (${
      start.getMonth() + 1
    }/${start.getDate()}/${start.getFullYear()} - ${
      end.getMonth() + 1
    }/${end.getDate()}/${end.getFullYear()})`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Section */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Risk Reward Ratio</span>
              <span className="text-white font-mono">{metrics.riskReward}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Risk Reward Ratio (Long)</span>
              <span className="text-white font-mono">1.57</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Risk Reward Ratio (Short)</span>
              <span className="text-white font-mono">N/A</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Win Rate %</span>
              <span className="text-white font-mono">
                {metrics.winRate.toFixed(2)} %
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Win Rate % (Long)</span>
              <span className="text-white font-mono">
                {(metrics.winRate * 0.9).toFixed(2)} %
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Win Rate % (Short)</span>
              <span className="text-white font-mono">N/A</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Avg Trade % (Combined)</span>
              <span className="text-white font-mono">1.45 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Max drawdown</span>
              <span className="text-red-400 font-mono">
                {metrics.maxDrawdown.toFixed(2)} %
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Avg Trade Duration</span>
              <span className="text-white font-mono">4d 2h 23m</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Avg Pyramiding</span>
              <span className="text-white font-mono">N/A</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Total Trades</span>
              <span className="text-white font-mono">
                {metrics.totalTrades}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Total Trades (Long)</span>
              <span className="text-white font-mono">
                {metrics.totalTrades}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Total Trades (Short)</span>
              <span className="text-white font-mono">N/A</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">ROI</span>
              <span className="text-green-400 font-mono">
                {metrics.roi.toFixed(2)} %
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Buy & Hold</span>
              <span className="text-blue-400 font-mono">
                {(metrics.roi * 0.7).toFixed(2)} %
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Avg Winning Trade %</span>
              <span className="text-green-400 font-mono">6.60 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Avg Losing Trade %</span>
              <span className="text-red-400 font-mono">5.00 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Avg Bars Per Trade</span>
              <span className="text-white font-mono">25</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Largest Win Trade %</span>
              <span className="text-green-400 font-mono">232.69 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Largest Loss Trade %</span>
              <span className="text-red-400 font-mono">39.24 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Open P/L</span>
              <span className="text-white font-mono">146.28 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Sharpe Ratio</span>
              <span className="text-white font-mono">0.237</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Sortino Ratio</span>
              <span className="text-white font-mono">1.304</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Number of Win Trades</span>
              <span className="text-green-400 font-mono">
                {Math.floor((metrics.totalTrades * metrics.winRate) / 100)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Number of Loss Trades</span>
              <span className="text-red-400 font-mono">
                {Math.ceil(
                  (metrics.totalTrades * (100 - metrics.winRate)) / 100
                )}
              </span>
            </div>
            {backtestData && (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Initial Capital</span>
                  <span className="text-white font-mono">
                    {formatCurrency(backtestData.initialBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">End Capital</span>
                  <span className="text-white font-mono">
                    {formatCurrency(backtestData.finalBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Net profit</span>
                  <span className="text-green-400 font-mono">
                    {formatCurrency(
                      backtestData.finalBalance - backtestData.initialBalance
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Total commission paid</span>
                  <span className="text-white font-mono">
                    23.45 % (45,304.57 USD)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Backtest period</span>
                  <span className="text-white font-mono text-xs">
                    {calculateBacktestPeriod()}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parameters Section */}
      <Card className="bg-slate-900 border-slate-800 h-fit">
        <CardHeader>
          <CardTitle className="text-white text-lg">Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Timeframe Used</span>
              <span className="text-white font-mono">4h</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Initial Capital</span>
              <span className="text-white font-mono">
                {backtestData
                  ? `${backtestData.initialBalance.toLocaleString()} USD`
                  : '10,000.00 USD'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Order Size Type</span>
              <span className="text-white font-mono">Percent Of Equity</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Order Size</span>
              <span className="text-white font-mono">100 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Commission type</span>
              <span className="text-white font-mono">Percent</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Commission value per order</span>
              <span className="text-white font-mono">0.075 %</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Use Bar Magnifier</span>
              <span className="text-white font-mono">Yes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
