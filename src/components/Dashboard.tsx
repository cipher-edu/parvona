import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  User as UserIcon, 
  Settings, 
  Calendar, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Star, 
  ShieldCheck,
  Camera,
  LogOut
} from 'lucide-react';

interface DashboardProps {
  user: User;
  userRole: 'parent' | 'nanny' | 'admin';
  onLogout: () => void;
}

export default function Dashboard({ user, userRole, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        if (userRole === 'nanny') {
          const profileDoc = await getDoc(doc(db, 'nannyProfiles', user.uid));
          if (profileDoc.exists()) {
            setProfileData(profileDoc.data());
          } else {
            // Initialize empty profile
            setProfileData({
              userId: user.uid,
              age: 25,
              experience: '1 yil',
              hourlyRate: "30 000 so'm",
              bio: "O'zim haqimda qisqacha ma'lumot...",
              skills: ['Bolalar parvarishi'],
              locationName: 'Navoiy shahri',
              rating: 0,
              reviewsCount: 0,
              isVerified: false
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userRole]);

  const handleSaveProfile = async () => {
    try {
      // Update User document
      if (userData) {
        await updateDoc(doc(db, 'users', user.uid), {
          name: userData.name,
          phone: userData.phone || ''
        });
      }

      // Update NannyProfile document
      if (userRole === 'nanny' && profileData) {
        const profileRef = doc(db, 'nannyProfiles', user.uid);
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) {
          await updateDoc(profileRef, profileData);
        } else {
          await setDoc(profileRef, profileData);
        }
      }
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-purple-50 object-cover mx-auto"
                />
                <button className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-slate-100 text-slate-600 hover:text-purple-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-4">{user.displayName}</h2>
              <p className="text-sm text-slate-500 capitalize">{userRole === 'nanny' ? 'Enaga' : 'Ota-ona'}</p>
            </div>

            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <UserIcon className="w-5 h-5" /> Profil
              </button>
              {userRole === 'nanny' && (
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'schedule' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Calendar className="w-5 h-5" /> Ish jadvali
                </button>
              )}
              {userRole === 'parent' && (
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Calendar className="w-5 h-5" /> Buyurtmalar
                </button>
              )}
              <button 
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'messages' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <MessageSquare className="w-5 h-5" /> Xabarlar
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Settings className="w-5 h-5" /> Sozlamalar
              </button>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Tizimdan chiqish
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Shaxsiy ma'lumotlar</h3>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm bg-purple-50 px-4 py-2 rounded-lg"
                    >
                      Tahrirlash
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="text-slate-600 hover:text-slate-700 font-medium text-sm bg-slate-100 px-4 py-2 rounded-lg"
                      >
                        Bekor qilish
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="text-white bg-purple-600 hover:bg-purple-700 font-medium text-sm px-4 py-2 rounded-lg shadow-sm"
                      >
                        Saqlash
                      </button>
                    </div>
                  )}
                </div>

                {userRole === 'nanny' && profileData ? (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ism familiya</label>
                        <input 
                          type="text" 
                          disabled={!isEditing}
                          value={userData?.name || ''}
                          onChange={(e) => setUserData({...userData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Telefon raqam</label>
                        <input 
                          type="tel" 
                          disabled={!isEditing}
                          value={userData?.phone || ''}
                          onChange={(e) => setUserData({...userData, phone: e.target.value})}
                          placeholder="+998 90 123 45 67"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Yosh</label>
                        <input 
                          type="number" 
                          disabled={!isEditing}
                          value={profileData.age || ''}
                          onChange={(e) => setProfileData({...profileData, age: parseInt(e.target.value)})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tajriba</label>
                        <input 
                          type="text" 
                          disabled={!isEditing}
                          value={profileData.experience || ''}
                          onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Soatlik narx</label>
                        <input 
                          type="text" 
                          disabled={!isEditing}
                          value={profileData.hourlyRate || ''}
                          onChange={(e) => setProfileData({...profileData, hourlyRate: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Manzil</label>
                        <input 
                          type="text" 
                          disabled={!isEditing}
                          value={profileData.locationName || ''}
                          onChange={(e) => setProfileData({...profileData, locationName: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">O'zim haqimda</label>
                      <textarea 
                        disabled={!isEditing}
                        value={profileData.bio || ''}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ko'nikmalar (vergul bilan ajrating)</label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={profileData.skills?.join(', ') || ''}
                        onChange={(e) => setProfileData({...profileData, skills: e.target.value.split(',').map(s => s.trim())})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ism familiya</label>
                        <input 
                          type="text" 
                          disabled={!isEditing}
                          value={userData?.name || ''}
                          onChange={(e) => setUserData({...userData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Telefon raqam</label>
                        <input 
                          type="tel" 
                          disabled={!isEditing}
                          value={userData?.phone || ''}
                          onChange={(e) => setUserData({...userData, phone: e.target.value})}
                          placeholder="+998 90 123 45 67"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab !== 'profile' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tez orada ishga tushadi</h3>
                <p className="text-slate-500 max-w-md">
                  Bu bo'lim hozirda ishlab chiqilmoqda. Tez orada siz bu yerda to'liq funksiyalardan foydalanishingiz mumkin bo'ladi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
