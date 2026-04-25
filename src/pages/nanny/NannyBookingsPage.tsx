import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle, ChevronDown, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge, STATUS_VARIANT, STATUS_LABEL } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getMyBookings, updateBookingStatus } from '../../api/bookings';
import { Booking, BookingStatus } from '../../api/types';

const STATUS_FILTER = [
  { value: '',           label: 'Barcha holatlar' },
  { value: 'pending',    label: 'Yangi so\'rovlar' },
  { value: 'confirmed',  label: 'Tasdiqlangan'    },
  { value: 'active',     label: 'Faol'            },
  { value: 'completed',  label: 'Yakunlangan'     },
  { value: 'cancelled',  label: 'Bekor qilingan'  },
];

export default function NannyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getMyBookings()
      .then(r => setBookings(r.results || []))
      .catch(err => console.error('Buyurtmalarni yuklashda xatolik:', err))
      .finally(() => setLoading(false));
  }, []);

  const handle = async (id: string, status: BookingStatus, reason?: string) => {
    try {
      const updated = await updateBookingStatus(id, status, reason);
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (err) { console.error('Buyurtma holatini yangilashda xatolik:', err); }
  };

  const openChat = (bookingId: string) => {
    navigate(`/dashboard/messages?booking=${bookingId}`);
  };

  if (loading) return <PageSpinner />;

  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <PageHeader
        title="Buyurtmalar"
        subtitle={`Jami ${bookings.length} ta buyurtma`}
        action={
          <Select
            options={STATUS_FILTER}
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
          description="Yangi buyurtmalar kelganda bu yerda ko'rinadi"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card padding="none">
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                >
                  <div className="flex items-center gap-4 p-5">
                    <Avatar src={b.parent.photo} name={b.parent.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{b.parent.name}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                              {new Date(b.start_date).toLocaleDateString('uz-UZ')} — {new Date(b.end_date).toLocaleDateString('uz-UZ')}
                            </span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{b.hours_per_day} soat/kun</span>
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
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-slate-100">
                    <div className="p-5 space-y-3">
                      {b.address && (
                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" /> {b.address}
                        </p>
                      )}
                      {b.notes && <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{b.notes}</p>}

                      {/* Price breakdown */}
                      {(() => {
                        const start = new Date(b.start_date);
                        const end   = new Date(b.end_date);
                        const days  = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        return (
                          <div className="bg-purple-50 rounded-xl p-3 text-sm text-slate-700 border border-purple-100">
                            <p className="text-xs text-slate-500 mb-1">
                              {b.start_date} — {b.end_date}
                            </p>
                            <p className="font-medium">
                              {days} kun × {b.hours_per_day} soat × {b.hourly_rate.toLocaleString()} so'm = <span className="font-bold text-purple-700">{b.total_amount.toLocaleString()} so'm</span>
                            </p>
                          </div>
                        );
                      })()}

                      <div className="flex gap-2 flex-wrap pt-1">
                        {b.status === 'pending' && (
                          <>
                            <Button size="sm" variant="primary" icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handle(b.id, 'confirmed')}>
                              Tasdiqlash
                            </Button>
                            <Button size="sm" variant="danger" icon={<AlertCircle className="w-3.5 h-3.5" />}
                              onClick={() => handle(b.id, 'cancelled', 'Enaga tomonidan rad etildi')}>
                              Rad etish
                            </Button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <Button size="sm" variant="primary" onClick={() => handle(b.id, 'active')}>
                            Boshlash
                          </Button>
                        )}
                        {b.status === 'active' && (
                          <Button size="sm" variant="primary" icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handle(b.id, 'completed')}>
                            Yakunlash
                          </Button>
                        )}
                        {['pending', 'confirmed', 'active'].includes(b.status) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<MessageSquare className="w-3.5 h-3.5" />}
                            onClick={() => openChat(b.id)}
                          >
                            Xabar yuborish
                          </Button>
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
    </div>
  );
}
