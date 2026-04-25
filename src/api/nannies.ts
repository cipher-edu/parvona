import { api } from './client';
import { Nanny, NannyListParams, PaginatedResponse, Review } from './types';

/**
 * Enagalar ro'yxati — ochiq endpoint, auth shart emas.
 */
export async function getNannies(
  params?: NannyListParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Nanny>> {
  return api.publicGet<PaginatedResponse<Nanny>>(
    '/api/nannies/',
    params as Record<string, string | number | boolean | undefined | null>,
    signal,
  );
}

/**
 * Enaga detail — ochiq endpoint.
 */
export async function getNannyById(id: string): Promise<Nanny> {
  return api.publicGet<Nanny>(`/api/nannies/${id}/`);
}

/**
 * Enaga sharhlarini olish.
 */
export async function getNannyReviews(nannyId: string): Promise<PaginatedResponse<Review>> {
  return api.publicGet<PaginatedResponse<Review>>(`/api/nannies/${nannyId}/reviews/`);
}

/**
 * O'z enaga profilini olish yoki yangilash.
 */
export async function getMyNannyProfile(): Promise<Nanny> {
  return api.get<Nanny>('/api/nannies/me/');
}

export async function updateMyNannyProfile(data: Partial<Nanny>): Promise<Nanny> {
  return api.patch<Nanny>('/api/nannies/me/', data);
}

// Ko'nikma kodini o'zbek tiliga tarjima
export const SKILL_LABELS: Record<string, string> = {
  infant_care:   'Chaqaloq parvarishi',
  school_prep:   'Maktabga tayyorlov',
  english:       'Ingliz tili',
  first_aid:     'Birinchi yordam',
  cooking:       'Ovqat pishirish',
  tutoring:      'Repetitorlik',
  special_needs: 'Maxsus ehtiyojlar',
  driving:       'Haydovchilik',
};

export function formatHourlyRate(rate: number): string {
  return `${rate.toLocaleString('uz-UZ')} so'm`;
}

export function formatExperience(years: number): string {
  if (years === 0) return '1 yildan kam';
  if (years === 1) return '1 yil';
  return `${years} yil`;
}
