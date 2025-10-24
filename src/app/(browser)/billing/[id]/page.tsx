import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPaymentDetails } from '@/app/api/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { GradientBackground } from '@/components/ui/gradient-background';

interface PaymentData {
  id: string;
  userId: string;
  network: string;
  status: string;
  txHash: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  createdAt: string;
  actuallyPaid: any; // Decimal
  expiresAt: string | null;
  orderData: any;
  orderId: string | null;
  totalAmount: any; // Decimal
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    tradingviewUsername: string;
    image: string | null;
    status: string;
  };
  paymentItems: Array<{
    id: string;
    pairId: string;
    basePrice: any; // Decimal
    discountRate: any; // Decimal
    finalPrice: any; // Decimal
    period: string;
    createdAt: string;
    pair: {
      id: string;
      symbol: string;
      version: string | null;
      timeframe: string;
    };
  }>;
  subscription: Array<{
    id: string;
    userId: string;
    pairId: string;
    period: string;
    startDate: string;
    expiryDate: string;
    status: string;
    paymentId: string | null;
    inviteStatus: string;
    basePrice: any | null; // Decimal
    discountRate: any | null; // Decimal
    createdAt: string;
    updatedAt: string;
  }>;
}

interface PaymentDetails {
  payment: PaymentData;
  metrics: {
    itemsCount: number;
    totalBasePrice: number;
    totalDiscount: number;
    averageDiscountRate: number;
  };
}

