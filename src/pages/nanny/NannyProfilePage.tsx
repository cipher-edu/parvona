import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, ShieldCheck, MapPin, Clock, DollarSign, MessageCircle, Link2, Unlink, Play, Upload } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/client';
import { DjangoUser, Nanny } from '../../api/types';
import { getMyNannyProfile, updateMyNannyProfile, SKILL_LABELS } from '../../api/nannies';
import { connectMyTelegram, disconnectMyTelegram } from '../../api/users';

const ALL_SKILLS = Object.entries(SKILL_LABELS).map(([v, l]) => ({ value: v, label: l }));

interface NannyForm {
  name:          string;
  phone:         string;
  age:           number;
  experience:    number;
  hourly_rate:   number;
  bio:           string;
  location_name: string;
  skills:        string[];
}

export default function NannyProfilePage() {
  const { djangoUser, setDjangoUser } = useAuthStore();
  const [profile, setProfile]     = useState<Nanny | null>(null);
  const [form, setForm]           = useState<NannyForm>({
    name: '', phone: '', age: 25, experience: 1,
    hourly_rate: 30000, bio: '', location_name: '', skills: [],
  });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [isEditing, setEditing]   = useState(false);
  const [success, setSuccess]     = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = React.useState(false);
  const [tgToken, setTgToken]           = useState('');
  const [tgConnecting, setTgConnecting] = useState(false);
  const [tgDisconnecting, setTgDisconnecting] = useState(false);
  const [tgError, setTgError]           = useState('');
  const [tgSuccess, setTgSuccess]       = useState('');

  useEffect(() => {
    if (!djangoUser) { setLoading(false); return; }
    getMyNannyProfile()
      .then(p => {
        setProfile(p);
        setForm({
          name:          djangoUser.name || '',
          phone:         djangoUser.phone || '',
          age:           p.age,
          experience:    p.experience,
          hourly_rate:   p.hourly_rate,
          bio:           p.bio || '',
          location_name: p.location_name,
          skills:        p.skills as string[],
        });
      })
      .catch(() => {
        setForm(f => ({ ...f, name: djangoUser.name || '', phone: djangoUser.phone || '' }));
      })
      .finally(() => setLoading(false));
  }, [djangoUser]);

  const toggleSkill = (skill: string) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Rasm hajmi 5MB dan oshmasin'); return; }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const updated = await api.patch<DjangoUser>('/api/auth/me/', formData);
      setDjangoUser(updated);
    } catch {
      alert('Rasm yuklanmadi. Qayta urinib ko\'ring.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { alert('Video hajmi 100MB dan oshmasin'); return; }
    setVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const updated = await api.patch<Nanny>('/api/nannies/me/', formData);
      setProfile(updated);
    } catch {
      alert("Video yuklanmadi. Qayta urinib ko'ring.");
    } finally {
      setVideoUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [updated] = await Promise.all([
        api.patch<DjangoUser>('/api/auth/me/', { name: form.name, phone: form.phone }),
        updateMyNannyProfile({
          age:           form.age,
          experience:    form.experience,
          hourly_rate:   form.hourly_rate,
          bio:           form.bio,
          location_name: form.location_name,
          skills:        form.skills as unknown as string[],
        }),
      ]);
      setDjangoUser(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleTgConnect = async () => {
    if (!tgToken.trim()) return;
    setTgConnecting(true);
    setTgError('');
    setTgSuccess('');
    try {
      const updated = await connectMyTelegram(tgToken.trim());
      setDjangoUser({ ...djangoUser!, ...updated });
      setTgToken('');
      setTgSuccess('Telegram muvaffaqiyatli ulandi!');
      setTimeout(() => setTgSuccess(''), 4000);
    } catch {
      setTgError("Token noto'g'ri yoki muddati o'tgan. Botdan yangi token oling.");
    } finally {
      setTgConnecting(false);
    }
  };

  const handleTgDisconnect = async () => {
    setTgDisconnecting(true);
    setTgError('');
    try {
      await disconnectMyTelegram();
      setDjangoUser({ ...djangoUser!, telegram_user_id: null });
      setTgSuccess('Telegram ulanishi uzildi.');
      setTimeout(() => setTgSuccess(''), 3000);
    } catch {
      setTgError('Uzishda xatolik yuz berdi.');
    } finally {
      setTgDisconnecting(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader title="Mening profilim" subtitle="Enaga sifatida ma'lumotlaringiz" />

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-6"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Profil muvaffaqiyatli yangilandi
        </motion.div>
      )}

      <Card padding="lg" className="mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 pb-6 border-b border-slate-100">
          <div className="relative">
            <Avatar src={djangoUser?.photo ?? null} name={form.name} size="xl" />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <button
              className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-purple-600 shadow-sm transition-colors disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
            >
              {photoUploading
                ? <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{form.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1 justify-center sm:justify-start">
              <MapPin className="w-3.5 h-3.5" /> {form.location_name || 'Manzil kiritilmagan'}
            </p>
            {profile && (
              <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                <Badge variant={profile.is_verified ? 'green' : 'yellow'}>
                  {profile.is_verified ? '✓ Tasdiqlangan' : 'Verifikatsiya kutilmoqda'}
                </Badge>
                <Badge variant={profile.status === 'active' ? 'green' : 'slate'}>
                  {profile.status === 'active' ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
            )}
          </div>
          <div className="sm:ml-auto flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" /> {form.experience} yil tajriba
            </div>
            <div className="text-lg font-bold text-purple-700">
              {form.hourly_rate.toLocaleString()} so'm/soat
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Ism familiya" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={!isEditing} />
            <Input label="Telefon" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} disabled={!isEditing} placeholder="+998 90 123 45 67" />
            <Input label="Yosh" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) || 18 }))} disabled={!isEditing} min={18} max={70} />
            <Input label="Tajriba (yil)" type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: parseInt(e.target.value) || 0 }))} disabled={!isEditing} min={0} />
            <Input
              label="Soatlik narx (so'm)"
              icon={<DollarSign className="w-4 h-4" />}
              type="number"
              value={form.hourly_rate}
              onChange={e => setForm(f => ({ ...f, hourly_rate: parseInt(e.target.value) || 0 }))}
              disabled={!isEditing}
            />
            <Input
              label="Joylashuv"
              icon={<MapPin className="w-4 h-4" />}
              value={form.location_name}
              onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
              disabled={!isEditing}
              placeholder="Toshkent shahri"
            />
          </div>

          <Textarea
            label="O'zim haqimda"
            rows={4}
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            disabled={!isEditing}
            placeholder="O'zingiz haqingizda qisqacha yozing..."
          />

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Ko'nikmalar</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map(s => {
                const active = form.skills.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => toggleSkill(s.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border disabled:cursor-not-allowed ${
                      active
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          {!isEditing ? (
            <Button onClick={() => setEditing(true)}>Tahrirlash</Button>
          ) : (
            <>
              <Button onClick={handleSave} loading={saving}>Saqlash</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Bekor qilish</Button>
            </>
          )}
        </div>
      </Card>
      <Card padding="lg" className="mt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Telegram ulash</h3>
            <p className="text-xs text-slate-500">Bildirishnomalarni Telegram orqali oling</p>
          </div>
        </div>

        {tgError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {tgError}
          </div>
        )}
        {tgSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <ShieldCheck className="w-4 h-4 shrink-0" />{tgSuccess}
          </div>
        )}

        {djangoUser?.telegram_user_id ? (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">Telegram ulangan ✅</p>
                <p className="text-xs text-slate-500">ID: {djangoUser.telegram_user_id}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleTgDisconnect} loading={tgDisconnecting}>
              <Unlink className="w-4 h-4 mr-1.5" />Uzish
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600 space-y-1.5">
              <p className="font-medium text-slate-700">Qanday ulash kerak?</p>
              <p>1. <a href="https://t.me/Enagamuzbot" target="_blank" rel="noreferrer" className="text-blue-600 underline">@Enagamuzbot</a> ga o'ting</p>
              <p>2. <code className="bg-slate-200 px-1 rounded">/connect</code> buyrug'ini yuboring</p>
              <p>3. Tokenni quyidagi maydonga kiriting</p>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Token (masalan: 4dEMJqZD...)"
                value={tgToken}
                onChange={e => setTgToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTgConnect()}
              />
              <Button onClick={handleTgConnect} loading={tgConnecting} disabled={!tgToken.trim()}>
                Ulash
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Taqdimot videosi ──────────────────────────────────────────────── */}
      <Card padding="lg" className="mt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Play className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Taqdimot videosi</h3>
            <p className="text-xs text-slate-500">Video orqali o'zingizni tanishtiring (maks. 100 MB)</p>
          </div>
        </div>

        {profile?.video ? (
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 mb-4" style={{ aspectRatio: '16/9' }}>
            <video
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              poster={djangoUser?.photo || undefined}
            >
              <source src={profile.video} />
            </video>
          </div>
        ) : (
          <div
            className="w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-4 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors"
            style={{ aspectRatio: '16/9' }}
            onClick={() => videoInputRef.current?.click()}
          >
            <div className="text-center text-slate-400 p-6">
              <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Hali video yuklanmagan</p>
              <p className="text-xs mt-1">MP4, MOV yoki WebM · Maks. 100 MB</p>
            </div>
          </div>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/avi"
          className="hidden"
          onChange={handleVideoUpload}
        />
        <Button
          variant="outline"
          onClick={() => videoInputRef.current?.click()}
          loading={videoUploading}
          fullWidth
        >
          <Upload className="w-4 h-4 mr-2" />
          {profile?.video ? 'Videoni almashtirish' : 'Video yuklash'}
        </Button>
      </Card>
    </div>
  );
}
