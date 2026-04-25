import { api, tokenStorage } from './client';
import { SupportConversation, SupportMessageData } from './types';

const WS_BASE = import.meta.env.VITE_WS_URL
  ?? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

// ─── REST ─────────────────────────────────────────────────────────────────────

export async function getMyConversations(): Promise<SupportConversation[]> {
  const data = await api.get<{ results: SupportConversation[] } | SupportConversation[]>(
    '/api/support/'
  );
  return Array.isArray(data) ? data : (data as { results: SupportConversation[] }).results ?? [];
}

export async function getOrCreateConversation(subject = 'Yordam so\'rovi'): Promise<SupportConversation> {
  return api.post<SupportConversation>('/api/support/', { subject });
}

export async function getConversation(id: string): Promise<SupportConversation> {
  return api.get<SupportConversation>(`/api/support/${id}/`);
}

export async function getMessages(conversationId: string): Promise<SupportMessageData[]> {
  const data = await api.get<{ results: SupportMessageData[] } | SupportMessageData[]>(
    `/api/support/${conversationId}/messages/`
  );
  return Array.isArray(data) ? data : (data as { results: SupportMessageData[] }).results ?? [];
}

export async function sendMessageRest(conversationId: string, text: string): Promise<SupportMessageData> {
  return api.post<SupportMessageData>(`/api/support/${conversationId}/send/`, { text });
}

export async function closeConversation(id: string): Promise<void> {
  await api.post(`/api/support/${id}/close/`);
}

export async function reopenConversation(id: string): Promise<void> {
  await api.post(`/api/support/${id}/reopen/`);
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export interface SupportWsMessage {
  type: 'message';
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  text: string;
  created_at: string;
}

export class SupportSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;

  constructor(
    private conversationId: string,
    private onMessage: (msg: SupportWsMessage) => void,
    private onConnected: () => void,
  ) {
    this.connect();
  }

  private connect() {
    if (this.destroyed) return;
    this.ws = new WebSocket(`${WS_BASE}/ws/support/${this.conversationId}/`);

    this.ws.onopen = () => {
      const token = tokenStorage.getAccess();
      this.ws?.send(JSON.stringify({ type: 'auth', token }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_ok') {
          this.reconnectAttempts = 0;
          this.onConnected();
        } else if (data.type === 'message') {
          this.onMessage(data as SupportWsMessage);
        }
      } catch { /* ignore */ }
    };

    this.ws.onclose = () => {
      if (this.destroyed) return;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => this.connect(), delay);
    };
  }

  send(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  disconnect() {
    this.destroyed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
  }
}
