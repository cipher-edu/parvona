import { api, tokenStorage } from './client';
import { ChatMessage, ConversationMessage, PaginatedResponse } from './types';

export interface Conversation {
  id: string;
  booking_id: string;
  other_user: { id: string; name: string; photo: string | null };
  last_message: string;
  unread_count: number;
  updated_at: string;
}

/** Foydalanuvchining barcha suhbatlari */
export const getConversations = () =>
  api.get<PaginatedResponse<Conversation>>('/api/chat/');

/** Bitta suhbatni olish yoki yaratish (booking_id orqali) */
export const getOrCreateConversation = (bookingId: string) =>
  api.get<Conversation>(`/api/chat/${bookingId}/`);

/** Bitta suhbatning xabarlari (booking_id orqali) */
export const getMessages = (bookingId: string) =>
  api.get<PaginatedResponse<ConversationMessage>>(`/api/chat/${bookingId}/messages/`);

/** Xabar yuborish */
export const sendMessage = (bookingId: string, text: string) =>
  api.post<ConversationMessage>(`/api/chat/${bookingId}/send/`, { text });

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export type ChatEventHandler = (msg: ChatMessage) => void;

const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1_000;

export class ChatSocket {
  private ws: WebSocket | null = null;
  private bookingId: string;
  private onMessage: ChatEventHandler;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private shouldReconnect = true;
  private reconnectAttempts = 0;

  constructor(
    bookingId: string,
    onMessage: ChatEventHandler,
    onConnect?: () => void,
    onDisconnect?: () => void,
  ) {
    this.bookingId    = bookingId;
    this.onMessage    = onMessage;
    this.onConnect    = onConnect;
    this.onDisconnect = onDisconnect;
  }

  connect() {
    const url = `${WS_BASE}/ws/chat/${this.bookingId}/`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // Token URL-da emas — birinchi xabar sifatida yuboriladi
      const token = tokenStorage.getAccess();
      this.ws!.send(JSON.stringify({ type: 'auth', token }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_ok') {
          this.onConnect?.();
          return;
        }
        if (data.type === 'auth_error') {
          this.shouldReconnect = false;
          this.ws?.close();
          return;
        }
        this.onMessage(data as ChatMessage);
      } catch { /* ignore malformed */ }
    };

    this.ws.onclose = () => {
      this.onDisconnect?.();
      if (this.shouldReconnect) {
        const delay = Math.min(
          BASE_RECONNECT_DELAY * 2 ** this.reconnectAttempts,
          MAX_RECONNECT_DELAY,
        );
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      }
    };

    this.ws.onerror = () => { this.ws?.close(); };
  }

  sendMessage(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
