import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { Subscription, SubscriptionStatus } from '@/generated/prisma';

interface AccordionContentProps {
  pair: any;
}

export default function AccordionContent({ pair }: AccordionContentProps) {
  return (
    <div className="space-y-0">
      {pair.subscriptions && pair.subscriptions.length > 0 ? (
        <div className="space-y-2 divide-white/10">
          {pair.subscriptions.map((subscription: Subscription, index: number) => (
            <div
              key={subscription.id || index}
              className="bg-black/50 rounded-xl grid gap-2 pl-4 items-center justify-between py-4 px-2"
            >
              <div className="flex items-center gap-4">
                <div className="text-white font-medium min-w-[120px]">
                  <span className="text-white/70">Subscription ID:</span>
                  <Link href={`/subscriptions/${subscription.id}`} className='cursor-pointer hover:text-green-300'>
                    {subscription.id} <Link2 className="inline-block h-4 w-4 ml-1 text-slate-400" />
                  </Link>
                </div>
                |
                <div className="flex items-center gap-2">
                  <span className="text-white/70">Payment ID:</span>
                  <Link href={`/payments/${subscription.paymentId}`} className='cursor-pointer hover:text-green-300'>
                      {subscription.paymentId || 'N/A'} <Link2 className="inline-block h-4 w-4 ml-1 text-slate-400" />
                  </Link>
                </div>
                <Badge
                  className={`${
                    subscription.status === 'PAID'
                      ? 'bg-green-500/20 text-green-400'
                      : subscription.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : subscription.status === 'EXPIRED'
                      ? 'bg-red-500/20 text-red-400'
                      : subscription.status === 'CANCELLED'
                      ? 'bg-gray-500/20 text-gray-400'
                      : subscription.status === 'RENEWING'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {subscription.status}
                </Badge>
              </div>
              <div className="grid grid-cols-9 [&>div]:col-span-1 items-center gap-4 text-sm pl-2">
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Created At:</span>
                  <span className="text-white">
                    {new Date(subscription.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Updated At:</span>
                  <span className="text-white">
                    {new Date(subscription.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Period:</span>
                  <span className="text-white">
                    {subscription.period.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Start:</span>
                  <span className="text-white">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Expiry:</span>
                  <span className="text-white">
                    {new Date(subscription.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Invite:</span>
                  <span className="text-white">
                    {subscription.inviteStatus}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Base Price:</span>
                  <span className="text-green-400 font-medium">
                    ${subscription.basePrice ? Number(subscription.basePrice).toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Discount:</span>
                  <span className="text-blue-400">
                    {subscription.discountRate ? `${(Number(subscription.discountRate)).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="grid items-center gap-1">
                  <span className="text-white/70">Final Price:</span>
                  <span className="text-green-400 font-medium">
                    ${subscription.basePrice && subscription.discountRate
                      ? (Number(subscription.basePrice) - (Number(subscription.basePrice) * (Number(subscription.discountRate) / 100))).toFixed(2)
                      : subscription.basePrice ? Number(subscription.basePrice).toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-white/70">No subscriptions found for this pair.</p>
        </div>
      )}
    </div>
  );
}