'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/SearchInput';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  BarChart3,
  Target,
  DollarSign,
  Eye,
  Pencil,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Receipt,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Types based on Prisma schema
interface Payment {
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
    strategy?: string;
  };
}

interface PaymentFormData {
  userId: string;
  network: string;
  totalAmount: number;
  txHash?: string;
  invoiceId?: string;
  orderId?: string;
}

// Dummy Data for Development
const mockPayments: Payment[] = [
  {
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
          strategy: 'Momentum Trading'
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
          strategy: 'Scalping Strategy'
        }
      }
    ],
    subscription: {
      id: 'sub_001',
      period: 'QUARTERLY',
      status: 'ACTIVE'
    }
  },
  {
    id: 'pay_002',
    userId: 'user_002',
    network: 'USDT_BEP20',
    status: 'PENDING',
    invoiceId: 'INV-2024-002',
    createdAt: new Date('2024-09-20T14:20:00Z'),
    expiresAt: new Date('2024-09-21T14:20:00Z'),
    orderId: 'ORD-002',
    totalAmount: 499.99,
    updatedAt: new Date('2024-09-20T14:20:00Z'),
    user: {
      id: 'user_002',
      email: 'sarah.wilson@example.com',
      name: 'Sarah Wilson',
      image: 'https://avatar.vercel.sh/sarah'
    },
    paymentItems: [
      {
        id: 'item_003',
        paymentId: 'pay_002',
        pairId: 'pair_003',
        basePrice: 599.99,
        discountRate: 0.15,
        finalPrice: 509.99,
        period: 'SIX_MONTHS',
        createdAt: new Date('2024-09-20T14:20:00Z'),
        pair: {
          id: 'pair_003',
          symbol: 'BTCUSD',
          strategy: 'Trend Following'
        }
      }
    ]
  },
  {
    id: 'pay_003',
    userId: 'user_003',
    network: 'USDT_ERC20',
    status: 'FAILED',
    txHash: '0xfailed123456789abcdef1234567890abcdef1234567890abcdef1234567890',
    invoiceId: 'INV-2024-003',
    createdAt: new Date('2024-09-18T09:15:00Z'),
    actuallyPaid: 0,
    expiresAt: new Date('2024-09-19T09:15:00Z'),
    orderId: 'ORD-003',
    totalAmount: 99.99,
    updatedAt: new Date('2024-09-18T09:30:00Z'),
    user: {
      id: 'user_003',
      email: 'mike.johnson@example.com',
      name: 'Mike Johnson'
    },
    paymentItems: [
      {
        id: 'item_004',
        paymentId: 'pay_003',
        pairId: 'pair_004',
        basePrice: 99.99,
        discountRate: 0,
        finalPrice: 99.99,
        period: 'ONE_MONTH',
        createdAt: new Date('2024-09-18T09:15:00Z'),
        pair: {
          id: 'pair_004',
          symbol: 'AUDUSD',
          strategy: 'Range Trading'
        }
      }
    ]
  },
  {
    id: 'pay_004',
    userId: 'user_004',
    network: 'USDT_ERC20',
    status: 'UNDERPAID',
    txHash: '0xunderpaid789abcdef1234567890abcdef1234567890abcdef1234567890abc',
    invoiceId: 'INV-2024-004',
    createdAt: new Date('2024-09-25T16:45:00Z'),
    actuallyPaid: 245.50,
    expiresAt: new Date('2024-09-26T16:45:00Z'),
    orderId: 'ORD-004',
    totalAmount: 299.99,
    updatedAt: new Date('2024-09-25T17:00:00Z'),
    user: {
      id: 'user_004',
      email: 'emily.davis@example.com',
      name: 'Emily Davis',
      image: 'https://avatar.vercel.sh/emily'
    },
    paymentItems: [
      {
        id: 'item_005',
        paymentId: 'pay_004',
        pairId: 'pair_005',
        basePrice: 299.99,
        discountRate: 0,
        finalPrice: 299.99,
        period: 'THREE_MONTHS',
        createdAt: new Date('2024-09-25T16:45:00Z'),
        pair: {
          id: 'pair_005',
          symbol: 'USDJPY',
          strategy: 'Breakout Strategy'
        }
      }
    ],
    subscription: {
      id: 'sub_002',
      period: 'QUARTERLY',
      status: 'PENDING_PAYMENT'
    }
  },
  {
    id: 'pay_005',
    userId: 'user_005',
    network: 'USDT_BEP20',
    status: 'EXPIRED',
    invoiceId: 'INV-2024-005',
    createdAt: new Date('2024-09-10T12:00:00Z'),
    expiresAt: new Date('2024-09-11T12:00:00Z'),
    orderId: 'ORD-005',
    totalAmount: 799.99,
    updatedAt: new Date('2024-09-11T12:30:00Z'),
    user: {
      id: 'user_005',
      email: 'alex.brown@example.com',
      name: 'Alex Brown'
    },
    paymentItems: [
      {
        id: 'item_006',
        paymentId: 'pay_005',
        pairId: 'pair_006',
        basePrice: 999.99,
        discountRate: 0.20,
        finalPrice: 799.99,
        period: 'TWELVE_MONTHS',
        createdAt: new Date('2024-09-10T12:00:00Z'),
        pair: {
          id: 'pair_006',
          symbol: 'EURGBP',
          strategy: 'Arbitrage Strategy'
        }
      }
    ]
  },
  {
    id: 'pay_006',
    userId: 'user_001',
    network: 'USDT_ERC20',
    status: 'PAID',
    txHash: '0xsecond123456789abcdef1234567890abcdef1234567890abcdef1234567890',
    invoiceId: 'INV-2024-006',
    createdAt: new Date('2024-10-01T08:30:00Z'),
    actuallyPaid: 149.99,
    expiresAt: new Date('2024-10-02T08:30:00Z'),
    orderId: 'ORD-006',
    totalAmount: 149.99,
    updatedAt: new Date('2024-10-01T09:15:00Z'),
    user: {
      id: 'user_001',
      email: 'john.doe@example.com',
      name: 'John Doe',
      image: 'https://avatar.vercel.sh/john'
    },
    paymentItems: [
      {
        id: 'item_007',
        paymentId: 'pay_006',
        pairId: 'pair_007',
        basePrice: 149.99,
        discountRate: 0,
        finalPrice: 149.99,
        period: 'ONE_MONTH',
        createdAt: new Date('2024-10-01T08:30:00Z'),
        pair: {
          id: 'pair_007',
          symbol: 'NZDUSD',
          strategy: 'Grid Trading'
        }
      }
    ],
    subscription: {
      id: 'sub_003',
      period: 'MONTHLY',
      status: 'ACTIVE'
    }
  },
  {
    id: 'pay_007',
    userId: 'user_006',
    network: 'USDT_BEP20',
    status: 'PENDING',
    invoiceId: 'INV-2024-007',
    createdAt: new Date('2024-10-05T13:20:00Z'),
    expiresAt: new Date('2024-10-06T13:20:00Z'),
    orderId: 'ORD-007',
    totalAmount: 399.99,
    updatedAt: new Date('2024-10-05T13:20:00Z'),
    user: {
      id: 'user_006',
      email: 'lisa.taylor@example.com',
      name: 'Lisa Taylor',
      image: 'https://avatar.vercel.sh/lisa'
    },
    paymentItems: [
      {
        id: 'item_008',
        paymentId: 'pay_007',
        pairId: 'pair_008',
        basePrice: 399.99,
        discountRate: 0,
        finalPrice: 399.99,
        period: 'SIX_MONTHS',
        createdAt: new Date('2024-10-05T13:20:00Z'),
        pair: {
          id: 'pair_008',
          symbol: 'USDCAD',
          strategy: 'Mean Reversion'
        }
      }
    ]
  },
  {
    id: 'pay_008',
    userId: 'user_007',
    network: 'USDT_ERC20',
    status: 'PAID',
    txHash: '0xthird987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    invoiceId: 'INV-2024-008',
    createdAt: new Date('2024-09-28T11:10:00Z'),
    actuallyPaid: 1199.99,
    expiresAt: new Date('2024-09-29T11:10:00Z'),
    orderId: 'ORD-008',
    totalAmount: 1199.99,
    updatedAt: new Date('2024-09-28T12:05:00Z'),
    user: {
      id: 'user_007',
      email: 'david.martinez@example.com',
      name: 'David Martinez'
    },
    paymentItems: [
      {
        id: 'item_009',
        paymentId: 'pay_008',
        pairId: 'pair_009',
        basePrice: 1499.99,
        discountRate: 0.20,
        finalPrice: 1199.99,
        period: 'TWELVE_MONTHS',
        createdAt: new Date('2024-09-28T11:10:00Z'),
        pair: {
          id: 'pair_009',
          symbol: 'XAUUSD',
          strategy: 'Gold Trading Bot'
        }
      }
    ],
    subscription: {
      id: 'sub_004',
      period: 'YEARLY',
      status: 'ACTIVE'
    }
  }
];

