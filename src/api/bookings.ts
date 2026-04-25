import { api } from './client';
import { Booking, BookingCreatePayload, BookingStatus, PaginatedResponse } from './types';

export async function getMyBookings(
  status?: BookingStatus,
): Promise<PaginatedResponse<Booking>> {
  return api.get<PaginatedResponse<Booking>>('/api/bookings/', status ? { status } : undefined);
}

export async function getBookingById(id: string): Promise<Booking> {
  return api.get<Booking>(`/api/bookings/${id}/`);
}

export async function createBooking(payload: BookingCreatePayload): Promise<Booking> {
  return api.post<Booking>('/api/bookings/', payload);
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  cancelReason?: string,
): Promise<Booking> {
  return api.patch<Booking>(`/api/bookings/${id}/status/`, {
    status,
    cancel_reason: cancelReason || '',
  });
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:   'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  active:    'Faol',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
  disputed:  'Shikoyat',
  resolved:  'Hal etildi',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  disputed:  'bg-orange-100 text-orange-700',
  resolved:  'bg-purple-100 text-purple-700',
};
