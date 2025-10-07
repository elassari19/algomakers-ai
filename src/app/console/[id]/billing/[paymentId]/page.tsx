'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  ExternalLink,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Receipt,
  Wallet,
  Hash,
  FileText,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Types based on Prisma schema
interface PaymentDetails {
  id: string;
  userId: string;
  network: 'USDT_ERC20' | 'USDT_BEP20';
  status: 'PENDING' | 'PAID' | 'UNDERPAID' | 'EXPIRED' | 'FAILED';
  txHash?: string;
  invoiceId?: string;
  createdAt: Date;
  actuallyPaid?: number;
  expiresAt?: Date;
  orderData?: any;
  orderId?: string;
  totalAmount: number;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  paymentItems: PaymentItem[];
  subscription?: {
    id: string;
    period: string;
    status: string;
    startDate?: Date;
    expiryDate?: Date;
  };
}

interface PaymentItem {
  id: string;
  paymentId: string;
  pairId: string;
  basePrice: number;
  discountRate: number;
  finalPrice: number;
  period: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS';
  createdAt: Date;
  pair: {
    id: string;
    symbol: string;
    version?: string;
  };
}

// Dummy data for development - should match the payment from the billing table
const mockPaymentDetails: PaymentDetails = {
  id: 'pay_001',
  userId: 'user_001',
  network: 'USDT_ERC20',
  status: 'PAID',
  txHash: '0xa1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
  invoiceId: 'INV-2024-001',
  createdAt: new Date('2024-09-15T10:30:00Z'),
  actuallyPaid: 299.99,
  expiresAt: new Date('2024-09-16T10:30:00Z'),
  orderId: 'ORD-001',
  totalAmount: 299.99,
  updatedAt: new Date('2024-09-15T11:45:00Z'),
  user: {
    id: 'user_001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    image: 'https://avatar.vercel.sh/john'
  },
  paymentItems: [
    {
      id: 'item_001',
      paymentId: 'pay_001',
      pairId: 'pair_001',
      basePrice: 199.99,
      discountRate: 0.10,
      finalPrice: 179.99,
      period: 'THREE_MONTHS',
      createdAt: new Date('2024-09-15T10:30:00Z'),
      pair: {
        id: 'pair_001',
        symbol: 'EURUSD',
        version: 'Momentum Trading'
      }
    },
    {
      id: 'item_002',
      paymentId: 'pay_001',
      pairId: 'pair_002',
      basePrice: 149.99,
      discountRate: 0.20,
      finalPrice: 119.99,
      period: 'ONE_MONTH',
      createdAt: new Date('2024-09-15T10:30:00Z'),
      pair: {
        id: 'pair_002',
        symbol: 'GBPJPY',
        version: 'Scalping Strategy'
      }
    }
  ],
  subscription: {
    id: 'sub_001',
    period: 'QUARTERLY',
    status: 'ACTIVE',
    startDate: new Date('2024-09-15T11:45:00Z'),
    expiryDate: new Date('2024-12-15T11:45:00Z')
  }
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    PAID: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    PENDING: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    FAILED: { color: 'bg-red-500/20 text-red-400', icon: XCircle },
    EXPIRED: { color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
    UNDERPAID: { color: 'bg-orange-500/20 text-orange-400', icon: AlertCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  const IconComponent = config.icon;

  return (
    <Badge className={`${config.color} border-0 font-semibold px-3 py-1`}>
      <IconComponent size={12} className="mr-1" />
      {status}
    </Badge>
  );
}

// Period formatter
function formatPeriod(period: string): string {
  const periodMap = {
    'ONE_MONTH': '1 Month',
    'THREE_MONTHS': '3 Months',
    'SIX_MONTHS': '6 Months',
    'TWELVE_MONTHS': '12 Months',
  };
  return periodMap[period as keyof typeof periodMap] || period;
}

// Network formatter
function formatNetwork(network: string): string {
  const networkMap = {
    'USDT_ERC20': 'USDT (ERC-20)',
    'USDT_BEP20': 'USDT (BEP-20)',
  };
  return networkMap[network as keyof typeof networkMap] || network;
}

const BillingDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const paymentId = params.paymentId as string;

  // Fetch payment details
  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use dummy data for development
      setPayment(mockPaymentDetails);
      
      /* 
      // Original API call - uncomment when ready to use real API
      const response = await fetch(`/api/billing/invoice/${paymentId}`);
      const data = await response.json();
      
      if (response.ok && data.payment) {
        setPayment(data.payment);
      } else {
        toast.error(data.message || 'Failed to fetch payment details');
        router.push('/billing');
      }
      */
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Error loading payment details');
      router.push('/billing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  const handleDownloadInvoice = () => {
    // Implement invoice download functionality
    toast.info('Invoice download feature coming soon');
  };

  const handleRefreshPayment = () => {
    fetchPaymentDetails();
    toast.success('Payment details refreshed');
  };

  const handleViewTransaction = () => {
    if (payment?.txHash) {
      const url = payment.network === 'USDT_ERC20' 
        ? `https://etherscan.io/tx/${payment.txHash}`
        : `https://bscscan.com/tx/${payment.txHash}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-white/80 text-lg">Loading payment details...</span>
          </div>
        </div>
      </GradientBackground>
    );
  }

  if (!payment) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Payment Not Found</h2>
              <p className="text-white/70 mb-4">The payment you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button onClick={() => router.back()} className="bg-gradient-to-r from-purple-600 to-pink-500">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </GradientBackground>
    );
  }

  const totalDiscount = payment.paymentItems.reduce((sum, item) => 
    sum + (item.basePrice * item.discountRate), 0
  );

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen p-4 md:p-6 md:pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Billing
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Payment Details</h1>
              <p className="text-white/70">Invoice #{payment.invoiceId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefreshPayment}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleDownloadInvoice}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"
            >
              <Download size={16} className="mr-2" />
              Download Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Status & Summary */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Receipt className="mr-2" size={20} />
                    Payment Summary
                  </CardTitle>
                  <StatusBadge status={payment.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Total Amount</p>
                    <p className="text-white font-semibold text-lg">{formatCurrency(payment.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Amount Paid</p>
                    <p className="text-white font-semibold text-lg">
                      {payment.actuallyPaid ? formatCurrency(payment.actuallyPaid) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Network</p>
                    <p className="text-white font-semibold">{formatNetwork(payment.network)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Order ID</p>
                    <p className="text-white font-semibold">{payment.orderId || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Items */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Package className="mr-2" size={20} />
                  Purchased Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payment.paymentItems.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <TrendingUp className="text-white" size={20} />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">{item.pair.symbol}</h4>
                              <p className="text-white/60 text-sm">{item.pair.version}</p>
                              <p className="text-white/60 text-sm">Period: {formatPeriod(item.period)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {formatCurrency(item.finalPrice)}
                          </div>
                          {item.discountRate > 0 && (
                            <>
                              <div className="text-white/50 text-sm line-through">
                                {formatCurrency(item.basePrice)}
                              </div>
                              <div className="text-green-400 text-sm">
                                -{(item.discountRate * 100).toFixed(0)}% off
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {index < payment.paymentItems.length - 1 && <Separator className="my-2 bg-white/10" />}
                    </div>
                  ))}
                </div>

                {/* Payment Total Breakdown */}
                <Separator className="my-4 bg-white/20" />
                <div className="space-y-2">
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal</span>
                    <span>{formatCurrency(payment.paymentItems.reduce((sum, item) => sum + item.basePrice, 0))}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Total Discount</span>
                      <span>-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between text-white font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(payment.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            {payment.txHash && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Hash className="mr-2" size={20} />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white/60 text-sm">Transaction Hash</p>
                        <p className="text-white font-mono text-sm break-all">{payment.txHash}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewTransaction}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ExternalLink size={16} className="mr-2" />
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="mr-2" size={20} />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  {payment.user.image ? (
                    <img
                      src={payment.user.image}
                      alt={payment.user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="text-white" size={20} />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold">{payment.user.name || 'Anonymous User'}</p>
                    <p className="text-white/60 text-sm">{payment.user.email}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-white/60 text-sm">User ID</p>
                  <p className="text-white font-mono text-sm">{payment.user.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Timeline */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Payment Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Clock className="text-blue-400" size={14} />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Created</p>
                      <p className="text-white text-sm">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      payment.status === 'PAID' ? 'bg-green-500/20' : 'bg-gray-500/20'
                    }`}>
                      <CheckCircle className={`${
                        payment.status === 'PAID' ? 'text-green-400' : 'text-gray-400'
                      }`} size={14} />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Last Updated</p>
                      <p className="text-white text-sm">
                        {new Date(payment.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {payment.expiresAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="text-orange-400" size={14} />
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Expires</p>
                        <p className="text-white text-sm">
                          {new Date(payment.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            {payment.subscription && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Wallet className="mr-2" size={20} />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-white/60 text-sm">Subscription ID</p>
                    <p className="text-white font-mono text-sm">{payment.subscription.id}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Period</p>
                    <p className="text-white">{payment.subscription.period}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Status</p>
                    <StatusBadge status={payment.subscription.status} />
                  </div>
                  {payment.subscription.startDate && (
                    <div>
                      <p className="text-white/60 text-sm">Start Date</p>
                      <p className="text-white text-sm">
                        {new Date(payment.subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {payment.subscription.expiryDate && (
                    <div>
                      <p className="text-white/60 text-sm">Expiry Date</p>
                      <p className="text-white text-sm">
                        {new Date(payment.subscription.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default BillingDetailsPage;