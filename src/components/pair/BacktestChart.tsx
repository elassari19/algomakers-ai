'use client';

import { useState } from 'react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface BacktestData {
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  equityCurve: Array<{ date: string; value: number }>;
}

interface BacktestChartProps {
  data?: BacktestData;
  symbol: string;
  metrics?: {
    roi: number;
    maxDrawdown: number;
  };
}

interface ChartDataPoint {
  date: string;
  cumPL_USDT: number;
  cumPL_PCT: number;
  drawdown_USDT: number;
  drawdown_PCT: number;
}

export function BacktestChart({ data, symbol, metrics }: BacktestChartProps) {
  // ...state and first set of logic...

  const [showDrawdown, setShowDrawdown] = useState(true);
  const [showCumPL, setShowCumPL] = useState(true);
  const [displayMode, setDisplayMode] = useState<'usdt' | 'percent'>('usdt');

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    let peak = data.initialBalance;
    return data.equityCurve.map((point, idx) => {
      // Cumulative P&L USDT
      const cumPL_USDT = point.value;
      // Cumulative P&L %
      const cumPL_PCT =
        data.initialBalance !== 0
          ? ((point.value - data.initialBalance) /
              Math.abs(data.initialBalance)) *
            100
          : 0;
      // Drawdown USDT
      if (point.value > peak) peak = point.value;
      const drawdown_USDT = point.value - peak;
      // Drawdown %
      const drawdown_PCT =
        peak !== 0 ? ((point.value - peak) / Math.abs(peak)) * 100 : 0;
      return {
        date: point.date,
        cumPL_USDT,
        cumPL_PCT,
        drawdown_USDT,
        drawdown_PCT,
      };
    });
  }, [data]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (displayMode === 'usdt') {
      return [
        `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`,
        name,
      ];
    }
    return [`${value.toFixed(2)}%`, name];
  };

  const formatTooltipLabel = (label: string) => {
    return new Date(label).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handlers
  const handleDrawdownChange = (checked: boolean | 'indeterminate') => {
    setShowDrawdown(checked === true);
  };
  const handleCumPLChange = (checked: boolean | 'indeterminate') => {
    setShowCumPL(checked === true);
  };
  const handleDisplayModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayMode(e.target.value as 'usdt' | 'percent');
  };

  if (!data) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Historical Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-slate-400">
            No backtest data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent">
      <CardHeader className="px-2 py-0 sm:px-4 sm:py-4">
        <CardTitle className="text-white text-base sm:text-lg">
          Historical Performance
        </CardTitle>
        <div className="text-xs sm:text-sm text-slate-400">
          Historical growth of a {formatCurrency(data.initialBalance)} capital
          over time
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        {/* Chart Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full flex flex-row justify-between px-2 md:px-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cumpl-line"
                  checked={showCumPL}
                  onCheckedChange={handleCumPLChange}
                  className="border-green-500 text-green-500"
                />
                <label
                  htmlFor="cumpl-line"
                  className="text-xs sm:text-sm font-medium text-green-400 cursor-pointer"
                >
                  {displayMode === 'usdt'
                    ? 'Cumulative P&L USDT'
                    : 'Cumulative P&L %'}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="drawdown-line"
                  checked={showDrawdown}
                  onCheckedChange={handleDrawdownChange}
                  className="border-purple-500 text-purple-500"
                />
                <label
                  htmlFor="drawdown-line"
                  className="text-xs sm:text-sm font-medium text-purple-400 cursor-pointer"
                >
                  {displayMode === 'usdt' ? 'Drawdown USDT' : 'Drawdown %'}
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-xs sm:text-sm text-green-400">USDT</span>
              <Switch
                checked={displayMode === 'percent'}
                onCheckedChange={(checked) =>
                  setDisplayMode(checked ? 'percent' : 'usdt')
                }
                className="mx-1 border border-slate-600 bg-slate-800"
                aria-label="Toggle percent mode"
              />
              <span className="text-xs sm:text-sm text-blue-400">%</span>
            </div>
          </div>
          {/* Period Controls removed */}
        </div>

        {/* Chart */}
        <div className="h-80 sm:h-[28rem] w-full bg-transparent rounded-lg shadow-lg p-0">
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 0,
                  left: 0,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#334155"
                  opacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  fontSize={12}
                  tick={{ fontSize: 12, fill: '#cbd5e1', dy: 16 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  padding={{ left: 0, right: 0 }}
                  height={60}
                  angle={-90}
                  textAnchor="end"
                />
                {/* Dual Y axes */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={
                    displayMode === 'usdt'
                      ? (v) =>
                          v.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                      : (v) => `${v.toFixed(2)}%`
                  }
                  stroke="#10b981"
                  fontSize={12}
                  tick={{ fontSize: 12, fill: '#a7f3d0' }}
                  axisLine={{ stroke: '#10b981' }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  allowDataOverflow
                  allowDecimals
                  minTickGap={2}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={
                    displayMode === 'usdt'
                      ? (v) =>
                          v.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                      : (v) => `${v.toFixed(2)}%`
                  }
                  stroke="#a855f7"
                  fontSize={12}
                  tick={{ fontSize: 12, fill: '#e9d5ff' }}
                  axisLine={{ stroke: '#a855f7' }}
                  tickLine={false}
                  domain={([dataMin, dataMax]) => {
                    // Center zero in the middle
                    const maxAbs = Math.max(
                      Math.abs(dataMin),
                      Math.abs(dataMax)
                    );
                    return [-maxAbs, maxAbs];
                  }}
                  allowDataOverflow
                  allowDecimals
                  minTickGap={2}
                />
                {/* Reference line for drawdown axis zero */}
                <ReferenceLine
                  y={0}
                  yAxisId="right"
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  opacity={0.7}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #a855f7',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                    fontSize: 14,
                  }}
                  labelStyle={{ color: '#f472b6', fontWeight: 600 }}
                  itemStyle={{ fontSize: 13 }}
                  labelFormatter={formatTooltipLabel}
                  formatter={formatTooltipValue}
                />

                {/* Cumulative P&L Line */}
                {showCumPL && (
                  <Line
                    type="monotone"
                    yAxisId="left"
                    dataKey={
                      displayMode === 'usdt' ? 'cumPL_USDT' : 'cumPL_PCT'
                    }
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name={
                      displayMode === 'usdt'
                        ? 'Cumulative P&L USDT'
                        : 'Cumulative P&L %'
                    }
                    activeDot={{
                      r: 4,
                      fill: '#10b981',
                      stroke: '#065f46',
                      strokeWidth: 2,
                    }}
                  />
                )}
                {/* Drawdown Line */}
                {showDrawdown && (
                  <Line
                    type="monotone"
                    yAxisId="right"
                    dataKey={
                      displayMode === 'usdt' ? 'drawdown_USDT' : 'drawdown_PCT'
                    }
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    name={
                      displayMode === 'usdt' ? 'Drawdown USDT' : 'Drawdown %'
                    }
                    strokeDasharray="2 2"
                    activeDot={{
                      r: 4,
                      fill: '#a855f7',
                      stroke: '#7c3aed',
                      strokeWidth: 2,
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-100 gap-2 mt-4">
          <span>
            Period:{' '}
            {chartData.length > 0
              ? formatDate(chartData[0].date)
              : formatDate(data.startDate)}{' '}
            -{' '}
            {chartData.length > 0
              ? formatDate(chartData[chartData.length - 1].date)
              : formatDate(data.endDate)}
          </span>
          <span>Data updated 7 days ago</span>
        </div>
      </CardContent>
    </Card>
  );
}
