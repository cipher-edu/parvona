import { ApiError } from './types';

// Dev: VITE_API_URL o'rnatilmasa, so'rovlar Vite proxy orqali o'tadi ('/api/...')
// Prod: VITE_API_URL = 'https://api.parvona.uz' yoki shunga o'xshash
const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY  = 'parvona_access';
const REFRESH_KEY = 'parvona_refresh';

export const tokenStorage = {
  getAccess:    ()       => localStorage.getItem(TOKEN_KEY),
  getRefresh:   ()       => localStorage.getItem(REFRESH_KEY),
  setTokens:    (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clearTokens:  () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ─── HTTP client ──────────────────────────────────────────────────────────────

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?:   unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  auth?:   boolean;  // default true
  signal?: AbortSignal;
};

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      tokenStorage.clearTokens();
      return null;
    }
    const data = await res.json();
    const access = data.data?.access || data.access;
    if (access) {
      localStorage.setItem(TOKEN_KEY, access);
      return access;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, params, auth = true, signal } = options;

  // Query params
  let url = `${API_BASE}${path}`;
  if (params) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        search.set(k, String(v));
      }
    }
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    let token = tokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  };

  let res = await fetch(url, init);

  // JWT muddati o'tgan bo'lsa — refresh qilib qayta urinish
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...init, headers });
    }
  }

  if (!res.ok) {
    let errBody: ApiError = {};
    try { errBody = await res.json(); } catch { /* ignore */ }

    // errors dict ichidan birinchi mazmunli xabarni olish
    let msg = errBody.detail || '';
    if (!msg && errBody.errors && typeof errBody.errors === 'object') {
      const firstField = Object.values(errBody.errors).flat().find(v => typeof v === 'string');
      if (firstField) msg = firstField as string;
    }
    if (!msg) msg = errBody.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json();
  // Backend UnifiedJSONRenderer { data: ..., ... } formatida qaytaradi
  return (json.data !== undefined ? json.data : json) as T;
}

export const api = {
  get:    <T>(path: string, params?: RequestOptions['params'], signal?: AbortSignal) =>
            apiRequest<T>(path, { method: 'GET', params, signal }),
  post:   <T>(path: string, body?: unknown, signal?: AbortSignal) =>
            apiRequest<T>(path, { method: 'POST', body, signal }),
  patch:  <T>(path: string, body?: unknown) =>
            apiRequest<T>(path, { method: 'PATCH', body }),
  put:    <T>(path: string, body?: unknown) =>
            apiRequest<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) =>
            apiRequest<T>(path, { method: 'DELETE' }),
  publicGet:  <T>(path: string, params?: RequestOptions['params'], signal?: AbortSignal) =>
            apiRequest<T>(path, { method: 'GET', params, auth: false, signal }),
  publicPost: <T>(path: string, body?: unknown) =>
            apiRequest<T>(path, { method: 'POST', body, auth: false }),
};
