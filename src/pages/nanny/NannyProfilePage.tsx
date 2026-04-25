import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, ShieldCheck, MapPin, Clock, DollarSign } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { getMyNannyProfile, updateMyNannyProfile, SKILL_LABELS } from '../../api/nannies';
import { Nanny } from '../../api/types';

const ALL_SKILLS = Object.entries(SKILL_LABELS).map(([v, l]) => ({ value: v, label: l }));

interface NannyForm {
  name:        string;
  phone:       string;
  age:         number;
  experience:  number;
  hourly_rate: number;
  bio:         string;
  location_name: string;
  skills:      string[];
}

export default function NannyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile]       = useState<Nanny | null>(null);
  const [form, setForm]             = useState<NannyForm>({ name: '', phone: '', age: 25, experience: 1, hourly_rate: 30000, bio: '', location_name: '', skills: [] });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [isEditing, setEditing]     = useState(false);
  const [success, setSuccess]       = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMyNannyProfile(),
      getDoc(doc(db, 'users', user.uid)),
    ]).then(([p, snap]) => {
      setProfile(p);
      setForm({
        name:          snap.exists() ? snap.data().name : user.displayName || '',
        phone:         snap.exists() ? snap.data().phone || '' : '',
        age:           p.age,
        experience:    p.experience,
        hourly_rate:   p.hourly_rate,
        bio:           p.bio || '',
        location_name: p.location_name,
        skills:        p.skills as string[],
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const toggleSkill = (skill: string) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
    }));
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
      const formData = new FormData();
      formData.append('photo', file);
      const { api } = await import('../../api/client');
      await api.patch('/api/users/me/', formData);
      window.location.reload();
    } catch (err) {
      console.error('Rasm yuklashda xatolik:', err);
      alert('Rasm yuklanmadi. Qayta urinib ko\'ring.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', user.uid), { name: form.name, phone: form.phone }),
        updateMyNannyProfile({
          age:           form.age,
          experience:    form.experience,
          hourly_rate:   form.hourly_rate,
          bio:           form.bio,
          location_name: form.location_name,
          skills:        form.skills as unknown as string[],
        }),
      ]);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
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

      {/* Profile header */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 pb-6 border-b border-slate-100">
          <div className="relative">
            <Avatar src={user?.photoURL} name={form.name} size="xl" />
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
              {photoUploading ? <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : <Camera className="w-4 h-4" />}
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

        {/* Form fields */}
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

          {/* Skills */}
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
    </div>
  );
}
