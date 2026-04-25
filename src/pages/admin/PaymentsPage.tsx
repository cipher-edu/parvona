import React, { useCallback, useEffect, useState } from 'react';
import { Search, CreditCard, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner, SkeletonTable } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { api } from '../../api/client';

interface AdminPayment {
  id: string;
  booking: { id: string; parent: { name: string; photo: string | null }; nanny: { name: string } };
  provider: 'payme' | 'click' | 'uzum';
  provider_tx_id: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paid_at: string | null;
  created_at: string;
}

interface PaymentStats {
  total_revenue: number;
  paid_count:    number;
  failed_count:  number;
  pending_count: number;
}

const STATUS_OPTS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'pending',   label: 'Kutilmoqda'  },
  { value: 'paid',      label: 'To\'langan'  },
  { value: 'failed',    label: 'Muvaffaqiyatsiz' },
  { value: 'refunded',  label: 'Qaytarilgan' },
  { value: 'cancelled', label: 'Bekor'       },
];

const PROVIDER_OPTS = [
  { value: '',       label: 'Barcha provayderlar' },
  { value: 'payme',  label: 'Payme'               },
  { value: 'click',  label: 'Click'               },
  { value: 'uzum',   label: 'Uzum Bank'           },
];

const PAYMENT_STATUS_BADGE: Record<string, 'green' | 'red' | 'yellow' | 'slate' | 'purple'> = {
  pending:   'yellow',
  paid:      'green',
  failed:    'red',
  refunded:  'purple',
  cancelled: 'slate',
};
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending:   "Kutilmoqda",
  paid:      "To'langan",
  failed:    "Muvaffaqiyatsiz",
  refunded:  "Qaytarilgan",
  cancelled: "Bekor",
};
const PROVIDER_COLOR: Record<string, string> = {
  payme: 'text-blue-600 bg-blue-50',
  click: 'text-green-600 bg-green-50',
  uzum:  'text-purple-600 bg-purple-50',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [stats, setStats]       = useState<PaymentStats | null>(null);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [provider, setProvider] = useState('');
  const [page, setPage]         = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        api.get<{ count: number; results: AdminPayment[] }>('/api/admin/payments/', {
          search:   search || undefined,
          status:   status || undefined,
          provider: provider || undefined,
          page,
        } as Record<string, string | number | undefined>),
        api.get<PaymentStats>('/api/admin/payments/stats/'),
      ]);
      setPayments(res.results || []);
      setTotal(res.count || 0);
      setStats(s);
    } catch (err) { console.error('To\'lovlarni yuklashda xatolik:', err); setPayments([]); }
    finally { setLoading(false); }
  }, [search, status, provider, page]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader title="To'lovlar" subtitle={`Jami ${total} ta tranzaksiya`} />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Jami daromad"         value={`${(stats.total_revenue/100).toLocaleString()} so'm`} icon={<TrendingUp  className="w-5 h-5" />} color="purple" />
          <StatCard label="Muvaffaqiyatli"        value={stats.paid_count}                                     icon={<CheckCircle2 className="w-5 h-5" />} color="green"  />
          <StatCard label="Muvaffaqiyatsiz"       value={stats.failed_count}                                   icon={<XCircle     className="w-5 h-5" />} color="orange" />
          <StatCard label="Kutilmoqda"            value={stats.pending_count}                                  icon={<CreditCard  className="w-5 h-5" />} color="blue"   />
        </div>
      )}

      <Card padding="none">
        <div className="flex flex-wrap gap-3 p-5 border-b border-slate-100">
          <div className="flex-1 min-w-44">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Tranzaksiya ID yoki ism..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select options={PROVIDER_OPTS} value={provider} onChange={e => { setProvider(e.target.value); setPage(1); }} className="w-48" />
          <Select options={STATUS_OPTS}   value={status}   onChange={e => { setStatus(e.target.value);   setPage(1); }} className="w-44" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><PageSpinner /></div>
        ) : payments.length === 0 ? (
          <EmptyState icon={<CreditCard className="w-8 h-8" />} title="To'lovlar topilmadi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-5 py-3">Ota-ona</th>
                  <th className="text-left px-5 py-3">Enaga</th>
                  <th className="text-left px-5 py-3">Provayder</th>
                  <th className="text-left px-5 py-3">Summa</th>
                  <th className="text-left px-5 py-3">Holat</th>
                  <th className="text-left px-5 py-3">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={p.booking?.parent?.photo ?? null} name={p.booking?.parent?.name ?? '—'} size="sm" />
                        <span className="text-sm font-medium text-slate-900">{p.booking?.parent?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">{p.booking?.nanny?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${PROVIDER_COLOR[p.provider]}`}>
                        {p.provider}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-900">
                      {(p.amount / 100).toLocaleString()} so'm
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={PAYMENT_STATUS_BADGE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('uz-UZ')}
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
    </div>
  );
}
