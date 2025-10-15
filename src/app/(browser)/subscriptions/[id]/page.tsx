import { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Users,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { GradientBackground } from '@/components/ui/gradient-background';
import { getSubscriptionDetails } from '@/app/api/services';

interface SubscriptionDetails {
  id: string;
  userId: string;
  pairId: string;
  period: string;
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  paymentId?: string;
  inviteStatus: 'PENDING' | 'SENT' | 'COMPLETED';
  basePrice?: number;
  discountRate?: number;
  pair: {
	id: string;
	symbol: string;
	version?: string;
	timeframe: string;
	priceOneMonth: number;
	priceThreeMonths: number;
	priceSixMonths: number;
	priceTwelveMonths: number;
	discountOneMonth: number;
	discountThreeMonths: number;
	discountSixMonths: number;
	discountTwelveMonths: number;
	performance?: any;
	riskPerformanceRatios?: any;
	tradesAnalysis?: any;
	createdAt: string;
  };
  payment?: {
	id: string;
	network: string;
	status: string;
	txHash?: string;
	totalAmount: number;
	actuallyPaid?: number;
	createdAt: string;
	paymentItems: Array<{
	  id: string;
	  basePrice: number;
	  discountRate: number;
	  finalPrice: number;
	  period: string;
	  pair: {
		id: string;
		symbol: string;
	  };
	}>;
  };
  user: {
	id: string;
	name?: string;
	email: string;
	tradingviewUsername?: string;
	createdAt: string;
  };
  commissions: Array<{
	id: string;
	amount: number;
	status: string;
	type: string;
	affiliate: {
	  user: {
		id: string;
		name?: string;
		email: string;
	  };
	};
  }>;
}

async function getSubscriptionData(id: string) {
  try {
    const data = await getSubscriptionDetails(id);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw new Error('Failed to load subscription details');
  }
}

export default async function SubscriptionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let subscription: SubscriptionDetails | null = null;
  let error: string | null = null;

  try {
    subscription = await getSubscriptionData(id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Subscription not found';
  }

  if (error || !subscription) {
    return (
      <GradientBackground>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
            <p className="text-slate-400 mb-6">{error || 'Subscription not found'}</p>
            <Link href="/subscriptions">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subscriptions
              </Button>
            </Link>
          </div>
        </div>
      </GradientBackground>
    );
  }

  const getStatusColor = (status: string) => {
	switch (status) {
	  case 'ACTIVE':
		return 'bg-green-500/20 text-green-400 border-green-500/50';
	  case 'PENDING':
		return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
	  case 'EXPIRED':
		return 'bg-red-500/20 text-red-400 border-red-500/50';
	  case 'CANCELLED':
		return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
	  default:
		return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
	}
  };

  const getInviteStatusColor = (status: string) => {
	switch (status) {
	  case 'COMPLETED':
		return 'bg-green-500/20 text-green-400 border-green-500/50';
	  case 'SENT':
		return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
	  case 'PENDING':
		return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
	  default:
		return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
	}
  };

  const calculateDaysRemaining = () => {
	const expiry = new Date(subscription.expiryDate);
	const now = new Date();
	const diffTime = expiry.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
  };

  const calculateProgress = () => {
	const start = new Date(subscription.startDate);
	const expiry = new Date(subscription.expiryDate);
	const now = new Date();

	const total = expiry.getTime() - start.getTime();
	const elapsed = now.getTime() - start.getTime();
	return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const formatPeriod = (period: string) => {
	return period.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const daysRemaining = calculateDaysRemaining();
  const progress = calculateProgress();

  return (
	<GradientBackground>
	  {/* Header */}
	  <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
			<div className="container mx-auto p-2 md:px-6 md:py-3">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg border border-white/20">
						<TrendingUp className="w-5 h-5 text-blue-400" />
						</div>
						<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold text-white">
							{subscription.pair.symbol} Subscription
							</h1>
							<Badge className={getStatusColor(subscription.status)}>
							{subscription.status}
							</Badge>
						</div>
						<p className="text-white/70 text-sm">
							Subscription #{subscription.id.slice(-8)}
						</p>
						</div>
					</div>
					<div className="flex items-center gap-4 text-sm">
						<div className="text-center">
						<div className="text-white/90 text-xs pb-1">Period</div>
						<div className="font-bold text-green-400">
							{formatPeriod(subscription.period)}
						</div>
						</div>
						<div className="text-center">
						<div className="text-white/90 text-xs pb-1">Days Remaining</div>
						<div className="font-bold text-blue-400">
							{daysRemaining}
						</div>
						</div>
						<div className="text-center">
						<div className="text-white/90 text-xs pb-1">Invite Status</div>
						<Badge className={getInviteStatusColor(subscription.inviteStatus)}>
							{subscription.inviteStatus}
						</Badge>
						</div>
					</div>
				</div>
			</div>
	  </div>

	  <div className="container mx-auto px-0 py-2 md:px-6 md:py-4">
			<div className="grid grid-cols-1 xl:grid-cols-6 gap-2 h-full">
				{/* Main Content */}
				<div className="xl:col-span-4 space-y-4 md:space-y-8 overflow-y-auto pr-0 md:pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
				{/* Subscription Overview */}
					<Card className="bg-white/10 backdrop-blur-md border-b border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
						<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="w-5 h-5" />
							Subscription Overview
						</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Period</h3>
							<p className="text-white font-semibold">{formatPeriod(subscription.period)}</p>
							</div>
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Start Date</h3>
							<p className="text-white">{new Date(subscription.startDate).toLocaleDateString()}</p>
							</div>
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Expiry Date</h3>
							<p className="text-white">{new Date(subscription.expiryDate).toLocaleDateString()}</p>
							</div>
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Days Remaining</h3>
							<p className={`font-semibold ${daysRemaining < 7 ? 'text-red-400' : daysRemaining < 30 ? 'text-yellow-400' : 'text-green-400'}`}>
								{daysRemaining} days
							</p>
							</div>
						</div>

						<div>
							<div className="flex justify-between items-center mb-2">
							<span className="text-sm font-medium text-slate-400">Progress</span>
							<span className="text-sm text-slate-400">{Math.round(progress)}%</span>
							</div>
							<Progress value={progress} className="h-2" />
						</div>

						{(subscription.basePrice || subscription.discountRate) && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700">
							{subscription.basePrice && (
								<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Base Price</h3>
								<p className="text-white font-semibold">${Number(subscription.basePrice).toFixed(2)}</p>
								</div>
							)}
							{subscription.discountRate && Number(subscription.discountRate) > 0 && (
								<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Discount Rate</h3>
								<p className="text-green-400 font-semibold">{Number(subscription.discountRate).toFixed(1)}%</p>
								</div>
							)}
							</div>
						)}
						</CardContent>
					</Card>

					{/* Pair Details */}
					<Card className="bg-white/10 backdrop-blur-md border-b border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
						<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="w-5 h-5" />
							Trading Pair Details
						</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Symbol</h3>
							<p className="text-white font-semibold text-lg">{subscription.pair.symbol}</p>
							</div>
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Version</h3>
							<p className="text-white">{subscription.pair.version || 'N/A'}</p>
							</div>
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Timeframe</h3>
							<p className="text-white">{subscription.pair.timeframe}</p>
							</div>
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Created</h3>
							<p className="text-white">{new Date(subscription.pair.createdAt).toLocaleDateString()}</p>
							</div>
						</div>

						{/* Pricing Information */}
						<div className="pt-4 border-t border-slate-700">
							<h3 className="text-sm font-medium text-slate-400 mb-4">Pricing Tiers</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center p-3 bg-slate-700/50 rounded-lg">
								<p className="text-xs text-slate-400">1 Month</p>
								<p className="text-white font-semibold">${Number(subscription.pair.priceOneMonth).toFixed(2)}</p>
								{Number(subscription.pair.discountOneMonth) > 0 && (
								<p className="text-green-400 text-xs">-{Number(subscription.pair.discountOneMonth).toFixed(0)}% off</p>
								)}
							</div>
							<div className="text-center p-3 bg-slate-700/50 rounded-lg">
								<p className="text-xs text-slate-400">3 Months</p>
								<p className="text-white font-semibold">${Number(subscription.pair.priceThreeMonths).toFixed(2)}</p>
								{Number(subscription.pair.discountThreeMonths) > 0 && (
								<p className="text-green-400 text-xs">-{Number(subscription.pair.discountThreeMonths).toFixed(0)}% off</p>
								)}
							</div>
							<div className="text-center p-3 bg-slate-700/50 rounded-lg">
								<p className="text-xs text-slate-400">6 Months</p>
								<p className="text-white font-semibold">${Number(subscription.pair.priceSixMonths).toFixed(2)}</p>
								{Number(subscription.pair.discountSixMonths) > 0 && (
								<p className="text-green-400 text-xs">-{Number(subscription.pair.discountSixMonths).toFixed(0)}% off</p>
								)}
							</div>
							<div className="text-center p-3 bg-slate-700/50 rounded-lg">
								<p className="text-xs text-slate-400">12 Months</p>
								<p className="text-white font-semibold">${Number(subscription.pair.priceTwelveMonths).toFixed(2)}</p>
								{Number(subscription.pair.discountTwelveMonths) > 0 && (
								<p className="text-green-400 text-xs">-{Number(subscription.pair.discountTwelveMonths).toFixed(0)}% off</p>
								)}
							</div>
							</div>
						</div>
						</CardContent>
					</Card>

					{/* Payment Information */}
					{subscription.payment && (
					<Card className="bg-white/10 backdrop-blur-md border-b border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CreditCard className="w-5 h-5" />
								Payment Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Payment ID</h3>
								<p className="text-white font-mono text-sm">{subscription.payment.id}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Network</h3>
								<p className="text-white">{subscription.payment.network.replace('_', ' ')}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
								<Badge className={subscription.payment.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
								{subscription.payment.status}
								</Badge>
							</div>
							<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Total Amount</h3>
								<p className="text-white font-semibold">${Number(subscription.payment.totalAmount).toFixed(2)}</p>
							</div>
							</div>

							{subscription.payment.actuallyPaid && (
							<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Actually Paid</h3>
								<p className="text-green-400 font-semibold">${Number(subscription.payment.actuallyPaid).toFixed(2)}</p>
							</div>
							)}

							{subscription.payment.txHash && (
							<div>
								<h3 className="text-sm font-medium text-slate-400 mb-2">Transaction Hash</h3>
								<p className="text-white font-mono text-sm break-all">{subscription.payment.txHash}</p>
							</div>
							)}

							{/* Payment Items */}
							{subscription.payment.paymentItems.length > 0 && (
							<div className="pt-4 border-t border-slate-700">
								<h3 className="text-sm font-medium text-slate-400 mb-4">Payment Items</h3>
								<div className="space-y-3">
								{subscription.payment.paymentItems.map((item) => (
									<div key={item.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
									<div>
										<p className="text-white font-medium">{item.pair.symbol}</p>
										<p className="text-slate-400 text-sm">{formatPeriod(item.period)}</p>
									</div>
									<div className="text-right">
										<p className="text-white font-semibold">${Number(item.finalPrice).toFixed(2)}</p>
										{Number(item.discountRate) > 0 && (
										<p className="text-green-400 text-sm">-{Number(item.discountRate).toFixed(1)}% off</p>
										)}
									</div>
									</div>
								))}
								</div>
							</div>
							)}
						</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar */}
				<div className="xl:col-span-2 space-y-8">
					{/* User Information */}
					<Card className="bg-white/10 backdrop-blur-md border-b border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
						<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="w-5 h-5" />
							User Information
						</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
						<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Name</h3>
							<p className="text-white">{subscription.user.name || 'N/A'}</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Email</h3>
							<p className="text-white">{subscription.user.email}</p>
						</div>
						{subscription.user.tradingviewUsername && (
							<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">TradingView Username</h3>
							<p className="text-white">@{subscription.user.tradingviewUsername}</p>
							</div>
						)}
						<div>
							<h3 className="text-sm font-medium text-slate-400 mb-2">Member Since</h3>
							<p className="text-white">{new Date(subscription.user.createdAt).toLocaleDateString()}</p>
						</div>
						</CardContent>
					</Card>

					{/* TradingView Invite Status */}
					<Card className="bg-white/10 backdrop-blur-md border-b border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
						<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mail className="w-5 h-5" />
							TradingView Integration
						</CardTitle>
						</CardHeader>
						<CardContent>
						<div className="flex items-center gap-3">
							{subscription.inviteStatus === 'COMPLETED' ? (
							<CheckCircle className="w-5 h-5 text-green-400" />
							) : subscription.inviteStatus === 'SENT' ? (
							<Clock className="w-5 h-5 text-blue-400" />
							) : (
							<AlertCircle className="w-5 h-5 text-yellow-400" />
							)}
							<div>
							<p className="text-white font-medium capitalize">
								{subscription.inviteStatus.toLowerCase().replace('_', ' ')}
							</p>
							<p className="text-slate-400 text-sm">
								{subscription.inviteStatus === 'COMPLETED'
								? 'User has access to the strategy'
								: subscription.inviteStatus === 'SENT'
								? 'Invite sent, waiting for acceptance'
								: 'Invite pending admin action'
								}
							</p>
							</div>
						</div>
						</CardContent>
					</Card>

					{/* Commissions */}
					{subscription.commissions.length > 0 && (
					<Card className="bg-white/10 backdrop-blur-md border-b border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5" />
							Referral Commissions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
							{subscription.commissions.map((commission) => (
								<div key={commission.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
								<div>
									<p className="text-white font-medium">
									{commission.affiliate.user.name || commission.affiliate.user.email}
									</p>
									<p className="text-slate-400 text-sm">{commission.type}</p>
								</div>
								<div className="text-right">
									<p className="text-green-400 font-semibold">${Number(commission.amount).toFixed(2)}</p>
									<Badge className={commission.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
									{commission.status}
									</Badge>
								</div>
								</div>
							))}
							</div>
						</CardContent>
						</Card>
					)}

					{/* Actions */}
					<Card className="bg-white/10 backdrop-blur-md border-b border-white/20 rounded-xl p-3 md:p-6 md:py-4 gap-0">
						<CardHeader>
						<CardTitle>Actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
						{subscription.status === 'ACTIVE' && daysRemaining < 30 && (
							<Button className="w-full bg-blue-600 hover:bg-blue-500">
							<RefreshCw className="w-4 h-4 mr-2" />
							Renew Subscription
							</Button>
						)}
						{subscription.status === 'PENDING' && (
							<Button variant="outline" className="w-full">
							<Mail className="w-4 h-4 mr-2" />
							Resend Invite
							</Button>
						)}
						<Link href="/billing">
							<Button variant="outline" className="w-full">
							<DollarSign className="w-4 h-4 mr-2" />
							View Payment History
							</Button>
						</Link>
						</CardContent>
					</Card>
				</div>
			</div>
	  </div>
	</GradientBackground>
  );
}