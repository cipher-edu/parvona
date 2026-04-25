import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, HeartHandshake, Calendar, CreditCard, TrendingUp, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge, STATUS_VARIANT, STATUS_LABEL } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PageSpinner, SkeletonStatCard, SkeletonCard, SkeletonTable } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { api } from '../../api/client';

interface AdminStats {
  total_users:    number;
  total_nannies:  number;
  total_bookings: number;
  total_revenue:  number;
  pending_verifications: number;
  active_bookings: number;
  new_users_this_month: number;
  revenue_growth: number;
}

interface RecentBooking {
  id: string;
  parent: { name: string; photo: string | null };
  nanny:  { name: string; photo: string | null };
  status: string;
  total_amount: number;
  created_at: string;
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item:      { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
};

export default function AdminDashboard() {
  const [stats, setStats]             = useState<AdminStats | null>(null);
  const [recentBookings, setRecent]   = useState<RecentBooking[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<AdminStats>('/api/admin/stats/'),
      api.get<{ results: RecentBooking[] }>('/api/admin/bookings/recent/'),
    ])
      .then(([s, b]) => { setStats(s); setRecent(b.results || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const s = stats;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader title="Admin boshqaruv paneli" subtitle="Parvona platformasi umumiy ko'rinishi" />

      {/* Main stats */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Jami foydalanuvchilar', value: s?.total_users ?? 0,    icon: <Users         className="w-5 h-5" />, color: 'purple' as const, trend: s ? { value: s.new_users_this_month, label: 'bu oy yangi' } : undefined },
          { label: 'Enagalar',              value: s?.total_nannies ?? 0,  icon: <HeartHandshake className="w-5 h-5"/>, color: 'blue'   as const },
          { label: 'Jami buyurtmalar',      value: s?.total_bookings ?? 0, icon: <Calendar      className="w-5 h-5" />, color: 'green'  as const },
          { label: 'Jami daromad',          value: s ? `${(s.total_revenue / 100).toLocaleString()} so'm` : '0', icon: <CreditCard className="w-5 h-5" />, color: 'orange' as const, trend: s ? { value: s.revenue_growth, label: 'o\'tgan oy' } : undefined },
        ].map(st => (
          <motion.div key={st.label} variants={stagger.item}>
            <StatCard {...st} />
          </motion.div>
        ))}
      </motion.div>

      {/* Alert cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card padding="md" className="border-orange-200 bg-orange-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{s?.pending_verifications ?? 0}</p>
                <p className="text-sm text-orange-600">Verifikatsiya kutmoqda</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card padding="md" className="border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{s?.active_bookings ?? 0}</p>
                <p className="text-sm text-green-600">Faol buyurtmalar</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card padding="md" className="border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{s?.revenue_growth ?? 0}%</p>
                <p className="text-sm text-blue-600">Daromad o'sishi</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Monthly overview mini-chart */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card padding="md">
          <h3 className="font-bold text-slate-900 mb-1">Platform holati</h3>
          <p className="text-xs text-slate-500 mb-4">Asosiy ko'rsatkichlar</p>
          <div className="space-y-4">
            {[
              { label: 'Faol buyurtmalar', value: s?.active_bookings ?? 0, max: s?.total_bookings || 1, color: 'bg-green-500' },
              { label: 'Tasdiqlash kutmoqda', value: s?.pending_verifications ?? 0, max: Math.max(s?.total_nannies || 1, 1), color: 'bg-orange-500' },
              { label: 'Bu oy yangi users', value: s?.new_users_this_month ?? 0, max: s?.total_users || 1, color: 'bg-purple-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <h3 className="font-bold text-slate-900 mb-1">Moliyaviy ko'rinish</h3>
          <p className="text-xs text-slate-500 mb-4">To'lovlar statistikasi</p>
          <div className="space-y-3">
            {[
              { label: 'Jami foydalanuvchilar', value: s?.total_users ?? 0, icon: '👥', color: 'text-purple-700 bg-purple-50' },
              { label: 'Jami enagalar', value: s?.total_nannies ?? 0, icon: '👩', color: 'text-blue-700 bg-blue-50' },
              { label: 'Jami buyurtmalar', value: s?.total_bookings ?? 0, icon: '📋', color: 'text-green-700 bg-green-50' },
              { label: 'Daromad o\'sishi', value: `${s?.revenue_growth ?? 0}%`, icon: '📈', color: 'text-orange-700 bg-orange-50' },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${item.color}`}>
                <span className="text-sm font-medium">{item.icon} {item.label}</span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">So'nggi buyurtmalar</h2>
        </div>
        {recentBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <AlertCircle className="w-10 h-10 mb-2 text-slate-200" />
            <p className="text-sm">Ma'lumot mavjud emas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-6 py-3">Ota-ona</th>
                  <th className="text-left px-6 py-3">Enaga</th>
                  <th className="text-left px-6 py-3">Holat</th>
                  <th className="text-left px-6 py-3">Summa</th>
                  <th className="text-left px-6 py-3">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={b.parent.photo} name={b.parent.name} size="sm" />
                        <span className="text-sm font-medium text-slate-900">{b.parent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={b.nanny.photo} name={b.nanny.name} size="sm" />
                        <span className="text-sm font-medium text-slate-900">{b.nanny.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {b.total_amount.toLocaleString()} so'm
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-slate-500">
                        {new Date(b.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
