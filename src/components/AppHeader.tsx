'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, ShoppingCart, X, Settings, Loader2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { removeItem, clearBasket, addItem } from '@/store/basketSlice';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
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
import { Toaster } from 'sonner';
import { PaymentModal } from '@/components/subscription/PaymentModal'; // Add this import

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function AppHeader() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Signal Alert',
      message: 'BTC/USDT strategy generated a new buy signal',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      type: 'success',
    },
    {
      id: '2',
      title: 'Subscription Reminder',
      message: 'Your ETH/USDT subscription expires in 3 days',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      type: 'warning',
    },
    {
      id: '3',
      title: 'Payment Confirmed',
      message: 'Your payment for SOL/USDT strategy has been confirmed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      type: 'info',
    },
  ]);

  const dispatch = useDispatch<AppDispatch>();
  const basketItems = useSelector((state: RootState) => state.basket.items);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // Add state for sheet open
  const [modalOpen, setModalOpen] = useState(false); // Add state for modal open
  const [invoiceData, setInvoiceData] = useState<any>(null); // Add state for invoice data

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Add home
    breadcrumbs.push({
      label: 'Home',
      href: '/dashboard',
      isCurrentPage: pathname === '/dashboard',
    });

    // Add path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isCurrentPage = index === pathSegments.length - 1;

      // Format segment name
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrentPage,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const unreadNotifications = notifications.filter((n) => !n.read).length;
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

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const removeBasketItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const updateBasketItemPlan = (itemId: string, newPlan: any) => {
    // For now, we'll remove the old item and add a new one with updated plan
    // In a real app, you'd have an updateItem action
    const currentItem = basketItems.find(item => item.id === itemId);
    if (currentItem) {
      const newItemId = `${currentItem.pair.id}-${newPlan.id}`;

      dispatch(removeItem(itemId));

      // Add new item with updated plan immediately
      dispatch(addItem({
        id: newItemId,
        name: `${currentItem.pair.symbol} - ${newPlan.period}`,
        price: newPlan.price,
        pair: currentItem.pair,
        plan: newPlan,
      }));

      // Update expanded item ID to the new item
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
      // Prepare payment items from basket
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
      }));

      const checkoutData = {
        amount: basketTotal,
        currency: 'usd',
        network: 'trc20',
        pairIds: basketItems.map(item => item.pair.symbol),
        orderData: {
          pairIds: basketItems.map(item => item.pair.id),
          paymentItems: paymentItems,
          userId: 'current-user-id', // This should come from auth context
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
        const error = await response.json();
        console.error('Checkout failed:', error);
        // TODO: Show error toast
        return;
      }

      const invoice = await response.json();

      // Close the sheet and open the modal with invoice data
      setSheetOpen(false);
      setInvoiceData(invoice);
      setModalOpen(true);
    } catch (error) {
      console.error('Checkout error:', error);
      // TODO: Show error toast
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Clear the basket on successful payment
    dispatch(clearBasket());
    setModalOpen(false);
    setInvoiceData(null);
    // TODO: Show success toast
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setInvoiceData(null);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    return icons[type];
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/5 backdrop-blur-md">
        <Toaster position="top-center" richColors />
        <div className="flex h-10 items-center justify-between pl-8 px-4 sm:px-6 sm:pl-12">
          {/* Left side - Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href + index}>
                    <BreadcrumbItem>
                      {crumb.isCurrentPage ? (
                        <BreadcrumbPage className="text-white font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link
                            href={crumb.href}
                            className="text-white/70 hover:text-white transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="text-white/50" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right side - Notifications and Basket */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[28rem] max-w-none bg-gradient-to-b from-purple-950 to-pink-950 backdrop-blur-md border-white/20 p-6">
                <SheetHeader className="px-2">
                  <SheetTitle className="text-white">Notifications</SheetTitle>
                  <SheetDescription className="text-white/70">
                    Stay updated with your trading alerts and account activity
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-6 px-2">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          notification.read
                            ? 'bg-white/5 border-white/10'
                            : 'bg-white/10 border-white/20'
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-white/70 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-white/50 mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Basket */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}> {/* Make sheet controlled */}
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
              <SheetContent className="w-full sm:w-[28rem] max-w-none  bg-gradient-to-b from-white/30 to-black/20 backdrop-blur-3xl border-white/20 p-6">
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
          </div>
        </div>
      </header>

      {/* Add PaymentModal */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        invoice={invoiceData} // Pass the invoice data
        basketItems={basketItems} // Pass basket items for display
        totalAmount={basketTotal}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
