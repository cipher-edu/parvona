import { api } from './client';
import { Notification, PaginatedResponse } from './types';

export async function getNotifications(unread = false): Promise<PaginatedResponse<Notification>> {
  return api.get<PaginatedResponse<Notification>>('/api/notifications/', unread ? { unread: 'true' } : undefined);
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ unread_count: number }>('/api/notifications/unread-count/');
  return res.unread_count;
}

export async function markAsRead(id: string): Promise<Notification> {
  return api.patch<Notification>(`/api/notifications/${id}/read/`);
}

export async function markAllAsRead(): Promise<void> {
  await api.post('/api/notifications/read-all/');
}

export async function markOneAsRead(id: string): Promise<void> {
  await api.post(`/api/notifications/${id}/read/`);
}
