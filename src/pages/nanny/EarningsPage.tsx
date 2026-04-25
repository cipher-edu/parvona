import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PageSpinner, SkeletonStatCard, SkeletonCard } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { getMyBookings } from '../../api/bookings';
import { Booking } from '../../api/types';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function EarningsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getMyBookings()
      .then(r => setBookings((r.results || []).filter(b => b.status === 'completed')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const stats = useMemo(() => {
    const total = bookings.reduce((s, b) => s + b.total_amount, 0);
    const thisMonth = bookings.filter(b => {
      if (!b.completed_at) return false;
      const d = new Date(b.completed_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, b) => s + b.total_amount, 0);
    const lastMonth = bookings.filter(b => {
      if (!b.completed_at) return false;
      const d = new Date(b.completed_at);
      const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === lm && d.getFullYear() === ly;
    }).reduce((s, b) => s + b.total_amount, 0);

    return { total, thisMonth, lastMonth, count: bookings.length };
  }, [bookings, now]);

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => {
      const d = new Date(b.completed_at || b.updated_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + b.total_amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([key, amount]) => {
        const [year, month] = key.split('-');
        return { label: `${MONTHS_UZ[parseInt(month) - 1]} ${year}`, amount };
      });
  }, [bookings]);

  const maxAmount = monthlyData.reduce((m, d) => Math.max(m, d.amount), 1);

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader title="Daromadim" subtitle="Moliyaviy hisobot va statistika" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Jami daromad"     value={`${stats.total.toLocaleString()} so'm`}      icon={<TrendingUp  className="w-5 h-5" />} color="purple" />
        <StatCard label="Bu oy"            value={`${stats.thisMonth.toLocaleString()} so'm`}   icon={<CreditCard  className="w-5 h-5" />} color="green"  />
        <StatCard label="O'tgan oy"        value={`${stats.lastMonth.toLocaleString()} so'm`}   icon={<ArrowUpRight className="w-5 h-5"/>} color="blue"   />
        <StatCard label="Yakunlangan ish"  value={`${stats.count} ta`}                          icon={<Calendar    className="w-5 h-5" />} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <Card padding="md">
          <h3 className="font-bold text-slate-900 mb-5">Oylik daromad</h3>
          {monthlyData.length === 0 ? (
            <EmptyState icon={<TrendingUp className="w-7 h-7" />} title="Ma'lumot yo'q" />
          ) : (
            <div className="space-y-3">
              {monthlyData.map(d => (
                <div key={d.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{d.label}</span>
                    <span className="font-semibold text-slate-900">{d.amount.toLocaleString()} so'm</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${(d.amount / maxAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent transactions */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">So'nggi to'lovlar</h3>
          </div>
          {bookings.length === 0 ? (
            <EmptyState icon={<CreditCard className="w-7 h-7" />} title="To'lovlar yo'q" />
          ) : (
            <div className="divide-y divide-slate-50">
              {bookings.slice(0, 8).map(b => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar src={b.parent.photo} name={b.parent.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{b.parent.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(b.completed_at || b.updated_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+{b.total_amount.toLocaleString()} so'm</p>
                    <Badge variant="green" size="sm">Yakunlangan</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
