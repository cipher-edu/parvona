import { api } from './client';
import { DjangoUser } from './types';

export interface UserUpdatePayload {
  name?: string;
  phone?: string;
}

export async function getMe(): Promise<DjangoUser> {
  return api.get<DjangoUser>('/api/auth/me/');
}

export async function updateMe(data: UserUpdatePayload): Promise<DjangoUser> {
  return api.patch<DjangoUser>('/api/auth/me/', data);
}

export async function uploadMyPhoto(file: File): Promise<DjangoUser> {
  const formData = new FormData();
  formData.append('photo', file);
  return api.patch<DjangoUser>('/api/auth/me/', formData);
}

export async function connectMyTelegram(token: string): Promise<DjangoUser> {
  try {
    const res = await api.post<{ message: string; user: DjangoUser }>('/api/auth/me/telegram/connect/', { token });
    return res.user;
  } catch (err) {
    const msg = (err instanceof Error ? err.message : '').toLowerCase();
    const isNotFound = msg.includes('404') || msg.includes('not found') || msg.includes('topilmadi');
    if (!isNotFound) throw err;
    const fallback = await api.post<{ message: string; user: DjangoUser }>('/api/auth/telegram/connect/', { token });
    return fallback.user;
  }
}

export async function disconnectMyTelegram(): Promise<void> {
  try {
    return await api.delete('/api/auth/me/telegram/connect/');
  } catch (err) {
    const msg = (err instanceof Error ? err.message : '').toLowerCase();
    const isNotFound = msg.includes('404') || msg.includes('not found') || msg.includes('topilmadi');
    if (!isNotFound) throw err;
    return api.delete('/api/auth/telegram/connect/');
  }
}
