'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditCard, TrendingUp, Lock, Clock, X } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';
import { Pair, SubscriptionStatus } from '@/generated/prisma';

interface SubscribeButtonProps {
  userSubscriptionStatus?: SubscriptionStatus;
  isUserLoggedIn: boolean;
  pair: Pair; // Add pairs prop
  className?: string;
  onCancel?: (pairId: string) => void; // Optional callback for cancel action
}

export function SubscribeButton({
  userSubscriptionStatus,
  isUserLoggedIn,
  pair,
  className,
  onCancel,
}: SubscribeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Modal state
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

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
      case SubscriptionStatus.EXPIRED:
        return {
          text: 'Resubscribe',
          icon: CreditCard,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: false,
          className: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case SubscriptionStatus.PENDING:
        return {
          text: 'Payment Pending',
          icon: Clock,
          variant: 'outline' as const,
          action: 'subscribe' as const,
          disabled: true,
          className: 'disabled:opacity-100 bg-blue-500/10 text-blue-400 border-blue-400/30',
        };
      case SubscriptionStatus.PAID:
        return {
          text: 'Awaiting Invitation',
          icon: Clock,
          variant: 'outline' as const,
          action: 'subscribe' as const,
          disabled: true,
          className: 'disabled:opacity-100 bg-amber-500/10 text-amber-400 border-amber-400/30',
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

  const getPendingButtonConfig = () => {
    return {
      text: 'Pending',
      icon: Clock,
      variant: 'outline' as const,
      action: 'pending' as const,
      disabled: false,
      className: 'bg-blue-500/70 text-blue-400 border-blue-400/70',
    };
  }

  const subscribeConfig = getSubscribeButtonConfig();
  const upgradeConfig = getUpgradeButtonConfig();
  const cancelConfig = getCancelButtonConfig();
  const pendingConfig = getPendingButtonConfig();

  // Modal handlers - memoized to prevent unnecessary re-renders
  const handleSubscribe = useCallback((
    pairId: string,
    action: 'subscribe' | 'upgrade' | 'cancel'
  ) => {
    if (action === 'cancel') {
      handleCancelSubscription();
    } else {
      setSubscriptionModalOpen(true);
    }
  }, []);

  const handleCancelSubscription = useCallback(() => {
    // Call the optional onCancel callback if provided
    if (onCancel) {
      onCancel(pair?.id || '');
    } else {
      // Default behavior: show confirmation and handle cancellation
      const confirmed = window.confirm(
        `Are you sure you want to cancel your subscription to ${
          pair?.symbol || 'this pair'
        }?`
      );
      if (confirmed) {
        console.log('Canceling subscription for pair:', pair?.id);
        // TODO: Call API to cancel subscription
        // This would typically call an API endpoint to cancel the subscription
      }
    }
  }, [onCancel, pair?.id, pair?.symbol]);

  const handleCloseSubscriptionModal = useCallback(() => {
    setSubscriptionModalOpen(false);
  }, []);

  const handleSubscribeClick = useCallback(() => {
    if (!isUserLoggedIn) {
      // Redirect to sign in (only on client side)
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    handleSubscribe(pair?.id || '', subscribeConfig.action);
  }, [isUserLoggedIn, router, pathname, handleSubscribe, pair?.id, subscribeConfig.action]);

  const handleUpgradeClick = useCallback(() => {
    handleSubscribe(pair?.id || '', upgradeConfig.action);
  }, [handleSubscribe, pair?.id, upgradeConfig.action]);

  const handleCancelClick = useCallback(() => {
    handleSubscribe(pair?.id || '', cancelConfig.action);
  }, [handleSubscribe, pair?.id, cancelConfig.action]);

  return (
    <>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {userSubscriptionStatus === SubscriptionStatus.ACTIVE ? (
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
          </div>
        ) : userSubscriptionStatus === SubscriptionStatus.PENDING ?
        (
          <Button
            onClick={handleCancelClick}
            variant={pendingConfig.variant}
            disabled={pendingConfig.disabled}
            className={`w-full min-w-[120px] ${pendingConfig.className || ''}`}
            size="sm"
          >
            <pendingConfig.icon className="h-4 w-4 mr-2" />
            {pendingConfig.text}
          </Button>
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
        pair={pair}
      />
    </>
  );
}
