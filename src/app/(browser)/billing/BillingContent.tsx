'use client';

import { Suspense, useState } from 'react';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Receipt,
  DollarSign,
  CreditCard,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Subscription } from '@/generated/prisma/client';

// Payment interface
interface Payment {
  id: string;
  orderId: string;
  invoiceId: string;
  totalAmount: number;
  actuallyPaid?: number;
  network: string;
  status: 'PENDING' | 'PAID' | 'UNDERPAID' | 'EXPIRED' | 'FAILED';
  txHash?: string;
  createdAt: string;
  expiresAt?: string;
  updatedAt: string;
  userId: string;
  paymentItems: Array<{
    pairId: string;
    period: string;
    basePrice: number;
    finalPrice: number;
    discountRate: number;
  }>;
  orderData?: {
    basketItems: any[];
    pairIds: string[];
  };
  pairs: Array<{
    id: string;
    symbol: string;
    basePrice: number;
    discountRate: number;
    finalPrice: number;
  }>;
}

interface BillingStats {
  totalSpent: number;
  totalPayments: number;
  activeSubscriptions: number;
  pendingPayments: number;
}

interface BillingContentProps {
  initialPayments: Payment[];
  initialStats: BillingStats;
}

interface BillingStats {
  totalSpent: number;
  totalPayments: number;
  activeSubscriptions: number;
  pendingPayments: number;
}

interface BillingContentProps {
  initialPayments: Payment[];
  initialStats: BillingStats;
}

