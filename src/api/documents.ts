import { api } from './client';
import { PaginatedResponse } from './types';

export interface NannyDocument {
  id: string;
  doc_type: string;
  doc_type_display: string;
  file: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  status_display: string;
  review_note: string;
  reviewed_at: string | null;
  created_at: string;
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  passport:    'Pasport',
  certificate: 'Sertifikat',
  medical:     'Tibbiy hujjat',
  diploma:     'Diplom',
  other:       'Boshqa',
};

export async function getMyDocuments(): Promise<NannyDocument[]> {
  const data = await api.get<PaginatedResponse<NannyDocument> | NannyDocument[]>('/api/nannies/me/documents/');
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function uploadDocument(docType: string, file: File, description?: string): Promise<NannyDocument> {
  const formData = new FormData();
  formData.append('doc_type', docType);
  formData.append('file', file);
  if (description) formData.append('description', description);
  return api.post<NannyDocument>('/api/nannies/me/documents/', formData);
}

export async function deleteDocument(id: string): Promise<void> {
  return api.delete(`/api/nannies/me/documents/${id}/`);
}

export async function downloadContract(bookingId: string): Promise<void> {
  const token = (await import('./client')).tokenStorage.getAccess();
  const resp = await fetch(`/api/bookings/${bookingId}/contract/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!resp.ok) throw new Error('PDF yuklanmadi');
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contract_${bookingId.slice(0, 8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
