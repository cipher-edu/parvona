import { api } from './client';

export type AvailabilityStatus = 'available' | 'busy' | 'vacation';

export interface AvailabilityDay {
  date: string;   // YYYY-MM-DD
  status: AvailabilityStatus;
}

export async function getMyAvailability(year: number, month: number): Promise<AvailabilityDay[]> {
  return api.get<AvailabilityDay[]>('/nannies/me/availability/', { year, month });
}

export async function saveMyAvailability(items: AvailabilityDay[]): Promise<void> {
  await api.post('/nannies/me/availability/', { items });
}

export async function getNannyAvailability(nannyId: string, year: number, month: number): Promise<AvailabilityDay[]> {
  return api.get<AvailabilityDay[]>(`/nannies/${nannyId}/availability/`, { year, month });
}
