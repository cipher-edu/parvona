import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, ShieldCheck, Mail, Phone, User as UserIcon, Lock, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { getMe, updateMe, uploadMyPhoto } from '../../api/users';
import { api } from '../../api/client';
import { DjangoUser } from '../../api/types';

interface ProfileForm {
  name:  string;
  phone: string;
}

interface PasswordForm {
  old_password:  string;
  new_password:  string;
  new_password2: string;
}

export default function AdminProfilePage() {
  const { djangoUser } = useAuth();
  const [profile, setProfile]       = useState<DjangoUser | null>(null);
  const [form, setForm]             = useState<ProfileForm>({ name: '', phone: '' });
  const [pwForm, setPwForm]         = useState<PasswordForm>({ old_password: '', new_password: '', new_password2: '' });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savingPw, setSavingPw]     = useState(false);
  const [isEditing, setEditing]     = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);

  useEffect(() => {
    getMe()
      .then(data => {
        setProfile(data);
        setForm({ name: data.name || '', phone: data.phone || '' });
      })
      .catch(() => {
        if (djangoUser) {
          setForm({ name: djangoUser.name || '', phone: djangoUser.phone || '' });
        }
      })
      .finally(() => setLoading(false));
  }, [djangoUser]);

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Rasm hajmi 5MB dan katta bo\'lishi mumkin emas');
      return;
    }
    setPhotoUploading(true);
    try {
      await uploadMyPhoto(file);
      window.location.reload();
    } catch {
      alert('Rasm yuklanmadi. Qayta urinib ko\'ring.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Ism bo\'sh bo\'lishi mumkin emas'); return; }
    setSaving(true);
    setError('');
    try {
      const updated = await updateMe({ name: form.name, phone: form.phone });
      setProfile(updated);
      setEditing(false);
      showSuccessMsg('Ma\'lumotlar muvaffaqiyatli saqlandi');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    if (pwForm.new_password !== pwForm.new_password2) {
      setError('Yangi parollar mos kelmadi');
      return;
    }
    if (pwForm.new_password.length < 8) {
      setError('Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setSavingPw(true);
    try {
      await api.post('/api/auth/me/password/', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ old_password: '', new_password: '', new_password2: '' });
      showSuccessMsg('Parol muvaffaqiyatli o\'zgartirildi');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parol o\'zgartirishda xatolik');
    } finally {
      setSavingPw(false);
    }
  };

  const displayPhoto = profile?.photo || djangoUser?.photo || null;
  const displayName  = profile?.name  || djangoUser?.name  || 'Admin';
  const email        = profile?.email || djangoUser?.email || '';

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <PageHeader title="Profilim" subtitle="Shaxsiy ma'lumotlaringizni boshqaring" />

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {success}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3"
        >
          {error}
        </motion.div>
      )}

      {/* Asosiy ma'lumotlar */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-slate-100">
          <div className="relative">
            <Avatar src={displayPhoto} name={displayName} size="xl" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <button
              className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-purple-600 shadow-sm transition-colors disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
            >
              {photoUploading
                ? <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-4 h-4" />
              }
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Tizim administratori</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Input
            label="Ism familiya"
            icon={<UserIcon className="w-4 h-4" />}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            disabled={!isEditing}
            placeholder="Admin Adminov"
          />
          <Input
            label="Email"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            disabled
            hint="Email o'zgartirib bo'lmaydi"
          />
          <Input
            label="Telefon raqam"
            icon={<Phone className="w-4 h-4" />}
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            disabled={!isEditing}
            placeholder="+998 90 123 45 67"
          />
        </div>

        <div className="flex items-center gap-3 mt-8">
          {!isEditing ? (
            <Button onClick={() => { setEditing(true); setError(''); }}>Tahrirlash</Button>
          ) : (
            <>
              <Button onClick={handleSave} loading={saving}>Saqlash</Button>
              <Button variant="outline" onClick={() => { setEditing(false); setError(''); }}>Bekor qilish</Button>
            </>
          )}
        </div>
      </Card>

      {/* Parol o'zgartirish */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-slate-500" />
          <h3 className="text-base font-semibold text-slate-900">Parolni o'zgartirish</h3>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Hozirgi parol"
              type={showPw ? 'text' : 'password'}
              value={pwForm.old_password}
              onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <Input
            label="Yangi parol"
            type={showPw ? 'text' : 'password'}
            value={pwForm.new_password}
            onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
            placeholder="Kamida 8 ta belgi"
          />
          <div className="relative">
            <Input
              label="Yangi parolni tasdiqlang"
              type={showPw ? 'text' : 'password'}
              value={pwForm.new_password2}
              onChange={e => setPwForm(f => ({ ...f, new_password2: e.target.value }))}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPw(v => !v)}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleChangePassword}
            loading={savingPw}
            disabled={!pwForm.old_password || !pwForm.new_password || !pwForm.new_password2}
          >
            Parolni o'zgartirish
          </Button>
        </div>
      </Card>
    </div>
  );
}
