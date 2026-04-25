import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, MapPin, DollarSign, GraduationCap,
  CheckCircle2, ChevronRight, ChevronLeft, Camera,
  HeartHandshake, Clock, Star,
} from 'lucide-react';
import { updateMyNannyProfile } from '../../api/nannies';
import { SKILL_LABELS } from '../../api/nannies';

const STEPS = [
  { id: 1, icon: <User className="w-5 h-5" />,         title: 'Shaxsiy ma\'lumotlar' },
  { id: 2, icon: <GraduationCap className="w-5 h-5" />, title: 'Ko\'nikmalar'         },
  { id: 3, icon: <MapPin className="w-5 h-5" />,        title: 'Joylashuv'            },
  { id: 4, icon: <DollarSign className="w-5 h-5" />,    title: 'Narx va tajriba'      },
  { id: 5, icon: <CheckCircle2 className="w-5 h-5" />,  title: 'Tasdiqlash'           },
];

interface FormData {
  bio: string;
  age: string;
  skills: string[];
  location_name: string;
  latitude: string;
  longitude: string;
  hourly_rate: string;
  experience: string;
}

const DEFAULT: FormData = {
  bio: '', age: '',
  skills: [], location_name: '',
  latitude: '', longitude: '',
  hourly_rate: '', experience: '',
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const set = (field: keyof FormData, value: string | string[]) =>
    setForm(f => ({ ...f, [field]: value }));

  const toggleSkill = (key: string) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(key)
        ? f.skills.filter(s => s !== key)
        : [...f.skills, key],
    }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({
          ...f,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
    );
  };

  const next = () => {
    setError('');
    if (step === 1 && !form.bio.trim()) { setError('Bio kiriting'); return; }
    if (step === 2 && form.skills.length === 0) { setError('Kamida 1 ta ko\'nikma tanlang'); return; }
    if (step === 3 && !form.location_name.trim()) { setError('Joylashuvni kiriting'); return; }
    if (step === 4 && (!form.hourly_rate || !form.experience)) { setError('Narx va tajribani kiriting'); return; }
    setStep(s => s + 1);
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await updateMyNannyProfile({
        bio:           form.bio,
        age:           Number(form.age) || undefined,
        skills:        form.skills,
        location_name: form.location_name,
        latitude:      form.latitude  ? Number(form.latitude)  : null,
        longitude:     form.longitude ? Number(form.longitude) : null,
        hourly_rate:   Number(form.hourly_rate),
        experience:    Number(form.experience),
      });
      navigate('/dashboard');
    } catch {
      setError('Saqlashda xato yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50 flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
          <HeartHandshake className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-extrabold text-slate-900">Parvona</span>
      </div>

      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map(s => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.id  ? 'bg-purple-600 text-white shadow-sm shadow-purple-200' :
                  step === s.id ? 'bg-purple-600 text-white shadow-md shadow-purple-300 scale-110' :
                  'bg-white border-2 border-slate-200 text-slate-400'
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${step === s.id ? 'text-purple-600' : 'text-slate-400'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-600 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-right">{step}/{STEPS.length} bosqich</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8"
            >

              {/* Step 1: Shaxsiy ma'lumotlar */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Shaxsiy ma'lumotlar</h2>
                    <p className="text-sm text-slate-500">O'zingiz haqingizda qisqacha yozing</p>
                  </div>

                  {/* Avatar placeholder */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors">
                      <Camera className="w-6 h-6 text-purple-300 mb-1" />
                      <span className="text-[10px] text-purple-400 font-medium">Foto</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Yosh</p>
                      <input
                        type="number"
                        value={form.age}
                        onChange={e => set('age', e.target.value)}
                        placeholder="Masalan: 28"
                        min={18} max={65}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Bio <span className="text-red-400">*</span></p>
                    <textarea
                      value={form.bio}
                      onChange={e => set('bio', e.target.value)}
                      placeholder="O'zingiz, tajribangiz va bolalar bilan ishlash uslubingiz haqida yozing..."
                      rows={5}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent resize-none"
                    />
                    <p className="text-right text-[10px] text-slate-400 mt-1">{form.bio.length}/500</p>
                  </div>
                </div>
              )}

              {/* Step 2: Ko'nikmalar */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Ko'nikmalaringiz</h2>
                    <p className="text-sm text-slate-500">Qaysi sohalarda yordam bera olasiz?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(SKILL_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleSkill(key)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left ${
                          form.skills.includes(key)
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          form.skills.includes(key) ? 'bg-white/30' : 'bg-slate-100'
                        }`}>
                          {form.skills.includes(key) && <CheckCircle2 className="w-3 h-3" />}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                  {form.skills.length > 0 && (
                    <p className="text-xs text-purple-600 font-semibold">{form.skills.length} ta ko'nikma tanlandi</p>
                  )}
                </div>
              )}

              {/* Step 3: Joylashuv */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Joylashuv</h2>
                    <p className="text-sm text-slate-500">Qayerda xizmat ko'rsatasiz?</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Shahar/tuman <span className="text-red-400">*</span></p>
                    <input
                      type="text"
                      value={form.location_name}
                      onChange={e => set('location_name', e.target.value)}
                      placeholder="Masalan: Navoiy shahri, Qoʻshrabot tumani"
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all ${
                      form.latitude
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                    } disabled:opacity-50`}
                  >
                    {geoLoading ? (
                      <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    {form.latitude ? 'GPS manzil aniqlandi ✓' : 'GPS orqali manzilni aniqlash'}
                  </button>
                </div>
              )}

              {/* Step 4: Narx va tajriba */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Narx va tajriba</h2>
                    <p className="text-sm text-slate-500">Xizmatlaringiz qiymati va ish stajingiz</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Soatlik narx (so'm) <span className="text-red-400">*</span>
                      </p>
                      <input
                        type="number"
                        value={form.hourly_rate}
                        onChange={e => set('hourly_rate', e.target.value)}
                        placeholder="40000"
                        min={5000}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Tajriba (yil) <span className="text-red-400">*</span>
                      </p>
                      <input
                        type="number"
                        value={form.experience}
                        onChange={e => set('experience', e.target.value)}
                        placeholder="3"
                        min={0} max={40}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Narx rekommendatsiyasi */}
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Tavsiya etilgan narxlar
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Boshlang\'ich', rate: '25 000' },
                        { label: 'O\'rta',        rate: '40 000' },
                        { label: 'Yuqori',        rate: '60 000' },
                      ].map(r => (
                        <button
                          key={r.label}
                          onClick={() => set('hourly_rate', r.rate.replace(' ', ''))}
                          className="py-2 px-2 rounded-lg bg-white border border-amber-200 text-center hover:bg-amber-100 transition-colors"
                        >
                          <p className="text-xs font-bold text-slate-800">{r.rate}</p>
                          <p className="text-[10px] text-slate-500">{r.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Tasdiqlash */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Tasdiqlash</h2>
                    <p className="text-sm text-slate-500">Ma'lumotlarni ko'rib chiqing va yuboring</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { icon: <User className="w-4 h-4 text-purple-600" />,         label: 'Bio',          value: form.bio.slice(0, 60) + (form.bio.length > 60 ? '...' : '') },
                      { icon: <GraduationCap className="w-4 h-4 text-purple-600" />, label: 'Ko\'nikmalar', value: form.skills.map(s => SKILL_LABELS[s]).join(', ') || '—' },
                      { icon: <MapPin className="w-4 h-4 text-purple-600" />,        label: 'Joylashuv',    value: form.location_name || '—' },
                      { icon: <DollarSign className="w-4 h-4 text-purple-600" />,    label: 'Soatlik narx', value: form.hourly_rate ? `${Number(form.hourly_rate).toLocaleString()} so'm` : '—' },
                      { icon: <Clock className="w-4 h-4 text-purple-600" />,         label: 'Tajriba',      value: form.experience ? `${form.experience} yil` : '—' },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm text-slate-800 font-medium mt-0.5 break-words">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-medium">
                      Profilingiz yuborilgandan keyin admin tomonidan tekshiriladi (1-2 ish kuni). Tasdiqlangach platformada ko'rinasiz.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="mt-4 text-sm text-red-500 font-medium bg-red-50 px-4 py-2 rounded-xl">{error}</p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer buttons */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => { setError(''); setStep(s => s - 1); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Orqaga
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS.length ? (
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
              >
                Davom etish <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Yuborish
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Keyinroq to'ldirasizmi?{' '}
          <button onClick={() => navigate('/dashboard')} className="text-purple-600 font-semibold hover:underline">
            O'tkazib yuborish
          </button>
        </p>
      </div>
    </div>
  );
}