// Action buttons component
function ActionButtons({
  row,
  onView,
  onUpdate,
  onDelete,
}: {
  row: Payment;
  onView: (row: Payment) => void;
  onUpdate: (row: Payment) => void;
  onDelete: (row: Payment) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Button
        className="hover:text-white text-white/70"
        variant={'ghost'}
        size="icon"
        onClick={() => onView(row)}
        title="View Details"
      >
        <Eye size={16} />
      </Button>
      <Button
        className="hover:text-white text-white/70"
        variant={'ghost'}
        size="icon"
        onClick={() => onUpdate(row)}
        title="Update Payment"
      >
        <Pencil size={16} />
      </Button>
      {row.txHash && (
        <Button
          className="hover:text-blue-400 text-blue-500"
          variant={'ghost'}
          size="icon"
          onClick={() => window.open(`https://etherscan.io/tx/${row.txHash}`, '_blank')}
          title="View Transaction"
        >
          <ExternalLink size={16} />
        </Button>
      )}
    </div>
  );
}

// Payment form component
function PaymentForm({
  payment,
  onSubmit,
  onCancel,
  isLoading,
}: {
  payment?: Payment;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<PaymentFormData>({
    userId: payment?.userId || '',
    network: payment?.network || 'USDT',
    totalAmount: payment?.totalAmount || 0,
    txHash: payment?.txHash || '',
    invoiceId: payment?.invoiceId || '',
    orderId: payment?.orderId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="userId" className="text-white/90">User ID *</Label>
          <Input
            id="userId"
            type="text"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            required
            className="bg-white/10 border-white/20 text-white"
            placeholder="User UUID"
          />
        </div>

        <div>
          <Label htmlFor="network" className="text-white/90">Payment Network *</Label>
          <Select value={formData.network} onValueChange={(value) => setFormData({ ...formData, network: value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="BTC">Bitcoin</SelectItem>
              <SelectItem value="ETH">Ethereum</SelectItem>
              <SelectItem value="USDT_TRC20">USDT (TRC20)</SelectItem>
              <SelectItem value="USDT_ERC20">USDT (ERC20)</SelectItem>
              <SelectItem value="USDT_BEP20">USDT (BEP20)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="totalAmount" className="text-white/90">Total Amount *</Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
            required
            className="bg-white/10 border-white/20 text-white"
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="txHash" className="text-white/90">Transaction Hash</Label>
          <Input
            id="txHash"
            type="text"
            value={formData.txHash}
            onChange={(e) => setFormData({ ...formData, txHash: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="0x..."
          />
        </div>

        <div>
          <Label htmlFor="invoiceId" className="text-white/90">Invoice ID</Label>
          <Input
            id="invoiceId"
            type="text"
            value={formData.invoiceId}
            onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="Invoice identifier"
          />
        </div>

        <div>
          <Label htmlFor="orderId" className="text-white/90">Order ID</Label>
          <Input
            id="orderId"
            type="text"
            value={formData.orderId}
            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="Order identifier"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white"
        >
          {isLoading ? 'Saving...' : payment ? 'Update Payment' : 'Create Payment'}
        </Button>
      </div>
    </form>
  );
}

const BillingPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const consoleId = params.id as string;

  // Fetch all payments (using dummy data for development)
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use dummy data instead of API call
      console.log('Loading dummy payments data:', mockPayments);
      setPayments(mockPayments);
      
      toast.success('Payments loaded successfully', {
        style: { background: '#10b981', color: 'white' },
      });
      
      /* 
      // Original API call - uncomment when ready to use real API
      const response = await fetch('/api/payments');
      const data = await response.json();
      
      if (response.ok && data.payments) {
        console.log('Fetched payments:', data.payments);
        setPayments(data.payments);
      } else {
        // Handle different error types
        if (response.status === 403) {
          toast.error(data.error || 'You do not have permission to view payments. Contact an administrator.', {
            style: { background: '#ef4444', color: 'white' },
            duration: 5000,
          });
        } else if (response.status === 401) {
          toast.error('Please log in to access this page', {
            style: { background: '#ef4444', color: 'white' },
          });
        } else {
          toast.error(data.message || 'Failed to fetch payments', {
            style: { background: '#ef4444', color: 'white' },
          });
        }
        console.error('API Error:', data);
      }
      */
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error loading payments', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments based on selected filter and search query
  const getFilteredPayments = () => {
    let filtered = payments;

    // Apply category filter first
    switch (filterBy) {
      case 'paid':
        filtered = payments.filter((payment) => payment.status === 'PAID');
        break;
      case 'pending':
        filtered = payments.filter((payment) => payment.status === 'PENDING');
        break;
      case 'failed':
        filtered = payments.filter((payment) => payment.status === 'FAILED');
        break;
      case 'expired':
        filtered = payments.filter((payment) => payment.status === 'EXPIRED');
        break;
      case 'underpaid':
        filtered = payments.filter((payment) => payment.status === 'UNDERPAID');
        break;
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = payments.filter((payment) => new Date(payment.createdAt) >= sevenDaysAgo);
        break;
      default:
        filtered = payments;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((payment) => 
        payment.user.email.toLowerCase().includes(query) ||
        (payment.user.name && payment.user.name.toLowerCase().includes(query)) ||
        payment.network.toLowerCase().includes(query) ||
        payment.status.toLowerCase().includes(query) ||
        (payment.txHash && payment.txHash.toLowerCase().includes(query)) ||
        (payment.orderId && payment.orderId.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  // CRUD Operations
  const handleCreatePayment = () => {
    setEditingPayment(null);
    setIsSheetOpen(true);
  };

  const handleUpdatePayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsSheetOpen(true);
  };

  const handleViewPayment = (payment: Payment) => {
    // Navigate to payment details page
    router.push(`/console/${consoleId}/billing/${payment.id}`);
  };

  const handleFormSubmit = async (formData: PaymentFormData) => {
    setIsFormLoading(true);

    try {
      const isUpdate = !!editingPayment;
      const url = isUpdate ? `/api/payments/${editingPayment.id}` : '/api/payments';
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Payment ${isUpdate ? 'updated' : 'created'} successfully!`, {
          style: { background: '#22c55e', color: 'white' },
        });
        setIsSheetOpen(false);
        setEditingPayment(null);
        fetchPayments();
      } else {
        toast.error(result.message || `Failed to ${isUpdate ? 'update' : 'create'} payment`, {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error(`Error ${editingPayment ? 'updating' : 'creating'} payment`, {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingPayment(null);
  };

  // Calculate stats
  const stats = {
    totalPayments: payments.length,
    paidPayments: payments.filter(p => p.status === 'PAID').length,
    totalRevenue: payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.totalAmount, 0),
    pendingPayments: payments.filter(p => p.status === 'PENDING').length,
  };

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

  // Define columns
  const columns: Column<Payment>[] = [
    {
      key: 'user',
      header: 'Customer',
      sortable: true,
      render: (_, payment: Payment) => (
        <div className="flex items-center gap-3">
          {payment.user.image ? (
            <img
              src={payment.user.image}
              alt={payment.user.name || payment.user.email}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {(payment.user.name || payment.user.email).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-white">{payment.user.name || 'Unnamed User'}</p>
            <p className="text-sm text-gray-400">{payment.user.email}</p>
          </div>
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
      header: 'Items',
      align: 'center',
      render: (items: PaymentItem[]) => (
        <div className="text-center">
          <div className="text-white/80 text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''}
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
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_, payment: Payment) => (
        <ActionButtons
          row={payment}
          onView={handleViewPayment}
          onUpdate={handleUpdatePayment}
          onDelete={() => {}} // TODO: Implement delete if needed
        />
      ),
    },
  ];

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Billing Stats */}
        <div className="mb-4">
          <OverviewSection
            overviewData={[
              {
                title: 'Total Payments',
                currentValue: stats.totalPayments,
                icon: BarChart3,
                description: 'All payment records',
                pastValue: '+2 new payments this month',
              },
              {
                title: 'Paid Payments',
                currentValue: stats.paidPayments,
                icon: Target,
                description: `${stats.totalPayments > 0 ? ((stats.paidPayments / stats.totalPayments) * 100).toFixed(1) : '0'}% success rate`,
                pastValue: `${stats.paidPayments} out of ${stats.totalPayments} payments`,
              },
              {
                title: 'Total Revenue',
                currentValue: `$${stats.totalRevenue.toLocaleString()}`,
                icon: DollarSign,
                description: 'Combined revenue',
                pastValue: '+15.2% this quarter',
              },
              {
                title: 'Pending Payments',
                currentValue: stats.pendingPayments,
                icon: Clock,
                description: 'Awaiting processing',
                pastValue: 'Pending payments',
              },
            ]}
            className="mb-0 opacity-95"
          />
        </div>

        <div className="flex flex-col justify-end mb-12">
          {/* Main Payments Table */}
          <div className="flex-1 min-h-0 space-y-4">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                  <span className="ml-3 text-white/80">Loading payments...</span>
                </div>
              }
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  {/* Results Count */}
                  <div className="text-sm text-white/80 font-medium">
                    {filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'} found
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

                <Button
                  onClick={handleCreatePayment}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-2 rounded-xl shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Payment
                </Button>
              </div>

              <ReusableTable
                data={filteredPayments}
                columns={columns}
                title="Payment Management"
                icon={CreditCard}
                isLoading={loading}
                searchable={true}
                searchFields={['user.email', 'user.name', 'network', 'status']}
                emptyStateTitle="No payments found"
                emptyStateDescription="No payments found matching your criteria"
                enableRowDetails={true}
                rowDetailTitle={(payment) => `Payment ${payment.id.slice(0, 8)} - ${payment.user.email}`}
                excludeFromDetails={['id', 'userId']}
                rowDetailContent={(payment) => (
                  <div className="space-y-6">
                    {/* Payment Details */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Payment Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Payment ID</p>
                          <p className="text-white font-mono text-xs">{payment.id}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Total Amount</p>
                          <p className="text-white font-semibold">{formatCurrency(payment.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Actually Paid</p>
                          <p className="text-white">{payment.actuallyPaid ? formatCurrency(payment.actuallyPaid) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Network</p>
                          <div>{getNetworkBadge(payment.network)}</div>
                        </div>
                        <div>
                          <p className="text-white/70">Status</p>
                          <div>{getStatusBadge(payment.status)}</div>
                        </div>
                        <div>
                          <p className="text-white/70">Created</p>
                          <p className="text-white">{new Date(payment.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Info */}
                    {(payment.txHash || payment.invoiceId || payment.orderId) && (
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Wallet className="h-5 w-5" />
                          Transaction Info
                        </h3>
                        <div className="space-y-3">
                          {payment.txHash && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">Transaction Hash:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                                onClick={() => window.open(`https://etherscan.io/tx/${payment.txHash}`, '_blank')}
                              >
                                <span className="font-mono text-xs">
                                  {payment.txHash.slice(0, 10)}...{payment.txHash.slice(-6)}
                                </span>
                                <ExternalLink size={12} className="ml-1" />
                              </Button>
                            </div>
                          )}
                          {payment.invoiceId && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">Invoice ID:</span>
                              <span className="text-white font-mono text-sm">{payment.invoiceId}</span>
                            </div>
                          )}
                          {payment.orderId && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">Order ID:</span>
                              <span className="text-white font-mono text-sm">{payment.orderId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Items */}
                    {payment.paymentItems && payment.paymentItems.length > 0 && (
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Payment Items ({payment.paymentItems.length})
                        </h3>
                        <div className="space-y-3">
                          {payment.paymentItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{item.pair.symbol}</p>
                                <p className="text-white/70 text-sm">{item.period.replace('_', ' ')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-semibold">{formatCurrency(item.finalPrice)}</p>
                                {item.discountRate > 0 && (
                                  <p className="text-green-400 text-sm">
                                    -{(item.discountRate * 100).toFixed(1)}%
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleUpdatePayment(payment)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Payment
                      </Button>
                      {payment.txHash && (
                        <Button
                          onClick={() => window.open(`https://etherscan.io/tx/${payment.txHash}`, '_blank')}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Transaction
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Payment Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full md:w-[32rem] max-w-none bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl p-6">
          <SheetHeader className="px-2 mb-6">
            <SheetTitle className="text-white text-lg">
              {editingPayment ? 'Edit Payment' : 'Create New Payment'}
            </SheetTitle>
            <SheetDescription className="text-white/70">
              {editingPayment 
                ? 'Update payment information and status'
                : 'Add a new payment to the system'
              }
            </SheetDescription>
          </SheetHeader>
          <div className="px-2">
            <PaymentForm
              payment={editingPayment || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleSheetClose}
              isLoading={isFormLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Detail Modal */}
      <Dialog open={!!viewingPayment} onOpenChange={() => setViewingPayment(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Payment Details</DialogTitle>
          </DialogHeader>
          {viewingPayment && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Payment overview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-white/10 rounded-lg">
                <div>
                  <p className="text-white/70 text-sm">Customer</p>
                  <p className="text-white font-medium">{viewingPayment.user.name || viewingPayment.user.email}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Amount</p>
                  <p className="text-white font-semibold">{formatCurrency(viewingPayment.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Network</p>
                  <div>{getNetworkBadge(viewingPayment.network)}</div>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Status</p>
                  <div>{getStatusBadge(viewingPayment.status)}</div>
                </div>
              </div>

              {/* Transaction details */}
              {viewingPayment.txHash && (
                <div className="p-4 bg-white/10 rounded-lg">
                  <p className="text-white/70 text-sm mb-2">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">{viewingPayment.txHash}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`https://etherscan.io/tx/${viewingPayment.txHash}`, '_blank')}
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment items */}
              {viewingPayment.paymentItems && viewingPayment.paymentItems.length > 0 && (
                <div className="p-4 bg-white/10 rounded-lg">
                  <p className="text-white font-medium mb-3">Items ({viewingPayment.paymentItems.length})</p>
                  <div className="space-y-2">
                    {viewingPayment.paymentItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-white">{item.pair.symbol} - {item.period}</span>
                        <span className="text-white font-medium">{formatCurrency(item.finalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GradientBackground>
  );
};

export default BillingPage;
