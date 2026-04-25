import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, CreditCard,
  Star, MessageSquare, Bell, Settings, LogOut, HeartHandshake,
  Menu, X, ChevronRight,
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { authApi } from '@/api';

const nav = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Boshqaruv'      },
  { to: '/admin/users',         icon: Users,           label: 'Foydalanuvchilar' },
  { to: '/admin/nannies',       icon: UserCheck,       label: 'Enagalar'        },
  { to: '/admin/bookings',      icon: CalendarDays,    label: 'Bronlar'         },
  { to: '/admin/payments',      icon: CreditCard,      label: 'To\'lovlar'       },
  { to: '/admin/reviews',       icon: Star,            label: 'Sharhlar'        },
  { to: '/admin/notifications', icon: Bell,            label: 'Bildirishnomalar' },
  { to: '/admin/settings',      icon: Settings,        label: 'Sozlamalar'      },
];

export default function AdminLayout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? 'w-64' : collapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white flex flex-col transition-all duration-300 ${mobile ? '' : 'h-screen sticky top-0'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <HeartHandshake className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobile) && <span className="text-lg font-bold">Parvona Admin</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all mb-0.5
               ${isActive ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
               ${collapsed && !mobile ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={`border-t border-slate-800 p-4 ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
        {collapsed && !mobile ? (
          <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={user?.name ?? 'Admin'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <button className="hidden md:block" onClick={() => setCollapsed(p => !p)}>
              <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/admin/notifications" className="p-2 hover:bg-slate-100 rounded-xl relative">
              <Bell className="w-5 h-5 text-slate-600" />
            </NavLink>
            <Avatar name={user?.name ?? 'Admin'} size="sm" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
