import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, ChevronDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getMyNannyProfile, getNannyReviews } from '../../api/nannies';
import { getPendingReviews, getReceivedReviews, createReview } from '../../api/reviews';
import { Review, Booking } from '../../api/types';

type Tab = 'received' | 'pending';

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star className={`w-7 h-7 transition-colors ${i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`} />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-slate-600 font-medium text-right">{label}</span>
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-amber-400 rounded-full"
        />
      </div>
      <span className="w-6 text-xs text-slate-500 text-right">{count}</span>
    </div>
  );
}

function ReviewForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const [rating, setRating]   = useState(5);
  const [text, setText]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) { setError('Kamida 10 ta belgi kiriting'); return; }
    setSaving(true);
    try {
      await createReview({ booking_id: booking.id, rating, text: text.trim() });
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xato yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 pt-3 border-t border-slate-100">
      <div>
        <p className="text-xs text-slate-500 mb-1.5">Baho bering:</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <textarea
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 focus:bg-white"
        rows={3}
        placeholder="Ota-ona haqida fikringizni yozing (kamida 10 belgi)..."
        value={text}
        onChange={e => { setText(e.target.value); setError(''); }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button variant="primary" size="sm" icon={<Send className="w-4 h-4" />} loading={saving} type="submit">
        Sharh yuborish
      </Button>
    </form>
  );
}

export default function ReviewsPage() {
  const [tab, setTab]             = useState<Tab>('received');
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [pending, setPending]     = useState<Booking[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [profile, pend] = await Promise.all([
        getMyNannyProfile(),
        getPendingReviews(),
      ]);
      setAvgRating(parseFloat(profile.rating));
      const revRes = await getNannyReviews(profile.id);
      setReviews(revRes.results || []);
      setPending(pend);
    } catch { /* */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageSpinner />;

  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader title="Sharhlar" subtitle={`Jami ${reviews.length} ta izoh · ${pending.length} ta kutilmoqda`} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
        {([
          { key: 'received' as Tab, label: `Qabul qilingan (${reviews.length})`,  highlight: false },
          { key: 'pending'  as Tab, label: `Kutilmoqda (${pending.length})`,       highlight: pending.length > 0 },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.highlight && tab !== t.key && (
              <span className="ml-1.5 w-1.5 h-1.5 bg-red-500 rounded-full inline-block align-middle" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'received' ? (
          <motion.div key="received" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {reviews.length === 0 ? (
              <EmptyState
                icon={<Star className="w-8 h-8" />}
                title="Hali sharhlar yo'q"
                description="Buyurtmalar yakunlangandan so'ng ota-onalar sharh qoldirishi mumkin"
              />
            ) : (
              <>
                <Card padding="lg" className="mb-6">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-5xl font-extrabold text-slate-900 leading-none">{avgRating.toFixed(1)}</p>
                      <StarRow rating={Math.round(avgRating)} />
                      <p className="text-xs text-slate-500 mt-1">{reviews.length} ta izoh</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {breakdown.map(({ star, count }) => (
                        <RatingBar key={star} label={String(star)} count={count} total={reviews.length} />
                      ))}
                    </div>
                  </div>
                </Card>
                <div className="space-y-3">
                  {reviews.map((r, idx) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                      <Card padding="md">
                        <div className="flex items-start gap-3">
                          <Avatar src={r.author.photo} name={r.author.name} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900">{r.author.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(r.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                              <StarRow rating={r.rating} />
                            </div>
                            {r.text && <p className="text-sm text-slate-700 mt-2 leading-relaxed">{r.text}</p>}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="pending" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {pending.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="w-8 h-8" />}
                title="Kutilayotgan sharhlar yo'q"
                description="Yakunlangan buyurtmalar uchun ota-onalarni baholab, ikki tomonlama reyting tizimini qo'llab-quvvatlang"
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-2">Quyidagi yakunlangan buyurtmalar uchun ota-onani baholang:</p>
                {pending.map(b => (
                  <Card key={b.id} padding="md">
                    <div className="flex items-center gap-3">
                      <Avatar src={b.parent.photo} name={b.parent.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{b.parent.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(b.start_date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
                          {' — '}
                          {new Date(b.end_date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant="purple" size="sm">Yakunlangan</Badge>
                      <button
                        onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded === b.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {expanded === b.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <ReviewForm
                            booking={b}
                            onDone={() => {
                              setPending(p => p.filter(x => x.id !== b.id));
                              setExpanded(null);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
