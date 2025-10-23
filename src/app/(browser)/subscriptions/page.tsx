import { Suspense } from 'react';
import { GradientBackground } from '@/components/ui/gradient-background';
import SubscriptionsContent from './SubscriptionsContent';
import { getUserSubscriptionPairs } from '@/app/api/services';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Subscription } from '@/generated/prisma';

interface SubscriptionData extends Subscription {
  pair: {
    id: string;
    symbol: string;
    version: string;
    timeframe: string;
    paymentItems: any[];
  };
}

async function getSubscriptionsData(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { subscriptions: [], searchParams };
    }

    const response = await getUserSubscriptionPairs(session.user.id);
    const subscriptions: SubscriptionData[] = JSON.parse(response);

    return { subscriptions, searchParams };
  } catch (error) {
    console.error('Error fetching subscriptions data:', error);
    return { subscriptions: [], searchParams };
  }
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getSubscriptionsData(resolvedSearchParams);

  return (
    <Suspense
      fallback={
        <GradientBackground>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-3 text-white/80">Loading subscriptions...</span>
          </div>
        </GradientBackground>
      }
    >
      <SubscriptionsContent
        initialData={data.subscriptions}
        searchParams={data.searchParams}
      />
    </Suspense>
  );
}
