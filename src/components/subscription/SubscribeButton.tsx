'use client';

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

interface SubscribeButtonProps {
  pairId: string;
  pairSymbol: string;
  userSubscriptionStatus?:
    | 'none'
    | 'active'
    | 'expiring'
    | 'expired'
    | 'pending';
  isUserLoggedIn: boolean;
  onSubscribe: (
    pairId: string,
    action: 'subscribe' | 'renew' | 'upgrade'
  ) => void;
  className?: string;
}

export function SubscribeButton({
  pairId,
  pairSymbol,
  userSubscriptionStatus = 'none',
  isUserLoggedIn,
  onSubscribe,
  className,
}: SubscribeButtonProps) {
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

  const handleClick = () => {
    if (!isUserLoggedIn) {
      // Redirect to sign in
      window.location.href =
        '/signin?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }

    onSubscribe(pairId, config.action);
  };

  return (
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
  );
}
