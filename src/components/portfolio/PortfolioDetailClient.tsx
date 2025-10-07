'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  DollarSign,
  Activity,
  AlertTriangle,
  Edit,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { BacktestChart } from '@/components/pair/BacktestChart';
import { OverviewSection } from '../dashboard/DashboardStats';

interface Portfolio {
  id: string;
  name: string;
  description: string;
  pairIds: string[];
  createdAt: string;
  updatedAt: string;
  performance: {
    totalValue: number;
    totalReturn: number;
    totalReturnPercentage: number;
    bestPerformer: string;
    worstPerformer: string;
  };
}

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
}

interface PortfolioDetailClientProps {
  portfolio: Portfolio;
  portfolioPairs: PairData[];
}

export function PortfolioDetailClient({
  portfolio,
  portfolioPairs,
}: PortfolioDetailClientProps) {
  // Update document title dynamically
  useEffect(() => {
    if (portfolio) {
      document.title = `${portfolio.name} - Portfolio Details | AlgoMakers.Ai`;
    }
  }, [portfolio]);

  // Calculate combined metrics
  const combinedMetrics = useMemo(() => {
    if (portfolioPairs.length === 0) {
      return {
        totalPairs: 0,
        totalProfit: 0,
        avgROI: 0,
        avgWinRate: 0,
        avgRiskReward: 0,
        maxDrawdown: 0,
        totalTrades: 0,
      };
    }

    const totalPairs = portfolioPairs.length;
    const totalProfit = portfolioPairs.reduce(
      (sum, pair) => sum + pair.metrics.profit,
      0
    );
    const avgROI =
      portfolioPairs.reduce((sum, pair) => sum + pair.metrics.roi, 0) /
      totalPairs;
    const avgWinRate =
      portfolioPairs.reduce((sum, pair) => sum + pair.metrics.winRate, 0) /
      totalPairs;
    const avgRiskReward =
      portfolioPairs.reduce((sum, pair) => sum + pair.metrics.riskReward, 0) /
      totalPairs;
    const maxDrawdown = Math.max(
      ...portfolioPairs.map((pair) => pair.metrics.maxDrawdown)
    );
    const totalTrades = portfolioPairs.reduce(
      (sum, pair) => sum + pair.metrics.totalTrades,
      0
    );

    return {
      totalPairs,
      totalProfit,
      avgROI,
      avgWinRate,
      avgRiskReward,
      maxDrawdown,
      totalTrades,
    };
  }, [portfolioPairs]);

  // Generate combined backtest data
  const combinedBacktestData = useMemo(() => {
    const startDate = '2024-01-01';
    const endDate = '2024-09-01';
    const initialBalance = 10000;
    const finalBalance = initialBalance + combinedMetrics.totalProfit;

    // Generate combined equity curve
    const equityCurve = Array.from({ length: 9 }, (_, i) => {
      const currentValue = initialBalance + (combinedMetrics.totalProfit * (i + 1)) / 9;
      const currentProfitPct = ((currentValue - initialBalance) / initialBalance) * 100;
      const drawdownValue = Math.max(0, combinedMetrics.maxDrawdown * (i + 1) / 9);
      
      return {
        date: new Date(2024, i, 1).toISOString().split('T')[0],
        value: currentValue,
        tradeNumber: i + 1,
        cumPL_USDT: currentValue - initialBalance,
        cumPL_PCT: currentProfitPct,
        drawdown_USDT: drawdownValue,
        drawdown_PCT: (drawdownValue / initialBalance) * 100,
      };
    });

    return {
      startDate,
      endDate,
      initialBalance,
      finalBalance,
      equityCurve,
    };
  }, [combinedMetrics.totalProfit]);

  return (
    <div className="w-full px-0 sm:px-4 md:px-6 lg:px-8">
      {/* Portfolio Overview Cards */}
      <OverviewSection
        overviewData={[
          {
            title: 'Total Value',
            currentValue: `$${portfolio.performance.totalValue.toLocaleString()}`,
            icon: DollarSign,
            description: `Total portfolio value`,
            pastValue: `${
              portfolio.performance.totalReturn >= 0 ? '+' : ''
            }$${portfolio.performance.totalReturn.toLocaleString()} (${
              portfolio.performance.totalReturnPercentage >= 0 ? '+' : ''
            }${portfolio.performance.totalReturnPercentage.toFixed(1)}%)`,
            color: 'text-green-300',
            bgColor: 'bg-green-400/20',
          },
          {
            title: 'Average ROI',
            currentValue: `${
              combinedMetrics.avgROI >= 0 ? '+' : ''
            }${combinedMetrics.avgROI.toFixed(1)}%`,
            icon: TrendingUp,
            description: `Across ${combinedMetrics.totalPairs} pairs`,
            color: 'text-blue-300',
            bgColor: 'bg-blue-400/20',
          },
          {
            title: 'Win Rate',
            currentValue: `${combinedMetrics.avgWinRate.toFixed(1)}%`,
            icon: Target,
            description: `${combinedMetrics.totalTrades} total trades`,
            color: 'text-purple-300',
            bgColor: 'bg-purple-400/20',
          },
          {
            title: 'Max Drawdown',
            currentValue: `${combinedMetrics.maxDrawdown.toFixed(1)}%`,
            icon: AlertTriangle,
            description: `Risk/Reward: ${combinedMetrics.avgRiskReward.toFixed(
              1
            )}`,
            color: 'text-orange-300',
            bgColor: 'bg-orange-400/20',
          },
        ]}
        className="mb-8"
      />

      {/* Main Content Tabs and Header Actions on same row */}
      <div className="flex items-center justify-between mb-6">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-2 md:gap-0">
            <TabsList className="pl-48 md:pl-0 bg-white/10 border-white/20 max-w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
              <TabsTrigger
                value="overview"
                className="pl-3 pr-4 sm:pl-4 sm:pr-6 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:-bottom-1 data-[state=active]:after:h-1 data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-purple-500 data-[state=active]:after:via-pink-500"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="px-4 sm:px-6 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:-bottom-1 data-[state=active]:after:h-1 data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-purple-500 data-[state=active]:after:via-pink-500"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="pairs"
                className="px-4 sm:px-6 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:-bottom-1 data-[state=active]:after:h-1 data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-purple-500 data-[state=active]:after:via-pink-500"
              >
                <PieChart className="w-4 h-4 mr-2" />
                Pairs Analysis
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="px-4 sm:px-6 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:-bottom-1 data-[state=active]:after:h-1 data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-purple-500 data-[state=active]:after:via-pink-500"
              >
                <Activity className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2 ml-6">
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Combined Portfolio Chart */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Portfolio Performance Chart
                </CardTitle>
              </CardHeader>
              <CardContent className="px-1">
                <BacktestChart
                  data={combinedBacktestData}
                  symbol={portfolio.name}
                  metrics={{
                    drawdownUSDT: combinedMetrics.totalProfit * (combinedMetrics.maxDrawdown / 100),
                    drawdownPCT: combinedMetrics.maxDrawdown,
                    cumPL_USDT: combinedMetrics.totalProfit,
                    cumPL_PCT: combinedMetrics.avgROI,
                  }}
                />
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    Portfolio Composition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {portfolioPairs.map((pair, index) => (
                    <div
                      key={pair.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <div>
                          <span className="text-white font-medium">
                            {pair.symbol}
                          </span>
                          <div className="text-white/60 text-sm">
                            {pair.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${
                            pair.metrics.roi >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {pair.metrics.roi >= 0 ? '+' : ''}
                          {pair.metrics.roi.toFixed(1)}%
                        </div>
                        <div className="text-white/60 text-sm">
                          ${pair.metrics.profit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Portfolio Beta</span>
                    <span className="text-white font-medium">1.2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Sharpe Ratio</span>
                    <span className="text-green-400 font-medium">2.1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Volatility</span>
                    <span className="text-orange-400 font-medium">18.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Correlation</span>
                    <span className="text-blue-400 font-medium">0.65</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Value at Risk (95%)</span>
                    <span className="text-red-400 font-medium">-$1,250</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="text-white text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <h3 className="text-xl font-semibold mb-2">
                Performance Analytics Coming Soon
              </h3>
              <p className="text-white/70">
                Detailed performance metrics and historical analysis will be
                available here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="pairs" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {portfolioPairs.map((pair) => (
                <Card
                  key={pair.id}
                  className="bg-white/10 backdrop-blur-md border-white/20"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">
                        {pair.symbol}
                      </CardTitle>
                      {pair.isPopular && (
                        <Badge className="bg-orange-500/10 text-orange-400">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">{pair.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">ROI</span>
                        <div
                          className={`font-semibold ${
                            pair.metrics.roi >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {pair.metrics.roi >= 0 ? '+' : ''}
                          {pair.metrics.roi.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Win Rate</span>
                        <div className="text-blue-400 font-semibold">
                          {pair.metrics.winRate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Profit</span>
                        <div
                          className={`font-semibold ${
                            pair.metrics.profit >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          ${pair.metrics.profit.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Trades</span>
                        <div className="text-white font-semibold">
                          {pair.metrics.totalTrades}
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                    >
                      <Link href={`/pair/${pair.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-white text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <h3 className="text-xl font-semibold mb-2">
                Advanced Analytics Coming Soon
              </h3>
              <p className="text-white/70">
                Deep dive analytics and AI-powered insights will be available
                here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