async function fetchPaymentDetails(id: string): Promise<PaymentDetails | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return null;
    }

    // Check if user has permission to view this payment
    // For non-admin users, only allow access to their own payments
    const paymentString = await getPaymentDetails(id);
    const payment = JSON.parse(paymentString) as PaymentData;

    if (!['ADMIN', 'MANAGER', 'SUPPORT'].includes(session.user.role) && payment.userId !== session.user.id) {
      return null;
    }

    // Calculate metrics
    const paymentMetrics = {
      itemsCount: payment.paymentItems.length,
      totalBasePrice: payment.paymentItems.reduce((sum, item) => sum + Number(item.basePrice), 0),
      totalDiscount: payment.paymentItems.reduce((sum, item) =>
        sum + (Number(item.basePrice) - Number(item.finalPrice)), 0
      ),
      averageDiscountRate: payment.paymentItems.length > 0
        ? payment.paymentItems.reduce((sum, item) => sum + Number(item.discountRate), 0) / payment.paymentItems.length
        : 0,
    };

    return {
      payment,
      metrics: paymentMetrics,
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'secondary';
    case 'expired':
    case 'failed':
      return 'destructive';
    case 'underpaid':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getSubscriptionStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'default';
    case 'paid':
      return 'secondary';
    case 'trial':
      return 'outline';
    case 'expired':
    case 'cancelled':
    case 'failed':
      return 'destructive';
    case 'pending':
    case 'invited':
    case 'renewing':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export default async function PaymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paymentData = await fetchPaymentDetails(id);

  if (!paymentData) {
    notFound();
  }

  const { payment, metrics } = paymentData;

  return (
    <GradientBackground className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
        <p className="text-muted-foreground mt-2">
          Payment ID: {payment.id}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Payment Overview */}
        <Card className="md:col-span-2 bg-black/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
            <CardDescription>
              Created on {format(new Date(payment.createdAt), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Network</label>
                <div className="mt-1">
                  <Badge variant="outline">{payment.network}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                <div className="mt-1 text-lg font-semibold">
                  {payment.paymentItems && payment.paymentItems.length > 0
                    ? formatCurrency(payment.paymentItems.reduce((sum, item) => sum + Number(item.basePrice), 0))
                    : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Actually Paid</label>
                <div className="mt-1 text-lg text-green-400">
                  {payment.paymentItems && payment.paymentItems.length > 0
                    ? formatCurrency(payment.paymentItems.reduce((sum, item) => sum + Number(item.finalPrice), 0))
                    : 'N/A'}
                </div>
              </div>

              {payment.txHash && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                  <div className="mt-1 font-mono text-sm break-all">
                    {payment.txHash}
                  </div>
                </div>
              )}

              {payment.invoiceId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice ID</label>
                  <div className="mt-1 font-mono text-sm">
                    {payment.invoiceId}
                  </div>
                </div>
              )}

              {payment.createdAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expires At</label>
                  <div className="mt-1">
                    {format(new Date(payment.createdAt), 'PPP p')}
                  </div>
                </div>
              )}
              {payment.expiresAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expires At</label>
                  <div className="mt-1">
                    {format(new Date(payment.expiresAt), 'PPP p')}
                  </div>
                </div>
              )}
            </div>


          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="bg-black/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className="self-end">
              <Badge variant={payment.user.status === 'ACTIVE' ? 'success' : 'destructive'}>{payment.user.status}</Badge>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <Avatar>
                <AvatarImage src={payment.user.image!} alt="User Avatar" />
                <AvatarFallback>
                  {payment.user.name?.charAt(0) || payment.user.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{payment.user.name || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Customer Email</label>
              <div className="mt-1 font-mono text-sm">
                {payment.user.email}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">TradingView Username</label>
              <div className="mt-1 font-mono text-sm">
                {payment.user.tradingviewUsername}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Items */}
      <Card className="mt-6 bg-black/30 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Payment Items ({metrics.itemsCount})</CardTitle>
          <CardDescription>
            Trading pairs included in this payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trading Pair</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Final Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payment.paymentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.pair.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.pair.version && `v${item.pair.version}`} • {item.pair.timeframe}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.period.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(item.basePrice))}</TableCell>
                  <TableCell>
                    {Number(item.discountRate) > 0 ? (
                      <span className="text-green-600">
                        -{formatCurrency(Number(item.basePrice) - Number(item.finalPrice))}
                        ({(Number(item.discountRate) * 100).toFixed(0)}%)
                      </span>
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(item.finalPrice))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div />
            <div>
              <span className="text-muted-foreground">Total Base Price:</span>
              <div className="font-medium">{formatCurrency(metrics.totalBasePrice)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Discount:</span>
              <div className="font-medium text-green-600">
                -{formatCurrency(metrics.totalDiscount)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Average Discount:</span>
              <div className="font-medium">
                {(metrics.averageDiscountRate).toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Final Total:</span>
              <div className="font-medium">{formatCurrency(Number(payment.totalAmount))}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions */}
      {payment.subscription && payment.subscription.length > 0 && (
        <Card className="mt-6 bg-black/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Subscriptions ({payment.subscription.length})</CardTitle>
            <CardDescription>
              Subscriptions created from this payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payment.subscription.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge variant={getSubscriptionStatusBadgeVariant(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Period</label>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {subscription.period.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                      <div className="mt-1 text-sm">
                        {format(new Date(subscription.startDate), 'PP')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                      <div className="mt-1 text-sm">
                        {format(new Date(subscription.expiryDate), 'PP')}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Invite Status</label>
                      <div className="mt-1">
                        <Badge variant="outline">{subscription.inviteStatus}</Badge>
                      </div>
                    </div>
                    {subscription.basePrice && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Base Price</label>
                        <div className="mt-1 font-medium">
                          {formatCurrency(Number(subscription.basePrice))}
                        </div>
                      </div>
                    )}
                    {subscription.discountRate && Number(subscription.discountRate) > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Discount Rate</label>
                        <div className="mt-1 text-green-600">
                          {(Number(subscription.discountRate)).toFixed(0)}%
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Final Price</label>
                      <div className="mt-1 text-green-400">
                        {formatCurrency(Number(subscription.basePrice) - (Number(subscription.basePrice) * (Number(subscription.discountRate) / 100)))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card className="mt-6 bg-black/30 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <div className="mt-1">
                {format(new Date(payment.createdAt), 'PPP p')}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <div className="mt-1">
                {format(new Date(payment.updatedAt), 'PPP p')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </GradientBackground>
  );
}

// Dynamic metadata for individual payment pages
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const paymentData = await fetchPaymentDetails(id);
    if (!paymentData) {
      return {
        title: 'Payment not found – AlgoMakers',
        description: 'Payment not found',
        robots: { index: false, follow: false },
      };
    }

    const invoice = paymentData.payment.invoiceId || paymentData.payment.orderId || id;
    const title = `Payment ${invoice} – AlgoMakers`;
    const description = `Details for payment ${invoice} (${paymentData.payment.status}).`;

    return {
      title,
      description,
      keywords: ['payment details', 'invoice', invoice, 'transaction', paymentData.payment.status.toLowerCase(), 'cryptocurrency payment', 'AlgoMakers'],
      openGraph: {
        title,
        description,
        url: `${process.env.NEXTAUTH_URL || ''}/billing/${id}`,
        siteName: 'AlgoMakers',
        type: 'article',
      },
      robots: { index: false, follow: false },
      alternates: { canonical: `${process.env.NEXTAUTH_URL || ''}/billing/${id}` },
    };
  } catch (e) {
    return {
      title: 'Payment – AlgoMakers',
      description: 'Payment details',
      robots: { index: false, follow: false },
    };
  }
}
