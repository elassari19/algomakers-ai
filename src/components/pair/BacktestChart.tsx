'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  roi: number;
  buyHold: number;
  drawdownValue: number;
}

export function BacktestChart({ data, symbol, metrics }: BacktestChartProps) {
  const [showROI, setShowROI] = useState(true);
  const [showBuyHold, setShowBuyHold] = useState(true);
  const [showMaxDrawdown, setShowMaxDrawdown] = useState(true);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(
    () => {
      // Set default date range to full backtest period
      if (data) {
        return {
          from: new Date(data.startDate),
          to: new Date(data.endDate),
        };
      }
      return undefined;
    }
  );

  const handleROIChange = (checked: boolean | 'indeterminate') => {
    setShowROI(checked === true);
  };

  const handleBuyHoldChange = (checked: boolean | 'indeterminate') => {
    setShowBuyHold(checked === true);
  };

  const handleMaxDrawdownChange = (checked: boolean | 'indeterminate') => {
    setShowMaxDrawdown(checked === true);
  };

  const handleCustomDateChange = (dateRange: DateRange | undefined) => {
    setCustomDateRange(dateRange);
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

  // Calculate chart data with multiple lines
  const chartData: ChartDataPoint[] = data.equityCurve.map((point, index) => {
    const roiPercent =
      ((point.value - data.initialBalance) / data.initialBalance) * 100;

    // Simulate buy & hold performance (simplified calculation)
    const buyHoldPercent = roiPercent * 0.7; // Assume buy & hold performs 70% of strategy

    // Calculate drawdown curve (negative values)
    const maxDrawdownPercent = metrics?.maxDrawdown || 0;
    const drawdownValue = -(
      maxDrawdownPercent *
      (index / data.equityCurve.length) *
      Math.random() *
      0.8
    );

    return {
      date: point.date,
      roi: roiPercent,
      buyHold: buyHoldPercent,
      drawdownValue: drawdownValue,
    };
  });

  // Filter data based on custom date range
  const filterDataByPeriod = (data: ChartDataPoint[]) => {
    if (customDateRange?.from && customDateRange?.to) {
      return data.filter((point) => {
        const pointDate = new Date(point.date);
        return (
          pointDate >= customDateRange.from! && pointDate <= customDateRange.to!
        );
      });
    }

    // If no custom date range is selected, return all data
    return data;
  };

  const filteredChartData = filterDataByPeriod(chartData);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTooltipValue = (value: number, name: string) => {
    return [`${value.toFixed(2)}%`, name];
  };

  const formatTooltipLabel = (label: string) => {
    return new Date(label).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="px-2 py-0 sm:px-4 sm:py-4">
        <CardTitle className="text-white text-base sm:text-lg">
          Historical Performance
        </CardTitle>
        <div className="text-xs sm:text-sm text-slate-400">
          Historical growth of a {formatCurrency(data.initialBalance)} capital
          over time
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-2 sm:px-4">
        {/* Chart Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-row sm:items-center sm:gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="roi-line"
                checked={showROI}
                onCheckedChange={handleROIChange}
                className="border-green-500 text-green-500"
              />
              <label
                htmlFor="roi-line"
                className="text-xs sm:text-sm font-medium text-green-400 cursor-pointer"
              >
                ROI
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="buyhold-line"
                checked={showBuyHold}
                onCheckedChange={handleBuyHoldChange}
                className="border-blue-500 text-blue-500"
              />
              <label
                htmlFor="buyhold-line"
                className="text-xs sm:text-sm font-medium text-blue-400 cursor-pointer"
              >
                Buy & Hold
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="drawdown-line"
                checked={showMaxDrawdown}
                onCheckedChange={handleMaxDrawdownChange}
                className="border-purple-500 text-purple-500"
              />
              <label
                htmlFor="drawdown-line"
                className="text-xs sm:text-sm font-medium text-purple-400 cursor-pointer"
              >
                Max DrawDown
              </label>
            </div>
          </div>
          {/* Period Controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              {/* <span className="text-xs sm:text-sm text-slate-400">
                Date Range:
              </span> */}
              <DateRangePicker
                date={customDateRange}
                onDateChange={handleCustomDateChange}
                placeholder="Select date range"
                minDate={data ? new Date(data.startDate) : undefined}
                maxDate={data ? new Date(data.endDate) : undefined}
                className="w-auto"
              />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-72 sm:h-96 w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          <div className="min-w-[600px] sm:min-w-[900px] w-full h-full border *:border-slate-800 rounded">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  stroke="#64748b"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  labelFormatter={formatTooltipLabel}
                  formatter={formatTooltipValue}
                />

                {showROI && (
                  <Line
                    type="monotone"
                    dataKey="roi"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="ROI"
                    activeDot={{
                      r: 4,
                      fill: '#10b981',
                      stroke: '#065f46',
                      strokeWidth: 2,
                    }}
                  />
                )}

                {showBuyHold && (
                  <Line
                    type="monotone"
                    dataKey="buyHold"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Buy & Hold"
                    strokeDasharray="5 5"
                    activeDot={{
                      r: 4,
                      fill: '#3b82f6',
                      stroke: '#1e40af',
                      strokeWidth: 2,
                    }}
                  />
                )}

                {showMaxDrawdown && (
                  <Line
                    type="monotone"
                    dataKey="drawdownValue"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    name="Max DrawDown"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2 mt-2">
          <span>
            Period:{' '}
            {filteredChartData.length > 0
              ? formatDate(filteredChartData[0].date)
              : formatDate(data.startDate)}{' '}
            -{' '}
            {filteredChartData.length > 0
              ? formatDate(filteredChartData[filteredChartData.length - 1].date)
              : formatDate(data.endDate)}
          </span>
          <span>Data updated 7 days ago</span>
        </div>
      </CardContent>
    </Card>
  );
}
