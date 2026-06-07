import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Star, MapPin, Clock, Play } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner, SkeletonNannyCard } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getNannies, getNannyById, getNannyReviews, SKILL_LABELS, formatHourlyRate } from '../../api/nannies';
import { createBooking } from '../../api/bookings';
import { Nanny, Review } from '../../api/types';
import { Input as InputEl } from '../../components/ui/Input';
import { getGeneratedAvatarUrl, getInitials } from '../../components/ui/Avatar';

// ─── Nanny photo: haqiqiy rasm yoki DiceBear fallback ────────────────────────
function NannyPhoto({ photo, name, className = '' }: { photo: string | null; name: string; className?: string }) {
  const [diceFailed, setDiceFailed] = React.useState(false);
  const generatedUrl = getGeneratedAvatarUrl(name);

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${className}`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = generatedUrl; }}
      />
    );
  }

  if (!diceFailed) {
    return (
      <img
        src={generatedUrl}
        alt={name}
        className={`w-full h-full object-contain bg-gradient-to-br from-purple-50 to-indigo-100 group-hover:scale-105 transition-transform duration-300 ${className}`}
        onError={() => setDiceFailed(true)}
      />
    );
  }

  // DiceBear ham ishlamasa — chiroyli initials placeholder
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-100 via-indigo-50 to-purple-50 ${className}`}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
        {getInitials(name)}
      </div>
      <p className="text-xs font-medium text-purple-600/70 px-4 text-center leading-tight">{name}</p>
    </div>
  );
}

