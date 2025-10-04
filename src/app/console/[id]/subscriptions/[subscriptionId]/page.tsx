'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  TrendingUp,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle };
      case 'EXPIRED':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle };
      case 'PENDING':
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock };
      case 'CANCELLED':
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle };
      default:
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertCircle };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border flex items-center gap-1`}>
      <Icon size={14} />
      {status}
    </Badge>
  );
}

// Payment status badge
function PaymentStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return { color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'PENDING':
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case 'FAILED':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'EXPIRED':
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
      case 'UNDERPAID':
        return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      default:
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={`${config.color} border`}>
      {status}
    </Badge>
  );
}

const SubscriptionDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const subscriptionId = params.subscriptionId as string;
  
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch subscription details
  const fetchSubscriptionDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions?id=${subscriptionId}`);
      const data = await res.json();
      
      if (res.ok && data.subscriptions?.length > 0) {
        setSubscription(data.subscriptions[0]);
      } else {
        toast.error('Subscription not found', {
          style: { background: '#ef4444', color: 'white' },
        });
        router.back();
      }
    } catch (error) {
      toast.error('Error fetching subscription details', {
        style: { background: '#ef4444', color: 'white' },
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subscriptionId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Subscription status updated to ${newStatus}`, {
          style: { background: '#22c55e', color: 'white' },
        });
        fetchSubscriptionDetails();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update subscription', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error('Error updating subscription', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle invite status update
  const handleInviteStatusUpdate = async (newInviteStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subscriptionId,
          inviteStatus: newInviteStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Invite status updated to ${newInviteStatus}`, {
          style: { background: '#22c55e', color: 'white' },
        });
        fetchSubscriptionDetails();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update invite status', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error('Error updating invite status', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle subscription deletion
  const handleDeleteSubscription = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/subscriptions?id=${subscriptionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Subscription deleted successfully', {
          style: { background: '#22c55e', color: 'white' },
        });
        router.push(`/console/${params.id}/subscriptions`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete subscription', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error('Error deleting subscription', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [subscriptionId]);

  if (loading) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-lg">Loading subscription details...</div>
        </div>
      </GradientBackground>
    );
  }

  if (!subscription) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-lg">Subscription not found</div>
        </div>
      </GradientBackground>
    );
  }

  const finalPrice = subscription.basePrice * (1 - (subscription.discountRate || 0) / 100);
  const isExpired = new Date(subscription.expiryDate) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(subscription.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <GradientBackground className='pb-16'>
      <Toaster position="top-center" />
      <div className="min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Subscription Details</h1>
            <p className="text-gray-400 mt-1">
              {subscription.user?.email} • {subscription.pair?.symbol}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={subscription.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-blue-400" size={24} />
                <h2 className="text-xl font-semibold text-white">User Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <div className="text-white font-medium flex items-center gap-2">
                    {subscription.user?.email}
                    <Mail size={16} className="text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <div className="text-white font-medium">
                    {subscription.user?.name || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">TradingView Username</label>
                  <div className="text-white font-medium flex items-center gap-2">
                    {subscription.user?.tradingviewUsername || 'Not provided'}
                    {subscription.user?.tradingviewUsername && (
                      <ExternalLink size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">User ID</label>
                  <div className="text-white font-mono text-sm">
                    {subscription.user?.id}
                  </div>
                </div>
              </div>
            </Card>

            {/* Trading Pair Information */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-green-400" size={24} />
                <h2 className="text-xl font-semibold text-white">Trading Pair</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Symbol</label>
                  <div className="text-white font-medium text-lg">
                    {subscription.pair?.symbol}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Timeframe</label>
                  <div className="text-white font-medium">
                    {subscription.pair?.timeframe}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Strategy</label>
                  <div className="text-white font-medium">
                    {subscription.pair?.strategy || 'Not specified'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Information */}
            {subscription.payment && (
              <Card className="bg-white/5 backdrop-blur-md border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="text-purple-400" size={24} />
                  <h2 className="text-xl font-semibold text-white">Payment Details</h2>
                  <PaymentStatusBadge status={subscription.payment.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Total Amount</label>
                    <div className="text-white font-medium text-lg">
                      ${subscription.payment.totalAmount}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Actually Paid</label>
                    <div className="text-white font-medium text-lg">
                      ${subscription.payment.actuallyPaid || '0.00'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Network</label>
                    <div className="text-white font-medium">
                      {subscription.payment.network}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Payment Date</label>
                    <div className="text-white font-medium">
                      {new Date(subscription.payment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {subscription.payment.txHash && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400">Transaction Hash</label>
                      <div className="text-white font-mono text-sm break-all bg-gray-900/50 p-2 rounded">
                        {subscription.payment.txHash}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Items */}
                {subscription.payment.paymentItems?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Payment Items</h3>
                    <div className="space-y-3">
                      {subscription.payment.paymentItems.map((item: any, index: number) => (
                        <div key={index} className="bg-gray-900/50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-400">Base Price:</span>
                              <div className="text-white font-medium">${item.basePrice}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Discount:</span>
                              <div className="text-white font-medium">{item.discountRate}%</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Final Price:</span>
                              <div className="text-white font-medium">${item.finalPrice}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Period:</span>
                              <div className="text-white font-medium">
                                {item.period?.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
            {/* Subscription Status */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-orange-400" size={24} />
                <h2 className="text-lg font-semibold text-white">Subscription Status</h2>
              </div>
              <div className="flex justify-between items-center space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Current Status</label>
                  <div className="mt-1">
                    <StatusBadge status={subscription.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Period</label>
                  <div className="text-white font-medium">
                    {subscription.period?.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Start Date</label>
                  <div className="text-white font-medium">
                    {new Date(subscription.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Expiry Date</label>
                  <div className={`font-medium ${isExpired ? 'text-red-400' : daysUntilExpiry <= 7 ? 'text-orange-400' : 'text-white'}`}>
                    {new Date(subscription.expiryDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {!isExpired && (
                      <div className="text-xs text-gray-400 mt-1">
                        {daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expires today'}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Invite Status</label>
                  <div className="text-white font-medium">
                    {subscription.inviteStatus}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Pricing Information */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="text-green-400" size={24} />
                <h2 className="text-lg font-semibold text-white">Pricing</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Base Price</label>
                  <div className="text-white font-medium text-lg">
                    ${subscription.basePrice || '0.00'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Discount Rate</label>
                  <div className="text-green-400 font-medium">
                    {subscription.discountRate || 0}%
                  </div>
                </div>
                <Separator className="bg-white/20" />
                <div>
                  <label className="text-sm text-gray-400">Final Price</label>
                  <div className="text-white font-bold text-xl">
                    ${finalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
              <div className="space-y-3">
                {/* Status Update Actions */}
                <div className="flex flex-wrap gap-2">
                  {subscription.status !== 'ACTIVE' && (
                    <Button
                      onClick={() => handleStatusUpdate('ACTIVE')}
                      disabled={updating}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Activate
                    </Button>
                  )}
                  {subscription.status !== 'CANCELLED' && (
                    <Button
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      disabled={updating}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle size={16} className="mr-1" />
                      Cancel
                    </Button>
                  )}
                  {subscription.status === 'EXPIRED' && (
                    <Button
                      onClick={() => handleStatusUpdate('ACTIVE')}
                      disabled={updating}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <RefreshCw size={16} className="mr-1" />
                      Renew
                    </Button>
                  )}
                </div>

                {/* Invite Status Actions */}
                <div className="flex flex-wrap gap-2">
                  {subscription.inviteStatus !== 'SENT' && (
                    <Button
                      onClick={() => handleInviteStatusUpdate('SENT')}
                      disabled={updating}
                      size="sm"
                      variant="outline"
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      Send Invite
                    </Button>
                  )}
                  {subscription.inviteStatus !== 'COMPLETED' && (
                    <Button
                      onClick={() => handleInviteStatusUpdate('COMPLETED')}
                      disabled={updating}
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>

                <Separator className="bg-white/20" />

                {/* Dangerous Actions */}
                <div className="space-y-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
                        disabled={updating}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the subscription
                          and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteSubscription}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default SubscriptionDetailsPage;