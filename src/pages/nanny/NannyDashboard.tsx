import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar, TrendingUp, Star, Clock, ArrowRight,
  CheckCircle2, AlertCircle, Users,
} from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge, STATUS_VARIANT, STATUS_LABEL } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PageSpinner, SkeletonStatCard, SkeletonCard } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { getMyBookings, updateBookingStatus } from '../../api/bookings';
import { getMyNannyProfile } from '../../api/nannies';
import { Booking, BookingStatus, Nanny } from '../../api/types';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item:      { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
};

export default function NannyDashboard() {
  const { user, djangoUser } = useAuth();
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [profile, setProfile]       = useState<Nanny | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([getMyBookings(), getMyNannyProfile()])
      .then(([bRes, p]) => {
        setBookings(bRes.results || []);
        setProfile(p);
      })
      .catch((err) => { console.error('Dashboard yuklashda xato:', err); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    </div>
  );

  const displayName  = djangoUser?.name || user?.displayName || 'Enaga';
  const pending      = bookings.filter(b => b.status === 'pending');
  const active       = bookings.filter(b => b.status === 'active').length;
  const completed    = bookings.filter(b => b.status === 'completed').length;
  const monthEarnings = bookings
    .filter(b => b.status === 'completed' && b.completed_at && new Date(b.completed_at).getMonth() === new Date().getMonth())
    .reduce((s, b) => s + b.total_amount, 0);

  const handleStatus = async (id: string, status: BookingStatus, reason?: string) => {
    try {
      const updated = await updateBookingStatus(id, status, reason);
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title={`Xush kelibsiz, ${displayName.split(' ')[0]} 👋`}
        subtitle={profile ? `Reytingingiz: ${parseFloat(profile.rating).toFixed(1)} ⭐ | ${profile.reviews_count} izoh` : ''}
        action={
          <Link to="/dashboard/profile">
            <Button variant="secondary" size="sm">Profilni tahrirlash</Button>
          </Link>
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
          { label: 'Kutilayotgan',    value: pending.length,                        icon: <AlertCircle className="w-5 h-5" />,  color: 'orange' as const },
          { label: 'Faol buyurtmalar',value: active,                                icon: <CheckCircle2 className="w-5 h-5" />, color: 'green'  as const },
          { label: 'Yakunlangan',     value: completed,                             icon: <Calendar    className="w-5 h-5" />,  color: 'blue'   as const },
          { label: 'Bu oy daromad',   value: `${monthEarnings.toLocaleString()} so'm`, icon: <TrendingUp  className="w-5 h-5" />,  color: 'purple' as const },
        ].map(s => (
          <motion.div key={s.label} variants={stagger.item}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending requests */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Yangi so'rovlar</h2>
              <Link to="/dashboard/bookings" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                Barchasi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Calendar className="w-9 h-9 text-slate-300 mb-2" />
                <p className="text-sm">Yangi so'rovlar yo'q</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.slice(0, 4).map(b => (
                  <div key={b.id} className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar src={b.parent.photo} name={b.parent.name} size="md" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{b.parent.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(b.start_date).toLocaleDateString('uz-UZ')} — {new Date(b.end_date).toLocaleDateString('uz-UZ')} · {b.hours_per_day} soat/kun
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{b.address}</p>
                      </div>
                      <span className="text-sm font-bold text-purple-700 shrink-0">
                        {b.total_amount.toLocaleString()} so'm
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleStatus(b.id, 'confirmed')}
                        className="flex-1"
                      >
                        Tasdiqlash
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<AlertCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleStatus(b.id, 'cancelled', 'Enaga tomonidan rad etildi')}
                        className="flex-1"
                      >
                        Rad etish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <Card padding="md">
            <h2 className="font-bold text-slate-900 mb-4">Tezkor amallar</h2>
            <div className="space-y-2">
              {[
                { to: '/dashboard/schedule', icon: <Clock       className="w-5 h-5 text-blue-500"   />, label: 'Ish jadvalim',  desc: 'Bandligingizni belgilang'    },
                { to: '/dashboard/earnings', icon: <TrendingUp  className="w-5 h-5 text-green-500"  />, label: 'Daromadim',     desc: 'Moliyaviy hisobot'          },
                { to: '/dashboard/messages', icon: <Users       className="w-5 h-5 text-purple-500" />, label: 'Xabarlar',      desc: 'Ota-onalar bilan muloqot'   },
                { to: '/dashboard/profile',  icon: <Star        className="w-5 h-5 text-amber-400"  />, label: 'Profilim',      desc: 'Ko\'rish va tahrirlash'     },
              ].map(item => (
                <Link key={item.to} to={item.to} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
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

          {profile && (
            <Card padding="md" className="bg-gradient-to-br from-purple-50 to-white">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">Profil ko'rsatkichlari</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Reyting</span>
                  <span className="font-bold text-slate-900">{parseFloat(profile.rating).toFixed(1)} / 5.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Jami izohlar</span>
                  <span className="font-bold text-slate-900">{profile.reviews_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Holat</span>
                  <Badge variant={profile.status === 'active' ? 'green' : 'slate'}>
                    {profile.status === 'active' ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Verifikatsiya</span>
                  <Badge variant={profile.is_verified ? 'green' : 'yellow'}>
                    {profile.is_verified ? 'Tasdiqlangan' : 'Kutilmoqda'}
                  </Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
