import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getNannies, getNannyReviews, formatHourlyRate, SKILL_LABELS } from './api/nannies';
import { createBooking } from './api/bookings';
import { getLatestReviews } from './api/reviews';
import { sendEmailOTP, registerSendOTP, registerTelegramInit, telegramOTPLoginInit, telegramOTPLoginVerify } from './api/auth';
import { Nanny, Review } from './api/types';
import { useAuthStore } from './store/useAuthStore';
import { useAuthFlow, clearAuthFlow } from './hooks/useAuthFlow';
import { 
  HeartHandshake, 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Star,
  Menu,
  X,
  ArrowRight,
  Video,
  MapPin,
  GraduationCap,
  Sparkles,
  CreditCard,
  AlertCircle,
  UserCheck,
  Map,
  Award,
  BrainCircuit,
  Wallet,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  Settings,
  Maximize,
  ChevronLeft,
  Filter,
  Heart,
  Palette,
  MessageSquareQuote,
  TrendingUp,
  UserPlus,
  Calendar,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  BadgeCheck,
  Banknote,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Gift,
  Crown,
} from 'lucide-react';

const MOCK_NANNIES = [
  {
    id: '1',
    name: 'Aziza Karimova',
    age: 28,
    experience: '5 yil',
    rating: 4.9,
    reviews: 124,
    hourlyRate: '40 000 so\'m',
    imageUrl: 'https://i.pravatar.cc/300?img=5',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bio: 'Assalomu alaykum! Men Aziza, 5 yillik tajribaga ega enagaman. Bolalar psixologiyasi bo\'yicha maxsus kurslarni tamomlaganman. Farzandingiz bilan nafaqat vaqt o\'tkazaman, balki ularning intellektual rivojlanishiga ham yordam beraman.',
    skills: ['Chaqaloqlar parvarishi', 'Maktabga tayyorlov', 'Ingliz tili', 'Birinchi yordam'],
    coordinates: [40.0844, 65.3792] as [number, number],
    locationName: 'Navoiy shahri va Karmana tumani',
    badges: [{ label: 'Eng sabrli', icon: 'heart', count: 45 }, { label: 'Kreativ', icon: 'palette', count: 32 }],
    reviewsList: [
      { author: 'Madina T.', rating: 5, date: '2 kun oldin', text: 'Aziza juda mehribon va sabrli. Farzandim u bilan vaqt o\'tkazishni yaxshi ko\'radi.', badges: ['Eng sabrli'] },
      { author: 'Rustam K.', rating: 5, date: '1 hafta oldin', text: 'Ingliz tilini o\'rgatishda kreativ yondashadi. Rahmat!', badges: ['Kreativ'] }
    ]
  },
  {
    id: '2',
    name: 'Dilnoza Rahmatova',
    age: 34,
    experience: '8 yil',
    rating: 5.0,
    reviews: 210,
    hourlyRate: '50 000 so\'m',
    imageUrl: 'https://i.pravatar.cc/300?img=9',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bio: 'Tibbiy ma\'lumotga ega mutaxassisman. Qariyalar va alohida ehtiyojli insonlar bilan ishlash bo\'yicha katta tajribam bor. Mas\'uliyatli va mehribonman.',
    skills: ['Tibbiy parvarish', 'Qariyalar parvarishi', 'Maxsus ehtiyojlilar', 'Massaj'],
    coordinates: [41.2995, 69.2401] as [number, number],
    locationName: 'Toshkent shahri',
    badges: [{ label: 'Tozalikka e\'tiborli', icon: 'sparkles', count: 89 }, { label: 'Eng sabrli', icon: 'heart', count: 64 }],
    reviewsList: [
      { author: 'Nigora A.', rating: 5, date: '3 kun oldin', text: 'Juda toza va ozoda ishlaydi. Tibbiy bilimlari borligi bizga xotirjamlik beradi.', badges: ['Tozalikka e\'tiborli'] }
    ]
  },
  {
    id: '3',
    name: 'Malika Usmonova',
    age: 24,
    experience: '2 yil',
    rating: 4.8,
    reviews: 45,
    hourlyRate: '35 000 so\'m',
    imageUrl: 'https://i.pravatar.cc/300?img=1',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bio: 'Bolalarni juda yaxshi ko\'raman. Ularga san\'at, rasm chizish va qiziqarli o\'yinlar orqali dunyoni anglashga yordam beraman. Energiya va mehrga to\'laman!',
    skills: ['Faol o\'yinlar', 'San\'at va ijod', 'Maktab yoshidagi bolalar', 'Uy vazifalari'],
    coordinates: [39.6270, 66.9750] as [number, number],
    locationName: 'Samarqand shahri',
    badges: [{ label: 'Kreativ', icon: 'palette', count: 21 }, { label: 'Bolalar sevimlisi', icon: 'heart', count: 18 }],
    reviewsList: [
      { author: 'Zarina B.', rating: 5, date: '1 oy oldin', text: 'Bolalar bilan tez til topishadi. Turli xil qiziqarli o\'yinlar o\'ylab topadi.', badges: ['Bolalar sevimlisi', 'Kreativ'] }
    ]
  },
  {
    id: '4',
    name: 'Gulnora To\'rayeva',
    age: 42,
    experience: '12 yil',
    rating: 4.9,
    reviews: 340,
    hourlyRate: '45 000 so\'m',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bio: 'Assalomu alaykum. Men Gulnora, Navoiy shahrida yashayman. 12 yillik tajribaga ega enagaman. Chaqaloqlar va bog\'cha yoshidagi bolalar bilan ishlashni yaxshi ko\'raman.',
    skills: ['Chaqaloqlar parvarishi', 'Maxsus parhez taomlar', 'Uyqu rejimi'],
    coordinates: [40.1030, 65.3740] as [number, number],
    locationName: 'Navoiy shahri, 10-mikrorayon',
    badges: [{ label: 'Tajribali', icon: 'award', count: 120 }, { label: 'Pazanda', icon: 'heart', count: 85 }],
    reviewsList: [
      { author: 'Sevara M.', rating: 5, date: '1 hafta oldin', text: 'Juda tajribali va mehribon ayol. Bolam u bilan tez til topishdi.', badges: ['Tajribali'] }
    ]
  },
  {
    id: '5',
    name: 'Shahnoza Aliyeva',
    age: 22,
    experience: '1.5 yil',
    rating: 4.7,
    reviews: 28,
    hourlyRate: '30 000 so\'m',
    imageUrl: 'https://i.pravatar.cc/300?img=20',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bio: 'Talabaman, bo\'sh vaqtimda enagalik qilaman. Bolalar bilan turli xil rivojlantiruvchi o\'yinlar o\'ynashni va ularga ingliz tilini o\'rgatishni yoqtiraman.',
    skills: ['Ingliz tili', 'Rivojlantiruvchi o\'yinlar', 'Maktabga tayyorlov'],
    coordinates: [40.0980, 65.3850] as [number, number],
    locationName: 'Navoiy shahri, Markaz',
    badges: [{ label: 'Bolalar sevimlisi', icon: 'heart', count: 15 }],
    reviewsList: [
      { author: 'Lola D.', rating: 5, date: '3 kun oldin', text: 'Farzandim Shahnoza bilan ingliz tilini o\'rganishni boshladi. Natijalar yaxshi!', badges: ['Bolalar sevimlisi'] }
    ]
  }
];

