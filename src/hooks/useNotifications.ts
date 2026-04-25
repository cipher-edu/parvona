import { useEffect, useRef, useCallback } from 'react';
import { tokenStorage } from '../api/client';

export interface PushNotification {
  id: string;
  notif_type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  created_at: string;
}

type Handler = (n: PushNotification) => void;
type CountHandler = (count: number) => void;

export function useNotifications(
  onNotification?: Handler,
  onUnreadCount?: CountHandler,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retries = useRef(0);

  const token = tokenStorage.getAccess();

  const connect = useCallback(() => {
    if (!token) return;

    const base = import.meta.env.VITE_WS_URL
      ?? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    const wsUrl = `${base}/ws/notifications/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      retries.current = 0;
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'notification' && onNotification) {
          onNotification(data as PushNotification);
        }
        if (data.type === 'unread_count' && onUnreadCount) {
          onUnreadCount(data.count as number);
        }
        if (data.type === 'auth_ok' && onUnreadCount) {
          onUnreadCount(data.unread_count as number);
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      if (!token) return;
      const delay = Math.min(1000 * 2 ** retries.current, 30_000);
      retries.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [token, onNotification, onUnreadCount]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const markRead = useCallback((notificationId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'mark_read', notification_id: notificationId }));
  }, []);

  return { markRead };
}
