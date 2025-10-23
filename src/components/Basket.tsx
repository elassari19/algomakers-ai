'use client';

import React, { useState } from 'react';
import { ShoppingCart, X, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { removeItem, clearBasket, addItem } from '@/store/basketSlice';
import { toast } from 'sonner';
import { PaymentModal } from '@/components/subscription/PaymentModal';

export function Basket() {
  const dispatch = useDispatch<AppDispatch>();
  const basketItems = useSelector((state: RootState) => state.basket.items);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const basketTotal = basketItems.reduce(
    (sum, item) => {
      const discount = item.plan.discount || 0;
      const discountedPrice = discount > 0
        ? item.price * (1 - discount / 100)
        : item.price;
      return sum + discountedPrice;
    },
    0
  );

  const removeBasketItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const updateBasketItemPlan = (itemId: string, newPlan: any) => {
    const currentItem = basketItems.find(item => item.id === itemId);
    if (currentItem) {
      const newItemId = `${currentItem.pair.id}-${newPlan.id}`;

      dispatch(removeItem(itemId));

      dispatch(addItem({
        id: newItemId,
        name: `${currentItem.pair.symbol} - ${newPlan.period}`,
        price: newPlan.price,
        pair: currentItem.pair,
        plan: newPlan,
      }));

      setExpandedItemId(newItemId);
    }
  };

  const togglePlanOptions = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const handleCheckout = async () => {
    if (isProcessingCheckout) return;

    setIsProcessingCheckout(true);
    try {

      const paymentItems = basketItems.map(item => ({
        pairId: item.pair.id,
        basePrice: item.price,
        discountRate: item.plan.discount || 0,
        finalPrice: (item.plan.discount || 0) > 0
          ? item.price * (1 - (item.plan.discount || 0) / 100)
          : item.price,
        period: (() => {
          const periodMap: { [key: string]: string } = {
            '1-month': 'ONE_MONTH',
            '3-months': 'THREE_MONTHS',
            '6-months': 'SIX_MONTHS',
            '12-months': 'TWELVE_MONTHS'
          };
          return periodMap[item.plan.id] || 'ONE_MONTH';
        })(),
        action: item?.action ? item.action : 'subscribe',
      }));

      const checkoutData = {
        amount: basketTotal,
        currency: 'usd',
        network: 'trc20',
        pairIds: basketItems.map(item => item.pair.symbol),
        orderData: {
          pairIds: basketItems.map(item => item.pair.id),
          paymentItems: paymentItems,
          userId: 'current-user-id',
        },
      };

      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.warning(errorData.error || errorData.message || 'Checkout failed', {
          style: { background: '#333', color: '#fff' },
        });
        return;
      }

      const invoice = await response.json();

      setSheetOpen(false);
      setInvoiceData(invoice);
      setModalOpen(true);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create invoice. Please try again.', {
        duration: 3000,
        style: { background: '#333', color: '#fff' },
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handlePaymentSuccess = () => {
    dispatch(clearBasket());
    setModalOpen(false);
    setInvoiceData(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setInvoiceData(null);
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative text-white/80 hover:text-white hover:bg-white/10"
          >
            <ShoppingCart className="h-5 w-5" />
            {basketItems.length > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-green-500 text-white"
              >
                {basketItems.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-[28rem] max-w-none bg-gradient-to-b from-white/30 to-black/20 backdrop-blur-3xl border-white/20 p-6">
          <SheetHeader className="px-2">
            <SheetTitle className="text-white">Shopping Basket</SheetTitle>
            <SheetDescription className="text-white/70">
              Review your selected trading strategies
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6 px-2">
            <div className="space-y-4">
              {basketItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70">Your basket is empty</p>
                </div>
              ) : (
                basketItems.map((item) => {
                  const plans = [
                    {
                      id: '1-month',
                      period: '1 Month',
                      price: Number(item.pair.priceOneMonth),
                      discount: Number(item.pair.discountOneMonth) || 0
                    },
                    {
                      id: '3-months',
                      period: '3 Months',
                      price: Number(item.pair.priceThreeMonths),
                      discount: Number(item.pair.discountThreeMonths) || 0
                    },
                    {
                      id: '6-months',
                      period: '6 Months',
                      price: Number(item.pair.priceSixMonths),
                      discount: Number(item.pair.discountSixMonths) || 0
                    },
                    {
                      id: '12-months',
                      period: '12 Months',
                      price: Number(item.pair.priceTwelveMonths),
                      discount: Number(item.pair.discountTwelveMonths) || 0
                    },
                  ];

                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {(item.plan.discount || 0) > 0 && (
                              <span className="text-xs text-green-400 font-medium">
                                -{(item.plan.discount || 0)}% OFF
                              </span>
                            )}
                            <p className="text-sm font-bold text-white">
                              ${(item.plan.discount || 0) > 0
                                ? (item.price * (1 - (item.plan.discount || 0) / 100)).toFixed(2)
                                : item.price.toFixed(2)
                              }
                            </p>
                            {(item.plan.discount || 0) > 0 && (
                              <span className="text-xs text-red-500 line-through">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePlanOptions(item.id)}
                          className="text-white/60 hover:text-white h-8 w-8 p-0"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBasketItem(item.id)}
                          className="text-white/60 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {expandedItemId === item.id && (
                        <div className="ml-6 space-y-2">
                          <p className="text-xs text-white">Change Plan:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {plans.map((plan) => {
                              const discountedPrice = (plan.discount || 0) > 0
                                ? plan.price * (1 - (plan.discount || 0) / 100)
                                : plan.price;

                              return (
                                <Button
                                  key={plan.id}
                                  variant="outline"
                                  size="lg"
                                  onClick={() => updateBasketItemPlan(item.id, plan)}
                                  className={`text-xs ${
                                    item.plan.id === plan.id
                                      ? 'border border-pink-400 text-green-400 hover:text-green-300'
                                      : 'border-white/20 hover:text-white/80 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="grid grid-cols-2 items-center">
                                    <span>{plan.period}</span>
                                    {(plan.discount || 0) > 0 && (
                                      <span className="line-through text-xs">
                                        ${plan.price.toFixed(2)}
                                      </span>
                                    )}
                                    {(plan.discount || 0) > 0 && (
                                      <span className="text-xs">
                                        -{(plan.discount || 0)}% OFF
                                      </span>
                                    )}
                                    <span className="font-bold">
                                      ${discountedPrice.toFixed(2)}
                                    </span>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          {basketItems.length > 0 && (
            <div className="mt-6 space-y-4 border-t border-white/20 pt-4 px-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total:</span>
                <span className="text-white font-bold text-lg">
                  ${basketTotal.toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white"
                onClick={handleCheckout}
                disabled={isProcessingCheckout}
              >
                {isProcessingCheckout ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <PaymentModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        invoice={invoiceData}
        basketItems={basketItems}
        totalAmount={basketTotal}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}