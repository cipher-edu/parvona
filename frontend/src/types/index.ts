export type Role = 'parent' | 'nanny' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photo?: string;
  role: Role;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Nanny {
  id: string;
  user: { id: string; name: string; email: string; photo?: string };
  age: number;
  experience: number;
  hourly_rate: number;
  bio: string;
  skills: string[];
  location_name: string;
  latitude?: number;
  longitude?: number;
  rating: string;
  reviews_count: number;
  is_verified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  video_url?: string;
}

export type BookingStatus =
  | 'pending' | 'confirmed' | 'active'
  | 'completed' | 'cancelled' | 'disputed' | 'resolved';

export interface PriceDetails {
  base_amount: number;
  night_surcharge: number;
  holiday_surcharge: number;
  urgent_surcharge: number;
  long_term_discount: number;
  total_amount: number;
  applied_rules: string[];
}

export interface Booking {
  id: string;
  parent: AuthUser;
  nanny: AuthUser;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  hours_per_day: string;
  hourly_rate: number;
  total_amount: number;
  price_details: PriceDetails;
  address: string;
  notes: string;
  cancel_reason?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface Review {
  id: string;
  author: AuthUser;
  nanny: AuthUser;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_nannies: number;
  total_bookings: number;
  active_bookings: number;
  total_revenue: number;
  pending_verifications: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message?: string;
  detail?: string;
  [key: string]: unknown;
}
