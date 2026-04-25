import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar, Search, Star, Clock, ArrowRight,
  TrendingUp, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge, STATUS_VARIANT, STATUS_LABEL } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { SkeletonStatCard, SkeletonCard } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { getMyBookings } from '../../api/bookings';
import { Booking } from '../../api/types';

const stagger = { container: { animate: { transition: { staggerChildren: 0.06 } } }, item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } } };

export default function ParentDashboard() {
  const { user, djangoUser } = useAuth();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    getMyBookings()
      .then(res => setBookings(res.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const displayName = djangoUser?.name || user?.displayName || 'Foydalanuvchi';
  const active      = bookings.filter(b => b.status === 'active').length;
  const pending     = bookings.filter(b => b.status === 'pending').length;
  const completed   = bookings.filter(b => b.status === 'completed').length;
  const recent      = bookings.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title={`Xush kelibsiz, ${displayName.split(' ')[0]} 👋`}
        subtitle="Farzandingiz parvarishi haqida barcha ma'lumotlar shu yerda"
        action={
          <Button icon={<Search className="w-4 h-4" />} size="md">
            <Link to="/dashboard/search">Enaga izlash</Link>
          </Button>
        }
      />

      {/* Stats */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Jami buyurtmalar',  value: bookings.length, icon: <Calendar className="w-5 h-5" />,  color: 'purple' as const },
          { label: 'Faol parvarish',    value: active,           icon: <CheckCircle2 className="w-5 h-5" />, color: 'green' as const },
          { label: 'Kutilmoqda',        value: pending,          icon: <Clock className="w-5 h-5" />,     color: 'blue' as const  },
          { label: 'Yakunlangan',       value: completed,        icon: <TrendingUp className="w-5 h-5" />,color: 'orange' as const},
        ].map(s => (
          <motion.div key={s.label} variants={stagger.item}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">So'nggi buyurtmalar</h2>
              <Link to="/dashboard/bookings" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                Barchasi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Calendar className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-medium text-slate-700">Buyurtmalar yo'q</p>
                <p className="text-sm mt-1">Enaga topib, birinchi buyurtma bering</p>
                <Link to="/dashboard/search">
                  <Button variant="secondary" size="sm" className="mt-4">Enaga izlash</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map(b => (
                  <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <Avatar src={b.nanny.photo} name={b.nanny.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{b.nanny.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(b.start_date).toLocaleDateString('uz-UZ')} — {new Date(b.end_date).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                      <p className="text-xs text-slate-500 mt-1">{b.total_amount.toLocaleString()} so'm</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card padding="md">
            <h2 className="font-bold text-slate-900 mb-4">Tezkor amallar</h2>
            <div className="space-y-2">
              {[
                { to: '/dashboard/search',    icon: <Search      className="w-5 h-5 text-purple-500" />, label: 'Enaga izlash',     desc: 'Yaqin atrofdagi enagalar' },
                { to: '/dashboard/bookings',  icon: <Calendar    className="w-5 h-5 text-blue-500"   />, label: 'Buyurtmalarim',    desc: 'Barcha buyurtmalarni ko\'r' },
                { to: '/dashboard/messages',  icon: <AlertCircle className="w-5 h-5 text-green-500"  />, label: 'Xabarlar',        desc: 'Enaga bilan muloqot' },
                { to: '/dashboard/profile',   icon: <Star        className="w-5 h-5 text-orange-400" />, label: 'Profilim',        desc: 'Ma\'lumotlarni yangilash' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