// ─── VideoPlayer: suratni poster sifatida ko'rsatadi, play bosgach video ─────
function VideoPlayer({ src, poster, name }: { src?: string; poster?: string; name: string }) {
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    videoRef.current?.play().catch(() => {});
    setPlaying(true);
  };

  // Video yo'q — faqat rasm yoki initials ko'rsatish
  if (!src) {
    if (poster) {
      return <img src={poster} alt={name} className="w-full h-full object-cover" />;
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold select-none">
          {getInitials(name)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-900">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={playing}
        preload="none"
        poster={poster || undefined}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      >
        <source src={src} />
        Brauzeringiz video formatini qo'llab-quvvatlamaydi.
      </video>

      {/* Play tugmasi overlay — video boshlanmagunicha ko'rinadi */}
      {!playing && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center group"
          aria-label="Videoni ijro etish"
        >
          {/* Poster rasm (surati) */}
          {poster && (
            <img
              src={poster}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Qoraytirilgan overlay */}
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
          {/* Play circle */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
            <Play className="w-7 h-7 text-purple-700 ml-1" fill="currentColor" />
          </div>
        </button>
      )}
    </div>
  );
}


const SKILL_OPTIONS = [
  { value: '', label: 'Barcha ko\'nikmalar' },
  ...Object.entries(SKILL_LABELS).map(([v, l]) => ({ value: v, label: l })),
];

const SORT_OPTIONS = [
  { value: '-rating',      label: 'Reyting bo\'yicha' },
  { value: 'hourly_rate',  label: 'Arzon narxdan'     },
  { value: '-hourly_rate', label: 'Qimmat narxdan'     },
  { value: '-reviews_count', label: 'Ko\'p izohlar'   },
];

interface BookingForm {
  start_date:    string;
  end_date:      string;
  hours_per_day: number;
  address:       string;
  notes:         string;
}

const emptyForm: BookingForm = {
  start_date: '', end_date: '', hours_per_day: 4, address: '', notes: '',
};

export default function NannySearchPage() {
  const navigate = useNavigate();
  const [nannies, setNannies]       = useState<Nanny[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [skill, setSkill]           = useState('');
  const [ordering, setOrdering]     = useState('-rating');
  const [minRate, setMinRate]       = useState('');
  const [maxRate, setMaxRate]       = useState('');

  const [selected, setSelected]     = useState<Nanny | null>(null);
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [reviewsLoading, setRevLoad]= useState(false);

  const [bookingModal, setBookingModal] = useState(false);
  const [bookingForm, setBookingForm]   = useState<BookingForm>(emptyForm);
  const [bookingLoading, setBookLoading]= useState(false);
  const [bookingError, setBookError]    = useState('');
  const [loadError, setLoadError]       = useState('');
  const [detailError, setDetailError]   = useState('');

  const load = useCallback(async (q?: string, s?: string, o?: string, signal?: AbortSignal, minR?: string, maxR?: string) => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await getNannies({
        search: q || undefined,
        skill: s || undefined,
        ordering: o || '-rating',
        min_rate: minR ? Number(minR) : undefined,
        max_rate: maxR ? Number(maxR) : undefined,
      }, signal);
      setNannies(res.results || []);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setNannies([]);
      setLoadError('Enagalarni yuklashda xatolik. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(undefined, undefined, undefined, ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => load(search, skill, ordering, ctrl.signal, minRate, maxRate), 400);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [search, skill, ordering, minRate, maxRate, load]);

  const openDetail = async (n: Nanny) => {
    setSelected(n);
    setRevLoad(true);
    setDetailError('');
    try {
      const full = await getNannyById(n.id);
      setSelected(full);
      const revRes = await getNannyReviews(n.id);
      setReviews(revRes.results || []);
    } catch (e: unknown) {
      setDetailError(e instanceof Error ? e.message : 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setRevLoad(false);
    }
  };

  const handleBook = async () => {
    if (!selected || !bookingForm.start_date || !bookingForm.end_date || !bookingForm.address) {
      setBookError('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    if (bookingForm.end_date < bookingForm.start_date) {
      setBookError('Tugash sanasi boshlanish sanasidan oldin bo\'lishi mumkin emas');
      return;
    }
    if (bookingForm.hours_per_day < 1 || bookingForm.hours_per_day > 12) {
      setBookError('Kuniga soat 1 dan 12 gacha bo\'lishi kerak');
      return;
    }
    setBookLoading(true);
    setBookError('');
    try {
      await createBooking({
        nanny_id:      selected.user.id,
        ...bookingForm,
      });
      setBookingModal(false);
      setBookingForm(emptyForm);
      setTimeout(() => navigate('/dashboard/bookings'), 500);
    } catch (e: unknown) {
      setBookError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    } finally {
      setBookLoading(false);
    }
  };

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="h-10 w-56 bg-slate-200 rounded-xl animate-pulse mb-6" />
      <div className="flex gap-3 mb-6">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-200 rounded-xl animate-pulse flex-1" />)}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1,2,3,4,5,6].map(i => <SkeletonNannyCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader title="Enaga izlash" subtitle="O'zingizga mos enagani toping" />


      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-48">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Enaga ismi yoki joylashuv..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={SKILL_OPTIONS}
          value={skill}
          onChange={e => setSkill(e.target.value)}
          className="w-44"
        />
        <Select
          options={SORT_OPTIONS}
          value={ordering}
          onChange={e => setOrdering(e.target.value)}
          className="w-44"
        />
        <input
          type="number"
          placeholder="Min narx"
          value={minRate}
          onChange={e => setMinRate(e.target.value)}
          className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <input
          type="number"
          placeholder="Max narx"
          value={maxRate}
          onChange={e => setMaxRate(e.target.value)}
          className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6">{loadError}</p>
      )}

      {/* Results */}
      {nannies.length === 0 ? (
        <EmptyState icon={<Search className="w-8 h-8" />} title="Enagalar topilmadi" description="Boshqa kalit so'z bilan qidiring" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {nannies.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card padding="none" className="overflow-hidden cursor-pointer group" hover>
                {/* Photo */}
                <div className="relative h-48 overflow-hidden" onClick={() => openDetail(n)}>
                  <NannyPhoto photo={n.user.photo} name={n.user.name} />
                  {n.is_verified && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      ✓ Tasdiqlangan
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2" onClick={() => openDetail(n)}>
                    <div>
                      <h3 className="font-bold text-slate-900">{n.user.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {n.location_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 rounded-xl px-2 py-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-amber-700">{parseFloat(n.rating).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3" onClick={() => openDetail(n)}>
                    {(n.skills as string[]).slice(0, 3).map(s => (
                      <Badge key={s} variant="purple" size="sm">{SKILL_LABELS[s] || s}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{n.experience} yil tajriba</span>
                    </div>
                    <span className="text-sm font-bold text-purple-700">{formatHourlyRate(n.hourly_rate)}</span>
                  </div>

                  <Button
                    fullWidth
                    size="sm"
                    className="mt-3"
                    onClick={() => { setSelected(n); setBookingModal(true); }}
                  >
                    Buyurtma berish
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Nanny detail modal */}
      <Modal open={!!selected && !bookingModal} onClose={() => { setSelected(null); setDetailError(''); }} size="xl">
        {selected && (
          <div className="space-y-5">
            {detailError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{detailError}</p>
            )}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-purple-50 to-indigo-100">
                <NannyPhoto photo={selected.user.photo} name={selected.user.name} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{selected.user.name}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {selected.location_name}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {parseFloat(selected.rating).toFixed(1)} ({selected.reviews_count} izoh)
                  </span>
                  <span className="text-sm text-slate-600">{selected.experience} yil tajriba</span>
                  <span className="text-sm font-bold text-purple-700">{formatHourlyRate(selected.hourly_rate)}/soat</span>
                </div>
              </div>
            </div>

            {/* ── Video / rasm ko'rsatish ────────────────────────────────── */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900" style={{ aspectRatio: '16/9' }}>
              <VideoPlayer
                src={selected.video}
                poster={selected.user.photo || undefined}
                name={selected.user.name}
              />
            </div>

            {selected.bio && (
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">{selected.bio}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Ko'nikmalar</p>
              <div className="flex flex-wrap gap-2">
                {(selected.skills as string[]).map(s => (
                  <Badge key={s} variant="purple">{SKILL_LABELS[s] || s}</Badge>
                ))}
              </div>
            </div>

            {reviewsLoading ? <Spinner size="sm" /> : reviews.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Izohlar</p>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-slate-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar src={r.author.photo} name={r.author.name} size="xs" />
                        <span className="text-sm font-semibold text-slate-800">{r.author.name}</span>
                        <span className="text-xs text-amber-500 ml-auto">{'★'.repeat(r.rating)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button fullWidth onClick={() => setBookingModal(true)}>
              Buyurtma berish
            </Button>
          </div>
        )}
      </Modal>

      {/* Booking modal */}
      <Modal
        open={bookingModal}
        onClose={() => { setBookingModal(false); setBookError(''); }}
        title={`${selected?.user.name || ''} ga buyurtma`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setBookingModal(false)}>Bekor</Button>
            <Button onClick={handleBook} loading={bookingLoading}>Yuborish</Button>
          </>
        }
      >
        <div className="space-y-4">
          {bookingError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{bookingError}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <InputEl
              label="Boshlanish sanasi *"
              type="date"
              value={bookingForm.start_date}
              onChange={e => setBookingForm(f => ({ ...f, start_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
            <InputEl
              label="Tugash sanasi *"
              type="date"
              value={bookingForm.end_date}
              onChange={e => setBookingForm(f => ({ ...f, end_date: e.target.value }))}
              min={bookingForm.start_date || new Date().toISOString().split('T')[0]}
            />
          </div>
          <InputEl
            label="Kuniga soat *"
            type="number"
            min={1} max={12}
            value={bookingForm.hours_per_day}
            onChange={e => setBookingForm(f => ({ ...f, hours_per_day: parseInt(e.target.value) || 4 }))}
          />
          {bookingForm.start_date && bookingForm.end_date && selected && (() => {
            const days = Math.max(1, Math.ceil((new Date(bookingForm.end_date).getTime() - new Date(bookingForm.start_date).getTime()) / 86400000) + 1);
            const total = days * bookingForm.hours_per_day * selected.hourly_rate;
            return (
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <p className="text-xs font-semibold text-purple-700 mb-2">Narx hisoblash</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>{days} kun × {bookingForm.hours_per_day} soat × {selected.hourly_rate.toLocaleString()} so'm</span>
                  </div>
                  <div className="flex justify-between font-bold text-purple-800 text-base pt-1 border-t border-purple-200">
                    <span>Jami:</span>
                    <span>{total.toLocaleString()} so'm</span>
                  </div>
                </div>
              </div>
            );
          })()}
          <InputEl
            label="Manzil *"
            placeholder="Toshkent, Yunusobod tumani..."
            value={bookingForm.address}
            onChange={e => setBookingForm(f => ({ ...f, address: e.target.value }))}
          />
          <InputEl
            label="Qo'shimcha eslatma"
            placeholder="Maxsus talablar..."
            value={bookingForm.notes}
            onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
