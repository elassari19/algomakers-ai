'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { SortFilterBar } from '@/components/subscription/SortFilterBar';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import jsPDF from 'jspdf';

// Payment interface
interface Payment {
  id: string;
  orderId: string;
  invoiceId: string;
  pairName: string;
  amount: number;
  actuallyPaid?: number;
  network: string;
  status: 'PENDING' | 'PAID' | 'UNDERPAID' | 'EXPIRED' | 'FAILED';
  txHash?: string;
  createdAt: Date;
  expiresAt?: Date;
  subscription?: {
    id: string;
    period: string;
    startDate: Date;
    expiryDate: Date;
    status: string;
  };
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

  // Mock data for demonstration
  const mockPayments: Payment[] = [
    {
      id: '1',
      orderId: 'ORD-2024-001',
      invoiceId: 'INV-001',
      pairName: 'BTC/USDT',
      amount: 99.99,
      actuallyPaid: 99.99,
      network: 'USDT_TRC20',
      status: 'PAID',
      txHash: '0x1234567890abcdef1234567890abcdef12345678',
      createdAt: new Date('2024-01-15'),
      subscription: {
        id: 'sub-1',
        period: 'ONE_MONTH',
        startDate: new Date('2024-01-15'),
        expiryDate: new Date('2024-02-15'),
        status: 'EXPIRED',
      },
    },
    {
      id: '2',
      orderId: 'ORD-2024-002',
      invoiceId: 'INV-002',
      pairName: 'ETH/USDT',
      amount: 199.99,
      actuallyPaid: 199.99,
      network: 'USDT_ERC20',
      status: 'PAID',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
      createdAt: new Date('2024-02-20'),
      subscription: {
        id: 'sub-2',
        period: 'THREE_MONTHS',
        startDate: new Date('2024-02-20'),
        expiryDate: new Date('2024-05-20'),
        status: 'ACTIVE',
      },
    },
    {
      id: '3',
      orderId: 'ORD-2024-003',
      invoiceId: 'INV-003',
      pairName: 'SOL/USDT',
      amount: 149.99,
      network: 'USDT_TRC20',
      status: 'PENDING',
      createdAt: new Date('2024-03-10'),
      expiresAt: new Date('2024-03-11'),
    },
    {
      id: '4',
      orderId: 'ORD-2024-004',
      invoiceId: 'INV-004',
      pairName: 'ADA/USDT',
      amount: 79.99,
      actuallyPaid: 75.5,
      network: 'USDT_BEP20',
      status: 'UNDERPAID',
      createdAt: new Date('2024-03-05'),
    },
    {
      id: '5',
      orderId: 'ORD-2024-003',
      invoiceId: 'INV-003',
      pairName: 'SOL/USDT',
      amount: 149.99,
      network: 'USDT_TRC20',
      status: 'PENDING',
      createdAt: new Date('2024-03-10'),
      expiresAt: new Date('2024-03-11'),
    },
    {
      id: '6',
      orderId: 'ORD-2024-004',
      invoiceId: 'INV-004',
      pairName: 'ADA/USDT',
      amount: 79.99,
      actuallyPaid: 75.5,
      network: 'USDT_BEP20',
      status: 'UNDERPAID',
      createdAt: new Date('2024-03-05'),
    },
  ];

  useEffect(() => {
    // Simulate loading and set mock data
    setLoading(true);
    setTimeout(() => {
      setPayments(mockPayments);

      // Calculate stats
      const totalSpent = mockPayments
        .filter((p) => p.status === 'PAID')
        .reduce((sum, p) => sum + (p.actuallyPaid || p.amount), 0);

      setStats({
        totalSpent,
        totalPayments: mockPayments.length,
        activeSubscriptions: mockPayments.filter(
          (p) => p.subscription?.status === 'ACTIVE'
        ).length,
        pendingPayments: mockPayments.filter((p) => p.status === 'PENDING')
          .length,
      });

      setLoading(false);
    }, 10);
  }, []);

