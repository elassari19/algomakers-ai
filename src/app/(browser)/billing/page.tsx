'use client';

import { useState, useEffect, Suspense } from 'react';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Download,
  Receipt,
  DollarSign,
  CreditCard,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { SearchInput } from '@/components/SearchInput';
import jsPDF from 'jspdf';
import { getUserBillingData } from '@/app/api/services';
import { SortFilterBar } from '@/components/subscription/SortFilterBar';
import { formatCurrency } from '@/lib/utils';

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

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalSpent: 0,
    totalPayments: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  const fetchPayments = async (status?: string, dateRangeParam?: string, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (dateRangeParam && dateRangeParam !== 'all') params.append('dateRange', dateRangeParam);
      if (search && search.trim()) params.append('search', search.trim());

      const response = await fetch(`/api/billing?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }
      const data = await response.json();
      setPayments(data.payments || []);
      setStats({
        totalSpent: data.payments.map((payment: Payment) => payment.totalAmount).reduce((a: number, b: number) => Number(a) + Number(b), 0),
        totalPayments: data.payments.length,
        activeSubscriptions: data.payments.filter((payment: Payment) => payment.status === 'PAID').length,
        pendingPayments: data.payments.filter((payment: Payment) => payment.status === 'PENDING').length,
      });
    } catch (error) {
      console.error('Error fetching billing data:', error);
      // Fallback to empty data if API fails
      setPayments([]);
      setStats({
        totalSpent: 0,
        totalPayments: 0,
        activeSubscriptions: 0,
        pendingPayments: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Map filterBy to API parameters
    let statusParam = undefined;
    let dateRangeParam = undefined;

    switch (filterBy) {
      case 'paid':
        statusParam = 'PAID';
        break;
      case 'pending':
        statusParam = 'PENDING';
        break;
      case 'failed':
        statusParam = 'FAILED';
        break;
      case 'expired':
        statusParam = 'EXPIRED';
        break;
      case 'underpaid':
        statusParam = 'UNDERPAID';
        break;
      case 'recent':
        dateRangeParam = '30d';
        break;
      case 'high-value':
        // High-value filtering will be done client-side since API doesn't support amount filtering
        break;
      default:
        // 'all' or other values - no filtering
        break;
    }

    fetchPayments(statusParam, dateRangeParam, searchQuery);
  }, [filterBy, dateRange, searchQuery]);


  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      FAILED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      EXPIRED: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle },
      UNDERPAID: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
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
    const networkConfig = {
      BTC: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      ETH: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      USDT: { bg: 'bg-green-500/20', text: 'text-green-400' },
      USDT_TRC20: { bg: 'bg-green-500/20', text: 'text-green-400' },
      USDT_ERC20: { bg: 'bg-green-500/20', text: 'text-green-400' },
      USDT_BEP20: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    };

    const config = networkConfig[network as keyof typeof networkConfig] || networkConfig.USDT;

    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {network}
      </Badge>
    );
  };

  // Apply client-side filtering for high-value filter (API doesn't support amount filtering)
  const getDisplayedPayments = () => {
    if (filterBy === 'high-value') {
      return payments.filter((payment) => payment.totalAmount >= 100);
    }
    return payments;
  };

  const displayedPayments = getDisplayedPayments();

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
      render: (status: string) => getStatusBadge(status),
    },
    {
      key: 'paymentItems',
      header: 'Pair',
      align: 'center',
      render: (items: PaymentItem[]) => (
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
          <Button
            size="sm"
            variant="outline"
            className="text-gray-300 border-gray-500 hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              downloadInvoice(row);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const downloadInvoice = async (payment: Payment) => {
    try {
      // Generate PDF
      const pdf = generateInvoicePDF(payment);

      // Download the PDF
      pdf.save(`invoice-${payment.invoiceId}-${payment.orderId}.pdf`);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
    }
  };

  const generateInvoicePDF = (payment: Payment): jsPDF => {
    const currentDate = new Date().toLocaleDateString();
    const paymentDate = new Date(payment.createdAt).toLocaleDateString();

    const pdf = new jsPDF();

    // Set up colors
    const primaryColor: [number, number, number] = [79, 70, 229]; // #4f46e5
    const textColor: [number, number, number] = [51, 51, 51]; // #333
    const grayColor: [number, number, number] = [107, 114, 128]; // #6b7280    // Header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, 210, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AlgoMarkers AI', 105, 20, { align: 'center' });

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Trading Signals Platform', 105, 30, { align: 'center' });

    // Invoice Title
    pdf.setTextColor(...textColor);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', 105, 55, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #${payment.invoiceId}`, 105, 65, { align: 'center' });

    // Invoice Details - Left Side
    let yPos = 85;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);

    pdf.text('Invoice Date:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text(currentDate, 60, yPos);

    yPos += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Payment Date:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text(paymentDate, 60, yPos);

    yPos += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Order ID:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text(payment.orderId, 60, yPos);

    yPos += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Invoice ID:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text(payment.invoiceId, 60, yPos);

    // Company Info - Right Side
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...textColor);
    pdf.text('AlgoMarkers AI', 150, 85);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Trading Signals Platform', 150, 93);
    pdf.text('support@algomarkers.ai', 150, 101);

    // Payment Details Section
    yPos = 130;
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, yPos - 5, 180, 80, 'F');

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Payment Details', 20, yPos);

    yPos += 15;
    pdf.setFontSize(10);

    // Items
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text('Items:', 20, yPos);
    pdf.text(`${payment.pairs?.length} item${payment.pairs?.length !== 1 ? 's' : ''}`, 70, yPos);

    // Payment items details
    if (payment.paymentItems && payment.paymentItems?.length > 0) {
      payment.paymentItems.forEach((item, index) => {
        yPos += 8;
        pdf.text(`Item ${index + 1}:`, 20, yPos);
        pdf.text(`${item.period.replace('_', ' ')} - $${item.finalPrice}`, 70, yPos);
        if (item.discountRate > 0) {
          yPos += 6;
          pdf.setFontSize(8);
          pdf.text(`(Discount: ${item.discountRate}%)`, 70, yPos);
          pdf.setFontSize(10);
        }
      });
    }

    yPos += 8;
    pdf.text('Payment Network:', 20, yPos);
    pdf.text(payment.network.replace('_', ' '), 70, yPos);

    yPos += 8;
    pdf.text('Payment Status:', 20, yPos);

    // Status with color
    const statusColors: Record<Payment['status'], [number, number, number]> = {
      PAID: [6, 95, 70],
      PENDING: [146, 64, 14],
      UNDERPAID: [194, 65, 12],
      EXPIRED: [153, 27, 27],
      FAILED: [153, 27, 27],
    };

    const statusColor = statusColors[payment.status] || textColor;
    pdf.setTextColor(...statusColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(payment.status, 70, yPos);

    // Pairs Details Section
    if (payment.pairs && payment.pairs.length > 0) {
      yPos += 15;
      pdf.setFillColor(249, 250, 251);
      pdf.rect(15, yPos - 5, 180, 40 + (payment.pairs.length * 15), 'F');

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('Trading Pairs', 20, yPos);

      yPos += 15;
      pdf.setFontSize(10);

      payment.pairs.forEach((pair, index) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);

        yPos += 8;
        pdf.text(`Pair ${index + 1}:`, 20, yPos);
        pdf.text(`${pair.symbol}`, 70, yPos);

        yPos += 6;
        pdf.setFontSize(8);
        pdf.text(`Base Price: $${pair.basePrice}`, 25, yPos);
        pdf.text(`Final Price: $${pair.finalPrice}`, 85, yPos);

        if (pair.discountRate > 0) {
          yPos += 6;
          pdf.setTextColor(194, 65, 12); // Orange color for discount
          pdf.text(`Discount: ${pair.discountRate}%`, 25, yPos);
        }

        pdf.setTextColor(...textColor);
        pdf.setFontSize(10);
      });
    }

    // Amount details
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);

    if (payment.actuallyPaid && payment.actuallyPaid !== payment.totalAmount) {
      pdf.text('Amount Due:', 20, yPos);
      pdf.text(`$${payment.totalAmount}`, 70, yPos);

      yPos += 8;
      pdf.text('Amount Paid:', 20, yPos);
      pdf.text(`$${payment.actuallyPaid}`, 70, yPos);
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Amount:', 20, yPos);
      pdf.text(`$${payment.totalAmount}`, 70, yPos);
    }

    // Transaction hash if available
    if (payment.txHash) {
      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text('Transaction Hash:', 20, yPos);
      // Split long hash into multiple lines if needed
      const hashText = payment.txHash;
      if (hashText?.length > 30) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(hashText.substring(0, 30), 20, yPos + 6);
        pdf.text(hashText.substring(30), 20, yPos + 12);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.text(hashText, 70, yPos);
      }
    }

    // Footer
    yPos = 250;
    pdf.setDrawColor(...grayColor);
    pdf.line(20, yPos, 190, yPos);

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(...grayColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Thank you for your business!', 105, yPos, { align: 'center' });

    yPos += 8;
    pdf.text(`This invoice was generated on ${currentDate}`, 105, yPos, {
      align: 'center',
    });

    yPos += 8;
    pdf.text(
      'For any questions regarding this invoice, please contact support@algomarkers.ai',
      105,
      yPos,
      { align: 'center' }
    );

    return pdf;
  };

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

                  {/* Search Input */}
                  <div className="w-full sm:w-64">
                    <SearchInput placeholder="Search payments..." />
                  </div>

                  {/* Filter */}
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-full sm:w-40 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-xl">
                      <SelectItem value="all" className="text-white hover:bg-white/20 focus:bg-white/20">
                        All Payments
                      </SelectItem>
                      <SelectItem value="paid" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Paid
                      </SelectItem>
                      <SelectItem value="pending" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Pending
                      </SelectItem>
                      <SelectItem value="failed" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Failed
                      </SelectItem>
                      <SelectItem value="expired" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Expired
                      </SelectItem>
                      <SelectItem value="underpaid" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Underpaid
                      </SelectItem>
                      <SelectItem value="recent" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Recent (7 days)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <ReusableTable
                data={displayedPayments}
                columns={paymentColumns}
                title="Payment History"
                icon={Receipt}
                isLoading={loading}
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
                          {/* <p className="text-white/70">Order ID</p>
                          <p className="text-white font-mono">
                            {payment.orderId}
                          </p> */}
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

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => downloadInvoice(payment)}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                      </Button>
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
