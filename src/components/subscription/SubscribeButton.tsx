'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditCard, TrendingUp, Lock, Clock, X } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';
import { PaymentModal } from './PaymentModal';
import { mockPairs } from '@/lib/dummy-data';

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
  onCancel?: (pairId: string) => void; // Optional callback for cancel action
}

export function SubscribeButton({
  pairId,
  pairSymbol,
  userSubscriptionStatus = 'none',
  isUserLoggedIn,
  className,
  onCancel,
}: SubscribeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Modal state
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const isSubscribed = () => {
    return (
      userSubscriptionStatus === 'active' ||
      userSubscriptionStatus === 'expiring'
    );
  };

  const getSubscribeButtonConfig = () => {
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
      case 'expired':
        return {
          text: 'Resubscribe',
          icon: CreditCard,
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
          className: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
        };
      default:
        return {
          text: 'Subscribe',
          icon: CreditCard,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: false,
          className: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const getUpgradeButtonConfig = () => {
    return {
      text: 'Upgrade',
      icon: TrendingUp,
      variant: 'default' as const,
      action: 'upgrade' as const,
      disabled: false,
      className: 'bg-purple-600 hover:bg-purple-700 text-white',
    };
  };

  const getCancelButtonConfig = () => {
    return {
      text: 'Cancel',
      icon: X,
      variant: 'default' as const,
      action: 'cancel' as const,
      disabled: false,
      className: 'bg-red-600 hover:bg-red-700 text-white',
    };
  };

  const subscribeConfig = getSubscribeButtonConfig();
  const upgradeConfig = getUpgradeButtonConfig();
  const cancelConfig = getCancelButtonConfig();

  // Modal handlers
  const handleSubscribe = (
    pairId: string,
    action: 'subscribe' | 'upgrade' | 'cancel'
  ) => {
    if (action === 'cancel') {
      handleCancelSubscription();
    } else {
      setSubscriptionModalOpen(true);
    }
  };

  const handleCancelSubscription = () => {
    // Call the optional onCancel callback if provided
    if (onCancel) {
      onCancel(pairId);
    } else {
      // Default behavior: show confirmation and handle cancellation
      const confirmed = window.confirm(
        `Are you sure you want to cancel your subscription to ${
          pairSymbol || 'this pair'
        }?`
      );
      if (confirmed) {
        console.log('Canceling subscription for pair:', pairId);
        // TODO: Call API to cancel subscription
        // This would typically call an API endpoint to cancel the subscription
      }
    }
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

  const handleSubscribeClick = () => {
    if (!isUserLoggedIn) {
      // Redirect to sign in (only on client side)
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    handleSubscribe(pairId, subscribeConfig.action);
  };

  const handleUpgradeClick = () => {
    handleSubscribe(pairId, upgradeConfig.action);
  };

  const handleCancelClick = () => {
    handleSubscribe(pairId, cancelConfig.action);
  };

  return (
    <>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {isSubscribed() ? (
          // Show Upgrade and Cancel buttons for subscribed users
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={handleUpgradeClick}
              variant={upgradeConfig.variant}
              disabled={upgradeConfig.disabled}
              className={`w-full min-w-[120px] ${
                upgradeConfig.className || ''
              }`}
              size="sm"
            >
              <upgradeConfig.icon className="h-4 w-4 mr-2" />
              {upgradeConfig.text}
            </Button>
            <Button
              onClick={handleCancelClick}
              variant={cancelConfig.variant}
              disabled={cancelConfig.disabled}
              className={`w-full min-w-[120px] ${cancelConfig.className || ''}`}
              size="sm"
            >
              <cancelConfig.icon className="h-4 w-4 mr-2" />
              {cancelConfig.text}
            </Button>
          </div>
        ) : (
          // Show Subscribe button for non-subscribed users
          <Button
            onClick={handleSubscribeClick}
            variant={subscribeConfig.variant}
            disabled={subscribeConfig.disabled}
            className={`w-full min-w-[120px] ${
              subscribeConfig.className || ''
            }`}
            size="sm"
          >
            <subscribeConfig.icon className="h-4 w-4 mr-2" />
            {subscribeConfig.text}
          </Button>
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