  // Filter payments based on selected filter
  const getFilteredPayments = () => {
    let filtered = payments;

    switch (filterBy) {
      case 'paid':
        filtered = payments.filter((payment) => payment.status === 'PAID');
        break;
      case 'pending':
        filtered = payments.filter((payment) => payment.status === 'PENDING');
        break;
      case 'failed':
        filtered = payments.filter(
          (payment) =>
            payment.status === 'FAILED' || payment.status === 'EXPIRED'
        );
        break;
      case 'underpaid':
        filtered = payments.filter((payment) => payment.status === 'UNDERPAID');
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = payments.filter(
          (payment) => payment.createdAt >= thirtyDaysAgo
        );
        break;
      case 'high-value':
        filtered = payments.filter((payment) => payment.amount >= 100);
        break;
      default:
        filtered = payments;
    }

    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  // Column definitions for the ReusableTable
  const paymentColumns: Column<Payment>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      width: 'w-32',
      render: (value: Date) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-300">
            {value.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'orderId',
      header: 'Order ID',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm text-gray-300">{value}</span>
      ),
    },
    {
      key: 'pairName',
      header: 'Symbol',
      sortable: true,
      render: (value: string, row: Payment) => (
        <div>
          <p className="font-medium text-gray-300">{value}</p>
          {row.subscription && (
            <p className="text-sm text-gray-400">
              {row.subscription.period.replace('_', ' ').toLowerCase()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      render: (value: number, row: Payment) => (
        <div>
          <p className="font-medium text-gray-300">${value}</p>
          {row.actuallyPaid && row.actuallyPaid !== value && (
            <p className="text-sm text-orange-400">Paid: ${row.actuallyPaid}</p>
          )}
        </div>
      ),
    },
    {
      key: 'network',
      header: 'Network',
      sortable: true,
      align: 'center',
      render: (value: string) => (
        <Badge variant="outline" className="text-gray-300 border-gray-500">
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (value: Payment['status']) => {
        const variants = {
          PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          PENDING:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          UNDERPAID:
            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return <Badge className={variants[value]}>{value}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 'w-20',
      render: (_, row: Payment) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-gray-300 border-gray-500 hover:bg-gray-700"
            onClick={() => downloadInvoice(row)}
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

      console.log(
        'Invoice PDF downloaded successfully for payment:',
        payment.id
      );
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
    }
  };

  const generateInvoicePDF = (payment: Payment): jsPDF => {
    const currentDate = new Date().toLocaleDateString();
    const paymentDate = payment.createdAt.toLocaleDateString();

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

    // Strategy
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text('Strategy:', 20, yPos);
    pdf.text(payment.pairName, 70, yPos);

    // Subscription details if available
    if (payment.subscription) {
      yPos += 8;
      pdf.text('Subscription Period:', 20, yPos);
      pdf.text(payment.subscription.period.replace('_', ' '), 70, yPos);

      yPos += 8;
      pdf.text('Service Period:', 20, yPos);
      const servicePeriod = `${payment.subscription.startDate.toLocaleDateString()} - ${payment.subscription.expiryDate.toLocaleDateString()}`;
      pdf.text(servicePeriod, 70, yPos);
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

    // Amount details
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);

    if (payment.actuallyPaid && payment.actuallyPaid !== payment.amount) {
      pdf.text('Amount Due:', 20, yPos);
      pdf.text(`$${payment.amount.toFixed(2)}`, 70, yPos);

      yPos += 8;
      pdf.text('Amount Paid:', 20, yPos);
      pdf.text(`$${payment.actuallyPaid.toFixed(2)}`, 70, yPos);
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Amount:', 20, yPos);
      pdf.text(`$${payment.amount.toFixed(2)}`, 70, yPos);
    }

    // Transaction hash if available
    if (payment.txHash) {
      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text('Transaction Hash:', 20, yPos);
      // Split long hash into multiple lines if needed
      const hashText = payment.txHash;
      if (hashText.length > 30) {
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
      <div className="flex flex-1 flex-col gap-6 md:p-6 pt-0">
        {/* Header */}
        {/* <div className="">
          <h1 className="text-3xl font-bold text-white mb-2">
            Billing & Invoices
          </h1>
          <p className="text-white/70">
            Manage your payment history and download invoices.
          </p>
        </div> */}

        {/* Billing Overview Stats */}
        <OverviewSection
          overviewData={[
            {
              title: 'Total Spent',
              currentValue: `$${stats.totalSpent.toFixed(2)}`,
              icon: DollarSign,
              description: 'Total amount spent',
              pastValue: 'All-time spending',
              color: 'text-green-300',
              bgColor: 'bg-green-400/20',
            },
            {
              title: 'Total Payments',
              currentValue: stats.totalPayments,
              icon: CreditCard,
              description: 'Payment transactions',
              pastValue: 'Including all statuses',
              color: 'text-blue-300',
              bgColor: 'bg-blue-400/20',
            },
            {
              title: 'Active Subscriptions',
              currentValue: stats.activeSubscriptions,
              icon: Users,
              description: 'Currently active',
              pastValue: 'Subscription services',
              color: 'text-emerald-300',
              bgColor: 'bg-emerald-400/20',
            },
            {
              title: 'Pending Payments',
              currentValue: stats.pendingPayments,
              icon: Clock,
              description: 'Awaiting payment',
              pastValue: 'Requires attention',
              color: 'text-yellow-300',
              bgColor: 'bg-yellow-400/20',
            },
          ]}
        />

        {/* Filter Bar */}
        <div className="">
          <SortFilterBar
            filterBy={filterBy}
            onFilterChange={setFilterBy}
            totalResults={filteredPayments.length}
          />
        </div>

        {/* Main Billing Table */}
        <div className="space-y-6">
          <ReusableTable
            data={filteredPayments}
            columns={paymentColumns}
            title="Payment History"
            icon={Receipt}
            isLoading={loading}
            searchable={true}
            searchFields={['orderId', 'pairName', 'invoiceId']}
            emptyStateTitle="No payments found"
            emptyStateDescription="No payments found matching your criteria"
          />
        </div>
      </div>
    </GradientBackground>
  );
}
