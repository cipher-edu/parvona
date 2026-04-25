import { api, tokenStorage } from './client';
import type {
  AuthUser, AuthTokens, Nanny, Booking, BookingStatus,
  Notification, Review, AdminStats, PaginatedResponse, PriceDetails,
} from '@/types';

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.publicPost<{ access: string; refresh: string; user: AuthUser }>(
      '/api/auth/token/', { email, password }
    );
    tokenStorage.setTokens(res.access, res.refresh);
    localStorage.setItem('parvona_user', JSON.stringify(res.user));
    return res;
  },

  register: async (data: { email: string; name: string; phone: string; role: string; password: string; password2: string }) => {
    return api.publicPost<AuthUser>('/api/auth/register/', data);
  },

  logout: async () => {
    try { await api.post('/api/auth/logout/', { refresh: tokenStorage.getRefresh() }); } catch { /* ignore */ }
    tokenStorage.clearTokens();
  },

  me: () => api.get<AuthUser>('/api/auth/me/'),
};

// ─── NARX HISOBLASH (Preview) ─────────────────────────────────────────────────
export const pricingApi = {
  preview: (data: {
    nanny_id: string; start_date: string; end_date: string;
    hours_per_day: number; night_hours?: number;
  }) => api.post<PriceDetails>('/api/bookings/price-preview/', data),
};

// ─── NANNIES ──────────────────────────────────────────────────────────────────
export const nanniesApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return api.publicGet<PaginatedResponse<Nanny>>(`/api/nannies/${qs}`);
  },
  get:          (id: string)           => api.publicGet<Nanny>(`/api/nannies/${id}/`),
  myProfile:    ()                     => api.get<Nanny>('/api/nannies/me/'),
  updateProfile: (data: Partial<Nanny>) => api.patch<Nanny>('/api/nannies/me/', data),
  reviews:      (id: string)           => api.publicGet<PaginatedResponse<Review>>(`/api/nannies/${id}/reviews/`),
};

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return api.get<PaginatedResponse<Booking>>(`/api/bookings/${qs}`);
  },
  get:    (id: string)                                 => api.get<Booking>(`/api/bookings/${id}/`),
  create: (data: {
    nanny_id: string; start_date: string; end_date: string;
    hours_per_day: number; night_hours?: number; address: string; notes?: string;
  })                                                   => api.post<Booking>('/api/bookings/', data),
  updateStatus: (id: string, status: BookingStatus, cancel_reason?: string) =>
    api.post<Booking>(`/api/bookings/${id}/status/`, { status, cancel_reason }),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        (unread?: boolean) => api.get<PaginatedResponse<Notification>>(`/api/notifications/${unread ? '?unread=true' : ''}`),
  markRead:    (id: string)       => api.post<void>(`/api/notifications/${id}/read/`, {}),
  markAllRead: ()                  => api.post<void>('/api/notifications/mark-all-read/', {}),
  unreadCount: ()                  => api.get<{ count: number }>('/api/notifications/unread-count/'),
};

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (data: { nanny_id: string; booking_id: string; rating: number; comment: string }) =>
    api.post<Review>('/api/reviews/', data),
  mine: () => api.get<PaginatedResponse<Review>>('/api/reviews/my/'),
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:    ()                            => api.get<AdminStats>('/api/admin/stats/'),
  users:    (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<AuthUser>>(`/api/admin/users/${qs}`);
  },
  nannies:  (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Nanny>>(`/api/admin/nannies/${qs}`);
  },
  verifyNanny:  (id: string) => api.post<Nanny>(`/api/admin/nannies/${id}/verify/`, {}),
  suspendNanny: (id: string) => api.post<Nanny>(`/api/admin/nannies/${id}/suspend/`, {}),
  blockUser:    (id: string) => api.post<AuthUser>(`/api/admin/users/${id}/block/`, {}),
  bookings: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Booking>>(`/api/admin/bookings/${qs}`);
  },
  reviews: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Review>>(`/api/admin/reviews/${qs}`);
  },
  deleteReview: (id: string) => api.delete<void>(`/api/admin/reviews/${id}/`),
  sendNotification: (data: { title: string; body: string; role?: string }) =>
    api.post<void>('/api/admin/notifications/send/', data),
};

export { tokenStorage };
