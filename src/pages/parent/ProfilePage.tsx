import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, ShieldCheck, Mail, Phone, User as UserIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/client';
import { DjangoUser } from '../../api/types';

interface ProfileForm {
  name:  string;
  phone: string;
}

export default function ProfilePage() {
  const { djangoUser, setDjangoUser } = useAuthStore();
  const [form, setForm]         = useState<ProfileForm>({ name: '', phone: '' });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [success, setSuccess]   = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);

  useEffect(() => {
    if (!djangoUser) { setLoading(false); return; }
    setForm({ name: djangoUser.name || '', phone: djangoUser.phone || '' });
    setLoading(false);
  }, [djangoUser]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.patch<DjangoUser>('/api/auth/me/', { name: form.name, phone: form.phone });
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

  if (loading) return <PageSpinner />;

  const role = djangoUser?.role;
  const photoUrl = djangoUser?.photo ?? null;

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader title="Profilim" subtitle="Shaxsiy ma'lumotlaringizni boshqaring" />

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-6"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Ma'lumotlar muvaffaqiyatli saqlandi
        </motion.div>
      )}

      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-slate-100">
          <div className="relative">
            <Avatar src={photoUrl} name={form.name} size="xl" />
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
          <div>
            <h2 className="text-xl font-bold text-slate-900">{form.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{djangoUser?.email}</p>
            <p className="text-xs text-purple-600 font-medium mt-1 capitalize">
              {role === 'parent' ? 'Ota-ona' : role === 'nanny' ? 'Enaga' : 'Admin'}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <Input
            label="Ism familiya"
            icon={<UserIcon className="w-4 h-4" />}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            disabled={!isEditing}
            placeholder="Aziz Karimov"
          />
          <Input
            label="Email"
            icon={<Mail className="w-4 h-4" />}
            value={djangoUser?.email || ''}
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
            <Button onClick={() => setEditing(true)}>Tahrirlash</Button>
          ) : (
            <>
              <Button onClick={handleSave} loading={saving}>Saqlash</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Bekor qilish</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
