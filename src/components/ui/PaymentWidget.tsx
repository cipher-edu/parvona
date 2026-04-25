import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { initiatePayment, getPaymentStatus, PaymentProvider, PaymentStatus } from '../../api/payments';

interface PaymentWidgetProps {
  bookingId:   string;
  totalAmount: number;   // so'm (not tiyin)
  onPaid?:     () => void;
}

const PROVIDER_META: Record<PaymentProvider, { label: string; color: string; logo: string }> = {
  payme: { label: 'Payme',  color: 'bg-blue-600 hover:bg-blue-700',   logo: '💳' },
  click: { label: 'Click',  color: 'bg-teal-600 hover:bg-teal-700',   logo: '🔵' },
};

const STATUS_UI: Record<PaymentStatus, { icon: React.ReactNode; text: string; color: string }> = {
  no_payment: { icon: <CreditCard className="w-5 h-5" />, text: 'To\'lov kutilmoqda',    color: 'text-slate-500'  },
  pending:    { icon: <Clock      className="w-5 h-5" />, text: 'Jarayonda...',           color: 'text-amber-600'  },
  paid:       { icon: <CheckCircle2 className="w-5 h-5" />, text: 'To\'langan',           color: 'text-emerald-600'},
  failed:     { icon: <XCircle    className="w-5 h-5" />, text: 'Muvaffaqiyatsiz',        color: 'text-red-500'    },
  refunded:   { icon: <RefreshCw  className="w-5 h-5" />, text: 'Qaytarilgan',            color: 'text-slate-500'  },
  cancelled:  { icon: <XCircle    className="w-5 h-5" />, text: 'Bekor qilingan',         color: 'text-slate-400'  },
};

export function PaymentWidget({ bookingId, totalAmount, onPaid }: PaymentWidgetProps) {
  const [payStatus,  setPayStatus]  = useState<PaymentStatus>('no_payment');
  const [loading,    setLoading]    = useState(false);
  const [polling,    setPolling]    = useState(false);
  const [payUrl,     setPayUrl]     = useState<string | null>(null);
  const [error,      setError]      = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getPaymentStatus(bookingId);
      setPayStatus(data.status);
      if (data.status === 'paid') {
        setPolling(false);
        onPaid?.();
      }
    } catch { /* ignore */ }
  }, [bookingId, onPaid]);

  // Poll every 5s when pending
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, [polling, fetchStatus]);

  // Initial status check
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handlePay = async (provider: PaymentProvider) => {
    setLoading(true);
    setError('');
    try {
      const url = await initiatePayment(bookingId, provider);
      setPayUrl(url);
      setPayStatus('pending');
      setPolling(true);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'To\'lov boshlashda xato');
    } finally {
      setLoading(false);
    }
  };

  const ui = STATUS_UI[payStatus];

  if (payStatus === 'paid') {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 text-emerald-600 font-semibold text-sm"
      >
        <CheckCircle2 className="w-5 h-5" />
        To'langan
      </motion.div>
    );
  }

  return (
    <div>
      {/* Status badge */}
      <div className={`flex items-center gap-1.5 text-sm mb-3 ${ui.color}`}>
        {ui.icon}
        <span className="font-medium">{ui.text}</span>
        {polling && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="ml-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </div>

      {/* Provider buttons */}
      {(payStatus === 'no_payment' || payStatus === 'failed') && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium mb-2">
            To'lov tizimini tanlang — {totalAmount.toLocaleString()} so'm:
          </p>
          <div className="flex gap-2">
            {(Object.entries(PROVIDER_META) as [PaymentProvider, typeof PROVIDER_META.payme][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => handlePay(key)}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all ${meta.color} disabled:opacity-50`}
              >
                <span>{meta.logo}</span>
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Re-open payment link */}
      {payStatus === 'pending' && payUrl && (
        <Button
          variant="secondary"
          size="sm"
          icon={<ExternalLink className="w-4 h-4" />}
          onClick={() => window.open(payUrl, '_blank', 'noopener,noreferrer')}
        >
          To'lov sahifasini ochish
        </Button>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
