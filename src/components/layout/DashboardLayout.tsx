import React, { useState, useCallback } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { PageSpinner } from '../ui/Spinner';
import { useNotifications } from '../../hooks/useNotifications';

interface DashboardLayoutProps {
  requireRole?: 'parent' | 'nanny' | 'admin' | ('parent' | 'nanny' | 'admin')[];
}

export function DashboardLayout({ requireRole }: DashboardLayoutProps) {
  const { user, djangoUser, role, isReady, isLoggedIn } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const handleUnreadCount = useCallback((count: number) => setUnreadCount(count), []);
  useNotifications(undefined, handleUnreadCount);

  if (!isReady) return <PageSpinner />;
  if (!isLoggedIn) return <Navigate to="/" replace />;

  const allowedRoles = requireRole
    ? Array.isArray(requireRole) ? requireRole : [requireRole]
    : ['parent', 'nanny', 'admin'];

  if (role && !allowedRoles.includes(role)) {
    const redirect = role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirect} replace />;
  }

  const displayName  = djangoUser?.name || user?.displayName || 'Foydalanuvchi';
  const displayPhoto = djangoUser?.photo || user?.photoURL || null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} unreadNotifications={unreadCount} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">Parvona</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard/notifications')}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Avatar src={displayPhoto} name={displayName} size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
