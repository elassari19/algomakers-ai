import { notFound } from 'next/navigation';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Activity, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { BacktestChart } from '@/components/pair/BacktestChart';
import { getBacktest } from '../../../api/services';

interface PairDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PairDetailPage({ params }: PairDetailPageProps) {
  const { id } = await params;
  // Fetch pair data from API or DB
  let pair = await getBacktest(id);
  if (!pair) {
    notFound();
  }
  // Parse metrics if stringified
  if (typeof pair.metrics === 'string') {
    try {
      pair.metrics = JSON.parse(pair.metrics);
    } catch (e) {
      pair.metrics = {};
    }
  }

  return (
    <GradientBackground>
      <div className="min-h-screen">
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto p-2 md:px-6 md:py-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg border border-white/20">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      {pair.symbol}
                    </h1>
                  </div>
                  <p className="text-white/70 text-sm">{pair.timeframe}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-white/60 text-xs">Price (1M)</div>
                  <div className="font-bold text-green-400">
                    ${pair.priceOneMonth}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white/60 text-xs">Price (3M)</div>
                  <div className="font-bold text-blue-400">
                    ${pair.priceThreeMonths}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white/60 text-xs">Price (6M)</div>
                  <div className="font-bold text-amber-400">
                    ${pair.priceSixMonths}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white/60 text-xs">Price (12M)</div>
                  <div className="font-bold text-purple-400">
                    ${pair.priceTwelveMonths}
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <Link href={`/pair`}>Back to Pairs</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-0 py-2 md:px-6 md:py-4">
          <div className="grid grid-cols-1 xl:grid-cols-6 gap-2 h-full">
            <div className="xl:col-span-4 space-y-4 md:space-y-8 overflow-y-auto pr-0 md:pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {/* Pricing & Info Card moved above Backtest Metrics */}
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Pricing & Info
                </h3>
                <div className="space-y-1">
                  {/* Updated At - attractive style */}
                  <div className="my-2 flex items-center justify-end">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-700/80 to-purple-700/80 text-xs font-semibold text-white shadow-lg border border-white/20">
                      <Clock className="w-4 h-4 text-white/70" />
                      Updated:{' '}
                      {new Date(pair.updatedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Symbol</span>
                    <span className="text-white font-mono">{pair.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Timeframe</span>
                    <Badge className="bg-blue-500/20 text-white/70 border-blue-500/30">
                      {pair.timeframe}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">ID</span>
                    <span className="text-white font-mono max-w-[150px] truncate md:max-w-none">
                      {pair.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Created</span>
                    <span className="text-white/80">
                      {new Date(pair.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </Card>
              {/* Backtest Metrics */}
              <Card className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3 md:p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Backtest Metrics
                </h2>
                {/* BacktestChart for List of trades (Exit long) */}
                {(() => {
                  const trades = Array.isArray(pair.metrics?.['List of trades'])
                    ? pair.metrics['List of trades'].filter(
                        (t: any) => t['Type'] === 'Exit long'
                      )
                    : [];
                  if (!trades.length) {
                    return (
                      <div className="text-white/60 text-sm mb-4">
                        No 'Exit long' trades found for chart.
                      </div>
                    );
                  }
                  // Map trades to BacktestChart expected format
                  const chartData = {
                    startDate: trades[0]['Date/Time']
                      ? excelDateToISO(trades[0]['Date/Time'])
                      : '',
                    endDate: trades[trades.length - 1]['Date/Time']
                      ? excelDateToISO(trades[trades.length - 1]['Date/Time'])
                      : '',
                    initialBalance: trades[0]['Cumulative P&L USDT'] ?? 0,
                    finalBalance:
                      trades[trades.length - 1]['Cumulative P&L USDT'] ?? 0,
                    equityCurve: trades.map((t: any) => ({
                      date: t['Date/Time']
                        ? excelDateToISO(t['Date/Time'])
                        : '',
                      value:
                        typeof t['Cumulative P&L USDT'] === 'number'
                          ? t['Cumulative P&L USDT']
                          : 0,
                    })),
                  };
                  // Optionally, pass metrics (roi, maxDrawdown) if available
                  let roi = 0;
                  if (chartData.initialBalance !== 0) {
                    roi =
                      ((chartData.finalBalance - chartData.initialBalance) /
                        Math.abs(chartData.initialBalance)) *
                      100;
                  }
                  // Calculate max drawdown (simple version)
                  let maxDrawdown = 0;
                  let peak = chartData.initialBalance;
                  chartData.equityCurve.forEach((pt) => {
                    if (pt.value > peak) peak = pt.value;
                    const dd = (peak - pt.value) / peak;
                    if (dd > maxDrawdown) maxDrawdown = dd;
                  });
                  return (
                    <div className="mb-6">
                      <BacktestChart
                        data={chartData}
                        symbol={pair.symbol}
                        metrics={{ roi, maxDrawdown }}
                      />
                    </div>
                  );
                })()}
              </Card>
              {/* Trades analysis section */}
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 md:px-6 mt-4 md:mt-8">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Performance Metrics
                </h3>
                {Array.isArray(pair.metrics['Performance']) &&
                pair.metrics['Performance'].length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-white/80 bg-black/20 rounded">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-left font-semibold"></th>
                          <th className="px-2 py-1 text-right font-semibold">
                            All %
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            All USDT
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pair.metrics['Performance'].map(
                          (row: any, idx: number) => (
                            <tr key={idx} className="border-t border-white/10">
                              <td className="px-2 py-1 text-left">
                                {row['__EMPTY']}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {row['All %'] !== ''
                                  ? Number(row['All %']).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 4 }
                                    )
                                  : '-'}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {row['All USDT'] !== ''
                                  ? Number(row['All USDT']).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 2 }
                                    )
                                  : '-'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-white/60">
                    No performance data available.
                  </div>
                )}
                {/* Risk performance ratios section */}
                <div className="mt-1">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Risk performance ratios
                  </h3>
                  {Array.isArray(pair.metrics['Risk performance ratios']) &&
                  pair.metrics['Risk performance ratios'].length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-white/80 bg-black/20 rounded">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left font-semibold"></th>
                            <th className="px-2 py-1 text-right font-semibold">
                              All %
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              All USDT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pair.metrics['Risk performance ratios'].map(
                            (row: any, idx: number) => (
                              <tr
                                key={idx}
                                className="border-t border-white/10"
                              >
                                <td className="px-2 py-1 text-left">
                                  {row['__EMPTY']}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['All %'] !== ''
                                    ? Number(row['All %']).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 4 }
                                      )
                                    : '-'}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['All USDT'] !== ''
                                    ? Number(row['All USDT']).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 2 }
                                      )
                                    : '-'}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      No risk performance ratio data available.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="xl:col-span-2 space-y-4 pr-0 md:pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 md:px-6">
                {/* Properties section */}
                <div className="">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Properties
                  </h3>
                  {Array.isArray(pair.metrics['Properties']) &&
                  pair.metrics['Properties'].length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-white/80 bg-black/20 rounded">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left font-semibold">
                              Name
                            </th>
                            <th className="px-2 py-1 text-left font-semibold">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            pair.metrics['Properties'][0],
                            pair.metrics['Properties'][2],
                            pair.metrics['Properties'][3],
                            pair.metrics['Properties'][5],
                            pair.metrics['Properties'][6],
                            pair.metrics['Properties'][73],
                            pair.metrics['Properties'][74],
                            pair.metrics['Properties'][75],
                            pair.metrics['Properties'][76],
                          ].map((row: any, idx: number) => (
                            <tr key={idx} className="border-t border-white/10">
                              <td className="px-2 py-1 font-semibold text-white/90 whitespace-nowrap">
                                {row.name}
                              </td>
                              <td className="px-2 py-1 text-left">
                                {row.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      No properties data available.
                    </div>
                  )}
                </div>
              </Card>
              {/* Trades analysis */}
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 md:px-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Trades analysis
                  </h3>
                  {Array.isArray(pair.metrics['Trades analysis']) &&
                  pair.metrics['Trades analysis'].length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-white/80 bg-black/20 rounded">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left font-semibold"></th>
                            <th className="px-2 py-1 text-right font-semibold">
                              All %
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              All USDT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pair.metrics['Trades analysis'].map(
                            (row: any, idx: number) => (
                              <tr
                                key={idx}
                                className="border-t border-white/10"
                              >
                                <td className="px-2 py-1 text-left">
                                  {row['__EMPTY']}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['All %'] !== ''
                                    ? Number(row['All %']).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 4 }
                                      )
                                    : '-'}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['All USDT'] !== ''
                                    ? Number(row['All USDT']).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 2 }
                                      )
                                    : '-'}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      No trades analysis data available.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}

// Helper: Convert Excel serial date to ISO string (YYYY-MM-DD)
function excelDateToISO(serial: number | string): string {
  // Excel date serials: days since 1899-12-31
  const s = typeof serial === 'string' ? parseFloat(serial) : serial;
  if (isNaN(s)) return '';
  const utc_days = Math.floor(s - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  // Add fractional day as time
  const fractionalDay = s - Math.floor(s);
  const totalSeconds = Math.round(86400 * fractionalDay);
  date_info.setSeconds(date_info.getSeconds() + totalSeconds);
  return date_info.toISOString();
}
