'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, ShoppingCart, X } from 'lucide-react';
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

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface BasketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
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

  const [basketItems, setBasketItems] = useState<BasketItem[]>([
    {
      id: '1',
      name: 'BTC/USDT Premium Strategy',
      price: 99.99,
      quantity: 1,
    },
    {
      id: '2',
      name: 'ETH/USDT Pro Signals',
      price: 149.99,
      quantity: 1,
    },
  ]);

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
    (sum, item) => sum + item.price * item.quantity,
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
    setBasketItems((prev) => prev.filter((item) => item.id !== id));
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
    <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/5 backdrop-blur-md">
      <div className="flex h-10 items-center justify-between pl-8 px-4 sm:px-6 sm:pl-12">
        {/* Left side - Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
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
          <Sheet>
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
            <SheetContent className="w-full sm:w-[28rem] max-w-none bg-gradient-to-b from-purple-950 to-pink-950 backdrop-blur-md border-white/20 p-6">
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
                    basketItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-white/70">
                            Qty: {item.quantity} × ${item.price}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBasketItem(item.id)}
                          className="text-white/60 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
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
                  <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white">
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
