'use client';

import { Marquee } from '@/components/ui/marquee';
import { Pair } from '@/generated/prisma';

interface TradingPairSelectorProps {
  paris: Pair[];
  onPairSelect: (pair: string) => void;
  selectedPair: string;
}

export function TradingPairSelector({
  paris,
  onPairSelect,
  selectedPair,
}: TradingPairSelectorProps) {
  const tradingPairs = paris;

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
              key={pair.id}
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
              key={`reverse-${pair.id}`}
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
  pair: Pair;
  selectedPair: string;
  onSelect: (pair: string) => void;
}

function TradingPairIcon({
  pair,
  selectedPair,
  onSelect,
}: TradingPairIconProps) {
  const isSelected = selectedPair === pair.id;

  return (
    <button
      onClick={() => onSelect(pair.id)}
      className={`
        group relative flex h-16 w-32 sm:h-20 sm:w-36 mx-2 sm:mx-4 items-center justify-center rounded-lg sm:rounded-xl border 
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
          {/* <div className="flex items-center">
            <span className="text-lg sm:text-xl">{pair.symbol}</span>
          </div> */}

          <span
            className={`text-xs sm:text-sm font-bold ${
              isSelected ? 'text-pink-400' : 'text-zinc-400'
            }`}
          >
          </span>

          {/* Quote currency icon */}
          <div className="flex items-center">
            <span className="text-xs sm:text-sm">{pair.symbol}</span>
          </div>
        </div>

        {/* Pair text */}
        <div
          className={`text-xs sm:text-sm font-medium ${
            isSelected ? 'text-pink-400' : 'text-zinc-300'
          }`}
        >
          {pair.timeframe} {pair.version}
        </div>
      </div>

      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-600/20 to-purple-400/20 blur-sm -z-10" />
      )}
    </button>
  );
}
