import React, { useCallback, useEffect, useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Badge, STATUS_VARIANT, STATUS_LABEL } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner, SkeletonTable } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { api } from '../../api/client';
import { Booking } from '../../api/types';

const STATUS_OPTS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'pending',   label: 'Kutilmoqda'    },
  { value: 'confirmed', label: 'Tasdiqlangan'  },
  { value: 'active',    label: 'Faol'          },
  { value: 'completed', label: 'Yakunlangan'   },
  { value: 'cancelled', label: 'Bekor'         },
  { value: 'disputed',  label: 'Munozarali'    },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ count: number; results: Booking[] }>('/api/admin/bookings/', {
        search: search || undefined,
        status: status || undefined,
        page,
      } as Record<string, string | number | undefined>);
      setBookings(res.results || []);
      setTotal(res.count || 0);
    } catch (err) { console.error('Buyurtmalarni yuklashda xatolik:', err); setBookings([]); }
    finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleResolve = async (bookingId: string) => {
    setResolving(true);
    try {
      const updated = await api.post<Booking>(`/api/admin/bookings/${bookingId}/resolve/`);
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
      setSelected(null);
    } catch (err) { console.error('Nizoni hal qilishda xatolik:', err); }
    finally { setResolving(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader title="Buyurtmalar boshqaruvi" subtitle={`Jami ${total} ta buyurtma`} />

      <Card padding="none">
        <div className="flex flex-wrap gap-3 p-5 border-b border-slate-100">
          <div className="flex-1 min-w-44">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Ota-ona yoki enaga ismi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select options={STATUS_OPTS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><PageSpinner /></div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={<Calendar className="w-8 h-8" />} title="Buyurtmalar topilmadi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-5 py-3">Ota-ona</th>
                  <th className="text-left px-5 py-3">Enaga</th>
                  <th className="text-left px-5 py-3">Muddati</th>
                  <th className="text-left px-5 py-3">Holat</th>
                  <th className="text-left px-5 py-3">Summa</th>
                  <th className="text-left px-5 py-3">Sana</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={b.parent.photo} name={b.parent.name} size="sm" />
                        <span className="text-sm font-medium text-slate-900">{b.parent.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={b.nanny.photo} name={b.nanny.name} size="sm" />
                        <span className="text-sm font-medium text-slate-900">{b.nanny.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {new Date(b.start_date).toLocaleDateString('uz-UZ')} — {new Date(b.end_date).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">
                      {b.total_amount.toLocaleString()} so'm
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(b.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      {b.status === 'disputed' && (
                        <Button size="sm" variant="secondary" loading={resolving} onClick={() => handleResolve(b.id)}>
                          Hal qilish
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Jami {total} ta · {page}/{totalPages} sahifa</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>Oldingi</Button>
              <Button variant="outline" size="sm" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Keyingi</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Buyurtma tafsilotlari" size="lg">
        {selected && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Ota-ona</p>
                <div className="flex items-center gap-2">
                  <Avatar src={selected.parent.photo} name={selected.parent.name} size="sm" />
                  <span className="font-semibold">{selected.parent.name}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Enaga</p>
                <div className="flex items-center gap-2">
                  <Avatar src={selected.nanny.photo} name={selected.nanny.name} size="sm" />
                  <span className="font-semibold">{selected.nanny.name}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Holat: </span><Badge variant={STATUS_VARIANT[selected.status]}>{STATUS_LABEL[selected.status]}</Badge></div>
              <div><span className="text-slate-500">Summa: </span><span className="font-bold text-purple-700">{selected.total_amount.toLocaleString()} so'm</span></div>
              <div><span className="text-slate-500">Boshlanish: </span>{new Date(selected.start_date).toLocaleDateString('uz-UZ')}</div>
              <div><span className="text-slate-500">Tugash: </span>{new Date(selected.end_date).toLocaleDateString('uz-UZ')}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-sm text-slate-600">
              <p className="text-xs font-semibold text-purple-700 mb-1">Narx tafsiloti</p>
              <span>
                {selected.hours_per_day} soat/kun × {Math.ceil((new Date(selected.end_date).getTime() - new Date(selected.start_date).getTime()) / 86400000) + 1} kun × {selected.hourly_rate.toLocaleString()} so'm = <span className="font-bold text-purple-800">{selected.total_amount.toLocaleString()} so'm</span>
              </span>
            </div>
            {selected.address && <p><span className="text-slate-500">Manzil: </span>{selected.address}</p>}
            {selected.notes && <p className="bg-slate-50 rounded-xl p-3">{selected.notes}</p>}
            {selected.cancel_reason && (
              <p className="bg-red-50 text-red-700 rounded-xl p-3">Bekor sababi: {selected.cancel_reason}</p>
            )}
            {selected.status === 'disputed' && (
              <div className="pt-2">
                <Button fullWidth loading={resolving} onClick={() => handleResolve(selected.id)}>
                  Nizoni hal qilish
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
