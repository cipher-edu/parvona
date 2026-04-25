import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from './store/useAuthStore';
import { tokenStorage } from './api/client';
import { exchangeFirebaseToken } from './api/auth';
import { router } from './router';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Firebase auth state ni Zustand store'ga ulash
onAuthStateChanged(auth, async (firebaseUser) => {
  const store = useAuthStore.getState();
  store.setFirebaseUser(firebaseUser);

  if (firebaseUser) {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role as 'parent' | 'nanny' | 'admin';
        store.setRole(role);

        // Django JWT bo'lmasa, yangisini olish
        if (!tokenStorage.getAccess()) {
          try {
            const firebaseToken = await firebaseUser.getIdToken();
            const authData = await exchangeFirebaseToken(firebaseToken, role as 'parent' | 'nanny');
            store.setDjangoUser(authData.user);
          } catch { /* backend ishlamasa ham UI ishlaydi */ }
        }
      }
    } catch (e) {
      console.error('Auth state error:', e);
    }
  } else {
    // Firebase user yo'q — lekin email orqali kirgan foydalanuvchi
    // Django JWT sessiyasini saqlab qolish (refresh token mavjud bo'lsa)
    if (!tokenStorage.getRefresh()) {
      store.setRole(null);
      store.setDjangoUser(null);
      tokenStorage.clearTokens();
    }
  }

  store.setAuthReady(true);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);
