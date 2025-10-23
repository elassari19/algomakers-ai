'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addItem } from '@/store/basketSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pair } from '@/generated/prisma';

interface SubscriptionPlan {
  id: string;
  period: '1 Month' | '3 Month' | '6 Month' | '12 Month';
  months: number;
  price: number;
  discount?: number;
  popular?: boolean;
  bestValue?: boolean;
  tagline: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: Pair;
  currentSubscriptionPeriod?: string;
  action?: "subscribe" | "upgrade";
}

export function SubscriptionModal({
  isOpen,
  onClose,
  pair,
  currentSubscriptionPeriod,
  action
}: SubscriptionModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  
  // Generate subscription plans from pair pricing data - memoized to prevent recreation
  const subscriptionPlans: SubscriptionPlan[] = useMemo(() => [
    {
      id: '1-month',
      period: '1 Month',
      months: 1,
      price: Number(pair.priceOneMonth),
      discount: Number(pair.discountOneMonth),
      popular: false,
      bestValue: false,
      tagline: 'Perfect for trying out our signals',
    },
    {
      id: '3-months',
      period: '3 Month',
      months: 3,
      price: Number(pair.priceThreeMonths),
      discount: Number(pair.discountThreeMonths),
      popular: true,
      bestValue: false,
      tagline: 'Most popular choice',
    },
    {
      id: '6-months',
      period: '6 Month',
      months: 6,
      price: Number(pair.priceSixMonths),
      discount: Number(pair.discountSixMonths),
      popular: false,
      bestValue: true,
      tagline: 'Best value for long-term trading',
    },
    {
      id: '12-months',
      period: '12 Month',
      months: 12,
      price: Number(pair.priceTwelveMonths),
      discount: Number(pair.discountTwelveMonths),
      popular: false,
      bestValue: false,
      tagline: 'Maximum savings for serious traders',
    },
  ], [pair.priceOneMonth, pair.priceThreeMonths, pair.priceSixMonths, pair.priceTwelveMonths, pair.discountOneMonth, pair.discountThreeMonths, pair.discountSixMonths, pair.discountTwelveMonths]);

  const [step, setStep] = useState<'plans' | 'details'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('plans');
      setSelectedPlan(null);
    }
  }, [isOpen]);

  // Handle close - memoized to prevent recreation
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Plan selection handlers - memoized
  const handlePlanSelect = useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('details');
  }, []);

  // Submit subscription - memoized
  const handleSubmit = useCallback(() => {
    if (!selectedPlan) return;

    // Add the pair to basket with full data
    dispatch(addItem({
      id: `${pair.id}-${selectedPlan.id}`,
      name: `${pair.symbol} - ${selectedPlan.period}`,
      price: selectedPlan.price,
      pair: pair,
      plan: {
        id: selectedPlan.id,
        period: selectedPlan.period,
        months: selectedPlan.months,
        price: selectedPlan.price,
        discount: selectedPlan.discount,
      },
      action: action ? action : "subscribe"
    }));

    handleClose();
  }, [selectedPlan, dispatch, pair, handleClose]);

  // Calculate total price - memoized
  const totalPrice = useMemo(() => selectedPlan ? selectedPlan.price : 0, [selectedPlan]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white/30 to-black/40 backdrop-blur-3xl border-slate-800">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-2xl font-bold text-white">
            Subscribe to {pair.symbol}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Plan Selection */}
        {step === 'plans' && (
          <div className="space-y-6">
            <div className="text-white">
              Choose your subscription period for {pair.symbol}:
            </div>

            {/* Upgrade Message */}
            {currentSubscriptionPeriod && (
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 text-lg">⏰</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm mb-1">
                      Upgrade Your Subscription
                    </h3>
                    <p className="text-blue-200 text-sm leading-relaxed">
                      🎯 <strong>Smart Upgrade:</strong> Your new subscription period will be <span className="text-yellow-300 font-semibold">added to your remaining time</span>!
                      <br />
                      💡 This means you'll get <span className="text-green-300 font-semibold">extended access</span> without losing any of your current subscription days.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                    <CardTitle className="text-white">
                      {plan.period}
                    </CardTitle>
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
                        <span className="text-slate-400">Price:</span>
                        <span className="text-white">${plan.price}</span>
                      </div>
                    </div>

                    <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-500">
                      Select {plan.period}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details & Confirm */}
        {step === 'details' && selectedPlan && (
          <div className="space-y-6">
            <div className="text-slate-400">
              Review your order and proceed to add to basket:
            </div>

            {/* Enhanced Order Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Order Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    📋 Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-white mb-2">Selected Trading Pair:</h4>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-lg px-3 py-1">
                          {pair.symbol}
                        </Badge>
                        {pair.symbol && (
                          <span className="text-slate-400 text-sm">
                            {pair.symbol}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-slate-400 text-sm">Plan:</span>
                        <p className="text-white font-medium">{selectedPlan.period}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Duration:</span>
                        <p className="text-white font-medium">
                          {selectedPlan.months} month{selectedPlan.months !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Base Price:</span>
                        <p className="text-white font-medium">${selectedPlan.price}</p>
                      </div>
                      {selectedPlan.discount && (
                        <div>
                          <span className="text-slate-400 text-sm">Discount:</span>
                          <p className="text-green-400 font-medium">
                            -{selectedPlan.discount}%
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold text-lg">Total Amount:</span>
                        <span className="text-green-400 font-bold text-xl">${totalPrice}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - What You Get */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    🎯 What You Get
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Full Access to {pair.symbol}</p>
                        <p className="text-slate-400 text-sm">Complete trading signals and analysis for this pair</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedPlan.months} Month{selectedPlan.months !== 1 ? 's' : ''} Access</p>
                        <p className="text-slate-400 text-sm">Continuous signals and updates for the full period</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Real-time Notifications</p>
                        <p className="text-slate-400 text-sm">Instant alerts for trading opportunities</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Performance Analytics</p>
                        <p className="text-slate-400 text-sm">Track your subscription performance and ROI</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Subscription Info */}
                  {currentSubscriptionPeriod && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-300 font-medium text-sm">Upgrade Benefit</p>
                          <p className="text-blue-200 text-xs">
                            Your new {selectedPlan.period.toLowerCase()} will be added to your remaining {currentSubscriptionPeriod.toLowerCase()} time
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Savings Highlight */}
                  {selectedPlan.discount && selectedPlan.discount > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-lg">💰</span>
                        <div>
                          <p className="text-green-300 font-medium text-sm">You're Saving!</p>
                          <p className="text-green-200 text-xs">
                            ${((selectedPlan.price * selectedPlan.discount) / 100).toFixed(2)} off this subscription
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Information */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 text-lg">🔒</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Secure Payment</p>
                      <p className="text-slate-400 text-sm">Processed securely via crypto payment gateway</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Payment Method</p>
                    <p className="text-white font-medium">Cryptocurrency</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-2 font-semibold"
              >
                Add to Basket → ${totalPrice}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}