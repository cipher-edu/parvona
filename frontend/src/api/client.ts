import type { ApiError } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Token storage ────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:    () => localStorage.getItem('parvona_access'),
  getRefresh:   () => localStorage.getItem('parvona_refresh'),
  setTokens:    (a: string, r: string) => {
    localStorage.setItem('parvona_access', a);
    localStorage.setItem('parvona_refresh', r);
  },
  clearTokens:  () => {
    localStorage.removeItem('parvona_access');
    localStorage.removeItem('parvona_refresh');
    localStorage.removeItem('parvona_user');
  },
};

// ─── JWT refresh ──────────────────────────────────────────────────────────────
async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) { tokenStorage.clearTokens(); return null; }
    const json = await res.json();
    const access = json.data?.access ?? json.access;
    if (access) { localStorage.setItem('parvona_access', access); return access; }
    return null;
  } catch { return null; }
}

// ─── Core request ─────────────────────────────────────────────────────────────
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (authenticated) {
    const token = tokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && authenticated) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    let err: ApiError = {};
    try { err = await res.json(); } catch { /* ignore */ }
    const msg = err.message ?? err.detail ?? `HTTP ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status, data: err });
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
export const api = {
  get:        <T>(path: string)                      => apiRequest<T>(path, { method: 'GET' }),
  post:       <T>(path: string, body: unknown)       => apiRequest<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:      <T>(path: string, body: unknown)       => apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put:        <T>(path: string, body: unknown)       => apiRequest<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  delete:     <T>(path: string)                      => apiRequest<T>(path, { method: 'DELETE' }),
  publicGet:  <T>(path: string)                      => apiRequest<T>(path, { method: 'GET' }, false),
  publicPost: <T>(path: string, body: unknown)       => apiRequest<T>(path, { method: 'POST',  body: JSON.stringify(body) }, false),
};
