'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface SubscriptionPlan {
  id: string;
  period: '1M' | '3M' | '6M' | '12M';
  months: number;
  price: number;
  discount?: number;
  popular?: boolean;
  bestValue?: boolean;
  tagline: string;
}

interface TradingPair {
  id: string;
  symbol: string;
  name: string;
  metrics: {
    roi: number;
    winRate: number;
    totalTrades: number;
    profit: number;
  };
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: TradingPair[];
  selectedPairIds?: string[];
  onSubscribe: (data: SubscriptionFormData) => void;
}

interface SubscriptionFormData {
  pairIds: string[];
  plan: SubscriptionPlan;
  tradingViewUsername: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: '1m',
    period: '1M',
    months: 1,
    price: 25,
    tagline: 'Start small, test the strategy with zero commitment.',
  },
  {
    id: '3m',
    period: '3M',
    months: 3,
    price: 65,
    discount: 13,
    tagline: 'Stay consistent and track results over a full quarter.',
  },
  {
    id: '6m',
    period: '6M',
    months: 6,
    price: 120,
    discount: 20,
    popular: true,
    tagline: 'Commit to growth and save while building momentum.',
  },
  {
    id: '12m',
    period: '12M',
    months: 12,
    price: 200,
    discount: 33,
    bestValue: true,
    tagline: 'Maximize savings and trade with confidence all year long.',
  },
];

