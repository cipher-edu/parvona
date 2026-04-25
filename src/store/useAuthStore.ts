import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { exchangeFirebaseToken, loginWithEmail as apiLoginWithEmail, registerUser as apiRegisterUser, logout as djangoLogout, telegramAuth, verifyEmailOTP as apiVerifyEmailOTP, registerVerifyOTP as apiRegisterVerifyOTP, registerTelegramVerify as apiRegisterTelegramVerify } from '../api/auth';
import { tokenStorage } from '../api/client';
import { DjangoUser } from '../api/types';

interface AuthState {
  firebaseUser:    FirebaseUser | null;
  djangoUser:      DjangoUser | null;
  role:            'parent' | 'nanny' | 'admin' | null;
  isAuthReady:     boolean;
  isLoading:       boolean;
  error:           string | null;
  needsOnboarding: boolean;

  // actions
  setFirebaseUser:    (user: FirebaseUser | null) => void;
  setDjangoUser:      (user: DjangoUser | null)   => void;
  setRole:            (role: 'parent' | 'nanny' | 'admin' | null) => void;
  setAuthReady:       (ready: boolean) => void;
  loginWithGoogle:    () => Promise<{ needsRole: boolean }>;
  loginWithEmail:     (email: string, password: string) => Promise<void>;
  loginWithTelegram:  (data: Record<string, string | number>, role?: 'parent' | 'nanny') => Promise<void>;
  loginWithEmailOTP:  (email: string, otp: string, role?: 'parent' | 'nanny') => Promise<void>;
  registerAndLogin:   (payload: { email: string; name: string; phone?: string; role: 'parent' | 'nanny'; password: string; password2: string; ref_code?: string }) => Promise<void>;
  completeRegister:         (email: string, otp: string) => Promise<void>;
  completeTelegramRegister: (reg_token: string, otp: string) => Promise<void>;
  selectRole:         (role: 'parent' | 'nanny') => Promise<void>;
  logout:             () => Promise<void>;
  clearError:         () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      firebaseUser:    null,
      djangoUser:      null,
      role:            null,
      isAuthReady:     false,
      isLoading:       false,
      needsOnboarding: false,
      error:         null,

      setFirebaseUser: (user) => set({ firebaseUser: user }),
      setDjangoUser:   (user) => set({ djangoUser: user }),
      setRole:         (role) => set({ role }),
      setAuthReady:    (ready) => set({ isAuthReady: ready }),
      clearError:      () => set({ error: null }),

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const fbUser = result.user;

          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (!userDoc.exists()) {
            set({ firebaseUser: fbUser, isLoading: false });
            return { needsRole: true };
          }

          const data = userDoc.data();
          const role = data.role as 'parent' | 'nanny' | 'admin';
          set({ firebaseUser: fbUser, role });

          // Django JWT token olish
          const firebaseToken = await fbUser.getIdToken();
          const authData = await exchangeFirebaseToken(firebaseToken, role as 'parent' | 'nanny');
          set({ djangoUser: authData.user, isLoading: false });
          return { needsRole: false };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Kirishda xatolik';
          set({ isLoading: false, error: msg });
          return { needsRole: false };
        }
      },

      loginWithTelegram: async (data, role = 'parent') => {
        set({ isLoading: true, error: null });
        try {
          const result = await telegramAuth(data, role);
          set({ djangoUser: result.user, role: result.user.role, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Telegram orqali kirishda xatolik';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      loginWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiLoginWithEmail(email, password);
          set({ djangoUser: data.user, role: data.user.role, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Kirish xatosi';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      loginWithEmailOTP: async (email, otp, role = 'parent') => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiVerifyEmailOTP(email, otp, role);
          set({ djangoUser: data.user, role: data.user.role, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'OTP tasdiqlashda xatolik';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      registerAndLogin: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiRegisterUser(payload);
          set({ djangoUser: data.user, role: data.user.role, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Ro\'yxatdan o\'tish xatosi';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      completeTelegramRegister: async (reg_token, otp) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiRegisterTelegramVerify(reg_token, otp);
          set({ djangoUser: data.user, role: data.user.role, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Telegram OTP tasdiqlashda xatolik';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      completeRegister: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiRegisterVerifyOTP(email, otp);
          set({ djangoUser: data.user, role: data.user.role, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Email tasdiqlashda xatolik';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      selectRole: async (role) => {
        const fbUser = get().firebaseUser;
        if (!fbUser) return;
        set({ isLoading: true, error: null });

        // 10 soniyalik timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Ulanish vaqti tugadi. Qayta urinib ko\'ring.')), 10_000)
        );

        try {
          await Promise.race([
            setDoc(doc(db, 'users', fbUser.uid), {
              uid:       fbUser.uid,
              role,
              name:      fbUser.displayName || 'Foydalanuvchi',
              email:     fbUser.email,
              photoUrl:  fbUser.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
            timeoutPromise,
          ]);
          set({ role });

          const firebaseToken = await fbUser.getIdToken();
          const authData = await exchangeFirebaseToken(firebaseToken, role);
          set({ djangoUser: authData.user, needsOnboarding: role === 'nanny' });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Rol tanlashda xatolik yuz berdi';
          set({ error: msg });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          if (tokenStorage.getAccess()) await djangoLogout();
        } catch { /* ignore */ }
        tokenStorage.clearTokens();
        await signOut(auth);
        set({ firebaseUser: null, djangoUser: null, role: null });
      },
    }),
    {
      name: 'parvona-auth',
      partialize: (state) => ({ role: state.role, djangoUser: state.djangoUser }),
    }
  )
);