export default function BillingContent({ initialPayments, initialStats }: BillingContentProps) {
  const [payments] = useState<Payment[]>(initialPayments);
  const [stats] = useState<BillingStats>(initialStats);

  // Get status badge styling
  const getStatusBadge = (status: Payment['status']) => {
    const statusConfig = {
      PAID: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      FAILED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      EXPIRED: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle },
      UNDERPAID: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: AlertCircle },
    } as const;

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.bg} ${config.text} flex items-center gap-1`}>
        <Icon size={12} />
        {status}
      </Badge>
    );
  };

  // Get network badge styling
  const getNetworkBadge = (network: string) => {
    const networkConfig: Record<string, { bg: string; text: string }> = {
      BTC: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      ETH: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      USDT: { bg: 'bg-green-500/20', text: 'text-green-400' },
      USDT_TRC20: { bg: 'bg-green-500/20', text: 'text-green-400' },
      USDT_ERC20: { bg: 'bg-green-500/20', text: 'text-green-400' },
      USDT_BEP20: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    };

    const config = networkConfig[network] || networkConfig.USDT;

    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {network}
      </Badge>
    );
  };

  // Column definitions for the ReusableTable
  // Define columns
  const paymentColumns: Column<Payment>[] = [
    {
      key: 'orderId',
      header: 'Order ID',
      sortable: true,
      render: (orderId: string) => (
        <div className="font-mono text-sm text-white/80">
          {orderId}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      align: 'center',
      render: (amount: number) => (
        <div className="text-center">
          <div className="text-white font-semibold">
            {formatCurrency(amount)}
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (date: Date) => (
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'network',
      header: 'Network',
      sortable: true,
      align: 'center',
      render: (network: string) => getNetworkBadge(network),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (status: Payment['status']) => getStatusBadge(status),
    },
    {
      key: 'subscriptions',
      header: 'Pair',
      align: 'center',
      render: (items: Subscription[]) => (
        <div className="text-center">
          <div className="text-white/80 text-sm">
            {items.length} pair{items.length !== 1 ? 's' : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'txHash',
      header: 'Transaction',
      align: 'center',
      render: (txHash: string | null) => (
        <div className="text-center">
          {txHash ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
              onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
            >
              <span className="font-mono text-xs">
                {txHash.slice(0, 6)}...{txHash.slice(-4)}
              </span>
              <ExternalLink size={12} className="ml-1" />
            </Button>
          ) : (
            <span className="text-gray-500 text-sm">No hash</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_, row: Payment) => (
        <div className="flex items-center gap-2">
          <Link href={`/billing/${row.id}`} title='billing details'>
            <Eye className="h-5 w-5 text-gray-300 hover:text-white" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Billing Overview Stats */}
        <div className="mb-4">
          <OverviewSection
            overviewData={[
              {
                title: 'Total Spent',
                currentValue: `$${stats?.totalSpent?.toFixed(2)}`,
                icon: DollarSign,
                description: 'Total amount spent',
                pastValue: 'All-time spending',
                color: 'text-green-300',
                bgColor: 'bg-green-400/20',
              },
              {
                title: 'Total Payments',
                currentValue: stats?.totalPayments,
                icon: CreditCard,
                description: 'Payment transactions',
                pastValue: 'Including all statuses',
                color: 'text-blue-300',
                bgColor: 'bg-blue-400/20',
              },
              {
                title: 'Active Subscriptions',
                currentValue: stats?.activeSubscriptions,
                icon: Users,
                description: 'Currently active',
                pastValue: 'Subscription services',
                color: 'text-emerald-300',
                bgColor: 'bg-emerald-400/20',
              },
              {
                title: 'Pending Payments',
                currentValue: stats?.pendingPayments,
                icon: Clock,
                description: 'Awaiting payment',
                pastValue: 'Requires attention',
                color: 'text-yellow-300',
                bgColor: 'bg-yellow-400/20',
              },
            ]}
          />
        </div>

        <div className="flex flex-col justify-end mb-12">
          {/* Main Billing Table */}
          <div className="flex-1 min-h-0 space-y-4">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                  <span className="ml-3 text-white/80">
                    Loading trading pairs...
                  </span>
                </div>
              }
            >

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  {/* Results Count */}
                  <div className="text-sm text-white/80 font-medium">
                    {payments.length} {payments.length === 1 ? 'payment' : 'payments'} found
                  </div>
                </div>
              </div>


              <ReusableTable
                data={payments}
                columns={paymentColumns}
                title="Payment History"
                icon={Receipt}
                isLoading={false}
                searchable={true}
                searchFields={['orderId', 'invoiceId', 'network']}
                emptyStateTitle="No payments found"
                emptyStateDescription="No payments found matching your criteria"
                enableRowDetails={true}
                rowDetailTitle={(payment) =>
                  `${payment.orderId}`
                }
                excludeFromDetails={['id']}
                rowDetailContent={(payment) => (
                  <div className="space-y-6">
                    {/* Payment Overview */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Payment Overview
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Invoice ID</p>
                          <p className="text-white font-mono">
                            {payment.invoiceId}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/70">Items</p>
                          <p className="text-white font-semibold">
                            {payment.pairs?.length} item{payment.pairs?.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-white/70">Payment Network</p>
                          <p className="text-white">
                            {payment.network.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Status */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Amount & Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Amount Due:</span>
                          <span className="text-white font-semibold text-lg">
                            ${payment.totalAmount}
                          </span>
                        </div>
                        {payment.actuallyPaid &&
                          payment.actuallyPaid !== payment.totalAmount && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Amount Paid:
                              </span>
                              <span className="text-orange-400 font-semibold">
                                ${payment.actuallyPaid}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Status:</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              payment.status === 'PAID'
                                ? 'bg-green-500/20 text-green-400'
                                : payment.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : payment.status === 'UNDERPAID'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    {payment.txHash && (
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold mb-3">
                          Transaction Hash
                        </h3>
                        <div className="bg-black/20 p-3 rounded border border-white/10">
                          <p className="text-white/80 font-mono text-sm break-all">
                            {payment.txHash}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payment Items Details */}
                    {payment.paymentItems && payment.paymentItems?.length > 0 && (
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Payment Items
                        </h3>
                        <div className="space-y-3">
                          {payment.paymentItems.map((item, index) => (
                            <div key={index} className="bg-white/5 p-3 rounded border border-white/10">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/70">Pair ID:</span>
                                  <span className="text-white font-mono text-xs">
                                    {item.pairId}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Period:</span>
                                  <span className="text-white">
                                    {item.period.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Base Price:</span>
                                  <span className="text-white">
                                    ${item.basePrice}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Final Price:</span>
                                  <span className="text-green-400 font-semibold">
                                    ${item.finalPrice}
                                  </span>
                                </div>
                                {item.discountRate > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-white/70">Discount:</span>
                                    <span className="text-orange-400">
                                      {item.discountRate}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pairs Details */}
                    {payment.pairs && payment.pairs.length > 0 && (
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Trading Pairs
                        </h3>
                        <div className="space-y-3">
                          {payment.pairs.map((pair, index) => (
                            <div key={pair.id} className="bg-white/5 p-3 rounded border border-white/10">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/70">Pair ID:</span>
                                  <span className="text-white font-mono text-xs">
                                    {pair.id}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Symbol:</span>
                                  <span className="text-white font-semibold">
                                    {pair.symbol}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Base Price:</span>
                                  <span className="text-white">
                                    ${pair.basePrice}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Final Price:</span>
                                  <span className="text-green-400 font-semibold">
                                    ${pair.finalPrice}
                                  </span>
                                </div>
                                {pair.discountRate > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-white/70">Discount:</span>
                                    <span className="text-orange-400">
                                      {pair.discountRate}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Important Dates
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Created:</span>
                          <span className="text-white">
                            {new Date(payment.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {payment.expiresAt && (
                          <div className="flex justify-between">
                            <span className="text-white/70">Expires:</span>
                            <span className="text-white">
                              {new Date(payment.expiresAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}