export function SubscriptionModal({
  isOpen,
  onClose,
  pairs,
  selectedPairIds = [],
  onSubscribe,
}: SubscriptionModalProps) {
  // Determine initial step based on whether pairs are pre-selected
  const getInitialStep = () => {
    return selectedPairIds.length > 0 ? 'plans' : 'pairs';
  };

  const [step, setStep] = useState<'pairs' | 'plans' | 'details'>(
    getInitialStep()
  );
  const [selectedPairs, setSelectedPairs] = useState<string[]>(selectedPairIds);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [tradingViewUsername, setTradingViewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // Reset state when modal opens/closes or selectedPairIds change
  const handleClose = () => {
    const initialStep = selectedPairIds.length > 0 ? 'plans' : 'pairs';
    setStep(initialStep);
    setSelectedPairs(selectedPairIds);
    setSelectedPlan(null);
    setTradingViewUsername('');
    setUsernameError('');
    onClose();
  };

  // Update step when selectedPairIds change (when modal opens with pre-selected pairs)
  React.useEffect(() => {
    if (isOpen) {
      const initialStep = selectedPairIds.length > 0 ? 'plans' : 'pairs';
      setStep(initialStep);
      setSelectedPairs(selectedPairIds);
    }
  }, [isOpen, selectedPairIds]);

  // Pair selection handlers
  const handlePairToggle = (pairId: string) => {
    setSelectedPairs((prev) =>
      prev.includes(pairId)
        ? prev.filter((id) => id !== pairId)
        : [...prev, pairId]
    );
  };

  const handlePairStep = () => {
    if (selectedPairs.length === 0) return;
    setStep('plans');
  };

  // Plan selection handlers
  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('details');
  };

  // Username validation
  const validateUsername = (username: string): string => {
    if (!username.trim()) {
      return 'TradingView username is required.';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters long.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Invalid format, please check your username.';
    }
    return '';
  };

  const handleUsernameChange = (value: string) => {
    setTradingViewUsername(value);
    const error = validateUsername(value);
    setUsernameError(error);
  };

  // Submit subscription
  const handleSubmit = () => {
    const error = validateUsername(tradingViewUsername);
    if (error) {
      setUsernameError(error);
      return;
    }

    if (!selectedPlan) return;

    onSubscribe({
      pairIds: selectedPairs,
      plan: selectedPlan,
      tradingViewUsername: tradingViewUsername.trim(),
    });

    handleClose();
  };

  // Calculate total price
  const totalPrice = selectedPlan
    ? selectedPlan.price * selectedPairs.length
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {step === 'pairs' && 'Select Trading Pairs'}
            {step === 'plans' &&
              (selectedPairIds.length === 1
                ? `Subscribe to ${
                    pairs.find((p) => p.id === selectedPairIds[0])?.symbol ||
                    'Pair'
                  }`
                : selectedPairIds.length > 0
                ? 'Choose Your Plan'
                : 'Choose Subscription Plan')}
            {step === 'details' && 'Complete Your Subscription'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        {/* Step 1: Pair Selection */}
        {step === 'pairs' && (
          <div className="space-y-6">
            <div className="text-slate-400">
              Select the trading pairs you want to subscribe to:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {pairs.map((pair) => (
                <Card
                  key={pair.id}
                  className={`cursor-pointer transition-all ${
                    selectedPairs.includes(pair.id)
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => handlePairToggle(pair.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {pair.symbol}
                        </h3>
                        <p className="text-sm text-slate-400">{pair.name}</p>
                      </div>
                      {selectedPairs.includes(pair.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-400">ROI:</span>
                        <span className="text-green-400 ml-1">
                          {pair.metrics.roi}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Win Rate:</span>
                        <span className="text-blue-400 ml-1">
                          {pair.metrics.winRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Trades:</span>
                        <span className="text-white ml-1">
                          {pair.metrics.totalTrades}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Profit:</span>
                        <span className="text-green-400 ml-1">
                          ${pair.metrics.profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-slate-400">
                {selectedPairs.length} pair
                {selectedPairs.length !== 1 ? 's' : ''} selected
              </div>
              <Button
                onClick={handlePairStep}
                disabled={selectedPairs.length === 0}
                className="bg-blue-600 hover:bg-blue-500"
              >
                Continue to Plans →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Plan Selection */}
        {step === 'plans' && (
          <div className="space-y-6">
            {/* Show selected pairs when coming from direct subscription */}
            {selectedPairIds.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">
                  Selected Trading Pair{selectedPairs.length !== 1 ? 's' : ''}:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPairs.map((pairId) => {
                    const pair = pairs.find((p) => p.id === pairId);
                    return pair ? (
                      <Badge
                        key={pairId}
                        variant="secondary"
                        className="bg-blue-600/20 text-blue-400 border border-blue-600/30"
                      >
                        {pair.symbol} - {pair.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="text-slate-400">
              Choose your subscription period:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="cursor-pointer transition-all bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 relative"
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                      ⭐ Most Popular
                    </Badge>
                  )}
                  {plan.bestValue && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white">
                      🏆 Best Value
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-white">{plan.period}</CardTitle>
                    <div className="text-3xl font-bold text-white">
                      ${plan.price}
                      {plan.discount && (
                        <span className="text-sm text-green-400 ml-2">
                          Save {plan.discount}%
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-slate-400 text-sm text-center mb-4">
                      {plan.tagline}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <span className="text-white">
                          {plan.months} month{plan.months !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Per pair:</span>
                        <span className="text-white">${plan.price}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-400">Total cost:</span>
                        <span className="text-green-400">
                          ${plan.price * selectedPairs.length}
                        </span>
                      </div>
                    </div>

                    <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-500">
                      Select {plan.period}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {/* Only show back button if we started from pairs selection step */}
              {selectedPairIds.length === 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep('pairs')}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  ← Back to Pairs
                </Button>
              ) : (
                <div></div>
              )}
              <div className="text-slate-400">
                {selectedPairs.length} pair
                {selectedPairs.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details & TradingView Username */}
        {step === 'details' && selectedPlan && (
          <div className="space-y-6">
            <div className="text-slate-400">
              Enter your TradingView username to complete the subscription:
            </div>

            {/* Order Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Selected Pairs:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPairs.map((pairId) => {
                      const pair = pairs.find((p) => p.id === pairId);
                      return pair ? (
                        <Badge
                          key={pairId}
                          variant="secondary"
                          className="bg-slate-700 text-slate-300"
                        >
                          {pair.symbol}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plan:</span>
                    <span className="text-white">{selectedPlan.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white">
                      {selectedPlan.months} month
                      {selectedPlan.months !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price per pair:</span>
                    <span className="text-white">${selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Number of pairs:</span>
                    <span className="text-white">{selectedPairs.length}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-slate-600 pt-2">
                    <span className="text-white">Total:</span>
                    <span className="text-green-400">${totalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TradingView Username Field */}
            <div className="space-y-2">
              <Label htmlFor="tradingViewUsername" className="text-white">
                TradingView Username (required)
              </Label>
              <Input
                id="tradingViewUsername"
                type="text"
                placeholder="Enter your exact TradingView username"
                value={tradingViewUsername}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
                  usernameError ? 'border-red-500' : ''
                }`}
              />
              <p className="text-sm text-slate-400">
                We need this to send your private invite. Please make sure it
                matches your TradingView account.
              </p>
              {usernameError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {usernameError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setStep('plans')}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                ← Back to Plans
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!tradingViewUsername.trim() || !!usernameError}
                className="bg-green-600 hover:bg-green-500"
              >
                Proceed to Payment → ${totalPrice}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
