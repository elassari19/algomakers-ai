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
  currentSubscriptionPeriod?: string; // Current active subscription period
}

export function SubscribeButton({
  userSubscriptionStatus,
  isUserLoggedIn,
  pair,
  className,
  onCancel,
  currentSubscriptionPeriod,
}: SubscribeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Modal state
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const getButtonConfig = () => {
    if (!isUserLoggedIn) {
      return {
        text: 'Sign In to Subscribe',
        icon: Lock,
        variant: 'outline' as const,
        action: 'subscribe' as const,
        disabled: false,
        className: '',
      };
    }

    switch (userSubscriptionStatus) {
      case 'INVITED':
        return {
          text: 'Invitations Sent',
          icon: TrendingUp,
          variant: 'default' as const,
          action: 'upgrade' as const,
          disabled: true,
          className: 'disabled:opacity-100 bg-lime-400/20 hover:bg-lime-700/50 text-lime-400',
        };
      case SubscriptionStatus.ACTIVE:
        return {
          text: 'Extend',
          icon: TrendingUp,
          variant: 'default' as const,
          action: 'upgrade' as const,
          disabled: false,
          className: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      case SubscriptionStatus.RENEWING:
        return {
          text: 'Renewing',
          icon: Clock,
          variant: 'default' as const,
          action: 'upgrade' as const,
          disabled: false,
          className: 'bg-amber-600 hover:bg-green-700 text-white',
        };
      case SubscriptionStatus.PENDING:
        return {
          text: 'Awaiting Invitations',
          icon: Clock,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: true,
          className: 'disabled:opacity-100 bg-amber-500/20 text-amber-400 border-amber-400/50',
        };
      case SubscriptionStatus.EXPIRED:
        return {
          text: 'Expired',
          icon: CreditCard,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: false,
          className: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
      case SubscriptionStatus.CANCELLED:
        return {
          text: 'Cancelled',
          icon: X,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: true,
          className: 'disabled:opacity-100 bg-gray-600 hover:bg-gray-700 text-white',
        };
      case SubscriptionStatus.FAILED:
        return {
          text: 'Failed',
          icon: X,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: true,
          className: 'disabled:opacity-100 bg-red-700 hover:bg-red-800 text-white',
        };
      case SubscriptionStatus.PENDING:
        return {
          text: 'Pending',
          icon: Clock,
          variant: 'default' as const,
          action: 'subscribe' as const,
          disabled: true,
          className: 'disabled:opacity-100 bg-blue-400/30 hover:bg-blue-800/30 text-blue-400',
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

  const buttonConfig = getButtonConfig();

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

  const handleButtonClick = useCallback(() => {
    if (!isUserLoggedIn) {
      // Redirect to sign in (only on client side)
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    handleSubscribe(pair?.id || '', buttonConfig.action);
  }, [isUserLoggedIn, router, pathname, handleSubscribe, pair?.id, buttonConfig.action]);

  return (
    <>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <Button
          onClick={handleButtonClick}
          variant={buttonConfig.variant}
          disabled={buttonConfig.disabled}
          className={`w-full min-w-[120px] ${
            buttonConfig.className || ''
          }`}
          size="sm"
        >
          <buttonConfig.icon className="h-4 w-4 mr-2" />
          {buttonConfig.text}
        </Button>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={handleCloseSubscriptionModal}
        pair={pair}
        action={buttonConfig.action}
        currentSubscriptionPeriod={currentSubscriptionPeriod}
      />
    </>
  );
}