// Leaflet map resizer for animated modals
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // Wait for the modal animation to finish before invalidating size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const InterviewVideoPlayer = ({ src, poster, title }: { src: string | null, poster: string, title?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (seekTo / 100) * videoRef.current.duration;
      setProgress(seekTo);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const toggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const changePlaybackRate = (rate: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const toggleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative group/player w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-xl">
      {title && (
        <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-opacity duration-300 group-hover/player:opacity-100 opacity-0">
          <Video className="w-4 h-4 text-purple-400" />
          {title}
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src || undefined}
        poster={poster}
        className="w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => !isLooping && setIsPlaying(false)}
        playsInline
      />
      
      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 bg-purple-600/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform shadow-lg shadow-purple-900/50">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-4 px-4 opacity-0 group-hover/player:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-20">
        
        {/* Progress Bar */}
        <div className="w-full relative group/progress cursor-pointer h-1.5 bg-white/30 rounded-full mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            className="absolute top-0 left-0 h-full bg-purple-500 rounded-full pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-purple-400 transition-colors focus:outline-none">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="hover:text-purple-400 transition-colors focus:outline-none">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 focus-within:w-20 transition-all duration-300 opacity-0 group-hover/volume:opacity-100 focus-within:opacity-100 accent-purple-500 cursor-pointer"
              />
            </div>

            <span className="text-xs font-medium font-mono tracking-wider opacity-80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={toggleLoop} 
              className={`transition-colors focus:outline-none ${isLooping ? 'text-purple-400' : 'hover:text-purple-400 text-white/80'}`}
              title="Takrorlash (Loop)"
            >
              <Repeat className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                className="hover:text-purple-400 transition-colors focus:outline-none text-white/80"
                title="Tezlik sozlamalari"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-2 min-w-[120px] shadow-2xl border border-slate-700/50 z-30">
                  <div className="text-xs text-slate-400 mb-2 px-2 font-medium uppercase tracking-wider">Tezlik</div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={(e) => changePlaybackRate(rate, e)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none ${playbackRate === rate ? 'bg-purple-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'}`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleFullScreen} className="hover:text-purple-400 transition-colors focus:outline-none text-white/80">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── API nanny → display formatiga adapter ────────────────────────────────────
type DisplayNanny = typeof MOCK_NANNIES[0] & { apiId?: string; nannyUserId?: string; isVerified?: boolean; isPro?: boolean };

function nannyFromApi(n: Nanny): DisplayNanny {
  const skillLabels = (n.skills as string[]).map(s => SKILL_LABELS[s] || s);
  return {
    id: n.id,
    apiId: n.id,
    nannyUserId: n.user.id,
    name: n.user.name,
    age: n.age,
    experience: `${n.experience} yil`,
    rating: parseFloat(n.rating),
    reviews: n.reviews_count,
    hourlyRate: formatHourlyRate(n.hourly_rate),
    imageUrl: n.user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.user.name)}&background=7c3aed&color=fff`,
    videoUrl: n.video_url || null,
    bio: n.bio || '',
    skills: skillLabels,
    coordinates: (n.latitude && n.longitude) ? [n.latitude, n.longitude] as [number, number] : null as unknown as [number, number],
    locationName: n.location_name,
    badges: [],
    reviewsList: [],
    isVerified: n.is_verified,
    isPro: n.is_pro,
  };
}

// ─── Google logo SVG ──────────────────────────────────────────────────────────
const GoogleLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ─── Auth Modal ───────────────────────────────────────────────────────────────
// Telegram Login Widget — bot nomi .env VITE_TELEGRAM_BOT_NAME dan olinadi
function TelegramLoginWidget({
  onAuth,
  disabled,
}: {
  onAuth: (data: Record<string, string | number>) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const botName = (import.meta.env.VITE_TELEGRAM_BOT_NAME as string) || '';

  useEffect(() => {
    if (!botName || !containerRef.current) return;
    const container = containerRef.current;

    (window as Record<string, unknown>)['onTelegramAuth'] = (
      user: Record<string, string | number>,
    ) => { onAuth(user); };

    const script = document.createElement('script');
    script.async = true;
    script.src   = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login',  botName);
    script.setAttribute('data-size',            'large');
    script.setAttribute('data-onauth',          'onTelegramAuth(user)');
    script.setAttribute('data-request-access',  'write');
    container.appendChild(script);

    return () => {
      delete (window as Record<string, unknown>)['onTelegramAuth'];
      if (script.parentNode === container) container.removeChild(script);
    };
  }, [botName, onAuth]);

  if (!botName) return null;

  return (
    <div
      ref={containerRef}
      className={`flex justify-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    />
  );
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => void;
  onTelegramLogin: (data: Record<string, string | number>) => Promise<void>;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onEmailOTPLogin: (email: string, otp: string, role: 'parent' | 'nanny') => Promise<void>;
  onRegisterComplete:         (email: string, otp: string) => Promise<void>;
  onRegisterTelegramComplete: (reg_token: string, otp: string) => Promise<void>;
  authLoading: boolean;
  authError: string | null;
  clearError: () => void;
}

function AuthModal({ isOpen, onClose, onGoogleLogin, onTelegramLogin, onEmailLogin, onEmailOTPLogin, onRegisterComplete, onRegisterTelegramComplete, authLoading, authError, clearError }: AuthModalProps) {
  // Persistent state — sessionStorage orqali sahifa o'zgarsa ham saqlanadi
  const flow = useAuthFlow();
  const { tab, loginMode, otpStep, otpEmail, otpRole, regStep, regOtpMethod, regEmail, regTelegramToken, regTelegramBotLink, tgLoginStep, tgLoginPhone, tgLoginToken, tgLoginBotLink, tgLoginHasTelegram } = flow;

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // OTP login state (persistent emas — kodlar xavfsizlik uchun saqlanmaydi)
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'parent' | 'nanny'>('parent');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [regRefCode, setRegRefCode] = useState(() => new URLSearchParams(window.location.search).get('ref') ?? '');
  const [regError, setRegError] = useState('');

  // Register OTP step state (persistent emas)
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpCountdown, setRegOtpCountdown] = useState(0);
  const [regOtpSending, setRegOtpSending] = useState(false);
  const [regOtpVerifying, setRegOtpVerifying] = useState(false);
  // Telegram OTP state (persistent emas)
  const [regTelegramOtpCode, setRegTelegramOtpCode] = useState('');
  const [regTelegramVerifying, setRegTelegramVerifying] = useState(false);

  // Telegram login state
  const [tgLoginOtp, setTgLoginOtp] = useState('');
  const [tgLoginSending, setTgLoginSending] = useState(false);
  const [tgLoginVerifying, setTgLoginVerifying] = useState(false);
  const [tgLoginError, setTgLoginError] = useState('');

  // Modal yopilganda faqat kirish kodlari va xatolarni tozalash
  // (flow holati — tab, regStep, regTelegramToken — sessionStorage da saqlanadi)
  React.useEffect(() => {
    if (!isOpen) {
      setOtpCode('');
      setOtpError('');
      setOtpCountdown(0);
      setRegOtpCode('');
      setRegOtpCountdown(0);
      setRegTelegramOtpCode('');
    }
  }, [isOpen]);

  const switchTab = (t: 'login' | 'register') => {
    flow.set({ tab: t });
    setLoginError('');
    setRegError('');
    setRegOtpCode('');
    setRegTelegramOtpCode('');
    clearError();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) { setLoginError('Email va parolni kiriting'); return; }
    try {
      await onEmailLogin(loginEmail, loginPassword);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Kirish xatosi');
    }
  };

  const switchLoginMode = (mode: 'password' | 'otp' | 'telegram') => {
    flow.set({ loginMode: mode, otpStep: 1, tgLoginStep: 1, tgLoginPhone: '', tgLoginToken: '', tgLoginBotLink: '', tgLoginHasTelegram: false });
    setLoginError('');
    setOtpError('');
    setOtpCode('');
    setTgLoginError('');
    setTgLoginOtp('');
    clearError();
  };

  const handleTgLoginInit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = tgLoginPhone.trim();
    if (!phone) { setTgLoginError('Telefon raqamingizni kiriting'); return; }
    setTgLoginError('');
    setTgLoginSending(true);
    try {
      const res = await telegramOTPLoginInit(tgLoginPhone);
      flow.set({ tgLoginStep: 2, tgLoginToken: res.login_token, tgLoginBotLink: res.bot_link, tgLoginHasTelegram: res.has_telegram });
    } catch (err: unknown) {
      setTgLoginError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setTgLoginSending(false);
    }
  };

  const handleTgLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tgLoginOtp.length !== 6) { setTgLoginError('6 raqamli kodni kiriting'); return; }
    setTgLoginVerifying(true);
    setTgLoginError('');
    try {
      const data = await telegramOTPLoginVerify(tgLoginToken, tgLoginOtp);
      useAuthStore.getState().setDjangoUser(data.user);
      useAuthStore.getState().setRole(data.user.role as 'parent' | 'nanny' | 'admin');
      onClose();
    } catch (err: unknown) {
      setTgLoginError(err instanceof Error ? err.message : 'Kod noto\'g\'ri');
    } finally {
      setTgLoginVerifying(false);
    }
  };

  const startOtpCountdown = () => {
    setOtpCountdown(60);
    const id = setInterval(() => {
      setOtpCountdown(c => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!otpEmail) { setOtpError('Email manzilni kiriting'); return; }
    setOtpSending(true);
    try {
      await sendEmailOTP(otpEmail);
      flow.set({ otpStep: 2 });
      startOtpCountdown();
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Kod yuborishda xatolik');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpCode.length !== 6) { setOtpError('6 raqamli kodni kiriting'); return; }
    setOtpVerifying(true);
    try {
      await onEmailOTPLogin(otpEmail, otpCode, otpRole);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Noto\'g\'ri kod');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCountdown > 0) return;
    setOtpError('');
    setOtpSending(true);
    try {
      await sendEmailOTP(otpEmail);
      startOtpCountdown();
      setOtpCode('');
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Kod qayta yuborishda xatolik');
    } finally {
      setOtpSending(false);
    }
  };

  const startRegOtpCountdown = () => {
    setRegOtpCountdown(60);
    const id = setInterval(() => {
      setRegOtpCountdown(c => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim()) { setRegError('Ism-sharifingizni kiriting'); return; }
    if (!regEmail) { setRegError('Email manzilni kiriting'); return; }
    if (regPassword.length < 8) { setRegError('Parol kamida 8 ta belgidan iborat bo\'lishi kerak'); return; }
    if (regPassword !== regPassword2) { setRegError('Parollar mos kelmadi'); return; }
    setRegOtpSending(true);
    const payload = { email: regEmail, name: regName, phone: regPhone || undefined, role: regRole, password: regPassword, password2: regPassword2, ref_code: regRefCode || undefined };
    try {
      if (regOtpMethod === 'telegram') {
        const result = await registerTelegramInit(payload);
        flow.set({ regTelegramToken: result.reg_token, regTelegramBotLink: result.bot_link, regStep: 'telegram-otp' });
      } else {
        await registerSendOTP(payload);
        flow.set({ regStep: 'otp' });
        startRegOtpCountdown();
      }
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Ro\'yxatdan o\'tishda xato');
    } finally {
      setRegOtpSending(false);
    }
  };

  const handleRegisterTelegramVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regTelegramOtpCode.length !== 6) { setRegError('6 raqamli kodni kiriting'); return; }
    setRegTelegramVerifying(true);
    try {
      await onRegisterTelegramComplete(regTelegramToken, regTelegramOtpCode);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Noto\'g\'ri kod');
    } finally {
      setRegTelegramVerifying(false);
    }
  };

  const handleRegisterVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regOtpCode.length !== 6) { setRegError('6 raqamli kodni kiriting'); return; }
    setRegOtpVerifying(true);
    try {
      await onRegisterComplete(regEmail, regOtpCode);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Noto\'g\'ri kod');
    } finally {
      setRegOtpVerifying(false);
    }
  };

  const handleRegisterResendOTP = async () => {
    if (regOtpCountdown > 0) return;
    setRegError('');
    setRegOtpSending(true);
    try {
      await registerSendOTP({ email: regEmail, name: regName, phone: regPhone || undefined, role: regRole, password: regPassword, password2: regPassword2, ref_code: regRefCode || undefined });
      startRegOtpCountdown();
      setRegOtpCode('');
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Kod qayta yuborishda xatolik');
    } finally {
      setRegOtpSending(false);
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all bg-slate-50 focus:bg-white';
  const iconWrap = 'absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-800 px-8 pt-8 pb-6">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <HeartHandshake className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {tab === 'login' ? 'Xush kelibsiz!' : 'Ro\'yxatdan o\'tish'}
              </h2>
              <p className="text-purple-200 text-sm mt-1">
                {tab === 'login' ? 'Hisobingizga kiring' : 'Parvonaga qo\'shiling'}
              </p>

              {/* Tab selector */}
              <div className="flex gap-1 mt-5 bg-white/10 p-1 rounded-xl">
                {(['login', 'register'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-purple-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
                  >
                    {t === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* ── LOGIN TAB ── */}
                {tab === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Kirish usuli toggle */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => switchLoginMode('password')}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${loginMode === 'password' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Parol
                      </button>
                      <button
                        type="button"
                        onClick={() => switchLoginMode('otp')}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${loginMode === 'otp' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => switchLoginMode('telegram')}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${loginMode === 'telegram' ? 'bg-white text-[#229ED9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                        </svg>
                        Telegram
                      </button>
                    </div>

                    {/* ── Parol bilan kirish ── */}
                    {loginMode === 'password' && (
                      <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="relative">
                          <span className={iconWrap}><Mail className="w-4 h-4" /></span>
                          <input
                            type="email"
                            placeholder="Email manzilingiz"
                            value={loginEmail}
                            onChange={e => setLoginEmail(e.target.value)}
                            className={`${inputCls} pl-10`}
                            autoComplete="email"
                          />
                        </div>
                        <div className="relative">
                          <span className={iconWrap}><Lock className="w-4 h-4" /></span>
                          <input
                            type={showPw ? 'text' : 'password'}
                            placeholder="Parolingiz"
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            className={`${inputCls} pl-10 pr-10`}
                            autoComplete="current-password"
                          />
                          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {(loginError || authError) && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{loginError || authError}</span>
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          {authLoading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Kirish'}
                        </button>
                      </form>
                    )}

                    {/* ── Email OTP bilan kirish ── */}
                    {loginMode === 'otp' && (
                      <div className="space-y-4">
                        {/* Rol tanlash */}
                        <div className="grid grid-cols-2 gap-2">
                          {(['parent', 'nanny'] as const).map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => flow.set({ otpRole: r })}
                              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${otpRole === r ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                              {r === 'parent' ? '👨‍👩‍👧 Ota-ona' : '👩‍🍼 Enaga'}
                            </button>
                          ))}
                        </div>

                        {otpStep === 1 && (
                          <form onSubmit={handleSendOTP} className="space-y-3">
                            <div className="relative">
                              <span className={iconWrap}><Mail className="w-4 h-4" /></span>
                              <input
                                type="email"
                                placeholder="Email manzilingiz"
                                value={otpEmail}
                                onChange={e => flow.set({ otpEmail: e.target.value })}
                                className={`${inputCls} pl-10`}
                                autoComplete="email"
                              />
                            </div>
                            {otpError && (
                              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{otpError}</span>
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={otpSending}
                              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              {otpSending ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Kod yuborish'}
                            </button>
                          </form>
                        )}

                        {otpStep === 2 && (
                          <form onSubmit={handleVerifyOTP} className="space-y-3">
                            <div className="text-center p-3 bg-purple-50 rounded-xl text-sm text-purple-700 font-medium">
                              <Mail className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                              <span className="font-bold">{otpEmail}</span> ga 6 raqamli kod yuborildi
                            </div>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]{6}"
                              maxLength={6}
                              placeholder="_ _ _ _ _ _"
                              value={otpCode}
                              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em] py-4`}
                              autoComplete="one-time-code"
                              autoFocus
                            />
                            {otpError && (
                              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{otpError}</span>
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={otpVerifying || otpCode.length !== 6}
                              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              {otpVerifying ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Tasdiqlash'}
                            </button>
                            <div className="flex items-center justify-between text-sm">
                              <button type="button" onClick={() => { flow.set({ otpStep: 1 }); setOtpCode(''); setOtpError(''); }} className="text-slate-500 hover:text-slate-700">
                                ← Email o'zgartirish
                              </button>
                              <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={otpCountdown > 0 || otpSending}
                                className="text-purple-600 font-semibold hover:underline disabled:text-slate-400 disabled:no-underline"
                              >
                                {otpCountdown > 0 ? `Qayta yuborish (${otpCountdown}s)` : 'Qayta yuborish'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* ── Telegram OTP bilan kirish ── */}
                    {loginMode === 'telegram' && (
                      <div className="space-y-4">
                        {tgLoginStep === 1 && (
                          <form onSubmit={handleTgLoginInit} className="space-y-3">
                            <div className="p-3 bg-[#229ED9]/10 rounded-xl text-sm text-[#1a7aaa] font-medium flex items-start gap-2">
                              <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                              </svg>
                              Hisobingizga bog'liq Telegram profilingizga OTP yuboriladi
                            </div>
                            <div className="relative">
                              <span className={iconWrap}><Phone className="w-4 h-4" /></span>
                              <input
                                type="tel"
                                placeholder="+998 XX XXX XX XX"
                                value={tgLoginPhone}
                                onChange={e => flow.set({ tgLoginPhone: e.target.value })}
                                className={`${inputCls} pl-10`}
                                autoComplete="tel"
                                autoFocus
                              />
                            </div>
                            {tgLoginError && (
                              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{tgLoginError}</span>
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={tgLoginSending || !tgLoginPhone}
                              className="w-full bg-[#229ED9] hover:bg-[#1a8bbf] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              {tgLoginSending
                                ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : 'Telegram ga kod yuborish'}
                            </button>
                          </form>
                        )}

                        {tgLoginStep === 2 && (
                          <form onSubmit={handleTgLoginVerify} className="space-y-3">
                            {tgLoginHasTelegram ? (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                                </svg>
                                Telegram profilingizga kod yuborildi. Yoki botga o'ting:
                              </div>
                            ) : (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                                </svg>
                                Quyidagi tugma orqali botga o'ting va kodni oling:
                              </div>
                            )}
                            <a
                              href={tgLoginBotLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-3 w-full bg-[#229ED9] hover:bg-[#1a8bbf] text-white py-3.5 rounded-xl font-bold transition-colors"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                              </svg>
                              @Enagamuzbot ga o'tish
                            </a>
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                              <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">Botdan kelgan kodni kiriting</div>
                            </div>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="_ _ _ _ _ _"
                              value={tgLoginOtp}
                              onChange={e => setTgLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em] py-4`}
                              autoFocus
                            />
                            {tgLoginError && (
                              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{tgLoginError}</span>
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={tgLoginVerifying || tgLoginOtp.length !== 6}
                              className="w-full bg-[#229ED9] hover:bg-[#1a8bbf] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              {tgLoginVerifying
                                ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : 'Tasdiqlash'}
                            </button>
                            <button type="button" onClick={() => { flow.set({ tgLoginStep: 1 }); setTgLoginOtp(''); setTgLoginError(''); }} className="w-full text-sm text-slate-500 hover:text-slate-700">
                              ← Telefon raqamni o'zgartirish
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-xs text-slate-400 font-medium">yoki</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    <button
                      type="button"
                      onClick={onGoogleLogin}
                      disabled={authLoading}
                      className="w-full bg-white border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <GoogleLogo />
                      Google orqali kirish
                    </button>

                    {/* Telegram Login Widget */}
                    <TelegramLoginWidget
                      onAuth={onTelegramLogin}
                      disabled={authLoading}
                    />

                    <p className="text-center text-sm text-slate-500">
                      Hisobingiz yo'qmi?{' '}
                      <button type="button" onClick={() => switchTab('register')} className="text-purple-600 font-semibold hover:underline">
                        Ro'yxatdan o'ting
                      </button>
                    </p>
                  </motion.div>
                )}

                {/* ── REGISTER TAB ── */}
                {tab === 'register' && (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* ── Telegram OTP bosqichi ── */}
                    {regStep === 'telegram-otp' && (
                      <form onSubmit={handleRegisterTelegramVerify} className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-2xl">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Telegram orqali tasdiqlash</p>
                          <p className="text-xs text-slate-500 mt-1">Quyidagi tugma orqali botga o'ting va OTP kodni oling</p>
                        </div>

                        <a
                          href={regTelegramBotLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 w-full bg-[#229ED9] hover:bg-[#1a8bbf] text-white py-3.5 rounded-xl font-bold transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                          </svg>
                          @Enagamuzbot ga o'tish
                        </a>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                          <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">Botdan kelgan kodni kiriting</div>
                        </div>

                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          placeholder="_ _ _ _ _ _"
                          value={regTelegramOtpCode}
                          onChange={e => setRegTelegramOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em] py-4`}
                          autoComplete="one-time-code"
                        />

                        {(regError || authError) && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{regError || authError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={regTelegramVerifying || regTelegramOtpCode.length !== 6}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          {regTelegramVerifying
                            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <><CheckCircle2 className="w-4 h-4" /> Tasdiqlash</>
                          }
                        </button>

                        <button
                          type="button"
                          onClick={() => { flow.set({ regStep: 'form', regTelegramToken: '', regTelegramBotLink: '' }); setRegTelegramOtpCode(''); setRegError(''); clearError(); }}
                          className="w-full text-sm text-slate-500 hover:text-slate-700 py-1"
                        >
                          ← Orqaga
                        </button>
                      </form>
                    )}

                    {/* ── Email OTP tasdiqlash bosqichi ── */}
                    {regStep === 'otp' && (
                      <form onSubmit={handleRegisterVerifyOTP} className="space-y-4">
                        <div className="text-center p-4 bg-purple-50 rounded-2xl">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Mail className="w-6 h-6 text-purple-600" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Emailingizni tasdiqlang</p>
                          <p className="text-xs text-slate-500 mt-1">
                            <span className="font-bold text-purple-700">{regEmail}</span> manziliga 6 raqamli kod yuborildi
                          </p>
                        </div>

                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          placeholder="_ _ _ _ _ _"
                          value={regOtpCode}
                          onChange={e => setRegOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em] py-4`}
                          autoComplete="one-time-code"
                          autoFocus
                        />

                        {(regError || authError) && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{regError || authError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={regOtpVerifying || regOtpCode.length !== 6}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          {regOtpVerifying
                            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <><CheckCircle2 className="w-4 h-4" /> Emailni tasdiqlash</>
                          }
                        </button>

                        <div className="flex items-center justify-between text-sm">
                          <button
                            type="button"
                            onClick={() => { flow.set({ regStep: 'form' }); setRegOtpCode(''); setRegError(''); clearError(); }}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            ← Orqaga
                          </button>
                          <button
                            type="button"
                            onClick={handleRegisterResendOTP}
                            disabled={regOtpCountdown > 0 || regOtpSending}
                            className="text-purple-600 font-semibold hover:underline disabled:text-slate-400 disabled:no-underline"
                          >
                            {regOtpSending
                              ? 'Yuborilmoqda...'
                              : regOtpCountdown > 0
                                ? `Qayta yuborish (${regOtpCountdown}s)`
                                : 'Qayta yuborish'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* ── Ro'yxatdan o'tish formasi ── */}
                    {regStep === 'form' && (
                      <form onSubmit={handleRegister} className="space-y-4">
                        {/* Role selector */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Siz kim sifatida ro'yxatdan o'tyapsiz?</p>
                          <div className="grid grid-cols-2 gap-3">
                            {([
                              { v: 'parent', emoji: '👨‍👩‍👧‍👦', label: 'Ota-ona', desc: 'Enaga izlayman' },
                              { v: 'nanny',  emoji: '👩‍⚕️',       label: 'Enaga',   desc: 'Ish izlayman'  },
                            ] as const).map(opt => (
                              <button
                                key={opt.v}
                                type="button"
                                onClick={() => setRegRole(opt.v)}
                                className={`p-3 rounded-2xl border-2 text-left transition-all ${regRole === opt.v ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                <div className="text-xl mb-1">{opt.emoji}</div>
                                <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                                <p className="text-xs text-slate-500">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Name */}
                        <div className="relative">
                          <span className={iconWrap}><User className="w-4 h-4" /></span>
                          <input
                            type="text"
                            placeholder="To'liq ism-sharifingiz"
                            value={regName}
                            onChange={e => setRegName(e.target.value)}
                            className={`${inputCls} pl-10`}
                            autoComplete="name"
                          />
                        </div>

                        {/* Email */}
                        <div className="relative">
                          <span className={iconWrap}><Mail className="w-4 h-4" /></span>
                          <input
                            type="email"
                            placeholder="Email manzilingiz"
                            value={regEmail}
                            onChange={e => flow.set({ regEmail: e.target.value })}
                            className={`${inputCls} pl-10`}
                            autoComplete="email"
                          />
                        </div>

                        {/* Phone (optional) */}
                        <div className="relative">
                          <span className={iconWrap}><Phone className="w-4 h-4" /></span>
                          <input
                            type="tel"
                            placeholder="Telefon raqam (ixtiyoriy)"
                            value={regPhone}
                            onChange={e => setRegPhone(e.target.value)}
                            className={`${inputCls} pl-10`}
                            autoComplete="tel"
                          />
                        </div>

                        {/* Password */}
                        <div className="relative">
                          <span className={iconWrap}><Lock className="w-4 h-4" /></span>
                          <input
                            type={showPw ? 'text' : 'password'}
                            placeholder="Parol (kamida 8 belgi)"
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            className={`${inputCls} pl-10 pr-10`}
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Confirm password */}
                        <div className="relative">
                          <span className={iconWrap}><Lock className="w-4 h-4" /></span>
                          <input
                            type={showPw2 ? 'text' : 'password'}
                            placeholder="Parolni tasdiqlang"
                            value={regPassword2}
                            onChange={e => setRegPassword2(e.target.value)}
                            className={`${inputCls} pl-10 pr-10`}
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowPw2(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Referral code (optional) */}
                        <div className="relative">
                          <span className={iconWrap}><Gift className="w-4 h-4" /></span>
                          <input
                            type="text"
                            placeholder="Referal kod (ixtiyoriy)"
                            value={regRefCode}
                            onChange={e => setRegRefCode(e.target.value.toUpperCase())}
                            className={`${inputCls} pl-10`}
                            maxLength={12}
                          />
                        </div>

                        {/* OTP usul tanlash */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tasdiqlash usuli</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => flow.set({ regOtpMethod: 'email' })}
                              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${regOtpMethod === 'email' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                              <Mail className="w-4 h-4" /> Email OTP
                            </button>
                            <button
                              type="button"
                              onClick={() => flow.set({ regOtpMethod: 'telegram' })}
                              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${regOtpMethod === 'telegram' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.26l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.537-.194 1.006.131.978.299z"/>
                              </svg>
                              Telegram OTP
                            </button>
                          </div>
                        </div>

                        {/* Password strength indicator */}
                        {regPassword.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              {[1,2,3,4].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                  regPassword.length >= i * 3
                                    ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-500'
                                    : 'bg-slate-200'
                                }`} />
                              ))}
                            </div>
                            <p className="text-xs text-slate-400">
                              {regPassword.length < 4 ? 'Juda qisqa' : regPassword.length < 7 ? 'O\'rtacha' : regPassword.length < 10 ? 'Yaxshi' : 'Kuchli parol'}
                            </p>
                          </div>
                        )}

                        {(regError || authError) && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{regError || authError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={regOtpSending}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          {regOtpSending ? (
                            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><UserPlus className="w-4 h-4" /> Davom etish</>
                          )}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-2">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-xs text-slate-400 font-medium">yoki</span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <button
                          type="button"
                          onClick={onGoogleLogin}
                          disabled={regOtpSending}
                          className="w-full bg-white border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          <GoogleLogo />
                          Google orqali ro'yxatdan o'tish
                        </button>

                        <p className="text-center text-sm text-slate-500">
                          Hisobingiz bormi?{' '}
                          <button type="button" onClick={() => switchTab('login')} className="text-purple-600 font-semibold hover:underline">
                            Kiring
                          </button>
                        </p>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-center text-slate-400 mt-4">
                Davom etish orqali siz{' '}
                <a href="#" className="text-purple-600 hover:underline">Foydalanish shartlari</a>
                {' '}va{' '}
                <a href="#" className="text-purple-600 hover:underline">Maxfiylik siyosati</a>
                ga rozilik bildirasiz.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Super filter konstantalar ───────────────────────────────────────────────

const PAGE_SIZE = 9;

const SORT_OPTIONS = [
  { value: '-rating',      label: 'Reyting',     icon: <Star      className="w-3 h-3" /> },
  { value: 'hourly_rate',  label: 'Narx ↑',      icon: <ArrowUp   className="w-3 h-3" /> },
  { value: '-hourly_rate', label: 'Narx ↓',      icon: <ArrowDown className="w-3 h-3" /> },
  { value: '-experience',  label: 'Tajriba',      icon: <Award     className="w-3 h-3" /> },
  { value: '-created_at',  label: 'Yangi',        icon: <Sparkles  className="w-3 h-3" /> },
  { value: '-reviews_count', label: 'Sharhlar',   icon: <MessageSquareQuote className="w-3 h-3" /> },
];

const PRICE_PRESETS = [
  { label: '<30 000',    min: 0,      max: 30000  },
  { label: '30–50 000',  min: 30000,  max: 50000  },
  { label: '50–80 000',  min: 50000,  max: 80000  },
  { label: '80 000+',    min: 80000,  max: 0      },
];

const EXP_OPTIONS = [
  { value: 0, label: 'Bari'  },
  { value: 1, label: '1+ yil' },
  { value: 3, label: '3+ yil' },
  { value: 5, label: '5+ yil' },
];
// ─── NannyCard komponenti ────────────────────────────────────────────────────

interface NannyCardProps {
  nanny: DisplayNanny;
  onSelect: () => void;
  onBook: () => void;
}

function NannyCard({ nanny, onSelect, onBook }: NannyCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onSelect}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
    >
      {/* Top: photo + name */}
      <div className="p-4 pb-0 flex items-start gap-3">
        <div className="relative shrink-0">
          <img src={nanny.imageUrl} alt={nanny.name} className="w-14 h-14 rounded-xl object-cover" />
          {nanny.videoUrl && (
            <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{nanny.name}</h3>
            <div className="flex items-center gap-0.5 shrink-0">
              {nanny.isPro && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-[10px] font-bold text-white leading-none">
                  ★ Pro
                </span>
              )}
              {nanny.isVerified && (
                <BadgeCheck className="w-4 h-4 text-green-500 mt-0.5" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-800">{nanny.rating}</span>
            <span className="text-xs text-slate-400">({nanny.reviews})</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{nanny.experience}</span>
            {nanny.locationName && (
              <>
                <span className="text-slate-300">·</span>
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{nanny.locationName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="px-4 pt-3 flex flex-wrap gap-1.5">
        {nanny.skills.slice(0, 3).map((skill, i) => (
          <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[11px] font-medium">
            {skill}
          </span>
        ))}
        {nanny.skills.length > 3 && (
          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[11px] font-medium">
            +{nanny.skills.length - 3}
          </span>
        )}
      </div>

      {/* Footer: price + buttons */}
      <div className="px-4 py-3 mt-2 border-t border-slate-50 flex items-center justify-between gap-2">
        <div>
          <span className="font-extrabold text-slate-900 text-sm">{nanny.hourlyRate}</span>
          <span className="text-[11px] text-slate-400">/soat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); onBook(); }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            Oldindan ko'rish
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const navigate = useNavigate();

  // ─── Zustand auth store ────────────────────────────────────────────────────
  const {
    firebaseUser: user,
    djangoUser,
    role: userRole,
    isAuthReady,
    isLoading: authLoading,
    error: authError,
    clearError,
    loginWithGoogle,
    loginWithEmail,
    loginWithEmailOTP,
    loginWithTelegram,
    completeRegister,
    completeTelegramRegister,
    selectRole,
    logout: storeLogout,
  } = useAuthStore();

  // Kirgan foydalanuvchi ma'lumotlari (Firebase yoki Django)
  const isLoggedIn = !!user || !!djangoUser;
  const displayName = djangoUser?.name || user?.displayName || 'Foydalanuvchi';
  const displayPhoto = djangoUser?.photo || user?.photoURL || null;

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'parents' | 'nannies'>('parents');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedNanny, setSelectedNanny] = useState<DisplayNanny | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRoleSelectModalOpen, setIsRoleSelectModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // ─── Nannies from API ──────────────────────────────────────────────────────
  const [apiNannies, setApiNannies] = useState<DisplayNanny[]>([]);
  const [totalNannies, setTotalNannies] = useState(0);
  const [apiNanniesLoading, setApiNanniesLoading] = useState(false);
  const nannySearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nannyLoadCtrl = useRef<AbortController | null>(null);

  // Super filter holati
  interface NannyFilterState {
    search:     string;
    skill:      string;
    minRate:    string;
    maxRate:    string;
    minRating:  number;
    minExp:     number;
    isVerified: boolean;
    ordering:   string;
    lat:        number | null;
    lon:        number | null;
    radiusKm:   number;
  }
  const DEFAULT_FILTER: NannyFilterState = {
    search: '', skill: '', minRate: '', maxRate: '',
    minRating: 0, minExp: 0, isVerified: false, ordering: '-rating',
    lat: null, lon: null, radiusKm: 10,
  };
  const [nannyFilter, setNannyFilter] = useState<NannyFilterState>(DEFAULT_FILTER);
  const [filterDraft, setFilterDraft] = useState<NannyFilterState>(DEFAULT_FILTER);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [nannyPage, setNannyPage] = useState(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // ─── Reviews for selected nanny ────────────────────────────────────────────
  const [selectedNannyReviews, setSelectedNannyReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ─── Latest reviews for landing page ──────────────────────────────────────
  const [landingReviews, setLandingReviews] = useState<Review[]>([]);
  const [landingReviewsLoading, setLandingReviewsLoading] = useState(true);

  // ─── Booking modal ─────────────────────────────────────────────────────────
  const [bookingNanny, setBookingNanny] = useState<DisplayNanny | null>(null);
  const [bookingForm, setBookingForm] = useState({ start_date: '', end_date: '', hours_per_day: 4, address: '', notes: '', is_trial: false });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // ─── Load nannies from API (debounced 350ms) ──────────────────────────────
  const loadNannies = useCallback((f?: NannyFilterState, page = 1) => {
    if (nannySearchTimer.current) clearTimeout(nannySearchTimer.current);
    nannySearchTimer.current = setTimeout(async () => {
    nannyLoadCtrl.current?.abort();
    const ctrl = new AbortController();
    nannyLoadCtrl.current = ctrl;

    setApiNanniesLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined | null> = {
        page,
        page_size: PAGE_SIZE,
        ordering: f?.ordering || '-rating',
      };
      if (f?.search)                       params.search      = f.search;
      if (f?.skill)                        params.skill       = f.skill;
      if (f?.minRate && +f.minRate > 0)    params.min_rate    = +f.minRate;
      if (f?.maxRate && +f.maxRate > 0)    params.max_rate    = +f.maxRate;
      if (f?.minRating && f.minRating > 0) params.min_rating  = f.minRating;
      if (f?.minExp && f.minExp > 0)       params.min_exp     = f.minExp;
      if (f?.isVerified)                   params.is_verified = true;
      if (f?.lat && f?.lon) {
        params.lat       = f.lat;
        params.lon       = f.lon;
        params.radius_km = f.radiusKm || 10;
      }

      const res = await getNannies(
        params as import('./api/types').NannyListParams,
        ctrl.signal,
      );
      setApiNannies((res.results || []).map(nannyFromApi));
      setTotalNannies(res.count || 0);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setApiNannies([]);
    } finally {
      setApiNanniesLoading(false);
    }
    }, 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadNannies(DEFAULT_FILTER);
    return () => { nannyLoadCtrl.current?.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNannies]);

  useEffect(() => {
    getLatestReviews(6)
      .then(setLandingReviews)
      .catch(() => {})
      .finally(() => setLandingReviewsLoading(false));
  }, []);

  // ─── Load reviews when nanny profile opens ─────────────────────────────────
  useEffect(() => {
    if (!selectedNanny?.apiId) {
      setSelectedNannyReviews([]);
      return;
    }
    setReviewsLoading(true);
    getNannyReviews(selectedNanny.apiId)
      .then(res => setSelectedNannyReviews(res.results || []))
      .catch(() => setSelectedNannyReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [selectedNanny?.apiId]);

  // ─── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setIsAuthModalOpen(false);
    try {
      const { needsRole } = await loginWithGoogle();
      if (needsRole) setIsRoleSelectModalOpen(true);
      else { clearAuthFlow(); navigate('/dashboard'); }
    } catch {
      setIsAuthModalOpen(true);
    }
  };

  const handleTelegramLogin = async (data: Record<string, string | number>) => {
    setIsAuthModalOpen(false);
    try {
      await loginWithTelegram(data, 'parent');
      clearAuthFlow();
      const { role } = useAuthStore.getState();
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      setIsAuthModalOpen(true);
    }
  };

  const handleRoleSelect = async (role: 'parent' | 'nanny') => {
    try {
      await selectRole(role);
      setIsRoleSelectModalOpen(false);
      navigate(role === 'nanny' ? '/onboarding' : '/dashboard');
    } catch {
      // xato authError orqali ko'rsatiladi
    }
  };

  const handleLogout = async () => {
    await storeLogout();
    setIsUserMenuOpen(false);
  };

  // ─── Booking ───────────────────────────────────────────────────────────────
  const handleCreateBooking = async () => {
    if (!bookingNanny?.nannyUserId || !djangoUser) return;
    setBookingLoading(true);
    setBookingError('');
    try {
      await createBooking({
        nanny_id:      bookingNanny.nannyUserId,
        start_date:    bookingForm.start_date,
        end_date:      bookingForm.is_trial ? bookingForm.start_date : bookingForm.end_date,
        hours_per_day: bookingForm.is_trial ? 1 : bookingForm.hours_per_day,
        address:       bookingForm.address,
        notes:         bookingForm.notes,
        is_trial:      bookingForm.is_trial,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingNanny(null);
        setBookingSuccess(false);
        setBookingForm({ start_date: '', end_date: '', hours_per_day: 4, address: '', notes: '' });
      }, 2000);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Buyurtmani saqlashda xato yuz berdi');
    } finally {
      setBookingLoading(false);
    }
  };

  // ─── Filter helpers ────────────────────────────────────────────────────────
  const applyFilter = (next: NannyFilterState) => {
    setNannyFilter(next);
    setFilterDraft(next);
    setNannyPage(1);
    loadNannies(next, 1);
  };

  const applyDraft = () => {
    setNannyFilter(filterDraft);
    setNannyPage(1);
    loadNannies(filterDraft, 1);
  };

  const resetFilter = () => {
    setFilterDraft(DEFAULT_FILTER);
    applyFilter(DEFAULT_FILTER);
  };

  const handleGeoLocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Brauzer geolokatsiyani qo\'llab-quvvatlamaydi');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { ...filterDraft, lat: coords.latitude, lon: coords.longitude };
        setFilterDraft(next);
        setNannyFilter(next);
        setNannyPage(1);
        loadNannies(next, 1);
        setGeoLoading(false);
      },
      () => {
        setGeoError('Joylashuv aniqlanmadi. Ruxsat bering.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const goToPage = (p: number) => {
    setNannyPage(p);
    loadNannies(nannyFilter, p);
    document.getElementById('enagalar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Debounced search inside filter draft
  const handleDraftSearch = (value: string) => {
    const next = { ...filterDraft, search: value };
    setFilterDraft(next);
    if (nannySearchTimer.current) clearTimeout(nannySearchTimer.current);
    nannySearchTimer.current = setTimeout(() => {
      setNannyFilter(next);
      setNannyPage(1);
      loadNannies(next, 1);
    }, 350);
  };

  // Active filter count (for badge)
  const activeFilterCount = [
    filterDraft.skill,
    filterDraft.minRate,
    filterDraft.maxRate,
    filterDraft.minRating > 0,
    filterDraft.minExp > 0,
    filterDraft.isVerified,
    filterDraft.ordering !== '-rating',
    filterDraft.lat !== null,
  ].filter(Boolean).length;

  const displayNannies: DisplayNanny[] = apiNannies;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-200 selection:text-purple-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-purple-900">Parvona</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {(
                <>
                  <a href="#imkoniyatlar" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Imkoniyatlar</a>
                  <a href="#afzalliklar" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Afzalliklar</a>
                  <a href="#qanday-ishlaydi" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Qanday ishlaydi?</a>
                  <a href="#kelajak" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Kelajak rejalar</a>
                </>
              )}
              
              {isAuthReady && !isLoggedIn && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm shadow-purple-200"
                >
                  Kirish
                </button>
              )}

              {isAuthReady && isLoggedIn && (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-purple-200 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-purple-200 bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                          {displayPhoto ? (
                            <img src={displayPhoto} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                            <p className="text-xs text-slate-500 truncate">{userRole === 'nanny' ? 'Enaga' : userRole === 'parent' ? 'Ota-ona' : 'Foydalanuvchi'}</p>
                          </div>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { navigate(userRole === 'admin' ? '/admin' : '/dashboard'); setIsUserMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          >
                            Shaxsiy kabinet
                          </button>
                          <button
                            onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Tizimdan chiqish
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 hover:text-purple-600 focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg overflow-hidden"
            >
              <a href="#imkoniyatlar" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50">Imkoniyatlar</a>
              <a href="#afzalliklar" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50">Afzalliklar</a>
              <a href="#qanday-ishlaydi" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50">Qanday ishlaydi?</a>
              <a href="#kelajak" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50">Kelajak rejalar</a>
              
              {isAuthReady && !isLoggedIn && (
                <button
                  onClick={() => { setIsMenuOpen(false); setIsAuthModalOpen(true); }}
                  className="w-full mt-4 bg-purple-600 text-white px-5 py-3 rounded-xl font-medium"
                >
                  Kirish
                </button>
              )}
              {isAuthReady && isLoggedIn && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 px-3 mb-4">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 border border-slate-200 flex items-center justify-center text-purple-700 font-bold text-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{displayName}</p>
                      <p className="text-xs text-slate-500">{userRole === 'nanny' ? 'Enaga' : userRole === 'parent' ? 'Ota-ona' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate(userRole === 'admin' ? '/admin' : '/dashboard'); setIsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                  >
                    Shaxsiy kabinet
                  </button>
                  <button
                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md mt-1"
                  >
                    Tizimdan chiqish
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-16">
        <>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100 via-white to-white opacity-50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  Navoiyda ishga tushdi
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                  Oila a'zolaringiz uchun <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-sky-500">ishonchli parvarish</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                  O'zbekistonda birinchi bo'lib ayollarni professional g'amxo'r qilib tayyorlaymiz. Bolalar, qariyalar va maxsus ehtiyojli insonlar uchun malakali yordamchilarni bir zumda toping.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => document.getElementById("enagalar")?.scrollIntoView({ behavior: "smooth" })}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 group"
                  >
                    Enaga izlash
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => isLoggedIn ? navigate('/dashboard') : setIsAuthModalOpen(true)}
                    className="bg-white border-2 border-slate-200 hover:border-purple-200 hover:bg-purple-50 text-slate-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center justify-center"
                  >
                    {isLoggedIn ? 'Shaxsiy kabinet' : "G'amxo'r bo'lish"}
                  </button>
                </div>
                <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                      ))}
                    </div>
                    <p>1000+ oilalar ishonchi</p>
                  </div>
                  {totalNannies > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                      <span className="font-semibold text-purple-700">{totalNannies}</span>
                      <span className="text-purple-600">ta enaga ro'yxatda</span>
                    </div>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative lg:ml-auto"
              >
                {/* Abstract Mobile Mockup */}
                <div className="relative w-full max-w-[320px] mx-auto aspect-[1/2] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-20 rounded-b-3xl w-1/2 mx-auto"></div>
                  <div className="absolute inset-0 bg-slate-50 overflow-hidden flex flex-col">
                    {/* App Header */}
                    <div className="bg-purple-600 pt-12 pb-6 px-6 text-white rounded-b-3xl shadow-sm">
                      <p className="text-purple-200 text-sm">Xush kelibsiz,</p>
                      <h3 className="text-xl font-bold">Kimgadir yordam kerakmi?</h3>
                    </div>
                    {/* App Content */}
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xl">🧸</div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Bolalar uchun</h4>
                          <p className="text-xs text-slate-500">Enaga va hamrohlar</p>
                        </div>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xl">👵</div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Qariyalar uchun</h4>
                          <p className="text-xs text-slate-500">Tibbiy parvarish</p>
                        </div>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xl">♿</div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Inkluziv parvarish</h4>
                          <p className="text-xs text-slate-500">Maxsus ehtiyojlilar</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-1/4 -left-12 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Tasdiqlangan</p>
                    <p className="text-sm font-bold text-slate-800">Malakali enaga</p>
                  </div>
                </motion.div>
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 -right-8 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Reyting</p>
                    <p className="text-sm font-bold text-slate-800">4.9 / 5.0</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Enagalar bo'limi (inline filter + grid + pagination) ── */}
        <section id="enagalar" className="py-16 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section header */}
            <div className="mb-10">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-2"
              >
                Barcha enagalar
              </motion.h2>
              <p className="text-slate-500 text-base">
                {apiNanniesLoading ? 'Qidirilmoqda...' : `${totalNannies} ta enaga topildi`}
              </p>
            </div>

            <div className="flex gap-6 items-start">

              {/* ── Filter sidebar (desktop) ── */}
              <aside className="hidden lg:flex w-[400px] shrink-0 flex-col bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">

                {/* Search */}
                <div className="px-5 pt-5 pb-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filterDraft.search}
                      onChange={e => handleDraftSearch(e.target.value)}
                      placeholder="Ism yoki joylashuv..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="px-5 space-y-5 pb-4 flex-1">

                  {/* Saralash */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5" /> Saralash tartibi
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const next = { ...filterDraft, ordering: opt.value };
                            setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1);
                          }}
                          className={`px-2 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 justify-center ${
                            filterDraft.ordering === opt.value
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reyting */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> Minimal reyting
                    </p>
                    <div className="flex gap-1.5">
                      {[0, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          onClick={() => {
                            const next = { ...filterDraft, minRating: filterDraft.minRating === r ? 0 : r };
                            setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                            filterDraft.minRating === r
                              ? 'bg-amber-400 text-white border-amber-400 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600'
                          }`}
                        >
                          {r === 0 ? 'Bari' : `${r}★+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Narx */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5" /> Soatlik narx (so'm)
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {PRICE_PRESETS.map(p => {
                        const active = filterDraft.minRate === String(p.min) && filterDraft.maxRate === String(p.max || '');
                        return (
                          <button
                            key={p.label}
                            onClick={() => {
                              const next = { ...filterDraft, minRate: String(p.min), maxRate: String(p.max || '') };
                              setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1);
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                              active
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={filterDraft.minRate}
                        onChange={e => setFilterDraft(d => ({ ...d, minRate: e.target.value }))}
                        onBlur={() => { setNannyFilter(filterDraft); setNannyPage(1); loadNannies(filterDraft, 1); }}
                        placeholder="Min narx"
                        min={0}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                      />
                      <span className="text-slate-300">—</span>
                      <input
                        type="number"
                        value={filterDraft.maxRate}
                        onChange={e => setFilterDraft(d => ({ ...d, maxRate: e.target.value }))}
                        onBlur={() => { setNannyFilter(filterDraft); setNannyPage(1); loadNannies(filterDraft, 1); }}
                        placeholder="Max narx"
                        min={0}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Tajriba */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Minimal tajriba
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {EXP_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          onClick={() => {
                            const next = { ...filterDraft, minExp: filterDraft.minExp === o.value ? 0 : o.value };
                            setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1);
                          }}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                            filterDraft.minExp === o.value
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ko'nikmalar */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Ko'nikmalar
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(SKILL_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            const next = { ...filterDraft, skill: filterDraft.skill === key ? '' : key };
                            setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1);
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                            filterDraft.skill === key
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Geolokatsiya */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
                    <div className="flex items-center justify-between py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Menga yaqin enagalar</p>
                          <p className="text-[10px] text-slate-500">GPS orqali aniqlash</p>
                        </div>
                      </div>
                      <button
                        onClick={handleGeoLocate}
                        disabled={geoLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterDraft.lat
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-100'
                        } disabled:opacity-50`}
                      >
                        {geoLoading ? (
                          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        {filterDraft.lat ? 'Faol' : 'Aniqlash'}
                      </button>
                    </div>
                    {filterDraft.lat && (
                      <div className="px-4 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500">Radius: <b className="text-slate-700">{filterDraft.radiusKm} km</b></span>
                          <button
                            onClick={() => {
                              const next = { ...filterDraft, lat: null, lon: null, radiusKm: 10 };
                              setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1);
                            }}
                            className="text-[10px] text-red-400 hover:text-red-600 font-semibold"
                          >
                            O'chirish
                          </button>
                        </div>
                        <input
                          type="range" min={1} max={50} step={1}
                          value={filterDraft.radiusKm}
                          onChange={e => setFilterDraft(d => ({ ...d, radiusKm: +e.target.value }))}
                          onMouseUp={() => { setNannyFilter(filterDraft); setNannyPage(1); loadNannies(filterDraft, 1); }}
                          onTouchEnd={() => { setNannyFilter(filterDraft); setNannyPage(1); loadNannies(filterDraft, 1); }}
                          className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                          <span>1 km</span><span>25 km</span><span>50 km</span>
                        </div>
                      </div>
                    )}
                    {geoError && (
                      <p className="px-4 pb-3 text-[10px] text-red-500 font-medium">{geoError}</p>
                    )}
                  </div>

                  {/* Tasdiqlangan */}
                  <div className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Faqat tasdiqlangan</p>
                        <p className="text-[10px] text-slate-500">Admin tekshirgan enagalar</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const next = { ...filterDraft, isVerified: !filterDraft.isVerified };
                        setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1);
                      }}
                      className={`relative rounded-full transition-colors duration-200 ${filterDraft.isVerified ? 'bg-green-500' : 'bg-slate-200'}`}
                      style={{ width: '40px', height: '22px', minWidth: '40px' }}
                    >
                      <span className={`absolute top-0.5 bg-white rounded-full shadow transition-all duration-200 ${filterDraft.isVerified ? 'left-[18px]' : 'left-0.5'}`} style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>

                </div>

                {/* Reset */}
                <div className="px-5 py-4 border-t border-slate-100 shrink-0">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilter}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Tozalash ({activeFilterCount})
                    </button>
                  )}
                </div>
              </aside>

              {/* ── Results ── */}
              <div className="flex-1 min-w-0">

                {/* Mobile: search + filter toggle */}
                <div className="lg:hidden mb-4 flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filterDraft.search}
                      onChange={e => handleDraftSearch(e.target.value)}
                      placeholder="Qidirish..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(f => !f)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      isFilterOpen || activeFilterCount > 0
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtr
                    {activeFilterCount > 0 && (
                      <span className="bg-white text-purple-600 text-[10px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Mobile filter panel */}
                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="lg:hidden overflow-hidden bg-white rounded-2xl border border-slate-100 mb-4"
                    >
                      <div className="px-4 py-4 space-y-4">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Saralash</p>
                          <div className="flex flex-wrap gap-1.5">
                            {SORT_OPTIONS.map(opt => (
                              <button key={opt.value}
                                onClick={() => { const next = { ...filterDraft, ordering: opt.value }; setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1); }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${filterDraft.ordering === opt.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reyting</p>
                          <div className="flex gap-1.5">
                            {[0, 3, 4, 5].map(r => (
                              <button key={r} onClick={() => { const next = { ...filterDraft, minRating: filterDraft.minRating === r ? 0 : r }; setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1); }}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterDraft.minRating === r ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-slate-600 border-slate-200'}`}>
                                {r === 0 ? 'Bari' : `${r}★+`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Narx</p>
                          <div className="flex flex-wrap gap-1.5">
                            {PRICE_PRESETS.map(p => {
                              const active = filterDraft.minRate === String(p.min) && filterDraft.maxRate === String(p.max || '');
                              return (
                                <button key={p.label} onClick={() => { const next = { ...filterDraft, minRate: String(p.min), maxRate: String(p.max || '') }; setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1); }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tajriba</p>
                          <div className="flex gap-1.5">
                            {EXP_OPTIONS.map(o => (
                              <button key={o.value} onClick={() => { const next = { ...filterDraft, minExp: filterDraft.minExp === o.value ? 0 : o.value }; setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1); }}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterDraft.minExp === o.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ko'nikmalar</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(SKILL_LABELS).map(([key, label]) => (
                              <button key={key} onClick={() => { const next = { ...filterDraft, skill: filterDraft.skill === key ? '' : key }; setFilterDraft(next); setNannyFilter(next); setNannyPage(1); loadNannies(next, 1); }}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${filterDraft.skill === key ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {activeFilterCount > 0 && (
                          <button onClick={resetFilter} className="w-full text-xs text-red-500 font-semibold py-2 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" /> Tozalash
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active filters bar */}
                {activeFilterCount > 0 && (
                  <div className="mb-4 px-4 py-2.5 bg-purple-50 border border-purple-100 rounded-2xl flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-purple-700">Faol filtrlar:</span>
                    {filterDraft.minRating > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                        <Star className="w-3 h-3" /> {filterDraft.minRating}★+
                      </span>
                    )}
                    {(filterDraft.minRate || filterDraft.maxRate) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        <Banknote className="w-3 h-3" /> {filterDraft.minRate || '0'} – {filterDraft.maxRate || '∞'} so'm
                      </span>
                    )}
                    {filterDraft.minExp > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <Award className="w-3 h-3" /> {filterDraft.minExp}+ yil
                      </span>
                    )}
                    {filterDraft.skill && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                        <GraduationCap className="w-3 h-3" /> {SKILL_LABELS[filterDraft.skill] || filterDraft.skill}
                      </span>
                    )}
                    {filterDraft.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <BadgeCheck className="w-3 h-3" /> Tasdiqlangan
                      </span>
                    )}
                    {filterDraft.ordering !== '-rating' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                        <ArrowUpDown className="w-3 h-3" /> {SORT_OPTIONS.find(o => o.value === filterDraft.ordering)?.label}
                      </span>
                    )}
                    {filterDraft.lat && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <MapPin className="w-3 h-3" /> {filterDraft.radiusKm} km atrofida
                      </span>
                    )}
                    <button onClick={resetFilter} className="ml-auto text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors">
                      <RotateCcw className="w-3 h-3" /> Tozalash
                    </button>
                  </div>
                )}

                {/* Loading skeleton */}
                {apiNanniesLoading && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse">
                        <div className="flex gap-3 mb-3">
                          <div className="w-14 h-14 bg-slate-200 rounded-xl shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                            <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                            <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
                          </div>
                        </div>
                        <div className="flex gap-1.5 mb-3">
                          <div className="h-5 bg-slate-100 rounded-full w-16" />
                          <div className="h-5 bg-slate-100 rounded-full w-14" />
                        </div>
                        <div className="h-9 bg-slate-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!apiNanniesLoading && displayNannies.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-800 font-bold text-lg mb-1">Enaga topilmadi</p>
                    <p className="text-sm text-slate-400 mb-5">Filtr shartlarini o'zgartirib ko'ring</p>
                    <button onClick={resetFilter} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors">
                      <RotateCcw className="w-4 h-4" /> Filtrlarni tozalash
                    </button>
                  </div>
                )}

                {/* Grid */}
                {!apiNanniesLoading && displayNannies.length > 0 && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {displayNannies.map(nanny => (
                      <NannyCard
                        key={nanny.id}
                        nanny={nanny}
                        onSelect={() => setSelectedNanny(nanny)}
                        onBook={() => {
                          if (!djangoUser) { setIsAuthModalOpen(true); return; }
                          setBookingNanny(nanny);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!apiNanniesLoading && totalNannies > PAGE_SIZE && (() => {
                  const totalPages = Math.ceil(totalNannies / PAGE_SIZE);
                  const pages: (number | '...')[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (nannyPage > 3) pages.push('...');
                    for (let i = Math.max(2, nannyPage - 1); i <= Math.min(totalPages - 1, nannyPage + 1); i++) pages.push(i);
                    if (nannyPage < totalPages - 2) pages.push('...');
                    pages.push(totalPages);
                  }
                  return (
                    <div className="mt-8 flex items-center justify-center gap-1.5">
                      <button
                        disabled={nannyPage === 1}
                        onClick={() => goToPage(nannyPage - 1)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {pages.map((p, i) =>
                        p === '...' ? (
                          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => goToPage(p as number)}
                            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all border ${
                              nannyPage === p
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                      <button
                        disabled={nannyPage === totalPages}
                        onClick={() => goToPage(nannyPage + 1)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all rotate-180"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="imkoniyatlar" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
              >
                Parvona — nafaqat enaga, balki butun oila uchun ishonchli parvarish platformasi
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                O'zbekistonda birinchi bo'lib ayollarni professional g'amxo'r qilib tayyorlaymiz va sizga quyidagi xizmatlarni taklif qilamiz:
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  🧸
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Bolalar va sog'lom insonlar uchun</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <span>Professional enagalar va bolalar g'amxo'rlari</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <span>Sog'lom oila a'zolari uchun hamrohlik, uy vazifalari yordami, kundalik yordam</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <span>Moslashuvchan jadval: soatlik, kunlik, kechki yoki hafta oxiri</span>
                  </li>
                </ul>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  👵
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Qariyalar uchun maxsus parvarish</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span>Tajribali qariyalar enagalari (medical background bilan)</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span>Kundalik yordam, dori-darmon eslatmalari, yurish-turish yordami</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span>Ruhiy va emotsional qo'llab-quvvatlash</span>
                  </li>
                </ul>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  ♿
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Inkluziv parvarish</h3>
                <p className="text-sm font-medium text-emerald-600 mb-4 uppercase tracking-wider">Maxsus ehtiyojlilar uchun</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Nogironligi bor bolalar va kattalar uchun inkluziv g'amxo'rlar</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Autizm, Down sindromi, harakat cheklovlari va boshqa holatlar uchun maxsus o'qitilgan ayollar</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Individual yondashuv va maxsus sertifikatlar</span>
                  </li>
                </ul>
              </motion.div>

              {/* Feature 4 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  👩‍❤️‍👩
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Enaga topish va yollash xizmati</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>Tez izlash (Navoiy bo'yicha filtrlar: yosh, tajriba, til, narx)</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>To'liq profil + video intervyu + mijozlar reytingi</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>Bir marta bosish bilan bron qilish va xavfsiz to'lov</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>Shartnoma va sug'urta bilan rasmiy yollash</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* New Advantages Section */}
        <section id="afzalliklar" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
              >
                Platformamizning o'ziga xos afzalliklari
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                Xavfsizlik, innovatsiya va qulaylik — bizning asosiy qadriyatlarimiz.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Trust & Safety */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Ishonch va Xavfsizlik</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><Video className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/> <b>Video-tanishuv:</b> 30 soniyali qisqa video-intervyular.</li>
                  <li className="flex items-start gap-2"><UserCheck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/> <b>ID-verifikatsiya:</b> Pasport va sudlanmaganlik tekshiruvi.</li>
                  <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/> <b>Sug'urta tizimi:</b> Har bir buyurtma uchun kichik sug'urta paketi.</li>
                </ul>
              </motion.div>

              {/* UX/UI Features */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Map className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Innovatsion qulayliklar</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> <b>Real vaqtda kuzatuv (GPS):</b> Sayr vaqtida xaritada kuzatish.</li>
                  <li className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> <b>Favqulodda tugma (SOS):</b> Tezkor yordam chaqirish tugmasi.</li>
                  <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> <b>Sinov muddati:</b> Arzonlashtirilgan 2-3 soatlik tanishuv darsi.</li>
                </ul>
              </motion.div>

              {/* Education & Community */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Ta'lim va Jamiyat</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><GraduationCap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"/> <b>Parvona Akademiya:</b> Oflayn va onlayn amaliy mashg'ulotlar.</li>
                  <li className="flex items-start gap-2"><Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"/> <b>Maxsus nishonlar:</b> "Eng sabrli", "Kreativ" kabi reytinglar.</li>
                </ul>
              </motion.div>

              {/* AI & Data */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5 }}
                className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <BrainCircuit className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Sun'iy intellekt</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0"/> <b>AI-Matching:</b> Talablarga mos 3 ta nomzodni avtomatik tavsiya qilish.</li>
                  <li className="flex items-start gap-2"><Search className="w-4 h-4 text-purple-500 mt-0.5 shrink-0"/> <b>Ko'p tilli qo'llab-quvvatlash:</b> O'zbek, rus, ingliz tillari (Navoiydagi ekspatlar uchun).</li>
                </ul>
              </motion.div>

              {/* Localization */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -5 }}
                className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all md:col-span-2 lg:col-span-1"
              >
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Mahalliylashtirish</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><CreditCard className="w-4 h-4 text-rose-500 mt-0.5 shrink-0"/> <b>To'lov tizimlari:</b> Payme, Click, Uzum Pay bilan chuqur integratsiya.</li>
                  <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0"/> <b>Mahalla bilan ishlash:</b> "O'z mahallangdan top" funksiyasi.</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it works (Updated with Tabs) */}
        <section id="qanday-ishlaydi" className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
              >
                Qanday ishlaydi?
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                Foydalanuvchi yo'li juda oddiy va tushunarli.
              </motion.p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-12">
              <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 inline-flex relative">
                <button 
                  onClick={() => setActiveTab('parents')}
                  className={`relative z-10 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'parents' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Ota-onalar uchun
                </button>
                <button 
                  onClick={() => setActiveTab('nannies')}
                  className={`relative z-10 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'nannies' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  G'amxo'rlar uchun
                </button>
                <motion.div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-purple-600 rounded-xl"
                  animate={{ left: activeTab === 'parents' ? '4px' : 'calc(50%)' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
            </div>

            {/* Tab Content */}
            <div className="relative min-h-[300px]">
              <AnimatePresence mode="wait">
                {activeTab === 'parents' && (
                  <motion.div 
                    key="parents"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="grid md:grid-cols-4 gap-8 relative"
                  >
                    <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-purple-100 -z-10"></div>
                    {[
                      { icon: UserPlus, title: "1. Ro'yxatdan o'tish", desc: "Platformada ro'yxatdan o'ting va o'z talablaringizni kiriting." },
                      { icon: Video, title: "2. Video-intervyu", desc: "Nomzodlarning 30 soniyali video-intervyularini ko'rib chiqing." },
                      { icon: BrainCircuit, title: "3. AI Matching", desc: "Sun'iy intellekt sizga eng mos 3 ta nomzodni tavsiya qiladi." },
                      { icon: ShieldCheck, title: "4. Xavfsiz to'lov", desc: "Xavfsiz to'lovni amalga oshiring va xizmat so'ngida baho bering." }
                    ].map((step, idx) => (
                      <div key={idx} className="relative text-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center mb-6 relative z-10">
                          <step.icon className="w-7 h-7 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                        <p className="text-slate-600 text-sm">{step.desc}</p>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'nannies' && (
                  <motion.div 
                    key="nannies"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="grid md:grid-cols-4 gap-8 relative"
                  >
                    <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-sky-100 -z-10"></div>
                    {[
                      { icon: UserCheck, title: "1. Ro'yxatdan o'tish", desc: "Shaxsiy ma'lumotlarni kiriting va ID-verifikatsiyadan o'ting." },
                      { icon: GraduationCap, title: "2. Akademiya", desc: "Video-intervyu yuklang va Akademiyada sertifikat oling." },
                      { icon: Search, title: "3. Matching", desc: "O'zingizga mos ish vaqti va lokatsiyaga qarab buyurtma oling." },
                      { icon: Wallet, title: "4. Daromad va reyting", desc: "Xavfsiz daromad oling va ota-onalar e'tirofiga ega bo'ling." }
                    ].map((step, idx) => (
                      <div key={idx} className="relative text-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="w-16 h-16 mx-auto bg-sky-50 rounded-full flex items-center justify-center mb-6 relative z-10">
                          <step.icon className="w-7 h-7 text-sky-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                        <p className="text-slate-600 text-sm">{step.desc}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Landing Page Map Section */}
        <section id="xarita" className="py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-6"
              >
                Bizning enagalarimiz xaritada
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                O'zingizga eng yaqin bo'lgan mutaxassislarni toping va ularning xizmat ko'rsatish hududlari bilan tanishing.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="h-[500px] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 relative z-0"
            >
              <MapContainer 
                center={[40.5, 67.0]} 
                zoom={6} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {displayNannies.map((nanny) => (
                  nanny.coordinates && (
                    <React.Fragment key={nanny.id}>
                      <CircleMarker 
                        center={nanny.coordinates} 
                        radius={8}
                        pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 1 }}
                      >
                        <Popup>
                          <div className="p-1 min-w-[150px]">
                            <div className="flex items-center gap-3 mb-2">
                              <img src={nanny.imageUrl} alt={nanny.name} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                <h4 className="font-bold text-slate-900 leading-tight">{nanny.name}</h4>
                                <div className="flex items-center gap-1 text-amber-500 text-xs mt-0.5">
                                  <Star className="w-3 h-3 fill-amber-500" />
                                  <span>{nanny.rating}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 mb-1">{nanny.locationName}</p>
                            <p className="text-sm text-purple-600 font-bold">{nanny.hourlyRate}<span className="text-xs text-slate-500 font-normal">/soat</span></p>
                          </div>
                        </Popup>
                      </CircleMarker>
                      <Circle 
                        center={nanny.coordinates} 
                        radius={4000}
                        pathOptions={{ fillColor: '#9333ea', color: '#7e22ce', fillOpacity: 0.1, weight: 1 }}
                      />
                    </React.Fragment>
                  )
                ))}
              </MapContainer>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="sharhlar" className="py-24 bg-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
              >
                Foydalanuvchilarimiz sharhlari
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                Parvona orqali xizmatdan foydalangan insonlarning haqiqiy izohlari.
              </motion.p>
            </div>

            {landingReviewsLoading ? (
              /* Skeleton */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-slate-200 rounded-full" />
                        <div className="h-3 w-20 bg-slate-200 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded-full" />
                      <div className="h-3 bg-slate-200 rounded-full w-4/5" />
                      <div className="h-3 bg-slate-200 rounded-full w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : landingReviews.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {landingReviews.map((review, idx) => {
                  const initials = review.author.name
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const gradients = [
                    'from-purple-500 to-indigo-600',
                    'from-sky-500 to-blue-600',
                    'from-emerald-500 to-teal-600',
                    'from-rose-500 to-pink-600',
                    'from-amber-500 to-orange-600',
                    'from-violet-500 to-purple-600',
                  ];
                  const grad = gradients[idx % gradients.length];
                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.07 }}
                      className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative flex flex-col"
                    >
                      {/* Quote icon */}
                      <MessageSquareQuote className="absolute top-5 right-5 w-8 h-8 text-purple-100" />

                      {/* Stars */}
                      <div className="flex gap-0.5 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>

                      {/* Text */}
                      <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-5 line-clamp-4">
                        "{review.text}"
                      </p>

                      {/* Author + nanny */}
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        {review.author.photo ? (
                          <img
                            src={review.author.photo}
                            alt={review.author.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {review.author.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {review.author.role === 'parent' ? 'Ota-ona' : 'Enaga'} · {review.target.name} haqida
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Fallback: static cards */
              <div className="grid md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative"
                >
                  <div className="absolute top-8 right-8 text-purple-200">
                    <MessageSquareQuote className="w-12 h-12" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">D</div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Dilbar, 32 yosh</h3>
                      <p className="text-purple-600 text-sm font-medium">Professional Enaga</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-600 italic">
                    "Parvona orqali ishonchli oilalarda ishlayapman. Daromadim 2 barobar oshdi va mehnatim qadrlanayotganini his qilyapman."
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative"
                >
                  <div className="absolute top-8 right-8 text-sky-200">
                    <MessageSquareQuote className="w-12 h-12" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">A</div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Aysel, 28 yosh</h3>
                      <p className="text-sky-600 text-sm font-medium">Yosh Ona</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-600 italic">
                    "Parvona orqali o'zimizga eng mos enagani topdik. Xavfsiz to'lov tizimi menga xotirjamlik beradi."
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </section>

        {/* Future Plans */}
        <section id="kelajak" className="py-24 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-900 to-slate-900"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              >
                Bugun Navoiy — ertaga butun O'zbekiston va undan ham uzoqroq
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-400"
              >
                Loyihamizning kelajakdagi rivojlanish yo'nalishlari.
              </motion.p>
            </div>

            <div className="relative border-l-2 border-purple-500/30 ml-4 md:ml-0 md:border-l-0">
              {/* Desktop center line */}
              <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -ml-[1px] w-[2px] bg-purple-500/30"></div>

              <div className="space-y-12">
                {/* 2026 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="relative flex flex-col md:flex-row items-center md:justify-between group"
                >
                  <div className="absolute left-[-25px] md:left-1/2 md:-ml-3 w-6 h-6 rounded-full bg-purple-600 border-4 border-slate-900 z-10 group-hover:scale-125 transition-transform"></div>
                  <div className="w-full md:w-[45%] pl-8 md:pl-0 md:pr-12 md:text-right">
                    <h3 className="text-2xl font-bold text-purple-400 mb-2">2026 yil (hozirgi bosqich)</h3>
                    <ul className="space-y-2 text-slate-300">
                      <li>• Navoiyda to'liq ishga tushirish</li>
                      <li>• 500+ ayol professional sertifikat oladi</li>
                      <li>• Bolalar, qariyalar va inkluziv parvarish bo'yicha 1000+ muvaffaqiyatli buyurtma</li>
                    </ul>
                  </div>
                  <div className="hidden md:block w-[45%]"></div>
                </motion.div>

                {/* 2027 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="relative flex flex-col md:flex-row items-center md:justify-between group"
                >
                  <div className="absolute left-[-25px] md:left-1/2 md:-ml-3 w-6 h-6 rounded-full bg-purple-500 border-4 border-slate-900 z-10 group-hover:scale-125 transition-transform"></div>
                  <div className="hidden md:block w-[45%]"></div>
                  <div className="w-full md:w-[45%] pl-8 md:pl-12">
                    <h3 className="text-2xl font-bold text-purple-400 mb-2">2027 yil</h3>
                    <ul className="space-y-2 text-slate-300">
                      <li>• Samarqand, Buxoro, Andijon va Farg'onaga chiqish</li>
                      <li>• 3000+ ayol o'qitiladi</li>
                      <li>• Yangi yo'nalishlar: uy tibbiy yordamchi va psixologik qo'llab-quvvatlash</li>
                    </ul>
                  </div>
                </motion.div>

                {/* 2028 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="relative flex flex-col md:flex-row items-center md:justify-between group"
                >
                  <div className="absolute left-[-25px] md:left-1/2 md:-ml-3 w-6 h-6 rounded-full bg-purple-400 border-4 border-slate-900 z-10 group-hover:scale-125 transition-transform"></div>
                  <div className="w-full md:w-[45%] pl-8 md:pl-0 md:pr-12 md:text-right">
                    <h3 className="text-2xl font-bold text-purple-400 mb-2">2028 yil</h3>
                    <ul className="space-y-2 text-slate-300">
                      <li>• Butun O'zbekiston bo'ylab qamrov</li>
                      <li>• Xalqaro standartlarga (ISO) mos sertifikatlar</li>
                      <li>• Mobil ilovani rus, o'zbek va ingliz tillarida to'liq ishga tushirish</li>
                    </ul>
                  </div>
                  <div className="hidden md:block w-[45%]"></div>
                </motion.div>

                {/* Vision */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="relative flex flex-col md:flex-row items-center md:justify-between group"
                >
                  <div className="absolute left-[-25px] md:left-1/2 md:-ml-3 w-6 h-6 rounded-full bg-sky-400 border-4 border-slate-900 z-10 group-hover:scale-125 transition-transform shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>
                  <div className="hidden md:block w-[45%]"></div>
                  <div className="w-full md:w-[45%] pl-8 md:pl-12">
                    <h3 className="text-2xl font-bold text-sky-400 mb-2">Uzoq muddatli vizyon</h3>
                    <ul className="space-y-2 text-slate-300">
                      <li>• Markaziy Osiyoda yetakchi ayollar iqtisodiy kuchini oshiruvchi platforma bo'lish</li>
                      <li>• 50 000 ayolga munosib ish o'rni yaratish</li>
                      <li>• Har bir oilaga "Parvona" darajasidagi xavfsiz va professional parvarish yetkazish</li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-20 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 text-center max-w-4xl mx-auto"
            >
              <div className="grid sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
                <div className="pt-4 sm:pt-0">
                  <p className="text-3xl font-bold text-white mb-2">40%</p>
                  <p className="text-sm text-slate-400">oilalar ishonchli g'amxo'r topa olmaydi</p>
                </div>
                <div className="pt-4 sm:pt-0">
                  <p className="text-3xl font-bold text-white mb-2">1 mln+</p>
                  <p className="text-sm text-slate-400">ishsiz ayollar bor</p>
                </div>
                <div className="pt-4 sm:pt-0">
                  <p className="text-xl font-bold text-purple-400 mb-2 flex items-center justify-center gap-2">
                    <HeartHandshake className="w-6 h-6" /> Parvona
                  </p>
                  <p className="text-sm text-slate-400">ikkalasini ham birlashtiradi</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Revenue Model */}
        <section id="biznes-model" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
              >
                Platforma qanday pul topadi?
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                Shaffof va barqaror biznes modelimiz orqali hamkorlar va investorlar uchun ishonchli tizim.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Wallet, title: "15% Komissiya", desc: "Har bir muvaffaqiyatli buyurtma va tranzaksiyadan olinadigan xizmat haqi.", color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: GraduationCap, title: "O'qitish Kurslari", desc: "Parvona Akademiyasidagi professional enagalar tayyorlash kurslari ($50-200).", color: "text-purple-600", bg: "bg-purple-50" },
                { icon: Star, title: "Premium Obuna", desc: "Oilalar uchun qo'shimcha imtiyozlar va VIP xizmatlar ($10-30/oy).", color: "text-amber-500", bg: "bg-amber-50" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow"
                >
                  <div className={`w-16 h-16 mx-auto ${item.bg} rounded-full flex items-center justify-center mb-6`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold text-white mb-6"
            >
              O'z oilangizni ishonchli qo'llarga topshiring
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-purple-100 mb-10"
            >
              Hozir harakat qiling va Parvona ilovasini yuklab oling.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <button className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.73 3.65 1.89-3.23 1.96-2.75 6.06.45 7.34-.78 1.98-1.7 3.74-2.77 4.7zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                App Store
              </button>
              <button className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.98 1.98 0 0 1-.527-1.333V3.147c0-.526.198-1.004.526-1.333zM14.925 10.868l2.507-1.447L5.34 2.445l9.585 8.423zM18.42 12.883l-3.495-2.015-1.133 1.132 1.133 1.132 3.495-2.015a1.03 1.03 0 0 0 0-1.784l-2.507-1.447zM14.925 13.132l-9.585 8.423 12.092-6.976-2.507-1.447z"/>
                </svg>
                Google Play
              </button>
            </motion.div>
          </div>
        </section>
        </>
      </main>


      {/* Nanny Profile Modal with Video Interview */}
      <AnimatePresence>
        {selectedNanny && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70] bg-white overflow-y-auto"
          >
            <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
              <button 
                onClick={() => setSelectedNanny(null)} 
                className="mb-8 flex items-center text-slate-500 hover:text-purple-600 font-medium transition-colors bg-slate-50 hover:bg-purple-50 px-4 py-2 rounded-full w-fit"
              >
                <ChevronLeft className="w-5 h-5 mr-1" /> Orqaga qaytish
              </button>
              
              <div className="grid lg:grid-cols-5 gap-10">
                {/* Left Column: Video & Bio */}
                <div className="lg:col-span-3 space-y-8">
                  {/* Video Interview Section */}
                  <InterviewVideoPlayer 
                    src={selectedNanny.videoUrl} 
                    poster={selectedNanny.imageUrl} 
                    title="30-soniyali Tanishuv"
                  />

                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">O'zim haqimda</h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {selectedNanny.bio}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Ko'nikma va xizmatlar</h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedNanny.skills.map((skill, idx) => (
                        <span key={idx} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium border border-purple-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Service Area Map */}
                  {selectedNanny.coordinates && (
                    <div className="pt-8 border-t border-slate-100">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">Xizmat ko'rsatish hududi</h3>
                      <p className="text-slate-600 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        {selectedNanny.locationName || 'Asosiy xizmat hududi'}
                      </p>
                      <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                        <MapContainer 
                          center={selectedNanny.coordinates} 
                          zoom={12} 
                          scrollWheelZoom={false} 
                          style={{ height: '100%', width: '100%' }}
                        >
                          <MapResizer />
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Circle 
                            center={selectedNanny.coordinates} 
                            radius={4000}
                            pathOptions={{ fillColor: '#9333ea', color: '#7e22ce', fillOpacity: 0.2 }}
                          />
                        </MapContainer>
                      </div>
                    </div>
                  )}

                  {/* Reviews Section */}
                  <div className="pt-8 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">
                      Ota-onalar sharhlari
                      {selectedNannyReviews.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-500">({selectedNannyReviews.length} ta)</span>
                      )}
                    </h3>
                    {reviewsLoading ? (
                      <div className="space-y-4">
                        {[1, 2].map(i => (
                          <div key={i} className="bg-slate-50 rounded-2xl p-6 animate-pulse">
                            <div className="flex justify-between mb-3">
                              <div className="h-4 bg-slate-200 rounded w-32" />
                              <div className="h-4 bg-slate-200 rounded w-20" />
                            </div>
                            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                          </div>
                        ))}
                      </div>
                    ) : selectedNannyReviews.length > 0 ? (
                      <div className="space-y-6">
                        {selectedNannyReviews.map((review: Review) => (
                          <div key={review.id} className="bg-slate-50 rounded-2xl p-6">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-sm">
                                  {review.author.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{review.author.name}</h4>
                                  <p className="text-xs text-slate-500">
                                    {new Date(review.created_at).toLocaleDateString('uz-UZ')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                                ))}
                                {[...Array(5 - review.rating)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-slate-300" />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : selectedNanny.reviewsList && selectedNanny.reviewsList.length > 0 ? (
                      // Mock reviews for demo nannies
                      <div className="space-y-6">
                        {selectedNanny.reviewsList.map((review, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl p-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-slate-900">{review.author}</h4>
                                <p className="text-xs text-slate-500">{review.date}</p>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-700">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Hali sharhlar yo'q</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Profile Info & Action */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm sticky top-8">
                    <div className="flex items-center gap-5 mb-6">
                      <img src={selectedNanny.imageUrl} alt={selectedNanny.name} className="w-24 h-24 rounded-full object-cover border-4 border-purple-50" />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h2 className="text-2xl font-bold text-slate-900">{selectedNanny.name}</h2>
                          {selectedNanny.isPro && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-xs font-bold text-white">
                              <Crown className="w-3 h-3" /> Pro
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-amber-500 font-medium mt-1">
                          <Star className="w-5 h-5 fill-amber-500" />
                          <span className="text-lg">{selectedNanny.rating}</span>
                          <span className="text-slate-400 text-sm font-normal underline cursor-pointer">({selectedNanny.reviews} sharh)</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges Section */}
                    <div className="mb-6">
                      <p className="text-sm text-slate-500 mb-2 font-medium">Ota-onalar e'tirofi</p>
                      <div className="flex flex-col gap-2">
                        {selectedNanny.badges.map((badge, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 px-4 py-3 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                {badge.icon === 'heart' && <Heart className="w-4 h-4 text-rose-500" />}
                                {badge.icon === 'palette' && <Palette className="w-4 h-4 text-indigo-500" />}
                                {badge.icon === 'sparkles' && <Sparkles className="w-4 h-4 text-amber-500" />}
                                {!['heart', 'palette', 'sparkles'].includes(badge.icon) && <Award className="w-4 h-4 text-amber-500" />}
                              </div>
                              <span className="text-sm font-bold text-amber-900">{badge.label}</span>
                            </div>
                            <div className="bg-white px-2.5 py-1 rounded-lg text-xs font-bold text-amber-600 shadow-sm border border-amber-100">
                              {badge.count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-sm text-slate-500 mb-1">Tajriba</p>
                        <p className="font-bold text-slate-900 text-lg">{selectedNanny.experience}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-sm text-slate-500 mb-1">Yosh</p>
                        <p className="font-bold text-slate-900 text-lg">{selectedNanny.age} yosh</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl col-span-2 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Xizmat narxi</p>
                          <p className="font-bold text-slate-900 text-xl">{selectedNanny.hourlyRate}<span className="text-sm text-slate-500 font-normal">/soat</span></p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!djangoUser) { setIsAuthModalOpen(true); return; }
                        setBookingNanny(selectedNanny);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-bold transition-colors shadow-lg shadow-purple-200 mb-3 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Sinov uchrashuvini belgilash
                    </button>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => {
                          if (!djangoUser) { setIsAuthModalOpen(true); return; }
                          setSelectedNanny(null);
                          navigate('/dashboard/messages');
                        }}
                        className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 rounded-xl font-bold transition-colors"
                      >
                        Suhbatga chorlash
                      </button>
                      <button
                        onClick={() => {
                          if (!djangoUser) { setIsAuthModalOpen(true); return; }
                          setSelectedNanny(null);
                          navigate('/dashboard/messages');
                        }}
                        className="w-full bg-white border-2 border-slate-200 hover:border-purple-200 hover:bg-purple-50 text-slate-700 py-3 rounded-xl font-bold transition-colors"
                      >
                        Xabar yozish
                      </button>
                    </div>

                    <div className="mt-6 flex items-start gap-3 text-sm text-slate-500 bg-blue-50/50 p-4 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                      <p>Ushbu nomzodning shaxsi, pasporti va sudlanmaganlik holati <b>Parvona</b> platformasi tomonidan to'liq tekshirilgan.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Fixed Bottom Panel */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => document.getElementById("enagalar")?.scrollIntoView({ behavior: "smooth" })}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-xl text-base font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 group"
        >
          <Search className="w-5 h-5" />
          Enaga izlash
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-purple-900">Parvona</span>
            </div>
            <div className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Parvona. Barcha huquqlar himoyalangan.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-purple-600 transition-colors">Telegram</a>
              <a href="#" className="text-slate-400 hover:text-purple-600 transition-colors">Instagram</a>
              <a href="#" className="text-slate-400 hover:text-purple-600 transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
      {/* Booking Modal */}
      <AnimatePresence>
        {bookingNanny && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => { setBookingNanny(null); setBookingError(''); setBookingSuccess(false); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Buyurtma yuborildi!</h3>
                  <p className="text-slate-600">Enaga tasdiqlashini kuting.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <img src={bookingNanny.imageUrl} alt={bookingNanny.name} className="w-16 h-16 rounded-full object-cover" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{bookingNanny.name}</h2>
                      <p className="text-purple-600 font-medium">{bookingNanny.hourlyRate}/soat</p>
                    </div>
                  </div>

                  {/* Sinov darsi toggle */}
                  <button
                    onClick={() => setBookingForm(f => ({ ...f, is_trial: !f.is_trial }))}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all mb-4 ${
                      bookingForm.is_trial
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bookingForm.is_trial ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        <Star className={`w-5 h-5 ${bookingForm.is_trial ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold ${bookingForm.is_trial ? 'text-amber-800' : 'text-slate-700'}`}>Sinov darsi</p>
                        <p className="text-xs text-slate-500">1 soat • 50% chegirma</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${bookingForm.is_trial ? 'border-amber-400 bg-amber-400' : 'border-slate-300'}`}>
                      {bookingForm.is_trial && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </button>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Boshlanish sanasi</label>
                        <input
                          type="date"
                          value={bookingForm.start_date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setBookingForm(f => ({ ...f, start_date: e.target.value }))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tugash sanasi</label>
                        <input
                          type="date"
                          value={bookingForm.end_date}
                          min={bookingForm.start_date || new Date().toISOString().split('T')[0]}
                          onChange={e => setBookingForm(f => ({ ...f, end_date: e.target.value }))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kunlik soat soni</label>
                      <select
                        value={bookingForm.hours_per_day}
                        onChange={e => setBookingForm(f => ({ ...f, hours_per_day: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        {[2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h} soat</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Manzil</label>
                      <input
                        type="text"
                        value={bookingForm.address}
                        onChange={e => setBookingForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Uy manzilingizni kiriting"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Izoh (ixtiyoriy)</label>
                      <textarea
                        value={bookingForm.notes}
                        onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Maxsus talablar, bolaning yoshi..."
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                      />
                    </div>
                  </div>

                  {bookingError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {bookingError}
                    </div>
                  )}

                  <button
                    onClick={handleCreateBooking}
                    disabled={bookingLoading || !bookingForm.start_date || !bookingForm.end_date || !bookingForm.address}
                    className="mt-6 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? 'Yuklanmoqda...' : (
                      <><Calendar className="w-5 h-5" /> Buyurtma yuborish</>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => { setIsAuthModalOpen(false); clearError(); }}
        onGoogleLogin={handleLogin}
        onTelegramLogin={handleTelegramLogin}
        onEmailLogin={async (email, password) => {
          await loginWithEmail(email, password);
          clearAuthFlow();
          setIsAuthModalOpen(false);
          const { role } = useAuthStore.getState();
          navigate(role === 'admin' ? '/admin' : '/dashboard');
        }}
        onEmailOTPLogin={async (email, otp, role) => {
          await loginWithEmailOTP(email, otp, role);
          clearAuthFlow();
          setIsAuthModalOpen(false);
          const { role: userRole } = useAuthStore.getState();
          navigate(userRole === 'admin' ? '/admin' : '/dashboard');
        }}
        onRegisterComplete={async (email, otp) => {
          await completeRegister(email, otp);
          clearAuthFlow();
          setIsAuthModalOpen(false);
          navigate('/dashboard');
        }}
        onRegisterTelegramComplete={async (reg_token, otp) => {
          await completeTelegramRegister(reg_token, otp);
          clearAuthFlow();
          setIsAuthModalOpen(false);
          navigate('/dashboard');
        }}
        authLoading={authLoading}
        authError={authError}
        clearError={clearError}
      />

      {/* Role Selection Modal */}
      <AnimatePresence>
        {isRoleSelectModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Profilingizni tanlang</h2>
                <p className="text-slate-600">Platformadan qanday maqsadda foydalanmoqchisiz?</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleRoleSelect('parent')}
                  className="bg-white border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 p-6 rounded-2xl text-left transition-all group"
                >
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    👨‍👩‍👧‍👦
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Ota-ona</h3>
                  <p className="text-sm text-slate-500">Farzandim yoki yaqinlarim uchun enaga izlayman</p>
                </button>

                <button 
                  onClick={() => handleRoleSelect('nanny')}
                  className="bg-white border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 p-6 rounded-2xl text-left transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    👩‍⚕️
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Enaga</h3>
                  <p className="text-sm text-slate-500">Ish izlayapman va xizmatlarimni taklif qilaman</p>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
