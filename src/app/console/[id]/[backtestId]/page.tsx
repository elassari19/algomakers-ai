import { notFound } from 'next/navigation';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { BacktestChart } from '@/components/pair/BacktestChart';

interface BacktestDetailPageProps {
  params: Promise<{ id: string; backtestId: string }>;
}

async function getBacktest(id: string) {
  const cookieStore = cookies();
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/backtest?id=${encodeURIComponent(id)}`,
    {
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.found) return null;
  return data.pair;
}

export default async function BacktestDetailPage({
  params,
}: BacktestDetailPageProps) {
  const { id, backtestId } = await params;

  const pair = await getBacktest(backtestId);

  if (!pair) {
    notFound();
  }

  return (
    <GradientBackground>
      <div className="min-h-screen">
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto py-3">
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
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <Link href={`/console/${id}`}>Back to Console</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-full">
            <div className="xl:col-span-3 space-y-8 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {/* Pricing & Info Card moved above Backtest Metrics */}
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Pricing & Info
                </h3>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Symbol</span>
                    <span className="text-white font-mono">{pair.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Timeframe</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {pair.timeframe}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">ID</span>
                    <span className="text-white font-mono">{pair.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Created</span>
                    <span className="text-white/80">
                      {new Date(pair.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
              <Card className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
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
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 mt-8">
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
                          <th className="px-2 py-1 text-left font-semibold">
                            Metric
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            All %
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Long %
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Short %
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            All USDT
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Long USDT
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Short USDT
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pair.metrics['Trades analysis'].map(
                          (row: any, idx: number) => (
                            <tr key={idx} className="border-t border-white/10">
                              <td className="px-2 py-1 font-semibold text-white/90 whitespace-nowrap">
                                {row['']}
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
                                {row['Long %'] !== ''
                                  ? Number(row['Long %']).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 4 }
                                    )
                                  : '-'}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {row['Short %'] !== ''
                                  ? Number(row['Short %']).toLocaleString(
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
                              <td className="px-2 py-1 text-right">
                                {row['Long USDT'] !== ''
                                  ? Number(row['Long USDT']).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 2 }
                                    )
                                  : '-'}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {row['Short USDT'] !== ''
                                  ? Number(row['Short USDT']).toLocaleString(
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
              </Card>
            </div>
            <div className="xl:col-span-1 space-y-2 pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6">
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
                          <th className="px-2 py-1 text-left font-semibold">
                            Metric
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            All %
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Long %
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Short %
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            All USDT
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Long USDT
                          </th>
                          <th className="px-2 py-1 text-right font-semibold">
                            Short USDT
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pair.metrics['Performance'].map(
                          (row: any, idx: number) => (
                            <tr key={idx} className="border-t border-white/10">
                              <td className="px-2 py-1 font-semibold text-white/90 whitespace-nowrap">
                                {row['']}
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
                                {row['Long %'] !== ''
                                  ? Number(row['Long %']).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 4 }
                                    )
                                  : '-'}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {row['Short %'] !== ''
                                  ? Number(row['Short %']).toLocaleString(
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
                              <td className="px-2 py-1 text-right">
                                {row['Long USDT'] !== ''
                                  ? Number(row['Long USDT']).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 2 }
                                    )
                                  : '-'}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {row['Short USDT'] !== ''
                                  ? Number(row['Short USDT']).toLocaleString(
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
                            <th className="px-2 py-1 text-left font-semibold">
                              Metric
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              All %
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              Long %
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              Short %
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              All USDT
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              Long USDT
                            </th>
                            <th className="px-2 py-1 text-right font-semibold">
                              Short USDT
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
                                <td className="px-2 py-1 font-semibold text-white/90 whitespace-nowrap">
                                  {row['']}
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
                                  {row['Long %'] !== ''
                                    ? Number(row['Long %']).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 4 }
                                      )
                                    : '-'}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['Short %'] !== ''
                                    ? Number(row['Short %']).toLocaleString(
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
                                <td className="px-2 py-1 text-right">
                                  {row['Long USDT'] !== ''
                                    ? Number(row['Long USDT']).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 2 }
                                      )
                                    : '-'}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['Short USDT'] !== ''
                                    ? Number(row['Short USDT']).toLocaleString(
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

                {/* Properties section */}
                <div className="mt-8">
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
                          {pair.metrics['Properties'].map(
                            (row: any, idx: number) => (
                              <tr
                                key={idx}
                                className="border-t border-white/10"
                              >
                                <td className="px-2 py-1 font-semibold text-white/90 whitespace-nowrap">
                                  {row.name}
                                </td>
                                <td className="px-2 py-1 text-left">
                                  {row.value}
                                </td>
                              </tr>
                            )
                          )}
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
