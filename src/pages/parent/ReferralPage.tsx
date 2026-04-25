import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Users, Gift, Share2, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getReferralStats, ReferralStats } from '../../api/referral';

const APP_URL = window.location.origin;

export default function ReferralPage() {
  const [stats,   setStats]   = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    getReferralStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const refLink = `${APP_URL}/?ref=${stats?.code ?? ''}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Parvona — Enaga platformasi',
        text:  `Parvona orqali ishonchli enaga toping! Mening havolam:`,
        url:   refLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader title="Do'stlarni taklif qiling" subtitle="Har bir ro'yxatdan o'tgan do'stingiz uchun bonus oling" />

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-6 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg">10,000 so'm bonus</p>
            <p className="text-purple-200 text-sm">Har bir muvaffaqiyatli taklif uchun</p>
          </div>
        </div>

        <p className="text-purple-100 text-sm mb-5">
          Do'stingiz sizning havolangiz orqali ro'yxatdan o'tib, birinchi buyurtma berganda ikkalangiz ham bonus olasiz.
        </p>

        {/* Ref code display */}
        <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-purple-200 mb-0.5">Sizning kodingiz</p>
            <p className="font-mono font-bold text-xl tracking-widest">{stats?.code}</p>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-white text-purple-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Nusxalandi' : 'Nusxalash'}
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card padding="md" className="text-center">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.total_referrals ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Taklif qilinganlar</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card padding="md" className="text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Gift className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {((stats?.bonus_earned ?? 0) / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Bonus (so'm)</p>
          </Card>
        </motion.div>
      </div>

      {/* Share link */}
      <Card padding="md" className="mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-2">Havola nusxasi</p>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-3">
          <p className="flex-1 text-xs text-slate-500 truncate font-mono">{refLink}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={copyLink} className="flex-1">
            {copied ? 'Nusxalandi!' : 'Havolani nusxalash'}
          </Button>
          <Button variant="secondary" icon={<Share2 className="w-4 h-4" />} onClick={shareLink}>
            Ulashish
          </Button>
        </div>
      </Card>

      {/* How it works */}
      <Card padding="md">
        <p className="text-sm font-semibold text-slate-700 mb-4">Qanday ishlaydi?</p>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Havolangizni do\'stingizga yuboring' },
            { step: '2', text: 'Do\'stingiz ro\'yxatdan o\'tadi' },
            { step: '3', text: 'Birinchi buyurtma berilganda bonus hisoblanadi' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-purple-100 text-purple-700 text-sm font-bold rounded-full flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <p className="text-sm text-slate-700 flex-1">{s.text}</p>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
