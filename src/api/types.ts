// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface DjangoUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  photo: string | null;
  role: 'parent' | 'nanny' | 'admin';
  is_active: boolean;
  created_at: string;
  telegram_user_id: number | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: DjangoUser;
}

// ─── Nanny ────────────────────────────────────────────────────────────────────

export interface NannyUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  role: 'nanny';
}

export interface Nanny {
  id: string;
  user: NannyUser;
  age: number;
  experience: number;
  hourly_rate: number;
  skills: string[];
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  rating: string;
  reviews_count: number;
  is_verified: boolean;
  is_pro: boolean;
  status: 'active' | 'inactive' | 'suspended';
  distance_km?: number;
  created_at: string;
  // Detail only
  bio?: string;
  video_url?: string;
}

export interface NannyListParams {
  page?: number;
  search?: string;
  min_rate?: number;
  max_rate?: number;
  min_rating?: number;
  min_exp?: number;
  is_verified?: boolean;
  skill?: string;
  lat?: number;
  lon?: number;
  radius_km?: number;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'resolved';

export interface Booking {
  id: string;
  parent: DjangoUser;
  nanny: DjangoUser;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  hours_per_day: string;
  hourly_rate: number;
  total_amount: number;
  address: string;
  notes: string;
  cancel_reason: string;
  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingCreatePayload {
  nanny_id: string;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  address: string;
  notes?: string;
  is_trial?: boolean;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  booking: string;
  author: DjangoUser;
  target: DjangoUser;
  rating: number;
  text: string;
  created_at: string;
}

export interface ReviewCreatePayload {
  booking_id: string;
  rating: number;
  text: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  type: 'message';
  message_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  sender: DjangoUser;
  text: string;
  read_at: string | null;
  created_at: string;
}

// ─── Support Chat ─────────────────────────────────────────────────────────────

export interface SupportMessageData {
  id: string;
  sender: DjangoUser;
  text: string;
  read_at: string | null;
  created_at: string;
}

export interface SupportLastMessage {
  text: string;
  sender_name: string;
  created_at: string;
}

export interface SupportConversation {
  id: string;
  user: DjangoUser;
  admin: DjangoUser | null;
  subject: string;
  status: 'open' | 'closed';
  last_message: SupportLastMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiError {
  code?: string;
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
