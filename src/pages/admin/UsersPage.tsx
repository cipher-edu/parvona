import React, { useCallback, useEffect, useState } from 'react';
import { Search, MoreVertical, UserCheck, UserX, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner, SkeletonTable } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { api } from '../../api/client';
import { DjangoUser } from '../../api/types';

const ROLE_OPTIONS = [
  { value: '',       label: 'Barcha rollar' },
  { value: 'parent', label: 'Ota-onalar'   },
  { value: 'nanny',  label: 'Enagalar'     },
  { value: 'admin',  label: 'Adminlar'     },
];

const ROLE_BADGE: Record<string, 'purple' | 'blue' | 'orange'> = {
  parent: 'blue', nanny: 'purple', admin: 'orange',
};
const ROLE_LABEL: Record<string, string> = {
  parent: 'Ota-ona', nanny: 'Enaga', admin: 'Admin',
};

interface AdminUser extends DjangoUser { created_at: string; }

export default function UsersPage() {
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [actionUser, setActionUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirm] = useState<'deactivate' | 'activate' | null>(null);
  const [acting, setActing]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ count: number; results: AdminUser[] }>('/api/admin/users/', {
        search: search || undefined,
        role:   roleFilter || undefined,
        page,
      } as Record<string, string | number | undefined>);
      setUsers(res.results || []);
      setTotal(res.count || 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleToggleActive = async () => {
    if (!actionUser) return;
    setActing(true);
    try {
      const endpoint = actionUser.is_active
        ? `/api/admin/users/${actionUser.id}/deactivate/`
        : `/api/admin/users/${actionUser.id}/activate/`;
      await api.post(endpoint);
      setUsers(prev => prev.map(u => u.id === actionUser.id ? { ...u, is_active: !u.is_active } : u));
      setActionUser(null);
      setConfirm(null);
    } catch { /* ignore */ }
    finally { setActing(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader title="Foydalanuvchilar" subtitle={`Jami ${total} ta foydalanuvchi`} />

      <Card padding="none">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-5 border-b border-slate-100">
          <div className="flex-1 min-w-44">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Ism, email yoki telefon..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select options={ROLE_OPTIONS} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="w-40" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><PageSpinner /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={<UserCheck className="w-8 h-8" />} title="Foydalanuvchilar topilmadi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-5 py-3">Foydalanuvchi</th>
                  <th className="text-left px-5 py-3">Rol</th>
                  <th className="text-left px-5 py-3">Telefon</th>
                  <th className="text-left px-5 py-3">Holat</th>
                  <th className="text-left px-5 py-3">Ro'yxatdan o'tgan</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.photo} name={u.name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{u.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={u.is_active ? 'green' : 'red'} dot>
                        {u.is_active ? 'Faol' : 'Bloklangan'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => { setActionUser(u); setConfirm(u.is_active ? 'deactivate' : 'activate'); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">{total} ta natijadan {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} ko'rsatilmoqda</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Keyingi</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirm modal */}
      <Modal
        open={!!confirmAction && !!actionUser}
        onClose={() => { setActionUser(null); setConfirm(null); }}
        title={confirmAction === 'deactivate' ? 'Foydalanuvchini bloklash' : 'Foydalanuvchini faollashtirish'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setActionUser(null); setConfirm(null); }}>Bekor</Button>
            <Button
              variant={confirmAction === 'deactivate' ? 'danger' : 'primary'}
              loading={acting}
              onClick={handleToggleActive}
            >
              {confirmAction === 'deactivate' ? 'Bloklash' : 'Faollashtirish'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{actionUser?.name}</span> ni{' '}
          {confirmAction === 'deactivate'
            ? 'bloklamoqchimisiz? Foydalanuvchi tizimga kira olmaydi.'
            : 'faollashtirishni tasdiqlaysizmi?'}
        </p>
      </Modal>
    </div>
  );
}
