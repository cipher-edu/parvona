import { api } from './client';
import { Review, ReviewCreatePayload, PaginatedResponse, Booking } from './types';

export async function createReview(payload: ReviewCreatePayload): Promise<Review> {
  return api.post<Review>('/api/reviews/', payload);
}

export async function getMyReviews(): Promise<Review[]> {
  const res = await api.get<{ results: Review[] }>('/api/reviews/my/');
  return res.results || [];
}

export async function getPendingReviews(): Promise<Booking[]> {
  const res = await api.get<{ results: Booking[] }>('/api/reviews/pending/');
  return res.results || [];
}

export async function getReceivedReviews(): Promise<Review[]> {
  const res = await api.get<{ results: Review[] }>('/api/reviews/received/');
  return res.results || [];
}

export async function getLatestReviews(limit = 6): Promise<Review[]> {
  const res = await api.publicGet<PaginatedResponse<Review>>(
    '/api/reviews/latest/',
    { limit },
  );
  return res.results || [];
}
