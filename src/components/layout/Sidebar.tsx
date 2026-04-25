import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Calendar, MessageSquare, Bell,
  Settings, LogOut, Search, TrendingUp, Clock,
  Users, ShieldCheck, CreditCard, HeartHandshake, X, Star, LifeBuoy, Gift, Crown,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  unreadNotifications?: number;
  pendingBookings?: number;
}

function useNavItems(role: string | null, unreadNotifications = 0, pendingBookings = 0): NavItem[] {
  if (role === 'parent') {
    return [
      { to: '/dashboard',          icon: <LayoutDashboard className="w-5 h-5" />, label: 'Bosh sahifa'  },
      { to: '/dashboard/search',   icon: <Search          className="w-5 h-5" />, label: 'Enaga izlash' },
      { to: '/dashboard/bookings', icon: <Calendar        className="w-5 h-5" />, label: 'Buyurtmalar', badge: pendingBookings   },
      { to: '/dashboard/messages', icon: <MessageSquare   className="w-5 h-5" />, label: 'Xabarlar'     },
      { to: '/dashboard/notifications', icon: <Bell       className="w-5 h-5" />, label: 'Bildirishnomalar', badge: unreadNotifications },
      { to: '/dashboard/my-reviews', icon: <Star          className="w-5 h-5" />, label: 'Mening reytingim' },
      { to: '/dashboard/referral',  icon: <Gift           className="w-5 h-5" />, label: 'Referal'      },
      { to: '/dashboard/support',  icon: <LifeBuoy        className="w-5 h-5" />, label: 'Yordam'       },
      { to: '/dashboard/profile',  icon: <Settings        className="w-5 h-5" />, label: 'Profil'       },
    ];
  }
  if (role === 'nanny') {
    return [
      { to: '/dashboard',           icon: <LayoutDashboard className="w-5 h-5" />, label: 'Bosh sahifa'   },
      { to: '/dashboard/bookings',  icon: <Calendar        className="w-5 h-5" />, label: 'Buyurtmalar', badge: pendingBookings   },
      { to: '/dashboard/schedule',  icon: <Clock           className="w-5 h-5" />, label: 'Ish jadvali'  },
      { to: '/dashboard/earnings',  icon: <TrendingUp      className="w-5 h-5" />, label: 'Daromad'      },
      { to: '/dashboard/messages',  icon: <MessageSquare   className="w-5 h-5" />, label: 'Xabarlar'     },
      { to: '/dashboard/reviews',   icon: <Star            className="w-5 h-5" />, label: 'Sharhlar'     },
      { to: '/dashboard/notifications', icon: <Bell        className="w-5 h-5" />, label: 'Bildirishnomalar', badge: unreadNotifications },
      { to: '/dashboard/pro',        icon: <Crown          className="w-5 h-5" />, label: 'Parvona Pro'  },
      { to: '/dashboard/referral',   icon: <Gift           className="w-5 h-5" />, label: 'Referal'      },
      { to: '/dashboard/support',   icon: <LifeBuoy        className="w-5 h-5" />, label: 'Yordam'       },
      { to: '/dashboard/profile',   icon: <Settings        className="w-5 h-5" />, label: 'Profil'       },
    ];
  }
  if (role === 'admin') {
    return [
      { to: '/admin',              icon: <LayoutDashboard className="w-5 h-5" />, label: 'Bosh sahifa'  },
      { to: '/admin/users',        icon: <Users           className="w-5 h-5" />, label: 'Foydalanuvchilar' },
      { to: '/admin/nannies',      icon: <HeartHandshake  className="w-5 h-5" />, label: 'Enagalar'     },
      { to: '/admin/bookings',     icon: <Calendar        className="w-5 h-5" />, label: 'Buyurtmalar'  },
      { to: '/admin/payments',     icon: <CreditCard      className="w-5 h-5" />, label: 'To\'lovlar'   },
      { to: '/admin/verifications',icon: <ShieldCheck     className="w-5 h-5" />, label: 'Verifikatsiya'},
      { to: '/admin/support',      icon: <LifeBuoy        className="w-5 h-5" />, label: 'Yordam xizmati'},
    ];
  }
  return [];
}

function SidebarContent({ onClose, unreadNotifications = 0, pendingBookings = 0 }: {
  onClose?: () => void;
  unreadNotifications?: number;
  pendingBookings?: number;
}) {
  const { user, djangoUser, role, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = useNavItems(role, unreadNotifications, pendingBookings);

  const displayName  = djangoUser?.name  || user?.displayName || 'Foydalanuvchi';
  const displayPhoto = djangoUser?.photo || user?.photoURL;
  const roleLabel    = role === 'nanny' ? 'Enaga' : role === 'admin' ? 'Admin' : 'Ota-ona';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-slate-900">Parvona</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile card */}
      <div className="mx-3 mb-4 p-3 bg-purple-50 rounded-2xl flex items-center gap-3">
        <Avatar src={displayPhoto} name={displayName} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
          <p className="text-xs text-purple-600 font-medium">{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Tizimdan chiqish
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose, unreadNotifications, pendingBookings }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-100">
        <SidebarContent unreadNotifications={unreadNotifications} pendingBookings={pendingBookings} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-72 h-full bg-white shadow-2xl"
            >
              <SidebarContent onClose={onMobileClose} unreadNotifications={unreadNotifications} pendingBookings={pendingBookings} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
