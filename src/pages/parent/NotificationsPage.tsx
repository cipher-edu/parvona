import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell, CheckCheck,
  CheckCircle, XCircle, Star, Calendar, CreditCard, ShieldCheck, MessageSquare,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getNotifications, getUnreadCount, markAllAsRead } from '../../api/notifications';
import { Notification } from '../../api/types';

const TYPE_COLOR: Record<string, string> = {
  booking_confirmed: 'bg-green-100 text-green-600',
  booking_cancelled: 'bg-red-100 text-red-600',
  booking_started:   'bg-purple-100 text-purple-600',
  booking_completed: 'bg-blue-100 text-blue-600',
  new_message:       'bg-orange-100 text-orange-600',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  booking_confirmed: <CheckCircle className="w-4 h-4" />,
  booking_cancelled: <XCircle className="w-4 h-4" />,
  booking_completed: <Star className="w-4 h-4" />,
  new_booking:       <Calendar className="w-4 h-4" />,
  payment_received:  <CreditCard className="w-4 h-4" />,
  nanny_verified:    <ShieldCheck className="w-4 h-4" />,
  review_received:   <MessageSquare className="w-4 h-4" />,
  new_message:       <MessageSquare className="w-4 h-4" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [marking, setMarking]             = useState(false);

  useEffect(() => {
    Promise.all([getNotifications(), getUnreadCount()])
      .then(([res, count]) => {
        setNotifications(res.results || []);
        setUnread(count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await markAllAsRead();
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } finally {
      setMarking(false);
    }
  };

  const handleMarkOne = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader
        title="Bildirishnomalar"
        subtitle={unread > 0 ? `${unread} ta o'qilmagan` : 'Hammasi o\'qilgan'}
        action={
          unread > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCheck className="w-4 h-4" />}
              loading={marking}
              onClick={handleMarkAll}
            >
              Barchasini o'qildi deb belgilash
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="Bildirishnomalar yo'q"
          description="Yangi bildirishnomalar bu yerda ko'rinadi"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div onClick={() => handleMarkOne(n.id)} className="cursor-pointer">
              <Card
                padding="sm"
                className={`relative overflow-hidden transition-all ${!n.read_at ? 'border-purple-200 bg-purple-50/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${TYPE_COLOR[n.type] || 'bg-slate-100 text-slate-500'}`}>
                    {TYPE_ICON[n.type] || <Bell className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {new Date(n.created_at).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                  {!n.read_at && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              </Card>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
