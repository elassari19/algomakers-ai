'use client';

import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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
  const [invoice, setInvoice] = useState<PaymentInvoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
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
        } else if (status === 'expired' || status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 10000); // Poll every 10 seconds

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

  // Reset state when modal closes
  const handleClose = () => {
    setInvoice(null);
    setPaymentStatus('pending');
    setTimeRemaining('');
    setCopySuccess(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-800">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            Complete Your Payment
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        {!invoice ? (
          <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4">
            {/* Order Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="h-28 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {basketItems.map((item, index) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.name}:</span>
                    <span className="text-white">
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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  paymentStatus === 'pending'
                    ? 'bg-yellow-600/20 text-yellow-400'
                    : paymentStatus === 'confirming'
                    ? 'bg-blue-600/20 text-blue-400'
                    : paymentStatus === 'confirmed'
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-red-600/20 text-red-400'
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
                <span className="capitalize font-medium">{paymentStatus}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="text-2xl font-mono text-white">
                {timeRemaining !== 'Expired'
                  ? `⏰ ${timeRemaining}`
                  : '⏰ Expired'}
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {timeRemaining !== 'Expired'
                  ? 'Time remaining to complete payment'
                  : 'Payment window has expired'}
              </p>
            </div>

            {/* Payment Details */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-slate-400">Amount to send:</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 p-3 rounded font-mono text-white">
                      {invoice.amount} USDT
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(invoice.amount.toString(), 'amount')
                      }
                      className="border-slate-600"
                    >
                      {copySuccess === 'amount' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Network */}
                <div className="space-y-2">
                  <Label className="text-slate-400">Network:</Label>
                  <div className="bg-slate-700 p-3 rounded text-white">
                    USDT {invoice.network.toUpperCase()}
                  </div>
                </div>

                {/* Payment Link - Primary payment method */}
                {invoice.invoiceUrl && (
                  <div className="space-y-2">
                    <Label className="text-slate-400">Complete Payment:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-lg py-4"
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
                  <>
                    {/* Address */}
                    <div className="space-y-2">
                      <Label className="text-slate-400">Send to address:</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 p-3 rounded font-mono text-white break-all">
                          {invoice.address}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(invoice.address, 'address')
                          }
                          className="border-slate-600"
                        >
                          {copySuccess === 'address' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* QR Code */}
                    {invoice.qrCode && (
                      <div className="text-center">
                        <Label className="text-slate-400">QR Code:</Label>
                        <div className="mt-2 inline-block p-4 bg-white rounded-lg">
                          <img
                            src={invoice.qrCode}
                            alt="Payment QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Scan with your wallet app
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Status Messages */}
            {paymentStatus === 'pending' && (
              <Card className="bg-blue-600/10 border-blue-600/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium">
                        Waiting for payment...
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Send the exact amount to the address above. We'll
                        automatically detect your payment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentStatus === 'confirming' && (
              <Card className="bg-yellow-600/10 border-yellow-600/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium">
                        Payment detected, confirming...
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Your payment is being confirmed on the blockchain. This
                        usually takes a few minutes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentStatus === 'expired' && (
              <Card className="bg-red-600/10 border-red-600/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">
                        Payment window expired
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        This payment window has expired. Please return to your basket and create a new payment.
                      </p>
                      <Button
                        onClick={handleClose}
                        className="mt-3 bg-blue-600 hover:bg-blue-500"
                      >
                        Return to Basket
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
