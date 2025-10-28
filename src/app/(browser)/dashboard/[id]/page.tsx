import { notFound } from 'next/navigation';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BarChart3, Activity, TrendingUp, Clock } from 'lucide-react';
import { BacktestChart } from '@/components/pair/BacktestChart';
import { SubscribeButton } from '@/components/subscription/SubscribeButton';
import { SubscriptionStatus } from '@/generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to serialize Prisma Decimal objects to numbers
function serializePairData(pair: any) {
  return {
    ...pair,
    priceOneMonth: Number(pair.priceOneMonth),
    priceThreeMonths: Number(pair.priceThreeMonths),
    priceSixMonths: Number(pair.priceSixMonths),
    priceTwelveMonths: Number(pair.priceTwelveMonths),
    discountOneMonth: Number(pair.discountOneMonth),
    discountThreeMonths: Number(pair.discountThreeMonths),
    discountSixMonths: Number(pair.discountSixMonths),
    discountTwelveMonths: Number(pair.discountTwelveMonths),
  };
}

interface BacktestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BacktestDetailPage({
  params,
}: BacktestDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const pair = await prisma.pair.findUnique({
    where: { id },
    include: {
      subscriptions: session?.user ? {
        where: { userId: session.user.id },
      } : false,
    },
  });

  if (!pair) {
    notFound();
  }

  // Serialize the pair data to convert Decimal objects to numbers
  const serializedPair = serializePairData(pair);

  return (
    <GradientBackground className='relative'>
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
                    {serializedPair.symbol}
                  </h1>
                </div>
                <p className="text-white/70 text-sm">{serializedPair.timeframe}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-white/60 text-xs">Price (1M)</div>
                <div className="font-bold text-green-400">
                  {'$' + String(serializedPair.priceOneMonth)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">Price (3M)</div>
                <div className="font-bold text-blue-400">
                  {'$' + String(serializedPair.priceThreeMonths)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">Price (6M)</div>
                <div className="font-bold text-amber-400">
                  {'$' + String(serializedPair.priceSixMonths)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">Price (12M)</div>
                <div className="font-bold text-purple-400">
                  {'$' + String(serializedPair.priceTwelveMonths)}
                </div>
              </div>
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
                    {new Date(serializedPair.updatedAt).toLocaleString(undefined, {
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
                  <span className="text-white/70">Version Name</span>
                  <span className="text-white font-mono max-w-[150px] truncate md:max-w-none">
                    {pair.version || 'N/A'}
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
            {/* Backtest Metrics Card */}
            <Card className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3">
              <h2 className="text-xl font-bold text-white mb-4">
                Backtest Metrics
              </h2>
              {/* BacktestChart for List of trades (Exit long) */}
              {(() => {
                let trades: any[] = [];
                try {
                  // Parse listOfTrades from JSON string
                  const listOfTrades = pair.listOfTrades && typeof pair.listOfTrades === 'string' 
                    ? JSON.parse(pair.listOfTrades) 
                    : pair.listOfTrades || [];
                  trades = Array.isArray(listOfTrades)
                    ? listOfTrades.filter((t: any) => t['Type'] === 'Exit long')
                    : [];
                } catch (e) {
                  console.error('Error parsing listOfTrades:', e);
                  trades = [];
                }
                if (!trades.length) {
                  return (
                    <div className="text-white/60 text-sm mb-4">
                      No 'Exit long' trades found for chart.
                    </div>
                  );
                }
                // Map trades to BacktestChart expected format with existing values
                const chartData = {
                  startDate: trades[0]['Date/Time']
                    ? excelDateToISO(trades[0]['Date/Time'])
                    : new Date().toISOString(),
                  endDate: trades[trades.length - 1]['Date/Time']
                    ? excelDateToISO(trades[trades.length - 1]['Date/Time'])
                    : new Date().toISOString(),
                  initialBalance: trades[0]['Cumulative P&L USDT'] ?? 0,
                  finalBalance:
                    trades[trades.length - 1]['Cumulative P&L USDT'] ?? 0,
                  equityCurve: trades.map((t: any, index: number) => ({
                    date: t['Date/Time']
                      ? excelDateToISO(t['Date/Time'])
                      : new Date().toISOString(),
                    value: t['Cumulative P&L USDT'] || 0,
                    tradeNumber: t['Trade #'] || index + 1,
                    cumPL_USDT: t['Cumulative P&L USDT'] || 0,
                    cumPL_PCT: t['Cumulative P&L %'] || 0,
                    drawdown_USDT: Math.abs(t['Drawdown USDT'] || 0),
                    drawdown_PCT: Math.abs(t['Drawdown %'] || 0),
                  })),
                };
                
                // Extract drawdown and cumulative P&L metrics from the data
                const drawdownUSDT = Math.min(...trades.map(t => t['Drawdown USDT'] || 0));
                const drawdownPCT = Math.min(...trades.map(t => t['Drawdown %'] || 0));
                const finalCumPL_USDT = trades[trades.length - 1]['Cumulative P&L USDT'] || 0;
                const finalCumPL_PCT = trades[trades.length - 1]['Cumulative P&L %'] || 0;
                
                return (
                  <div className="mb-6 w-full overflow-x-auto">
                    <BacktestChart
                      data={chartData}
                      symbol={serializedPair.symbol}
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
              {[
                {
                  title: 'Trades analysis',
                  metrics: pair.tradesAnalysis,
                  values: [5, 6, 7, 9, 11], // Row indices for $ symbol in "Value" column
                  v_symbol: '$',
                  all: [4, 5, 6, 7, 10, 12], // Row indices for % symbol in "All %" column
                  all_symbol: '%',
                  ignore: []
                },
                {
                  title: 'Performance Metrics',
                  metrics: pair.performance,
                  values: [0, 1, 2, 3, 4, 5, 6, 7], // Row indices for $ symbol in "Value" column
                  v_symbol: '$',
                  all: [0, 1, 2, 3, 4, 5, 6, 7], // Row indices for % symbol in "All %" column
                  all_symbol: '%',
                  ignore: [8]
                },
                {
                  title: 'Risk performance ratios',
                  metrics: pair.riskPerformanceRatios,
                  values: [], // Row indices for $ symbol in "Value" column
                  v_symbol: '$',
                  all: [0, 2, 3], // Row indices for % symbol in "All %" column
                  all_symbol: '%',
                  ignore: [3]
                },
              ]?.map(({ title, metrics: rawMetrics, values = [], v_symbol = '', all = [], all_symbol = '', ignore = [] }) => {
                // Parse metrics from JSON string if needed
                let metrics: any[] = [];
                try {
                  metrics = rawMetrics && typeof rawMetrics === 'string' 
                    ? JSON.parse(rawMetrics) 
                    : rawMetrics || [];
                } catch (e) {
                  console.error(`Error parsing ${title}:`, e);
                  metrics = [];
                }
                return (
                <div key={title} className="mt-8">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    {title}
                  </h3>
                  {Array.isArray(metrics) && metrics.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-white/80 bg-black/20 rounded">
                        <thead>
                          <tr>
                            <th
                              className="px-2 py-1 text-left font-semibold"
                            >
                              </th>
                              <th className="px-2 py-1 text-right font-semibold">
                                Vlaue
                              </th>
                              <th className="px-2 py-1 text-right font-semibold">
                                All %
                              </th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map(
                            (row: any, idx: number) => {
                              // Skip rendering if row index is in ignore array
                              if (ignore.includes(idx)) {
                                return null;
                              }
                              return(
                              <tr
                                key={'metrics'+idx}
                                className="border-t border-white/10"
                              >
                                <td className="px-2 py-1 text-left text-nowrap">
                                  {row['__EMPTY'] || row[''] || row.value || `Row ${idx + 1}`}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['All USDT'] !== '' && row['All USDT'] !== undefined
                                    ? Number(row['All USDT']+ '').toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 4 }
                                      ) + (values.includes(idx) ? ' ' + v_symbol : '')
                                    : '-'}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row['All %'] !== '' && row['All %'] !== undefined
                                    ? Number(row['All %']).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 4 }
                                      ) + (all.includes(idx) ? ' ' + all_symbol : '')
                                    : '-'}
                                </td>
                              </tr>
                            )}
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      No {title.toLowerCase()} data available.
                    </div>
                  )}
                </div>
                );
              })}
            </Card>
          </div>

          <div className="xl:col-span-2 space-y-2 pr-0 md:pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 md:px-6">
              {/* Properties section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Properties
                </h3>
                {(() => {
                  let properties: any[] = [];
                  try {
                    // Parse properties from JSON string if needed
                    properties = pair.properties && typeof pair.properties === 'string' 
                      ? JSON.parse(pair.properties) 
                      : pair.properties || [];
                  } catch (e) {
                    console.error('Error parsing properties:', e);
                    properties = [];
                  }
                  
                  return Array.isArray(properties) && properties.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-white/80 bg-black/20 rounded">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left font-semibold max-w-40">
                              Name
                            </th>
                            <th className="px-2 py-1 text-left font-semibold">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties.map(
                            (row: any, idx: number) => {
                              // Only render selected indices: 1-8 and 135-137, 144-147
                              const allowedIndices = [1, 2, 3, 4, 5, 6, 7, 133, 134, 135, 140, 141, 142, 143];
                              if (!allowedIndices.includes(idx)) {
                                return null;
                              }
                              return (
                              <tr
                                key={'properties'+idx}
                                className="border-t border-white/10"
                              >
                                <td className="px-2 py-1 font-semibold text-white/90 whitespace-nowrap max-w-48 overflow-hidden text-ellipsis">
                                  {row.name}
                                </td>
                                <td className="px-2 py-1 text-left">
                                  {row.value}
                                </td>
                              </tr>
                            )}
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      No properties data available.
                    </div>
                  );
                })()}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": `${pair.symbol} Backtest Details`,
        "description": `Detailed backtest metrics and analysis for ${pair.symbol} (${pair.timeframe}) on AlgoMakers.`,
        "datePublished": pair.createdAt,
        "dateModified": pair.updatedAt,
        "author": {
          "@type": "Organization",
          "name": "AlgoMakers"
        },
        "publisher": {
          "@type": "Organization",
          "name": "AlgoMakers",
          "logo": {
            "@type": "ImageObject",
            "url": `${process.env.NEXTAUTH_URL || 'https://algomakers.ai'}/logo.png`
          }
        }
      }) }} />
      <SubscribeButton
        pair={serializedPair}
        userSubscriptionStatus={serializedPair.subscriptions?.[0]?.status as SubscriptionStatus | undefined}
        isUserLoggedIn={!!session?.user}
        className='sticky bottom-4 right-0 bg-gradient-to-r from-purple-500 to-pink-500 w-fit rounded-md px-4 ml-auto'
      />
    </GradientBackground>
  );
}

// Dynamic metadata for dashboard detail (pair/backtest) pages
export async function generateMetadata({ params }: BacktestDetailPageProps) {
  const { id } = await params;
  try {
    const pair = await prisma.pair.findUnique({
      where: { id },
    });

    if (!pair) {
      return {
        title: 'Backtest not found – AlgoMakers',
        description: 'Backtest or pair not found',
        alternates: { canonical: `${process.env.NEXTAUTH_URL || 'https://algomakers.ai'}/dashboard/${id}` },
        robots: { index: false, follow: false },
      };
    }

    const title = `${pair.symbol} – AlgoMakers`;
    const description = `Backtest and performance details for ${pair.symbol} (${pair.timeframe}).`;

    return {
      title,
      description,
      keywords: ['backtest', pair.symbol, pair.timeframe, 'trading strategy', 'performance metrics', 'algorithmic trading', 'market analysis', 'AlgoMakers'],
      openGraph: {
        title,
        description,
        url: `${process.env.NEXTAUTH_URL || ''}/dashboard/${id}`,
        siteName: 'AlgoMakers',
        type: 'article',
      },
      robots: { index: true, follow: true },
      alternates: { canonical: `${process.env.NEXTAUTH_URL || ''}/dashboard/${id}` },
    };
  } catch (e) {
    return {
      title: 'Backtest – AlgoMakers',
      description: 'Backtest details',
    };
  }
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
