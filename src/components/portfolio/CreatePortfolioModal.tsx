'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { mockPairs } from '@/lib/dummy-data';

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

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (portfolio: {
    name: string;
    description: string;
    pairIds: string[];
  }) => void;
}

type FilterType =
  | 'all'
  | 'profitable'
  | 'high-roi'
  | 'low-drawdown'
  | 'high-winrate'
  | 'forex'
  | 'crypto'
  | 'commodities';

export function CreatePortfolioModal({
  isOpen,
  onClose,
  onSubmit,
}: CreatePortfolioModalProps) {
  const [step, setStep] = useState<'details' | 'pairs'>('details');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedPairIds, setSelectedPairIds] = useState<string[]>([]);

  const filteredPairs = mockPairs.filter((pair) => {
    // Search filter
    const matchesSearch = searchQuery
      ? pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Type filter
    let matchesFilter = true;
    switch (filterType) {
      case 'profitable':
        matchesFilter = pair.metrics.profit > 0;
        break;
      case 'high-roi':
        matchesFilter = pair.metrics.roi > 20;
        break;
      case 'low-drawdown':
        matchesFilter = pair.metrics.maxDrawdown < 10;
        break;
      case 'high-winrate':
        matchesFilter = pair.metrics.winRate > 60;
        break;
      case 'forex':
        matchesFilter =
          !pair.symbol.includes('BTC') &&
          !pair.symbol.includes('ETH') &&
          !pair.symbol.includes('XAU');
        break;
      case 'crypto':
        matchesFilter =
          pair.symbol.includes('BTC') ||
          pair.symbol.includes('ETH') ||
          pair.symbol.includes('LTC');
        break;
      case 'commodities':
        matchesFilter =
          pair.symbol.includes('XAU') ||
          pair.symbol.includes('XAG') ||
          pair.symbol.includes('OIL');
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  const handlePairSelection = (pairId: string, checked: boolean) => {
    if (checked) {
      setSelectedPairIds([...selectedPairIds, pairId]);
    } else {
      setSelectedPairIds(selectedPairIds.filter((id) => id !== pairId));
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredPairs.map((pair) => pair.id);
    setSelectedPairIds(allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedPairIds([]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (selectedPairIds.length === 0) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      pairIds: selectedPairIds,
    });

    // Reset form
    setName('');
    setDescription('');
    setSelectedPairIds([]);
    setStep('details');
    setSearchQuery('');
    setFilterType('all');
  };

  const handleClose = () => {
    setStep('details');
    setName('');
    setDescription('');
    setSelectedPairIds([]);
    setSearchQuery('');
    setFilterType('all');
    onClose();
  };

  const isDetailsValid = name.trim().length > 0;
  const isPairsValid = selectedPairIds.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 max-w-full sm:max-w-5xl max-h-[90vh] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Create New Portfolio
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {step === 'details'
              ? 'Enter portfolio details and proceed to select trading pairs.'
              : 'Select trading pairs for your portfolio using filters and search.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white mb-2 block">
                  Portfolio Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Conservative Forex Portfolio"
                  className="bg-white/10 border-white/30 text-white placeholder-white/50"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your portfolio strategy and goals..."
                  rows={4}
                  className="bg-white/10 border-white/30 text-white placeholder-white/50"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep('pairs')}
                disabled={!isDetailsValid}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                Next: Select Pairs
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-auto flex flex-col">
            {/* Search and Filter Controls */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pairs..."
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder-white/50"
                  />
                </div>
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as FilterType)}
                >
                  <SelectTrigger className="w-48 bg-white/10 border-white/30 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20">
                    <SelectItem value="all">All Pairs</SelectItem>
                    <SelectItem value="profitable">Profitable Only</SelectItem>
                    <SelectItem value="high-roi">High ROI (&gt;20%)</SelectItem>
                    <SelectItem value="low-drawdown">
                      Low Drawdown (&lt;10%)
                    </SelectItem>
                    <SelectItem value="high-winrate">
                      High Win Rate (&gt;60%)
                    </SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Controls */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Select All ({filteredPairs.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeselectAll}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Deselect All
                  </Button>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {selectedPairIds.length} pairs selected
                </Badge>
              </div>
            </div>

            {/* Pairs List */}
            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {filteredPairs.map((pair) => (
                  <Card
                    key={pair.id}
                    className={`bg-white/5 border transition-all duration-200 cursor-pointer ${
                      selectedPairIds.includes(pair.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    onClick={() =>
                      handlePairSelection(
                        pair.id,
                        !selectedPairIds.includes(pair.id)
                      )
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedPairIds.includes(pair.id)}
                          onChange={() => {}}
                          className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white text-sm">
                              {pair.symbol}
                            </h4>
                            {pair.isPopular && (
                              <Badge className="text-xs bg-orange-500/10 text-orange-400">
                                🔥 Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-white/60 text-xs mb-3 line-clamp-1">
                            {pair.name}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-xs -ml-6">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-400" />
                              <span className="text-white/70">ROI:</span>
                              <span
                                className={
                                  pair.metrics.roi > 0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }
                              >
                                {pair.metrics.roi > 0 ? '+' : ''}
                                {pair.metrics.roi.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-blue-400" />
                              <span className="text-white/70">Win:</span>
                              <span className="text-blue-400">
                                {pair.metrics.winRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3 text-purple-400" />
                              <span className="text-white/70">R/R:</span>
                              <span className="text-purple-400">
                                {pair.metrics.riskReward.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-green-400" />
                              <span className="text-white/70">Profit:</span>
                              <span
                                className={
                                  pair.metrics.profit > 0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }
                              >
                                $
                                {Math.abs(pair.metrics.profit).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="flex justify-between pt-4 border-t border-white/20">
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isPairsValid}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0"
                >
                  Create Portfolio ({selectedPairIds.length} pairs)
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
