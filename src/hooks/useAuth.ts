import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const store = useAuthStore();
  return {
    user:        store.firebaseUser,
    djangoUser:  store.djangoUser,
    role:        store.role,
    isReady:     store.isAuthReady,
    isLoading:   store.isLoading,
    error:       store.error,
    isLoggedIn:  !!store.firebaseUser || !!store.djangoUser,
    isParent:    store.role === 'parent',
    isNanny:     store.role === 'nanny',
    isAdmin:     store.role === 'admin',
    login:       store.loginWithGoogle,
    selectRole:  store.selectRole,
    logout:      store.logout,
    clearError:  store.clearError,
  };
}
