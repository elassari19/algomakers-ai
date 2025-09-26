'use client';

import { SubscribeButton } from '@/components/subscription/SubscribeButton';

interface PairSubscribeWrapperProps {
  pairId: string;
  pairSymbol: string;
}

export function PairSubscribeWrapper({
  pairId,
  pairSymbol,
}: PairSubscribeWrapperProps) {
  const handleSubscribe = (
    pairId: string,
    action: 'subscribe' | 'renew' | 'upgrade'
  ) => {
    console.log(`Subscribe action: ${action} for pair: ${pairId}`);
    // TODO: Implement subscription modal/flow
    // This could open a modal, redirect to payment page, etc.
  };

  return (
    <SubscribeButton
      pairId={pairId}
      pairSymbol={pairSymbol}
      userSubscriptionStatus="none" // TODO: Get actual user subscription status from context/auth
      isUserLoggedIn={false} // TODO: Get actual auth status from context/auth
    />
  );
}
