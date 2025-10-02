import { notFound } from 'next/navigation';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Calendar } from 'lucide-react';
import { mockPairs } from '@/lib/dummy-data';
import { PortfolioDetailClient } from '@/components/portfolio/PortfolioDetailClient';

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

// Mock portfolio data - in real app, this would be an async database fetch
const mockPortfolios: Portfolio[] = [
  {
    id: '1',
    name: 'Conservative Forex',
    description: 'Low-risk forex pairs with steady returns',
    pairIds: ['1', '2', '4'],
    createdAt: '2024-09-15',
    updatedAt: '2024-09-28',
    performance: {
      totalValue: 15420,
      totalReturn: 3420,
      totalReturnPercentage: 28.5,
      bestPerformer: 'EURUSD',
      worstPerformer: 'GBPJPY',
    },
  },
  {
    id: '2',
    name: 'Crypto High Yield',
    description: 'Aggressive cryptocurrency trading portfolio',
    pairIds: ['3', '6'],
    createdAt: '2024-09-10',
    updatedAt: '2024-09-29',
    performance: {
      totalValue: 22800,
      totalReturn: 7800,
      totalReturnPercentage: 52.0,
      bestPerformer: 'BTCUSD',
      worstPerformer: 'ETHUSD',
    },
  },
  {
    id: '3',
    name: 'Balanced Mix',
    description: 'Diversified portfolio across forex, crypto, and commodities',
    pairIds: ['1', '3', '5'],
    createdAt: '2024-08-20',
    updatedAt: '2024-09-25',
    performance: {
      totalValue: 18900,
      totalReturn: 4900,
      totalReturnPercentage: 35.0,
      bestPerformer: 'XAUUSD',
      worstPerformer: 'EURUSD',
    },
  },
];

function getPortfolioData(id: string): Portfolio | null {
  // In real app, this would be an async database query
  return mockPortfolios.find((p) => p.id === id) || null;
}

interface IProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PortfolioDetailPage({ params }: IProps) {
  const { id } = await params;

  const portfolio = await new Promise<Portfolio | null>((resolve) => {
    setTimeout(() => {
      resolve(getPortfolioData(id));
    }, 0);
  });

  if (!portfolio) {
    notFound();
  }

  // Get pairs data for this portfolio
  const portfolioPairs = mockPairs.filter((pair) =>
    portfolio.pairIds.includes(pair.id)
  );

  return (
    <GradientBackground>
      <div className="min-h-screen px-0 sm:px-4 md:px-6 lg:px-8 py-4 overflow-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {portfolio.name}
            </h1>
            <p className="text-white/70 mb-2 text-sm sm:text-base">
              {portfolio.description}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-white/60">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created: {new Date(portfolio.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Updated: {new Date(portfolio.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Client-side interactive content */}
        <PortfolioDetailClient
          portfolio={portfolio}
          portfolioPairs={portfolioPairs}
        />
      </div>
    </GradientBackground>
  );
}
