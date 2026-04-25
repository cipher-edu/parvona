import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock, ChevronDown, MessageSquare } from 'lucide-react';
import { Star } from 'lucide-react';
import { PaymentWidget } from '../../components/ui/PaymentWidget';
import { Card } from '../../components/ui/Card';
import { Badge, STATUS_VARIANT, STATUS_LABEL } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { getMyBookings, updateBookingStatus } from '../../api/bookings';
import { createReview } from '../../api/reviews';
import { Booking } from '../../api/types';

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: '',           label: 'Barcha holatlar'  },
  { value: 'pending',    label: 'Kutilmoqda'       },
  { value: 'confirmed',  label: 'Tasdiqlangan'     },
  { value: 'active',     label: 'Faol'             },
  { value: 'completed',  label: 'Yakunlangan'      },
  { value: 'cancelled',  label: 'Bekor qilingan'   },
];

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const [cancelId, setCancelId]     = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating]   = useState(5);
  const [reviewText, setReviewText]       = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError]     = useState('');

  useEffect(() => {
    getMyBookings()
      .then(r => setBookings(r.results || []))
      .catch((err) => { console.error('Buyurtmalarni yuklashda xato:', err); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse mb-6" />
      <div className="space-y-3">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const updated = await updateBookingStatus(cancelId, 'cancelled', 'Ota-ona tomonidan bekor qilindi');
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
      setCancelId(null);
    } catch (err) {
      console.error('Buyurtmani bekor qilishda xato:', err);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking) return;
    if (reviewText.trim().length < 10) {
      setReviewError('Izoh kamida 10 ta belgidan iborat bo\'lishi kerak.');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    try {
      await createReview({
        booking_id: reviewBooking.id,
        rating: reviewRating,
        text: reviewText.trim(),
      });
      setReviewBooking(null);
      setReviewText('');
      setReviewRating(5);
      setReviewError('');
      setReviewSuccess(reviewBooking.id);
      setTimeout(() => setReviewSuccess(null), 3000);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <PageHeader
        title="Buyurtmalarim"
        subtitle={`Jami ${bookings.length} ta buyurtma`}
        action={
          <Select
            options={ALL_STATUSES}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-44"
          />
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="Buyurtmalar topilmadi"
          description="Enaga izlab, birinchi buyurtmangizni bering"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card padding="none" hover>
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                >
                  <div className="flex items-center gap-4 p-5">
                    <Avatar src={b.nanny.photo} name={b.nanny.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{b.nanny.name}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(b.start_date).toLocaleDateString('uz-UZ')} — {new Date(b.end_date).toLocaleDateString('uz-UZ')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {b.hours_per_day} soat/kun
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                          <span className="text-sm font-bold text-slate-900">
                            {b.total_amount.toLocaleString()} so'm
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded === b.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expanded === b.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-5 space-y-3">
                      {b.address && (
                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" /> {b.address}
                        </p>
                      )}
                      {b.notes && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{b.notes}</p>
                      )}
                      {/* Payment widget for confirmed bookings */}
                      {b.status === 'confirmed' && (
                        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">To'lov</p>
                          <PaymentWidget
                            bookingId={b.id}
                            totalAmount={b.total_amount}
                            onPaid={() => setBookings(prev =>
                              prev.map(x => x.id === b.id ? { ...x, status: 'active' } : x)
                            )}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1 flex-wrap items-center">
                        {b.status === 'pending' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setCancelId(b.id)}
                          >
                            Bekor qilish
                          </Button>
                        )}
                        {['pending', 'confirmed', 'active'].includes(b.status) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<MessageSquare className="w-3.5 h-3.5" />}
                            onClick={() => navigate(`/dashboard/messages?booking=${b.id}`)}
                          >
                            Xabar yuborish
                          </Button>
                        )}
                        {b.status === 'completed' && !reviewSuccess?.includes(b.id) && (
                          <Button variant="secondary" size="sm" icon={<Star className="w-3.5 h-3.5" />}
                            onClick={() => { setReviewBooking(b); setReviewRating(5); setReviewText(''); }}>
                            Sharh qoldirish
                          </Button>
                        )}
                        {reviewSuccess === b.id && (
                          <span className="text-xs text-green-600 font-medium">✓ Sharh yuborildi</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bekor qilish modali */}
      <Modal
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        title="Buyurtmani bekor qilish"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelId(null)}>Bekor</Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>Ha, bekor qilish</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Buyurtmani bekor qilmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
        </p>
      </Modal>

      {/* Sharh modali */}
      <Modal
        open={!!reviewBooking}
        onClose={() => { setReviewBooking(null); setReviewError(''); }}
        title={`${reviewBooking?.nanny.name || ''} ga sharh`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setReviewBooking(null); setReviewError(''); }}>Bekor</Button>
            <Button loading={reviewLoading} onClick={handleSubmitReview}>Yuborish</Button>
          </>
        }
      >
        <div className="space-y-4">
          {reviewError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {reviewError}
            </p>
          )}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Baho</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-amber-400' : 'text-slate-200'}`}
                >
                  ★
                </button>
              ))}
              <span className="text-sm text-slate-500 ml-2 self-center">{reviewRating}/5</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Izoh</p>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
              placeholder="Enaga haqida fikringizni yozing..."
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Kamida 10 ta belgi ({reviewText.trim().length}/10)
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
