import { useState, useEffect, createContext, useContext } from 'react';
import type { AuthUser, Role } from '@/types';
import { tokenStorage } from '@/api/client';

// JWT payload decode (no library needed)
function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

export function getUserFromStorage(): AuthUser | null {
  const stored = localStorage.getItem('parvona_user');
  if (stored) { try { return JSON.parse(stored); } catch { /* ignore */ } }

  const token = tokenStorage.getAccess();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  const exp = payload.exp as number;
  if (exp && Date.now() / 1000 > exp) { tokenStorage.clearTokens(); return null; }

  return {
    id:    payload.user_id as string,
    email: payload.email   as string,
    name:  payload.name    as string,
    role:  payload.role    as Role,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  isAuthenticated: boolean;
  role: Role | null;
}

import { createContext as _createContext } from 'react';
export const AuthContext = _createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  role: null,
});

export function useAuth() {
  return useContext(AuthContext);
}
