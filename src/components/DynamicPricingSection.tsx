'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { TradingPairSelector } from './TradingPairSelector';
import { SubscribeButton } from './subscription/SubscribeButton';
import { SubscriptionStatus } from '@/generated/prisma';
import { useSession } from 'next-auth/react';
import { ProcessedPairData, processPairsData } from '@/lib/utils';

export function DynamicPricingSection({ pairs }: { pairs: any[] }) {
  const [selectedPair, setSelectedPair] = useState<string>('');

  useEffect(() => {
    setSelectedPair(pairs[0]?.id);
  }, [pairs]);

  // Find the selected pair data from API
  const selectedPairData = pairs.find(pair => pair.id === selectedPair);

  // Use metrics from ProcessedPairData
  const pairMetrics: ProcessedPairData | undefined = processPairsData(selectedPairData ? [selectedPairData] : []).find(p => p.id === selectedPair);

  // Create pricing plans based on real data
  const plans = selectedPairData ? [
    {
      id: '1month',
      name: '1 Month',
      description: 'Perfect for testing our signals',
      months: 1,
      popular: false,
      limitations: ['Limited historical data', 'Basic analytics only'],
      basePrice: Number(selectedPairData.priceOneMonth),
      discount: Number(selectedPairData.discountOneMonth),
      finalPrice: Number(selectedPairData.priceOneMonth) * (1 - Number(selectedPairData.discountOneMonth) / 100),
    },
    {
      id: '3months',
      name: '3 Months',
      description: 'Most popular choice for serious traders',
      months: 3,
      popular: true,
      limitations: [],
      basePrice: Number(selectedPairData.priceThreeMonths),
      discount: Number(selectedPairData.discountThreeMonths),
      finalPrice: Number(selectedPairData.priceThreeMonths) * (1 - Number(selectedPairData.discountThreeMonths) / 100),
    },
    {
      id: '6months',
      name: '6 Months',
      description: 'Best value for consistent profits',
      months: 6,
      popular: false,
      limitations: [],
      basePrice: Number(selectedPairData.priceSixMonths),
      discount: Number(selectedPairData.discountSixMonths),
      finalPrice: Number(selectedPairData.priceSixMonths) * (1 - Number(selectedPairData.discountSixMonths) / 100),
    },
    {
      id: '12months',
      name: '12 Months',
      description: 'Maximum savings for professionals',
      months: 12,
      popular: false,
      limitations: [],
      basePrice: Number(selectedPairData.priceTwelveMonths),
      discount: Number(selectedPairData.discountTwelveMonths),
      finalPrice: Number(selectedPairData.priceTwelveMonths) * (1 - Number(selectedPairData.discountTwelveMonths) / 100),
    },
  ] : [];

  const paymentStatus = selectedPairData?.subscriptions?.[0].status;
  const inviteStatus = selectedPairData?.subscriptions?.[0]?.inviteStatus;
  const expiryDate = selectedPairData?.subscriptions?.[0]?.expiryDate;
  const expiryTs = expiryDate ? (expiryDate instanceof Date ? expiryDate.getTime() : new Date(expiryDate).getTime()) : undefined;
  let userSubscriptionStatus = 
    paymentStatus === 'PAID' && inviteStatus === 'COMPLETED' ? SubscriptionStatus.ACTIVE
    : paymentStatus === 'PAID' && inviteStatus === 'SENT' ? 'INVITED'
    : inviteStatus === 'PENDING' ? SubscriptionStatus.PENDING
    : expiryTs !== undefined && Math.floor((expiryTs - Date.now()) / (24 * 60 * 60 * 1000)) <= 3 ? SubscriptionStatus.RENEWING
    : SubscriptionStatus.TRIAL;

  const session = useSession();

  return (
    <section
      id="pricing"
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 lg:py-32"
    >
      <div className="container grid max-w-6xl gap-4 md:gap-8">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          <h2 className="font-urbanist text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight">
            Choose from one of <br className="hidden sm:block" /> of
            <span className="bg-gradient-to-r from-pink-600 to-purple-400 bg-clip-text text-transparent">
              {' '}
              the following Pairs
            </span>
          </h2>
          <h3 className="max-w-2xl text-sm sm:text-base lg:text-xl text-zinc-400 sm:leading-8">
            Select a trading pair to see customized pricing for your preferred
            market.
          </h3>
        </div>

        {/* Trading Pair Selector */}
        <div className="flex justify-center my-0">
          <TradingPairSelector
            paris={pairs}
            selectedPair={selectedPair}
            onPairSelect={setSelectedPair}
          />
        </div>        {/* Loading/Error States for Pairs Data */}

        {/* Pair Metrics Display */}
        {selectedPairData && pairMetrics && pairMetrics.metrics.totalTrades > 0 ? (
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base sm:text-sm font-semibold text-white">
                    {selectedPairData.symbol} | {selectedPairData.timeframe} | {selectedPairData.version}
                  </h4>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      pairMetrics.metrics.roi >= 0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {pairMetrics.metrics.roi >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {pairMetrics.metrics.roi.toFixed(2)}%
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-zinc-400">Net Profit</span>
                    <div className={`text-lg sm:text-xl font-bold ${pairMetrics.metrics.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${pairMetrics.metrics.profit.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">ROI</span>
                    <div className={`text-base sm:text-lg font-semibold ${pairMetrics.metrics.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pairMetrics.metrics.roi.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Win Rate</span>
                    <div className="text-sm sm:text-base text-white font-medium">
                      {pairMetrics.metrics.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Total Trades</span>
                    <div className="text-sm sm:text-base text-white font-medium">
                      {pairMetrics.metrics.totalTrades}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Max Drawdown</span>
                    <div className="text-sm sm:text-base text-white font-medium">
                      ${pairMetrics.metrics.maxDrawdown.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ): (
          <div className="flex justify-center mb-8">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 text-sm">
              No performance metrics available for {selectedPair}.
            </div>
          </div>
        )}

        {/* Dynamic Pricing Cards */}
        {selectedPairData && plans.length > 0 && (
          <div className="mx-auto w-full">
            {/* Mobile: Horizontal scroll */}
            <div className="max-w-xs mx-auto flex gap-4 overflow-x-auto pb-4 sm:hidden scrollbar-hide scroll-smooth">
              {plans.map((plan) => (
                <div key={plan.id} className="flex-shrink-0 w-64 min-w-[262px]">
                  <Card
                    className={`relative flex flex-col pt-0 transition-all duration-1000 ease-out hover:opacity-80 md:hover:-translate-y-3 w-full ${
                      plan.popular &&
                      'border-pink-600/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10'
                    }`}
                  >
                    <CardHeader className="overflow-hidden p-4 sm:p-6 px-4 sm:px-8 rounded-t-lg bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                      {plan.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-pink-600 to-purple-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                            POPULAR
                          </span>
                        </div>
                      )}
                      <CardTitle className="font-urbanist text-xl sm:text-2xl tracking-wide text-white">
                        {plan.name}
                      </CardTitle>

                      <CardDescription className="text-xs sm:text-sm text-zinc-400">
                        {plan.description}
                      </CardDescription>

                      <div className="flex flex-col gap-3 sm:gap-4 py-2">
                        <div className="flex gap-1 sm:gap-2 text-2xl sm:text-3xl lg:text-4xl font-semibold">
                          <span className="flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-normal text-white">
                            $
                          </span>
                          <span className="text-white">{Math.round(plan.finalPrice)}</span>
                          <span className="flex items-end text-sm sm:text-base lg:text-lg font-semibold text-white">
                            / {plan.months === 1 ? 'month' : `${plan.months} months`}
                          </span>
                        </div>
                        {plan.discount > 0 && (
                          <div className="text-xs sm:text-sm text-green-400">
                            Save {plan.discount}% (${Math.round(plan.basePrice - plan.finalPrice)} off)
                          </div>
                        )}
                        <div className="text-xs sm:text-sm text-zinc-400">
                          For {selectedPairData.symbol} signals
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col justify-between text-sm lg:text-base">
                      <SubscribeButton
                        userSubscriptionStatus={userSubscriptionStatus as SubscriptionStatus}
                        isUserLoggedIn={session?.data?.user ? true : false}
                        pair={selectedPairData as any}
                      />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden sm:grid sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col pt-0 transition-all duration-1000 ease-out hover:opacity-80 md:hover:-translate-y-3 min-w-[250px] ${
                    plan.popular &&
                    'border-pink-600/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10'
                  }`}
                >
                  <CardHeader className="overflow-hidden p-4 sm:p-6 px-4 sm:px-8 rounded-t-lg bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                    {plan.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-pink-600 to-purple-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                          POPULAR
                        </span>
                      </div>
                    )}
                    <CardTitle className="font-urbanist text-xl sm:text-2xl tracking-wide text-white">
                      {plan.name}
                    </CardTitle>

                    <CardDescription className="text-xs sm:text-sm text-zinc-400">
                      {plan.description}
                    </CardDescription>

                    <div className="flex flex-col gap-3 sm:gap-4 py-2">
                      <div className="flex gap-1 sm:gap-2 text-2xl sm:text-3xl lg:text-4xl font-semibold">
                        <span className="flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-normal text-white">
                          $
                        </span>
                        <span className="text-white">{Math.round(plan.finalPrice)}</span>
                        <span className="flex items-end text-sm sm:text-base lg:text-lg font-semibold text-white">
                          / {plan.months === 1 ? 'month' : `${plan.months} months`}
                        </span>
                      </div>
                      {plan.discount > 0 && (
                        <div className="text-xs sm:text-sm text-green-400">
                          Save {plan.discount}% (${Math.round(plan.basePrice - plan.finalPrice)} off)
                        </div>
                      )}
                      <div className="text-xs sm:text-sm text-zinc-400">
                        For {selectedPairData.symbol} signals
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between text-sm lg:text-base">
                    <SubscribeButton
                      userSubscriptionStatus={userSubscriptionStatus as SubscriptionStatus}
                      isUserLoggedIn={session?.data?.user ? true : false}
                      pair={selectedPairData as any}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
