import { api } from './client';

export type PaymentProvider = 'payme' | 'click';
export type PaymentStatus   = 'no_payment' | 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentStatusData {
  status:   PaymentStatus;
  provider: PaymentProvider | null;
  amount:   number;  // tiyin
  paid_at:  string | null;
}

export async function initiatePayment(bookingId: string, provider: PaymentProvider): Promise<string> {
  const res = await api.post<{ pay_url: string }>('/payments/initiate/', {
    booking_id: bookingId,
    provider,
    return_url: `${window.location.origin}/dashboard/bookings`,
  });
  return res.pay_url;
}

export async function getPaymentStatus(bookingId: string): Promise<PaymentStatusData> {
  return api.get<PaymentStatusData>(`/payments/status/${bookingId}/`);
}

export interface ProStatus {
  is_pro:     boolean;
  plan:       'monthly' | 'yearly' | null;
  expires_at: string | null;
}

export async function getProStatus(): Promise<ProStatus> {
  return api.get<ProStatus>('/payments/pro/');
}

export async function subscribePro(plan: 'monthly' | 'yearly'): Promise<ProStatus> {
  return api.post<ProStatus>('/payments/pro/', { plan });
}
