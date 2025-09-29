'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, Edit, Trash2, Activity, PieChart } from 'lucide-react';
import Link from 'next/link';
import { CreatePortfolioModal } from '@/components/portfolio/CreatePortfolioModal';

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

interface PortfolioGridClientProps {
  initialPortfolios: Portfolio[];
}

export function PortfolioGridClient({
  initialPortfolios,
}: PortfolioGridClientProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(initialPortfolios);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreatePortfolio = (
    newPortfolio: Omit<
      Portfolio,
      'id' | 'createdAt' | 'updatedAt' | 'performance'
    >
  ) => {
    // In real app, this would make an API call
    const portfolio: Portfolio = {
      ...newPortfolio,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      performance: {
        totalValue: 10000, // Starting value
        totalReturn: 0,
        totalReturnPercentage: 0,
        bestPerformer: '',
        worstPerformer: '',
      },
    };

    setPortfolios([...portfolios, portfolio]);
    setIsCreateModalOpen(false);
  };

  const handleDeletePortfolio = (portfolioId: string) => {
    setPortfolios(portfolios.filter((p) => p.id !== portfolioId));
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Portfolio Management
          </h1>
          <p className="text-white/70">
            Create and manage your trading portfolios
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PieChart className="w-16 h-16 text-white/50 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Portfolios Yet
            </h3>
            <p className="text-white/70 text-center mb-6">
              Create your first portfolio to start tracking your trading
              strategies
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <Card
              key={portfolio.id}
              className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">
                      {portfolio.name}
                    </CardTitle>
                    <p className="text-white/70 text-sm line-clamp-2">
                      {portfolio.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-white/60 text-xs mb-1">Total Value</p>
                    <p className="text-white font-semibold">
                      ${portfolio.performance.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-xs mb-1">Return</p>
                    <p
                      className={`font-semibold ${
                        portfolio.performance.totalReturnPercentage > 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {portfolio.performance.totalReturnPercentage >= 0
                        ? '+'
                        : ''}
                      {portfolio.performance.totalReturnPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Portfolio Info */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Pairs:</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {portfolio.pairIds.length} pairs
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Created:</span>
                    <span className="text-white/80 text-sm">
                      {portfolio.createdAt}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">
                      Best Performer:
                    </span>
                    <span className="text-green-400 text-sm font-medium">
                      {portfolio.performance.bestPerformer || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                  >
                    <Link href={`/portfolio/${portfolio.id}`}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white/80 hover:bg-white/10"
                  >
                    <Activity className="w-3 h-3 mr-1" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Portfolio Modal */}
      <CreatePortfolioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePortfolio}
      />
    </>
  );
}
