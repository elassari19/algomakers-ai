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
}

export function SubscriptionModal({
  isOpen,
  onClose,
  pair,
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
    }));

    handleClose();
  }, [selectedPlan, dispatch, pair, handleClose]);

  // Calculate total price - memoized
  const totalPrice = useMemo(() => selectedPlan ? selectedPlan.price : 0, [selectedPlan]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white/30 to-black/40 backdrop-blur-3xl border-slate-800">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
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

            {/* Order Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Selected Pair:</h4>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    {pair.symbol}
                  </Badge>
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
                    <span className="text-slate-400">Price:</span>
                    <span className="text-white">${selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-slate-600 pt-2">
                    <span className="text-white">Total:</span>
                    <span className="text-green-400">${totalPrice}</span>
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
                className="bg-green-600 hover:bg-green-500"
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