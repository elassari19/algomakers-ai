'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  RefreshCw,
  TrendingUp,
  Lock,
  Check,
  Clock,
} from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';
import { PaymentModal } from './PaymentModal';
import { mockPairs } from '../../app/(browser)/subscriptions/page';

interface TradingPair {
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
  subscription?: {
    status: 'active' | 'expiring' | 'expired' | 'pending';
    expiryDate?: string;
  };
}

interface SubscribeButtonProps {
  pairId: string;
  pairSymbol?: string;
  userSubscriptionStatus?:
    | 'none'
    | 'active'
    | 'expiring'
    | 'expired'
    | 'pending';
  isUserLoggedIn: boolean;
  className?: string;
}

export function SubscribeButton({
  pairId,
  pairSymbol,
  userSubscriptionStatus = 'none',
  isUserLoggedIn,
  className,
}: SubscribeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Modal state
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const getButtonConfig = () => {
    if (!isUserLoggedIn) {
      return {
        text: 'Sign In to Subscribe',
        icon: Lock,
        variant: 'outline' as const,
        action: 'subscribe' as const,
        disabled: false,
      };
    }

    switch (userSubscriptionStatus) {
      case 'active':
        return {
          text: 'Upgrade',
          icon: TrendingUp,
          variant: 'default' as const,
          action: 'upgrade' as const,
          disabled: false,
          className: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      case 'expiring':
        return {
          text: 'Renew',
          icon: RefreshCw,
          variant: 'default' as const,
          action: 'renew' as const,
          disabled: false,
          className: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        };
      case 'expired':
        return {
          text: 'Resubscribe',
          icon: RefreshCw,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: false,
          className: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'pending':
        return {
          text: 'Payment Pending',
          icon: Clock,
          variant: 'outline' as const,
          action: 'subscribe' as const,
          disabled: true,
          className: 'bg-blue-500/10 text-blue-400 text-white',
        };
      default:
        return {
          text: 'Subscribe',
          icon: CreditCard,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: false,
          className: 'bg-blue-700 hover:bg-blue-600 text-white',
        };
    }
  };

  const config = getButtonConfig();
  const IconComponent = config.icon;

  // Modal handlers
  const handleSubscribe = (
    pairId: string,
    action: 'subscribe' | 'renew' | 'upgrade'
  ) => {
    setSubscriptionModalOpen(true);
  };

  const handleSubscriptionSubmit = (data: any) => {
    // Transform the subscription data to match PaymentModal interface
    const paymentData = {
      pairIds: data.pairIds,
      pairNames: data.pairIds.map((id: string) => {
        const foundPair = mockPairs.find((p) => p.id === id);
        return foundPair ? foundPair.symbol : '';
      }),
      plan: {
        period: data.plan.period,
        months: data.plan.months,
        price: data.plan.price,
      },
      tradingViewUsername: data.tradingViewUsername,
      totalAmount: data.plan.price * data.pairIds.length,
    };

    setSubscriptionData(paymentData);
    setSubscriptionModalOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSubscriptionData(null);
    // TODO: Refresh user subscription data
  };

  const handleCloseSubscriptionModal = () => {
    setSubscriptionModalOpen(false);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSubscriptionData(null);
  };

  const handleClick = () => {
    if (!isUserLoggedIn) {
      // Redirect to sign in (only on client side)
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    handleSubscribe(pairId, config.action);
  };

  return (
    <>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <Button
          onClick={handleClick}
          variant={config.variant}
          disabled={config.disabled}
          className={`w-full min-w-[120px] ${config.className || ''}`}
          size="sm"
        >
          <IconComponent className="h-4 w-4 mr-2" />
          {config.text}
        </Button>

        {userSubscriptionStatus === 'active' && (
          <Badge
            variant="outline"
            className="text-xs bg-green-500/10 text-green-400 border-green-500/20"
          >
            ✓ Subscribed
          </Badge>
        )}

        {userSubscriptionStatus === 'expiring' && (
          <Badge
            variant="secondary"
            className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          >
            ⚠️ Expires Soon
          </Badge>
        )}
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={handleCloseSubscriptionModal}
        pairs={mockPairs}
        selectedPairIds={[pairId]}
        onSubscribe={handleSubscriptionSubmit}
      />

      {/* Payment Modal */}
      {subscriptionData && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={handleClosePaymentModal}
          subscriptionData={subscriptionData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
