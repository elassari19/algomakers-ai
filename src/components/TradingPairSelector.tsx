'use client';

import { Marquee } from '@/components/ui/marquee';
import { twelveDataService } from '@/lib/twelvedata';
import Image from 'next/image';

interface TradingPairSelectorProps {
  onPairSelect: (pair: string) => void;
  selectedPair: string;
}

export function TradingPairSelector({
  onPairSelect,
  selectedPair,
}: TradingPairSelectorProps) {
  const tradingPairs = [
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'BTC/USD',
    'ETH/USD',
    'XAU/USD',
  ];

  return (
    <div className="relative flex h-[160px] sm:h-[200px] w-full flex-col items-center justify-center overflow-hidden">
      {/* Horizontal marquee with trading pairs */}
      <div className="w-full max-w-xs sm:max-w-2xl lg:max-w-4xl">
        <Marquee
          className="py-2 sm:py-4 [--duration:30s]"
          pauseOnHover={true}
          repeat={2}
        >
          {tradingPairs.map((pair) => (
            <TradingPairIcon
              key={pair}
              pair={pair}
              selectedPair={selectedPair}
              onSelect={onPairSelect}
            />
          ))}
        </Marquee>
      </div>

      {/* Reverse direction marquee */}
      <div className="w-full max-w-xs sm:max-w-2xl lg:max-w-4xl">
        <Marquee
          className="py-2 sm:py-4 [--duration:25s]"
          reverse={true}
          pauseOnHover={true}
          repeat={2}
        >
          {tradingPairs.reverse().map((pair) => (
            <TradingPairIcon
              key={`reverse-${pair}`}
              pair={pair}
              selectedPair={selectedPair}
              onSelect={onPairSelect}
            />
          ))}
        </Marquee>
      </div>
    </div>
  );
}

interface TradingPairIconProps {
  pair: string;
  selectedPair: string;
  onSelect: (pair: string) => void;
}

function TradingPairIcon({
  pair,
  selectedPair,
  onSelect,
}: TradingPairIconProps) {
  const isSelected = selectedPair === pair;
  const { base, quote, baseIcon, quoteIcon } =
    twelveDataService.getPairIcons(pair);

  const isCrypto = (symbol: string) =>
    ['BTC', 'ETH', 'XAU', 'XAG'].includes(symbol.toUpperCase());

  return (
    <button
      onClick={() => onSelect(pair)}
      className={`
        group relative flex h-16 w-28 sm:h-20 sm:w-36 mx-2 sm:mx-4 items-center justify-center rounded-lg sm:rounded-xl border 
        bg-gradient-to-r from-zinc-900 to-zinc-800 p-2 sm:p-4 
        transition-all duration-300 hover:scale-105 hover:shadow-lg
        ${
          isSelected
            ? 'border-pink-500 bg-gradient-to-r from-pink-600/20 to-purple-400/20 shadow-lg shadow-pink-500/25 scale-105'
            : 'border-zinc-700 hover:border-zinc-500'
        }
      `}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Currency icons row */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Base currency icon */}
          <div className="flex items-center">
            {isCrypto(base) ? (
              <span className="text-lg sm:text-xl">{baseIcon}</span>
            ) : (
              <Image
                src={baseIcon}
                alt={base}
                width={20}
                height={15}
                className="sm:w-7 sm:h-[21px] rounded-sm"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-sm font-bold text-zinc-300">${base}</span>`;
                  }
                }}
              />
            )}
          </div>

          <span
            className={`text-xs sm:text-sm font-bold ${
              isSelected ? 'text-pink-400' : 'text-zinc-400'
            }`}
          >
            /
          </span>

          {/* Quote currency icon */}
          <div className="flex items-center">
            {isCrypto(quote) ? (
              <span className="text-lg sm:text-xl">{quoteIcon}</span>
            ) : (
              <Image
                src={quoteIcon}
                alt={quote}
                width={20}
                height={15}
                className="sm:w-7 sm:h-[21px] rounded-sm"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-sm font-bold text-zinc-300">${quote}</span>`;
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Pair text */}
        <div
          className={`text-xs sm:text-sm font-medium ${
            isSelected ? 'text-pink-400' : 'text-zinc-300'
          }`}
        >
          {pair}
        </div>
      </div>

      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-600/20 to-purple-400/20 blur-sm -z-10" />
      )}
    </button>
  );
}
