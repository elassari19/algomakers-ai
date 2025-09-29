import { GradientBackground } from '@/components/ui/gradient-background';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { PortfolioGridClient } from '@/components/portfolio/PortfolioGridClient';

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

// Mock portfolio data - replace with real data from API/database
const mockPortfolios: Portfolio[] = [
  {
    id: '1',
    name: 'Conservative Forex',
    description: 'Low-risk forex pairs with steady returns',
    pairIds: ['1', '2', '4'], // EURUSD, GBPJPY, AUDUSD
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
    pairIds: ['3', '6'], // BTCUSD, ETHUSD
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
    pairIds: ['1', '3', '5'], // EURUSD, BTCUSD, XAUUSD
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

export default function PortfolioPage() {
  // Server-side data fetching (in real app, this would be async)
  const portfolios = mockPortfolios;

  // Calculate portfolio statistics (server-side)
  const totalPortfolios = portfolios.length;
  const profitablePortfolios = portfolios.filter(
    (p) => p.performance.totalReturnPercentage > 0
  ).length;
  const totalPortfolioValue = portfolios.reduce(
    (sum, p) => sum + p.performance.totalValue,
    0
  );
  const bestPerformingPortfolio = portfolios.reduce((best, current) =>
    current.performance.totalReturnPercentage >
    best.performance.totalReturnPercentage
      ? current
      : best
  );

  const portfolioStats = {
    totalPairs: totalPortfolios,
    profitablePairs: profitablePortfolios,
    totalProfit: totalPortfolioValue,
    bestPerformer: {
      symbol: bestPerformingPortfolio.name,
      roi: bestPerformingPortfolio.performance.totalReturnPercentage,
    },
  };

  return (
    <GradientBackground>
      <div className="min-h-screen p-0 md:p-4">
        {/* Portfolio Statistics */}
        <div className="mb-6 sm:mb-8">
          <DashboardStats
            totalPairs={portfolioStats.totalPairs}
            profitablePairs={portfolioStats.profitablePairs}
            totalProfit={portfolioStats.totalProfit}
            bestPerformer={portfolioStats.bestPerformer}
            className="mb-0 opacity-95"
            // Override labels for portfolio context
            labels={{
              totalPairs: 'Total Portfolios',
              profitablePairs: 'Profitable Portfolios',
              totalProfit: 'Total Portfolio Value',
              bestPerformer: 'Best Portfolio',
            }}
          />
        </div>

        {/* Client-side portfolio grid with interactive functionality */}
        <PortfolioGridClient initialPortfolios={portfolios} />
      </div>
    </GradientBackground>
  );
}
