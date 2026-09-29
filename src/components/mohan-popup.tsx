'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, Coffee, Globe, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { FastfolioTracking, FREE_MESSAGE_LIMIT, MESSAGES_PER_PURCHASE } from '@/lib/fastfolio-tracking';
import { PoweredByMohanSharma } from './powered-by-mohan';

interface FastfolioPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasReachedLimit?: boolean;
  onPaymentSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function FastfolioPopup({
  open,
  onOpenChange,
  hasReachedLimit = false,
  onPaymentSuccess,
}: FastfolioPopupProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    try {
      setIsProcessing(true);

      // 1. Create Order on our Next.js API
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const orderData = await res.json();

      if (!res.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // If keys are not set up yet (Demo mode), allow testing immediately
      if (orderData.isDemo || !window.Razorpay) {
        toast.info('Razorpay demo mode: simulating ₹10 payment...');
        setTimeout(async () => {
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: `pay_demo_${Date.now()}`,
              razorpay_signature: 'demo_signature',
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            FastfolioTracking.addExtraMessages(MESSAGES_PER_PURCHASE);
            toast.success(`Paise mil gaye bhai! ${MESSAGES_PER_PURCHASE} sawaal aur unlock ho gaye 🎉☕`);
            onPaymentSuccess?.();
            onOpenChange(false);
          } else {
            toast.error('Payment verification failed');
          }
          setIsProcessing(false);
        }, 1200);
        return;
      }

      // 2. Open standard Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Mohan Sharma Chai Fund ☕',
        description: `Bhai ke ${MESSAGES_PER_PURCHASE} extra sawaal`,
        image: '/logo-mohan.svg',
        order_id: orderData.orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 3. Verify Payment Signature
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              FastfolioTracking.addExtraMessages(MESSAGES_PER_PURCHASE);
              toast.success(`Paise mil gaye bhai! ${MESSAGES_PER_PURCHASE} sawaal aur unlock ho gaye 🎉☕`);
              onPaymentSuccess?.();
              onOpenChange(false);
            } else {
              toast.error(verifyData.error || 'Payment verification failed');
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            toast.error('Failed to verify payment signature');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#0171E3',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessing(false);
        toast.error(`Payment failed: ${response.error?.description || 'Payment cancel ho gaya!'}`);
      });
      rzp.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Error initiating payment');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-none p-0 sm:max-w-[480px]">
        {hasReachedLimit ? (
          // Funny message limit payment card
          <div className="flex flex-col items-center px-6 py-8 text-center sm:px-8">
            {/* Top funny emoji & badge */}
            <div className="mb-2 text-5xl animate-bounce">
              😉💸
            </div>

            <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <span>🛑 {FREE_MESSAGE_LIMIT} Free Sawaal Khatam!</span>
            </div>

            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground sm:text-3xl leading-snug">
                Bhai, agar aur jaanna hai toh paise de! 😉
              </DialogTitle>
              <p className="text-sm font-semibold italic text-[#0171E3]">
                &ldquo;Bro, if you want to know more... pay me! 😉💸&rdquo;
              </p>
            </DialogHeader>

            {/* Funny description */}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Dekh bhai, mera AI avatar hawa pe nahi chalta. Server ke bills aate hain aur Tum Kitne Serious ho ye bhi to check karein  ☕🤖
              <br className="hidden sm:inline" />
              Dus rupaye de, chaar sawaal aur pooch lo. Deal pakki?
            </p>

            {/* Price badge */}
            <div className="my-4 w-full rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-left dark:border-neutral-800 dark:bg-neutral-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Coffee className="h-4 w-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-foreground">Chai-Paani Pass</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">+4 Extra AI Chat Questions</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-foreground">₹10</span>
                  <span className="block text-[10px] text-muted-foreground font-medium">only / ek baar</span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-neutral-200/80 pt-3 text-xs text-muted-foreground dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>Ek cutting chai se bhi sasta (Cheaper than half a tea)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>Instant unlock — no 24-hour wait drama</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>UPI (GPay, PhonePe, Paytm, CRED) & Cards via Razorpay</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full cursor-pointer rounded-xl bg-[#0171E3] py-6 text-base font-bold text-white transition-all hover:bg-blue-600 active:scale-98 disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Chai ban rahi hai... (Processing)
                </>
              ) : (
                'Chal De Diye ₹10 • Unlock 4 Sawaal 🚀'
              )}
            </Button>

            <button
              onClick={() => onOpenChange(false)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Nahi bhai, kal aaunga (I&apos;m broke today 🏃‍♂️)
            </button>

            <div className="mt-5">
              <PoweredByMohanSharma />
            </div>
          </div>
        ) : (
          // Normal portfolio CTA
          <>
            <div className="relative">
              <Image
                src="/portfolio-preview.png"
                alt="Portfolio Preview"
                width={500}
                height={250}
                className="h-[200px] w-full object-cover"
              />
            </div>

            <div className="space-y-8 p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Build Your Own{' '}
                  <span className="text-[#0171E3]">AI Portfolio</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-5 w-5 text-[#0171E3]" />
                  <p className="text-sm font-medium">Answers 24/7 in your voice</p>
                </div>

                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-[#0171E3]" />
                  <p className="text-sm font-medium">AI-powered conversations & generative UI</p>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-5 w-5 text-[#0171E3]" />
                  <p className="text-sm font-medium">Custom domain & personal branding</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 cursor-pointer border-none bg-[#0171E3] hover:bg-blue-600"
                >
                  Start Exploring
                </Button>
              </div>

              <PoweredByMohanSharma />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
