'use client';

import { useState } from 'react';
import { Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { TradingPairSelector } from './TradingPairSelector';
import { useTwelveDataQuote } from '@/hooks/useTwelveData';

export function DynamicPricingSection() {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');

  // Fetch real-time data for the selected pair
  const {
    data: quoteData,
    loading: quoteLoading,
    error: quoteError,
  } = useTwelveDataQuote(selectedPair);

  const pricingData = {
    'EUR/USD': { base: 49, multiplier: 1.0 },
    'GBP/USD': { base: 59, multiplier: 1.2 },
    'USD/JPY': { base: 54, multiplier: 1.1 },
    'BTC/USD': { base: 89, multiplier: 1.8 },
    'ETH/USD': { base: 79, multiplier: 1.6 },
    'XAU/USD': { base: 69, multiplier: 1.4 },
  };

  const currentPricing =
    pricingData[selectedPair as keyof typeof pricingData] ||
    pricingData['EUR/USD'];

  const plans = [
    {
      id: '1month',
      name: '1 Month',
      description: 'Perfect for testing our signals',
      months: 1,
      popular: false,
      limitations: ['Limited historical data', 'Basic analytics only'],
      price: Math.round(currentPricing.base * currentPricing.multiplier),
    },
    {
      id: '3months',
      name: '3 Months',
      description: 'Most popular choice for serious traders',
      months: 3,
      popular: true,
      limitations: [],
      price: Math.round(currentPricing.base * currentPricing.multiplier * 2.7), // 10% discount
    },
    {
      id: '6months',
      name: '6 Months',
      description: 'Best value for consistent profits',
      months: 6,
      popular: false,
      limitations: [],
      price: Math.round(currentPricing.base * currentPricing.multiplier * 5.1), // 15% discount
    },
    {
      id: '12months',
      name: '12 Months',
      description: 'Maximum savings for professionals',
      months: 12,
      popular: false,
      limitations: [],
      price: Math.round(currentPricing.base * currentPricing.multiplier * 9.6), // 20% discount
    },
  ];

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
            selectedPair={selectedPair}
            onPairSelect={setSelectedPair}
          />
        </div>

        {/* Real-time Price Display */}

        {quoteLoading ? (
          <div className="flex justify-center mb-4 sm:mb-8">
            <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:min-w-[300px]">
              <div className="animate-pulse">
                <div className="h-4 bg-zinc-700 rounded mb-4"></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="h-8 sm:h-12 bg-zinc-700 rounded"></div>
                  <div className="h-8 sm:h-12 bg-zinc-700 rounded"></div>
                  <div className="h-8 sm:h-10 bg-zinc-700 rounded"></div>
                  <div className="h-8 sm:h-10 bg-zinc-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          quoteData && (
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:min-w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base sm:text-lg font-semibold text-white">
                    {selectedPair}
                  </h4>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      parseFloat(quoteData.percent_change) >= 0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {parseFloat(quoteData.percent_change) >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {quoteData.percent_change}%
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-zinc-400">Current Price</span>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {quoteData.close}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Change</span>
                    <div
                      className={`text-base sm:text-lg font-semibold ${
                        parseFloat(quoteData.change) >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {quoteData.change}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">High</span>
                    <div className="text-sm sm:text-base text-white font-medium">
                      {quoteData.high}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Low</span>
                    <div className="text-sm sm:text-base text-white font-medium">
                      {quoteData.low}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {quoteError && (
          <div className="flex justify-center mb-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
              Failed to load {selectedPair} data: {quoteError}
            </div>
          </div>
        )}

        {/* Dynamic Pricing Cards */}
        <div className="mx-auto grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                    <span className="text-white">{plan.price}</span>
                    <span className="flex items-end text-sm sm:text-base lg:text-lg font-semibold text-white">
                      / {plan.months === 1 ? 'month' : `${plan.months} months`}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-zinc-400">
                    For {selectedPair} signals
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between text-sm lg:text-base">
                <Button
                  variant="outline"
                  className="h-10 sm:h-12 w-full border bg-gradient-to-br from-pink-600/20 to-purple-400/20 font-bold tracking-wide text-white hover:bg-gradient-to-br hover:from-pink-600/30 hover:to-purple-400/30 text-sm sm:text-base"
                >
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
