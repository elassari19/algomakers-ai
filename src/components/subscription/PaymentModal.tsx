'use client';

import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle, Clock, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any; // Optional pre-created invoice
  basketItems: any[]; // Basket items for display
  totalAmount: number;
  onPaymentSuccess: () => void;
}

interface PaymentInvoice {
  id: string;
  amount: number;
  address: string;
  qrCode: string;
  expiresAt: Date;
  network: string;
  invoiceUrl?: string;
}

type PaymentStatus =
  | 'pending'
  | 'confirming'
  | 'confirmed'
  | 'expired'
  | 'failed';

export function PaymentModal({
  isOpen,
  onClose,
  invoice: preCreatedInvoice,
  basketItems,
  totalAmount,
  onPaymentSuccess,
}: PaymentModalProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<PaymentInvoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('trc20');
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<
    'amount' | 'address' | 'link' | null
  >(null);

  // Use pre-created invoice if provided
  useEffect(() => {
    if (preCreatedInvoice) {
      const actualInvoice: PaymentInvoice = {
        id: preCreatedInvoice.id,
        amount: preCreatedInvoice.amount,
        address: preCreatedInvoice.address || '', // Invoice uses hosted checkout, no direct address
        qrCode: preCreatedInvoice.qrCode || '', // Invoice uses hosted checkout, no QR code needed
        expiresAt: new Date(preCreatedInvoice.expiresAt),
        network: preCreatedInvoice.network || 'trc20',
        invoiceUrl: preCreatedInvoice.invoiceUrl,
      };
      setInvoice(actualInvoice);
      startPaymentStatusPolling(actualInvoice.id);
    }
  }, [preCreatedInvoice]);

  // Poll payment status
  const startPaymentStatusPolling = (invoiceId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status/${invoiceId}`);
        const { status } = await response.json();

        setPaymentStatus(status);

        if (status === 'confirmed') {
          clearInterval(pollInterval);
          onPaymentSuccess();
          onClose();
          router.push('/subscriptions');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 10000); // Poll every 10 seconds

    router.refresh();
    // Clean up interval on component unmount
    return () => clearInterval(pollInterval);
  };

  // Countdown timer
  useEffect(() => {
    if (!invoice) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = invoice.expiresAt.getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining('Expired');
        setPaymentStatus('expired');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [invoice]);

  // Copy to clipboard
  const copyToClipboard = async (
    text: string,
    type: 'amount' | 'address' | 'link'
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Network options
  const networkOptions = [
    { value: 'trc20', label: 'USDT TRC20', description: 'Fastest & lowest fees' },
    { value: 'erc20', label: 'USDT ERC20', description: 'Ethereum network' },
    { value: 'bep20', label: 'USDT BEP20', description: 'Binance Smart Chain' },
  ];

  // Generate QR code for payment
  const generateQRCode = (amount: number, network: string) => {
    if (!invoice?.address) return '';

    // Create USDT payment URI
    const currencyCode = network === 'trc20' ? 'USDT' :
                        network === 'erc20' ? 'USDT' : 'USDT';
    const paymentUri = `${currencyCode}:${invoice.address}?amount=${amount}`;

    // Use QR Server API to generate QR code
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUri)}&bgcolor=ffffff&color=000000`;

    return qrApiUrl;
  };

  // Update QR code when network changes
  useEffect(() => {
    if (invoice?.amount) {
      const qrCode = generateQRCode(invoice.amount, selectedNetwork);
      setGeneratedQR(qrCode);
    }
  }, [selectedNetwork, invoice]);

  // Reset state when modal closes
  const handleClose = () => {
    setInvoice(null);
    setPaymentStatus('pending');
    setTimeRemaining('');
    setSelectedNetwork('trc20');
    setGeneratedQR('');
    setCopySuccess(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-gradient-to-b backdrop-blur-2xl from-white/20 to-white-10 border-slate-800 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-700">
          <DialogTitle className="text-xl font-bold text-white">
            💳 Complete Your Payment
          </DialogTitle>
        </DialogHeader>

        {!invoice ? (
          <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4">
            {/* Order Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3 bg-slate-700 border-b border-slate-600">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  <span>Your Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-32 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 p-4">
                {basketItems.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center text-sm bg-slate-700 p-2 rounded">
                    <span className="text-slate-300">{item.name}:</span>
                    <span className="text-white font-medium">
                      ${(item.plan.discount || 0) > 0 
                        ? (item.price * (1 - (item.plan.discount || 0) / 100)).toFixed(2) 
                        : item.price.toFixed(2)
                      }
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t border-slate-600 pt-2 mt-2">
                  <span className="text-white text-sm">Total (USD):</span>
                  <span className="text-green-400">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-white text-sm">Pay (USDT):</span>
                  <span className="text-blue-400">
                    {totalAmount} USDT
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="bg-slate-800 border-yellow-600/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="text-yellow-500 font-medium">
                      Important Payment Instructions:
                    </p>
                    <ul className="text-slate-400 space-y-1">
                      <li>• Click "Open Payment Page" to complete your payment</li>
                      <li>• Only send USDT on the selected network</li>
                      <li>
                        • Sending from exchanges may take longer to confirm
                      </li>
                      <li>
                        • Underpayments and overpayments may delay activation
                      </li>
                      <li>• Payment expires in 20 minutes after creation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4">
            {/* Payment Status */}
            <div className="text-center">
              <div
                className={`inline-flex items-center gap-3 px-4 py-2 rounded-full font-medium shadow-lg ${
                  paymentStatus === 'pending'
                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                    : paymentStatus === 'confirming'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : paymentStatus === 'confirmed'
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                    : 'bg-red-600/20 text-red-400 border border-red-600/30'
                }`}
              >
                {paymentStatus === 'pending' && <Clock className="w-4 h-4" />}
                {paymentStatus === 'confirming' && (
                  <Clock className="w-4 h-4" />
                )}
                {paymentStatus === 'confirmed' && (
                  <CheckCircle className="w-4 h-4" />
                )}
                {paymentStatus === 'expired' && (
                  <AlertCircle className="w-4 h-4" />
                )}
                {paymentStatus === 'failed' && (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="capitalize">
                  {paymentStatus === 'pending' && '⏳ Awaiting Payment'}
                  {paymentStatus === 'confirming' && '🔄 Confirming Payment'}
                  {paymentStatus === 'confirmed' && '✅ Payment Confirmed'}
                  {paymentStatus === 'expired' && '⏰ Payment Expired'}
                  {paymentStatus === 'failed' && '❌ Payment Failed'}
                </span>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-2xl font-mono text-white mb-1">
                {timeRemaining !== 'Expired'
                  ? `⏰ ${timeRemaining}`
                  : '⏰ Expired'}
              </div>
              <p className="text-slate-400 text-sm">
                {timeRemaining !== 'Expired'
                  ? 'Time remaining to complete payment'
                  : 'Payment window has expired'}
              </p>
            </div>

            {/* Payment Details */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className='py-0'>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-slate-300 font-medium flex items-center gap-2">
                    <span>💵</span>
                    <span>Amount to send:</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 p-3 rounded font-mono text-lg font-bold text-green-400 border border-slate-600 text-center">
                      {invoice.amount} USDT
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(invoice.amount.toString(), 'amount')
                      }
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      {copySuccess === 'amount' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {/* Expiry Date */}
                  <div className="text-center">
                    <p className="text-xs text-slate-400">
                      ⏰ Expires: {invoice.expiresAt.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Network Selector */}
                <div className="space-y-3">
                  <Label className="text-slate-300 font-medium">Choose Network:</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {networkOptions.map((network) => (
                        <SelectItem
                          key={network.value}
                          value={network.value}
                          className="hover:bg-slate-600 focus:bg-slate-600 text-white cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{network.label}</span>
                            <span className="text-xs text-slate-400">{network.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded border border-blue-800">
                    💡 <strong>TRC20 recommended:</strong> Fastest transactions with lowest fees
                  </div>
                </div>

                {/* Payment Link - Primary payment method */}
                {invoice.invoiceUrl && (
                  <div className="space-y-2">
                    <Label className="text-slate-400">Complete Payment:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        className="flex-1 bg-gradient-to-r backdrop-blur-md from-purple-500 to-pink-400 text-lg py-4"
                      >
                        <a
                          href={invoice.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Payment Page
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(invoice.invoiceUrl!, 'link')
                        }
                        className="border-slate-600"
                      >
                        {copySuccess === 'link' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Click to open secure payment page hosted by NOWPayments
                    </p>
                  </div>
                )}

                {/* Direct payment details (if available) */}
                {invoice.address && (
                  <div className="space-y-4">
                    {/* Address */}
                    <div className="space-y-2">
                      <Label className="text-slate-300 font-medium flex items-center gap-2">
                        <span>📍 Payment Address</span>
                        <Badge variant="secondary" className="bg-blue-900 text-blue-300 border border-blue-700">
                          {selectedNetwork.toUpperCase()}
                        </Badge>
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 p-3 rounded font-mono text-white break-all border border-slate-600">
                          {invoice.address}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(invoice.address, 'address')
                          }
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          {copySuccess === 'address' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* QR Code - Always show for direct payments */}
                    <div className="text-center space-y-3">
                      <Label className="text-slate-300 font-medium flex items-center justify-center gap-2">
                        <QrCode className="w-4 h-4" />
                        <span>Scan QR Code</span>
                      </Label>
                      <div className="inline-block p-3 bg-white rounded-lg border-2 border-slate-600">
                        <img
                          src={generatedQR || invoice.qrCode}
                          alt="Payment QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                      <p className="text-sm text-slate-400 bg-slate-800 p-2 rounded border border-slate-700">
                        📱 Open your wallet app and scan this QR code to pay automatically
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Messages */}
            {paymentStatus === 'pending' && (
              <Card className="bg-blue-900/20 border-blue-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium">
                        Waiting for your payment...
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Send the exact amount to the address above. We'll automatically detect your payment and activate your subscription! 🚀
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentStatus === 'confirming' && (
              <Card className="bg-yellow-900/20 border-yellow-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium">
                        Payment detected, confirming...
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Your payment is being confirmed on the blockchain. This usually takes just a few minutes! ⏱️
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentStatus === 'expired' && (
              <Card className="bg-red-900/20 border-red-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">
                        Payment window expired
                      </p>
                      <p className="text-slate-400 text-sm mt-1 mb-3">
                        This payment window has expired. Don't worry - you can create a new payment!
                      </p>
                      <Button
                        onClick={handleClose}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create New Payment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
                        <Card className="bg-slate-800 border-yellow-600/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="text-yellow-500 font-medium">
                      Important Payment Instructions:
                    </p>
                    <ul className="text-slate-400 space-y-1">
                      <li>• Click "Open Payment Page" to complete your payment</li>
                      <li>• Only send USDT on the selected network</li>
                      <li>
                        • Sending from exchanges may take longer to confirm
                      </li>
                      <li>
                        • Underpayments and overpayments may delay activation
                      </li>
                      <li>• Payment expires in 20 minutes after creation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
