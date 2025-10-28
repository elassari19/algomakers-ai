'use client';

import { useState, useRef, useEffect } from 'react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import dynamic from 'next/dynamic';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-slate-400">Loading chart...</div>
});

interface BacktestData {
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  equityCurve: Array<{ 
    date: string; 
    value: number;
    tradeNumber?: number;
    cumPL_USDT: number;
    cumPL_PCT: number;
    drawdown_USDT: number;
    drawdown_PCT: number;
  }>;
}

interface BacktestChartProps {
  data?: BacktestData;
  symbol: string;
  metrics?: {
    drawdownUSDT: number;
    drawdownPCT: number;
    cumPL_USDT: number;
    cumPL_PCT: number;
  };
}

interface ChartDataPoint {
  date: string;
  tradeNumber: number;
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
  
  const [isHoveringChart, setIsHoveringChart] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    let runningPeak = data.initialBalance;
    
    return data.equityCurve.map((point, idx) => {
      // Calculate cumulative P&L properly
      // If cumPL_USDT exists, use it; otherwise calculate from point.value (equity) minus initial balance
      const cumPL_USDT = point.cumPL_USDT !== undefined 
        ? point.cumPL_USDT 
        : (point.value - data.initialBalance);
      
      // For Cumulative P&L %, always calculate properly based on initial balance (like old code)
      const cumPL_PCT = data.initialBalance !== 0
        ? (cumPL_USDT / Math.abs(data.initialBalance))
        : 0;
      
      // Update running peak for drawdown calculation
      const currentEquity = data.initialBalance + cumPL_USDT;
      if (currentEquity > runningPeak) {
        runningPeak = currentEquity;
      }
      
      // For drawdown, use existing values if available, otherwise calculate
      // Always make drawdown positive (absolute value)
      const drawdown_USDT = point.drawdown_USDT !== undefined 
        ? Math.abs(point.drawdown_USDT)
        : Math.abs(runningPeak - currentEquity);
      
      const drawdown_PCT = point.drawdown_PCT !== undefined 
        ? Math.abs(point.drawdown_PCT)
        : runningPeak !== 0 ? Math.abs(((runningPeak - currentEquity) / runningPeak)) : 0;
      
      return {
        date: point.date,
        tradeNumber: point.tradeNumber ?? idx + 1,
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

  // Handlers
  const handleDrawdownChange = (checked: boolean | 'indeterminate') => {
    setShowDrawdown(checked === true);
  };
  const handleCumPLChange = (checked: boolean | 'indeterminate') => {
    setShowCumPL(checked === true);
  };

  // ApexCharts configuration
  const chartOptions = useMemo((): any => {
    const drawdownValues = chartData.map(d => displayMode === 'usdt' ? d.drawdown_USDT : d.drawdown_PCT);
    const cumPLValues = chartData.map(d => displayMode === 'usdt' ? d.cumPL_USDT : d.cumPL_PCT);
    
    const drawdownMax = Math.max(...drawdownValues, 0);
    const cumPLMin = Math.min(...cumPLValues, 0);
    const cumPLMax = Math.max(...cumPLValues, 0);

    return {
      chart: {
        id: 'backtest-chart',
        type: 'line' as const,
        height: '100%',
        background: 'transparent',
        foreColor: '#cbd5e1',
        fontFamily: 'inherit',
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: false,  // Remove the menu/download button
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        zoom: {
          enabled: true,
          type: 'x' as const,
        },
        animations: {
          enabled: true,
          easing: 'easeinout' as const,
          speed: 800,
        },
        // Remove left and right padding
        offsetX: 0,
        offsetY: 0,
        parentHeightOffset: 0,
        // Remove chart margins to eliminate side padding
        margin: {
          top: 0,
          right: -20,
          bottom: 0,
          left: 0,
        },
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: false,
          },
        },
      },
      colors: ['#a855f7', '#10b981'],
      stroke: {
        width: [2, 2],
        dashArray: [4, 0], // Dashed for drawdown, solid for cumulative P&L
      },
      grid: {
        borderColor: '#334155',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      xaxis: {
        type: 'datetime' as const,
        categories: chartData.map(d => {
          try {
            const date = new Date(d.date);
            return !isNaN(date.getTime()) ? date.getTime() : Date.now();
          } catch (error) {
            console.warn('Invalid date in chartData:', d.date);
            return Date.now();
          }
        }),
        labels: {
          style: {
            colors: '#cbd5e1',
            fontSize: '12px',
          },
          formatter: (value: number, timestamp: number, opts: any) => {
            try {
              const date = new Date(value);
              if (isNaN(date.getTime())) return 'Invalid Date';
              
              // Get the visible data range to determine zoom level
              const dataRange = opts?.w?.globals?.minX && opts?.w?.globals?.maxX 
                ? opts.w.globals.maxX - opts.w.globals.minX 
                : null;
              
              // If zoomed in (less than 90 days), show day and month
              if (dataRange && dataRange < (90 * 24 * 60 * 60 * 1000)) {
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }
              // If zoomed in very close (less than 30 days), show day, month, and year
              else if (dataRange && dataRange < (30 * 24 * 60 * 60 * 1000)) {
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit',
                });
              }
              // Default view: show month and year
              else {
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                });
              }
            } catch (error) {
              return 'Invalid Date';
            }
          },
        },
        axisBorder: {
          show: true,
          color: '#ffffff', // White axis line for datetime
        },
        axisTicks: {
          show: true,
          color: '#ffffff', // White tick marks for datetime
        },
      },
      yaxis: [
        {
          // Left Y-axis for Drawdown
          seriesName: displayMode === 'usdt' ? 'Drawdown USDT' : 'Drawdown %',
          opposite: false,
          min: 0,
          max: displayMode === 'usdt' ? Math.max(drawdownMax * 4, 10) : 100,
          tickAmount: 5,
          labels: {
            style: {
              colors: '#a855f7', // Match the drawdown line color (purple)
              fontSize: '12px',
            },
            formatter: (value: number) => {
              if (displayMode === 'usdt') {
                return formatCompactNumber(value);
              }
              return `${value.toFixed(0)}%`;
            },
          },
          axisBorder: {
            show: true,
            color: '#a855f7', // Purple axis line to match drawdown line
          },
          axisTicks: {
            show: true,
            color: '#a855f7', // Purple tick marks
          },
        },
        {
          // Right Y-axis for Cumulative P&L
          seriesName: displayMode === 'usdt' ? 'Cumulative P&L USDT' : 'Cumulative P&L %',
          opposite: true,
          min: displayMode === 'percent' ? Math.min(cumPLMin, 0) : 0,
          max: displayMode === 'percent' ? Math.max(cumPLMax, 0) : Math.max(cumPLMax, 0),
          labels: {
            style: {
              colors: '#10b981', // Match the cumulative P&L line color (green)
              fontSize: '12px',
            },
            formatter: (value: number) => {
              if (displayMode === 'usdt') {
                return formatCompactNumber(value);
              }
              return `${value.toFixed(0)}%`;
            },
          },
          axisBorder: {
            show: true,
            color: '#10b981', // Green axis line to match cumulative P&L line
          },
          axisTicks: {
            show: true,
            color: '#10b981', // Green tick marks
          },
        },
      ],
      tooltip: {
        theme: 'dark',
        followCursor: true,
        style: {
          fontSize: '14px',
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
          // Handle date safely
          let formattedDate = 'Invalid Date';
          try {
            const timestamp = w.globals.categoryLabels[dataPointIndex];
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });
            } else {
              // Fallback: try to use the original date string from chartData
              const originalDate = chartData[dataPointIndex]?.date;
              if (originalDate) {
                const fallbackDate = new Date(originalDate);
                if (!isNaN(fallbackDate.getTime())) {
                  formattedDate = fallbackDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });
                }
              }
            }
          } catch (error) {
            console.warn('Date parsing error in tooltip:', error);
          }
          
          const tradeNumber = chartData[dataPointIndex]?.tradeNumber ?? dataPointIndex + 1;
          
          let content = `<div class="bg-slate-900 border border-purple-500 rounded-lg p-3 text-slate-100">
            <div class="text-pink-400 font-semibold mb-2">${formattedDate}</div>
            <div class="text-blue-400 text-sm mb-2">Trade #${tradeNumber}</div>`;
          
          series.forEach((seriesData: number[], index: number) => {
            const value = seriesData[dataPointIndex];
            const seriesName = w.globals.seriesNames[index];
            const color = index === 0 ? '#a855f7' : '#10b981';
            
            if (displayMode === 'usdt') {
              content += `<div style="color: ${color};">${seriesName}: ${formatCompactNumber(value)} USDT</div>`;
            } else {
              content += `<div style="color: ${color};">${seriesName}: ${value.toFixed(2)}%</div>`;
            }
          });
          
          content += '</div>';
          return content;
        },
      },
      legend: {
        show: false, // We're using our own checkboxes
      },
      annotations: {
        yaxis: [
          // Reference line for drawdown at 0
          {
            y: 0,
            yAxisIndex: 0,
            borderColor: '#a855f7',
            strokeDashArray: 4,
            opacity: 0.7,
          },
          // Reference line for cumulative P&L at 0 (only in percentage mode)
          ...(displayMode === 'percent' ? [{
            y: 0,
            yAxisIndex: 1,
            borderColor: '#10b981',
            strokeDashArray: 4,
            opacity: 0.7,
          }] : []),
        ],
      },
    };
  }, [chartData, displayMode]);

  const chartSeries = useMemo((): any[] => {
    const series: any[] = [];
    
    if (showDrawdown) {
      series.push({
        name: displayMode === 'usdt' ? 'Drawdown USDT' : 'Drawdown %',
        data: chartData.map(d => displayMode === 'usdt' ? d.drawdown_USDT : d.drawdown_PCT),
        yAxisIndex: 0, // Left axis
      });
    }
    
    if (showCumPL) {
      series.push({
        name: displayMode === 'usdt' ? 'Cumulative P&L USDT' : 'Cumulative P&L %',
        data: chartData.map(d => displayMode === 'usdt' ? d.cumPL_USDT : d.cumPL_PCT),
        yAxisIndex: 1, // Right axis
      });
    }
    
    return series;
  }, [chartData, displayMode, showDrawdown, showCumPL]);

  // ApexCharts handles zoom internally, so we don't need custom wheel event handling

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
      <CardHeader className="px-2 py-0 sm:px-2 sm:py-4">
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
        <div 
          ref={chartContainerRef}
          className="h-80 sm:h-[28rem] w-[150%] sm:w-full bg-transparent rounded-lg shadow-lg p-0"
          onMouseEnter={() => setIsHoveringChart(true)}
          onMouseLeave={() => setIsHoveringChart(false)}
        >
          {/* @ts-ignore */}
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="line"
            height="100%"
            width="100%"
          />
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
        </div>
      </CardContent>
    </Card>
  );
}
