import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Crown, CheckCircle2, Zap, TrendingUp, ShieldCheck, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getProStatus, subscribePro, ProStatus } from '../../api/payments';

const FEATURES = [
  { icon: <TrendingUp  className="w-5 h-5" />, text: 'Qidiruv ro\'yxatida birinchi ko\'rinish' },
  { icon: <Crown       className="w-5 h-5" />, text: 'Pro badge — profilingizda maxsus belgi' },
  { icon: <Zap         className="w-5 h-5" />, text: 'Yangi buyurtma bildirishnomalari tezroq' },
  { icon: <ShieldCheck className="w-5 h-5" />, text: 'Prioritet qo\'llab-quvvatlash xizmati' },
  { icon: <Star        className="w-5 h-5" />, text: 'Pro enagalar alohida filtrlarda ko\'rinadi' },
];

const PLANS = [
  {
    key: 'monthly' as const,
    label: 'Oylik',
    price: 49_000,
    period: '/oy',
    desc: 'Har oyda yangilanadi',
    highlight: false,
  },
  {
    key: 'yearly' as const,
    label: 'Yillik',
    price: 449_000,
    period: '/yil',
    desc: 'Taxminan 37,400 so\'m/oy — 24% tejash',
    highlight: true,
  },
];

export default function ProPage() {
  const [status,   setStatus]  = useState<ProStatus | null>(null);
  const [loading,  setLoading] = useState(true);
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [buying,   setBuying]  = useState(false);
  const [success,  setSuccess] = useState(false);

  useEffect(() => {
    getProStatus()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const isPro = status?.is_pro ?? false;

  const handleSubscribe = async () => {
    setBuying(true);
    try {
      const res = await subscribePro(selected);
      setStatus(res);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBuying(false);
    }
  };

  if (isPro || success) {
    return (
      <div className="p-6 lg:p-8 max-w-xl">
        <PageHeader title="Parvona Pro" subtitle="Siz Pro enagasiz!" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-center text-white"
        >
          <Crown className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
          <p className="text-2xl font-extrabold mb-2">Pro Status Faol!</p>
          <p className="text-amber-100 mb-4">
            Reja: {status?.plan === 'monthly' ? 'Oylik' : 'Yillik'}
          </p>
          {status?.expires_at && (
            <p className="text-sm text-amber-100">
              Tugash: {new Date(status.expires_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </motion.div>

        <Card padding="md" className="mt-6">
          <p className="text-sm font-semibold text-slate-700 mb-4">Pro afzalliklari:</p>
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      <PageHeader title="Parvona Pro" subtitle="Ko'proq buyurtma oling — Pro bo'ling" />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white text-center"
      >
        <Crown className="w-14 h-14 mx-auto mb-3 drop-shadow" />
        <p className="text-xl font-extrabold mb-1">Parvona Pro</p>
        <p className="text-amber-100 text-sm">Qidiruv ro'yxatida birinchi bo'ling va ko'proq mijoz jalb qiling</p>
      </motion.div>

      {/* Features */}
      <Card padding="md" className="mb-6">
        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 text-sm text-slate-700"
            >
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                {f.icon}
              </div>
              {f.text}
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PLANS.map(plan => (
          <button
            key={plan.key}
            onClick={() => setSelected(plan.key)}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
              selected === plan.key
                ? 'border-amber-400 bg-amber-50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                TEJASH
              </span>
            )}
            <p className="font-bold text-slate-900 mb-0.5">{plan.label}</p>
            <p className="text-lg font-extrabold text-amber-600">
              {plan.price.toLocaleString()}
              <span className="text-sm font-medium text-slate-500"> so'm{plan.period}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        icon={<Crown className="w-5 h-5" />}
        loading={buying}
        onClick={handleSubscribe}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 py-3 text-base font-bold"
      >
        Pro obunani boshlash — {PLANS.find(p => p.key === selected)?.price.toLocaleString()} so'm
      </Button>
      <p className="text-xs text-center text-slate-400 mt-3">
        Demo rejimida — real to'lov talab qilinmaydi. Ishga tushganda Payme/Click orqali to'lov amalga oshiriladi.
      </p>
    </div>
  );
}
