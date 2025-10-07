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
                    <span className="text-white/70">Version</span>
                    <span className="text-white font-mono">{pair.version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Timeframe</span>
                    <Badge className="bg-blue-500/20 text-white/70 border-blue-500/30">
                      {pair.timeframe}
                    </Badge>
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
                  const trades = Array.isArray(pair.listOfTrades)
                    ? pair.listOfTrades.filter(
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
                      value: typeof t['Cumulative P&L USDT'] === 'number'
                        ? t['Cumulative P&L USDT']
                        : 0,
                      // Pass existing values if available
                      cumPL_USDT: typeof t['Cumulative P&L USDT'] === 'number'
                        ? t['Cumulative P&L USDT']
                        : 0,
                      cumPL_PCT: typeof t['Cumulative P&L %'] === 'number'
                        ? t['Cumulative P&L %']
                        : 0,
                      drawdown_USDT: typeof t['Drawdown USDT'] === 'number'
                        ? t['Drawdown USDT']
                        : 0,
                      drawdown_PCT: typeof t['Drawdown %'] === 'number'
                        ? t['Drawdown %']
                        : 0,
                    })),
                  };
                  // Extract drawdown and cumulative P&L metrics from the data
                  const drawdownUSDT = Math.min(...trades.map((t: any) => t['Drawdown USDT'] || 0));
                  const drawdownPCT = Math.min(...trades.map((t: any) => t['Drawdown %'] || 0));
                  const finalCumPL_USDT = trades[trades.length - 1]['Cumulative P&L USDT'] || 0;
                  const finalCumPL_PCT = trades[trades.length - 1]['Cumulative P&L %'] || 0;
                  
                  return (
                    <div className="mb-6">
                      <BacktestChart
                        data={chartData}
                        symbol={pair.symbol}
                        metrics={{ 
                          drawdownUSDT, 
                          drawdownPCT, 
                          cumPL_USDT: finalCumPL_USDT,
                          cumPL_PCT: finalCumPL_PCT
                        }}
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
                {Array.isArray(pair.performance) &&
                pair.performance.length > 0 ? (
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
                        {pair.performance.map(
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
                  {Array.isArray(pair.riskPerformanceRatios) &&
                  pair.riskPerformanceRatios.length > 0 ? (
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
                          {pair.riskPerformanceRatios.map(
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
                  {Array.isArray(pair.properties) &&
                  pair.properties.length > 0 ? (
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
                            pair.properties[0],
                            pair.properties[2],
                            pair.properties[3],
                            pair.properties[5],
                            pair.properties[6],
                            pair.properties[73],
                            pair.properties[74],
                            pair.properties[75],
                            pair.properties[76],
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
                  {Array.isArray(pair.tradesAnalysis) &&
                  pair.tradesAnalysis.length > 0 ? (
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
                          {pair.tradesAnalysis.map(
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
