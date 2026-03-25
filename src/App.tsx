import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Dashboard from './components/Dashboard';
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
  Calendar
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

const InterviewVideoPlayer = ({ src, poster, title }: { src: string, poster: string, title?: string }) => {
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
        src={src}
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

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'parents' | 'nannies'>('parents');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedNanny, setSelectedNanny] = useState<typeof MOCK_NANNIES[0] | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'parent' | 'nanny' | 'admin' | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRoleSelectModalOpen, setIsRoleSelectModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // User exists in Auth but not in Firestore, needs role selection
            setIsRoleSelectModalOpen(true);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setIsAuthModalOpen(false);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setIsRoleSelectModalOpen(true);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRoleSelect = async (role: 'parent' | 'nanny') => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        role: role,
        name: user.displayName || 'Foydalanuvchi',
        email: user.email,
        photoUrl: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setUserRole(role);
      setIsRoleSelectModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
              {currentView === 'dashboard' && (
                <button 
                  onClick={() => setCurrentView('home')}
                  className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Bosh sahifa
                </button>
              )}
              {currentView === 'home' && (
                <>
                  <a href="#imkoniyatlar" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Imkoniyatlar</a>
                  <a href="#afzalliklar" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Afzalliklar</a>
                  <a href="#qanday-ishlaydi" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Qanday ishlaydi?</a>
                  <a href="#kelajak" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Kelajak rejalar</a>
                </>
              )}
              
              {isAuthReady && !user && (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm shadow-purple-200"
                >
                  Kirish
                </button>
              )}

              {isAuthReady && user && (
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full border-2 border-purple-200 object-cover"
                    />
                  </button>
                  
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
                          <p className="text-xs text-slate-500 truncate">{userRole === 'nanny' ? 'Enaga' : userRole === 'parent' ? 'Ota-ona' : 'Foydalanuvchi'}</p>
                        </div>
                        <div className="py-1">
                          <button 
                            onClick={() => { setCurrentView('dashboard'); setIsUserMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          >
                            Shaxsiy kabinet
                          </button>
                          <button 
                            onClick={() => { handleLogout(); setCurrentView('home'); }}
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
              
              {!user ? (
                <button 
                  onClick={() => { setIsMenuOpen(false); setIsAuthModalOpen(true); }}
                  className="w-full mt-4 bg-purple-600 text-white px-5 py-3 rounded-xl font-medium"
                >
                  Kirish
                </button>
              ) : (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 px-3 mb-4">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
                      <p className="text-xs text-slate-500">{userRole === 'nanny' ? 'Enaga' : userRole === 'parent' ? 'Ota-ona' : ''}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setCurrentView('dashboard'); setIsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                  >
                    Shaxsiy kabinet
                  </button>
                  <button 
                    onClick={() => { setIsMenuOpen(false); handleLogout(); setCurrentView('home'); }}
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
        {currentView === 'dashboard' && user && userRole ? (
          <Dashboard user={user} userRole={userRole} onLogout={() => { handleLogout(); setCurrentView('home'); }} />
        ) : (
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
                    onClick={() => setIsSearchOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 group"
                  >
                    Enaga izlash
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => !user && setIsAuthModalOpen(true)}
                    className="bg-white border-2 border-slate-200 hover:border-purple-200 hover:bg-purple-50 text-slate-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center justify-center"
                  >
                    G'amxo'r bo'lish
                  </button>
                </div>
                <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                    ))}
                  </div>
                  <p>1000+ oilalar ishonchi</p>
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

        {/* Top Candidates in Navoiy Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
              >
                Navoiy shahri bo'yicha eng yaxshi nomzodlar
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                Ota-onalar tomonidan eng yuqori baholangan va ishonchli enagalar bilan tanishing.
              </motion.p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {MOCK_NANNIES.filter(n => n.locationName?.includes('Navoiy')).map((nanny, index) => (
                <motion.div 
                  key={nanny.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-purple-900/5 transition-all group flex flex-col"
                >
                  <div 
                    className="relative mb-6 cursor-pointer overflow-hidden rounded-2xl"
                    onClick={() => setSelectedNanny(nanny)}
                  >
                    <img src={nanny.imageUrl} alt={nanny.name} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                        <Play className="w-6 h-6 text-purple-600 ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-medium">
                      <Video className="w-3.5 h-3.5" />
                      30-soniyali intervyu
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-slate-900">{nanny.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{nanny.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {nanny.experience} tajriba</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Navoiy</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6 flex-grow">
                    {nanny.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                    {nanny.skills.length > 3 && (
                      <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">
                        +{nanny.skills.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-auto">
                    <div>
                      <p className="text-sm text-slate-500">Soatiga</p>
                      <p className="font-bold text-purple-700">{nanny.hourlyRate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* Add booking logic */ }}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                        title="Sinov darsini belgilash"
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Sinov darsi</span>
                      </button>
                      <button 
                        onClick={() => setSelectedNanny(nanny)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        Profil
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Barcha nomzodlarni ko'rish <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
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
                {MOCK_NANNIES.map((nanny) => (
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
                Foydalanuvchilarimiz hikoyalari
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600"
              >
                Parvona orqali hayoti o'zgargan insonlar bilan tanishing.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Nanny Testimonial */}
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
                  <img src="https://i.pravatar.cc/300?img=5" alt="Dilbar" className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Dilbar, 32 yosh</h3>
                    <p className="text-purple-600 text-sm font-medium">Professional Enaga</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">
                  "Parvona Akademiyasida o'qib, o'z malakamni oshirdim. Hozirda o'zimga qulay vaqtda, ishonchli oilalarda ishlayapman. Daromadim 2 barobar oshdi va eng muhimi, mehnatim qadrlanayotganini his qilyapman."
                </p>
              </motion.div>

              {/* Parent Testimonial */}
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
                  <img src="https://i.pravatar.cc/300?img=1" alt="Aysel" className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Aysel, 28 yosh</h3>
                    <p className="text-sky-600 text-sm font-medium">Yosh Ona</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">
                  "Farzandim uchun ishonchli enaga topish juda qiyin edi. Parvona orqali video-intervyularni ko'rib, o'zimizga eng mos enagani topdik. GPS kuzatuv va xavfsiz to'lov tizimi menga xotirjamlik beradi."
                </p>
              </motion.div>
            </div>
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
        )}
      </main>

      {/* Search Nannies Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Enaga izlash</h2>
                  <p className="text-sm text-slate-500">Navoiy shahri bo'yicha eng yaxshi nomzodlar</p>
                </div>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Ism, ko'nikma yoki xizmat turi bo'yicha qidirish..." 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    <span className="hidden sm:inline">Filtrlar</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MOCK_NANNIES.map((nanny) => (
                    <motion.div 
                      key={nanny.id}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedNanny(nanny)}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative group/avatar">
                          <img src={nanny.imageUrl} alt={nanny.name} className="w-16 h-16 rounded-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-0.5" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-900">{nanny.name}</h3>
                            <div className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                              <Video className="w-3 h-3" />
                              Video
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-amber-500 font-medium mt-1">
                            <Star className="w-4 h-4 fill-amber-500" />
                            {nanny.rating} <span className="text-slate-400 font-normal">({nanny.reviews} sharh)</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 mb-3">{nanny.experience} tajriba • {nanny.age} yosh</p>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            {nanny.badges.map((badge, idx) => (
                              <span key={idx} className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-amber-50/80 border border-amber-200/50 px-2 py-1 rounded-md">
                                {badge.icon === 'heart' && <Heart className="w-3 h-3 text-rose-500" />}
                                {badge.icon === 'palette' && <Palette className="w-3 h-3 text-indigo-500" />}
                                {badge.icon === 'sparkles' && <Sparkles className="w-3 h-3 text-amber-500" />}
                                {!['heart', 'palette', 'sparkles'].includes(badge.icon) && <Award className="w-3 h-3 text-amber-500" />}
                                {badge.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {nanny.skills.slice(0, 2).map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {nanny.skills.length > 2 && (
                          <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-xs font-medium">
                            +{nanny.skills.length - 2}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="font-bold text-slate-900">{nanny.hourlyRate}<span className="text-xs text-slate-500 font-normal">/soat</span></span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* Add booking logic */ }}
                            className="text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                            Sinov
                          </button>
                          <button className="text-sm font-semibold text-slate-600 hover:text-purple-700 flex items-center gap-1">
                            Profil <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Ota-onalar sharhlari</h3>
                    <div className="space-y-6">
                      {selectedNanny.reviewsList?.map((review, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-slate-900">{review.author}</h4>
                              <p className="text-sm text-slate-500">{review.date}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-700 mb-4">{review.text}</p>
                          {review.badges && review.badges.length > 0 && (
                            <div className="flex gap-2">
                              {review.badges.map((badge, i) => (
                                <span key={i} className="text-xs font-semibold text-amber-700 bg-amber-100/50 px-2 py-1 rounded-md border border-amber-200/50">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Profile Info & Action */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm sticky top-8">
                    <div className="flex items-center gap-5 mb-6">
                      <img src={selectedNanny.imageUrl} alt={selectedNanny.name} className="w-24 h-24 rounded-full object-cover border-4 border-purple-50" />
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedNanny.name}</h2>
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

                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-bold transition-colors shadow-lg shadow-purple-200 mb-3 flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Sinov uchrashuvini belgilash
                    </button>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 rounded-xl font-bold transition-colors">
                        Suhbatga chorlash
                      </button>
                      <button className="w-full bg-white border-2 border-slate-200 hover:border-purple-200 hover:bg-purple-50 text-slate-700 py-3 rounded-xl font-bold transition-colors">
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
          onClick={() => setIsSearchOpen(true)}
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
      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Xush kelibsiz!</h2>
                <p className="text-slate-600">Parvona platformasiga kirish uchun davom eting</p>
              </div>

              <button 
                onClick={handleLogin}
                className="w-full bg-white border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google orqali kirish
              </button>
              
              <p className="text-xs text-center text-slate-500 mt-6">
                Tizimga kirish orqali siz Parvona platformasining <a href="#" className="text-purple-600 hover:underline">Foydalanish shartlari</a> va <a href="#" className="text-purple-600 hover:underline">Maxfiylik siyosatiga</a> rozilik bildirasiz.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
