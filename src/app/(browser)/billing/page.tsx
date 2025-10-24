import { Suspense } from 'react';
import { GradientBackground } from '@/components/ui/gradient-background';
import BillingContent from './BillingContent';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserBillingData } from '@/app/api/services';

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

async function getBillingData(): Promise<{ payments: Payment[]; stats: BillingStats }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { payments: [], stats: { totalSpent: 0, totalPayments: 0, activeSubscriptions: 0, pendingPayments: 0 } };
    }

    // For now, we'll fetch all payments and handle filtering client-side
    // In a production app, you'd want to implement server-side filtering
    const paymentsString = await getUserBillingData();
    const rawPayments = JSON.parse(paymentsString) as Payment[];

    // Ensure all data is properly serialized for client components
    const payments: Payment[] = rawPayments.map(payment => ({
      ...payment,
      totalAmount: Number(payment.totalAmount),
      actuallyPaid: payment.actuallyPaid ? Number(payment.actuallyPaid) : undefined,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt || undefined,
      updatedAt: payment.updatedAt,
      paymentItems: payment.paymentItems?.map(item => ({
        ...item,
        basePrice: Number(item.basePrice),
        discountRate: Number(item.discountRate),
        finalPrice: Number(item.finalPrice),
      })) || [],
      pairs: payment.pairs?.map(pair => ({
        ...pair,
        basePrice: Number(pair.basePrice),
        discountRate: Number(pair.discountRate),
        finalPrice: Number(pair.finalPrice),
      })) || [],
    }));

    const stats = {
      totalSpent: payments.reduce((sum, payment) => sum + Number(payment.totalAmount), 0),
      totalPayments: payments.length,
      activeSubscriptions: payments.filter((payment) => payment.status === 'PAID').length,
      pendingPayments: payments.filter((payment) => payment.status === 'PENDING').length,
    };

    return { payments, stats };
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return { payments: [], stats: { totalSpent: 0, totalPayments: 0, activeSubscriptions: 0, pendingPayments: 0 } };
  }
}

export default async function BillingPage() {
  const { payments, stats } = await getBillingData();

  return (
    <Suspense
      fallback={
        <GradientBackground>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-3 text-white/80">Loading billing...</span>
          </div>
        </GradientBackground>
      }
    >
      <BillingContent
        initialPayments={payments}
        initialStats={stats}
      />
    </Suspense>
  );
}

export const metadata = {
  title: 'Billing – AlgoMakers',
  description: 'View your payment history, invoices and subscriptions on AlgoMakers.',
  keywords: ['billing', 'payments', 'invoices', 'subscriptions', 'crypto payments', 'trading subscriptions', 'payment history', 'AlgoMakers'],
  openGraph: {
    title: 'Billing – AlgoMakers',
    description: 'View your payment history, invoices and subscriptions on AlgoMakers.',
    url: `${process.env.NEXTAUTH_URL || ''}/billing`,
    siteName: 'AlgoMakers',
    type: 'website',
  },
  robots: {
    // billing is a user account page — avoid indexing user-specific pages
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${process.env.NEXTAUTH_URL || ''}/billing`,
  },
};
