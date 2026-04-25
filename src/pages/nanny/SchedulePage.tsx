import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Palmtree, Save, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getMyBookings } from '../../api/bookings';
import { getMyAvailability, saveMyAvailability, AvailabilityDay, AvailabilityStatus } from '../../api/availability';
import { Booking } from '../../api/types';
import { useAuthStore } from '../../store/useAuthStore';

const DAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const MONTHS_UZ  = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

function getMonthDays(year: number, month: number) {
  const first    = new Date(year, month, 1).getDay();
  const adjusted = first === 0 ? 6 : first - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { adjusted, daysInMonth };
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const STATUS_CYCLE: AvailabilityStatus[] = ['available', 'busy', 'vacation'];
const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Bo\'sh',
  busy:      'Band',
  vacation:  'Ta\'tilda',
};
const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
  busy:      'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
  vacation:  'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
};
const STATUS_DOT: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-500',
  busy:      'bg-rose-500',
  vacation:  'bg-amber-400',
};

export default function SchedulePage() {
  const role = useAuthStore(s => s.djangoUser?.role);
  const isNanny = role === 'nanny';

  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [availability,  setAvailability]  = useState<Record<string, AvailabilityStatus>>({});
  const [pendingChanges, setPending]      = useState<Record<string, AvailabilityStatus>>({});
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        getMyBookings(),
        isNanny ? getMyAvailability(year, month + 1) : Promise.resolve([] as AvailabilityDay[]),
      ]);
      setBookings((bRes.results || []).filter(b => ['pending','confirmed','active'].includes(b.status)));
      const map: Record<string, AvailabilityStatus> = {};
      (aRes as AvailabilityDay[]).forEach(a => { map[a.date] = a.status; });
      setAvailability(map);
      setPending({});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year, month, isNanny]);

  useEffect(() => { loadData(); }, [loadData]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const getBookingsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return bookings.filter(b => {
      const s = new Date(b.start_date), e = new Date(b.end_date);
      return date >= s && date <= e;
    });
  };

  const getDayStatus = (dateStr: string): AvailabilityStatus => {
    if (pendingChanges[dateStr] !== undefined) return pendingChanges[dateStr];
    return availability[dateStr] ?? 'available';
  };

  const cycleStatus = (dateStr: string) => {
    if (!isNanny) return;
    const cur = getDayStatus(dateStr);
    const idx = STATUS_CYCLE.indexOf(cur);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setPending(prev => ({ ...prev, [dateStr]: next }));
    setSelected(dateStr);
  };

  const hasPending = Object.keys(pendingChanges).length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const items: AvailabilityDay[] = Object.entries(pendingChanges).map(([date, status]) => ({ date, status }));
      await saveMyAvailability(items);
      setAvailability(prev => {
        const next = { ...prev };
        items.forEach(({ date, status }) => {
          if (status === 'available') delete next[date];
          else next[date] = status;
        });
        return next;
      });
      setPending({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const { adjusted, daysInMonth } = getMonthDays(year, month);
  const today = new Date();

  const selectedDate     = selected ? new Date(selected) : null;
  const selectedBookings = selectedDate
    ? bookings.filter(b => {
        const s = new Date(b.start_date), e = new Date(b.end_date);
        return selectedDate >= s && selectedDate <= e;
      })
    : [];
  const selectedStatus = selected ? getDayStatus(selected) : 'available';

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-1">
        <PageHeader
          title="Ish jadvali"
          subtitle={isNanny ? 'Mavjudligingizni belgilang — kunni bosing' : 'Buyurtmalaringiz bo\'yicha kalendar'}
        />
        {isNanny && hasPending && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button
              variant="primary"
              size="sm"
              icon={saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              loading={saving}
              onClick={handleSave}
            >
              {saved ? 'Saqlandi!' : `Saqlash (${Object.keys(pendingChanges).length})`}
            </Button>
          </motion.div>
        )}
      </div>

      {isNanny && (
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          Kunni bosing — bo'sh → band → ta'til → bo'sh tsikli. O'zgarishlar saqlagunga qadar saqlanmaydi.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card padding="md">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={prevMonth} />
              <h3 className="font-bold text-slate-900">{MONTHS_UZ[month]} {year}</h3>
              <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={nextMonth} />
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_SHORT.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: adjusted }, (_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day     = i + 1;
                const dateStr = toDateStr(year, month, day);
                const dayBks  = getBookingsForDay(day);
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                const isSelected = selected === dateStr;
                const status  = getDayStatus(dateStr);
                const isPast  = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const hasPendingThis = pendingChanges[dateStr] !== undefined;

                let cellClass = 'relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ';

                if (isSelected) {
                  cellClass += 'bg-purple-600 text-white shadow-md ';
                } else if (dayBks.length > 0) {
                  cellClass += 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 ';
                } else if (isNanny && !isPast) {
                  cellClass += STATUS_COLORS[status] + ' ';
                } else {
                  cellClass += 'text-slate-700 hover:bg-slate-100 ';
                }

                if (isPast) cellClass += 'opacity-40 cursor-default ';
                else if (isNanny) cellClass += 'cursor-pointer ';

                return (
                  <button
                    key={day}
                    onClick={() => {
                      if (isPast) return;
                      if (isNanny) cycleStatus(dateStr);
                      else setSelected(isSelected ? null : dateStr);
                    }}
                    className={cellClass}
                  >
                    {day}
                    {/* booking dot */}
                    {dayBks.length > 0 && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`} />
                    )}
                    {/* availability dot for nanny */}
                    {isNanny && !isPast && dayBks.length === 0 && status !== 'available' && !isSelected && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                    )}
                    {/* pending indicator */}
                    {hasPendingThis && !isSelected && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    )}
                    {isToday && (
                      <span className={`absolute inset-0 rounded-xl ring-2 ${isSelected ? 'ring-white' : 'ring-purple-500'} pointer-events-none`} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Selected day info */}
          <Card padding="md">
            <h3 className="font-bold text-slate-900 mb-4">
              {selectedDate
                ? `${selectedDate.getDate()} ${MONTHS_UZ[selectedDate.getMonth()]}`
                : 'Sana tanlang'}
            </h3>

            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Clock className="w-10 h-10 mb-2 text-slate-200" />
                  <p className="text-sm">Kalendardan kun tanlang</p>
                </motion.div>
              ) : (
                <motion.div key={selected} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {/* Availability status (nanny only) */}
                  {isNanny && (
                    <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-sm font-medium ${STATUS_COLORS[selectedStatus]}`}>
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[selectedStatus]}`} />
                      {STATUS_LABELS[selectedStatus]}
                      {pendingChanges[selected] !== undefined && (
                        <span className="ml-auto text-xs text-purple-500 font-normal">* o'zgartirildi</span>
                      )}
                    </div>
                  )}

                  {selectedBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                      <p className="text-sm">Bu kun buyurtma yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedBookings.map(b => (
                        <div key={b.id} className="bg-purple-50 rounded-2xl p-3 border border-purple-100">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <p className="text-sm font-semibold text-slate-900">{b.parent.name}</p>
                          </div>
                          <p className="text-xs text-slate-600 ml-4">{b.hours_per_day} soat · {b.address}</p>
                          <div className="ml-4 mt-1.5">
                            <Badge variant="purple" size="sm">
                              {b.status === 'active' ? 'Faol' : b.status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Legend */}
          <Card padding="sm">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Izoh</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-full bg-purple-500" /> Buyurtma bor
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-full ring-2 ring-purple-500 ring-offset-1" /> Bugungi kun
              </div>
              {isNanny && (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> Bo'sh
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-rose-500" /> Band
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-amber-400" /> Ta'tilda
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-purple-400" /> * Saqlanmagan
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
