import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldX, Star, MapPin, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner, SkeletonTable } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { api } from '../../api/client';
import { Nanny } from '../../api/types';
import { SKILL_LABELS, formatHourlyRate } from '../../api/nannies';

export default function VerificationsPage() {
  const [nannies, setNannies]     = useState<Nanny[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState<Nanny | null>(null);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ count: number; results: Nanny[] }>('/api/admin/nannies/', {
        search:      search || undefined,
        is_verified: 'false',
        status:      'active',
        page,
      } as Record<string, string | number | undefined>);
      setNannies(res.results || []);
      setTotal(res.count || 0);
    } catch { setNannies([]); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleVerify = async (nannyId: string) => {
    setVerifying(true);
    try {
      await api.post(`/api/admin/nannies/${nannyId}/verify/`);
      setNannies(prev => prev.filter(n => n.id !== nannyId));
      setTotal(prev => prev - 1);
      if (selected?.id === nannyId) setSelected(null);
    } catch { /* ignore */ }
    finally { setVerifying(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader
        title="Verifikatsiya kutmoqda"
        subtitle={`${total} ta enaga tasdiqlanishini kutmoqda`}
      />

      <Card padding="none">
        <div className="flex flex-wrap gap-3 p-5 border-b border-slate-100">
          <div className="flex-1 min-w-44">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Ism yoki joylashuv..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><PageSpinner /></div>
        ) : nannies.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8" />}
            title="Kutilayotgan so'rovlar yo'q"
            description="Barcha enagalar tasdiqlangan yoki hali ro'yxatdan o'tmagan"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-5 py-3">Enaga</th>
                  <th className="text-left px-5 py-3">Joylashuv</th>
                  <th className="text-left px-5 py-3">Reyting</th>
                  <th className="text-left px-5 py-3">Narx</th>
                  <th className="text-left px-5 py-3">Ro'yxatdan o'tgan</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {nannies.map(n => (
                  <tr
                    key={n.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(n)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={n.user.photo} name={n.user.name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{n.user.name}</p>
                          <p className="text-xs text-slate-500">{n.experience} yil tajriba</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {n.location_name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {parseFloat(n.rating).toFixed(1)}
                        <span className="text-slate-400 font-normal">({n.reviews_count})</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-purple-700">
                      {formatHourlyRate(n.hourly_rate)}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {new Date(n.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <Button
                        size="sm"
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                        loading={verifying}
                        onClick={() => handleVerify(n.id)}
                      >
                        Tasdiqlash
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {total} ta natijadan {(page - 1) * 20 + 1}–{Math.min(page * 20, total)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Oldingi
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Keyingi
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Enaga ma'lumotlari" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <Avatar src={selected.user.photo} name={selected.user.name} size="xl" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{selected.user.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />{selected.location_name}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="yellow">Tasdiqlanmagan</Badge>
                  <Badge variant={selected.status === 'active' ? 'green' : 'slate'}>{selected.status}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-purple-700">{formatHourlyRate(selected.hourly_rate)}</p>
                <p className="text-xs text-slate-500 mt-0.5">soatiga</p>
              </div>
            </div>

            {selected.bio && (
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">
                {selected.bio}
              </p>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Ko'nikmalar</p>
              <div className="flex flex-wrap gap-2">
                {(selected.skills as string[]).map(s => (
                  <Badge key={s} variant="purple">{SKILL_LABELS[s] || s}</Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {parseFloat(selected.rating).toFixed(1)} ({selected.reviews_count} izoh)
              </div>
              <div className="flex gap-2">
                <Button
                  icon={<ShieldCheck className="w-4 h-4" />}
                  loading={verifying}
                  onClick={() => handleVerify(selected.id)}
                >
                  Tasdiqlash
                </Button>
                <Button
                  variant="danger"
                  icon={<ShieldX className="w-4 h-4" />}
                  onClick={() => setSelected(null)}
                >
                  Keyinga qoldirish
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
