import { api } from './client';

export interface ReferralStats {
  code:            string;
  total_referrals: number;
  bonus_earned:    number;
}

export async function getReferralStats(): Promise<ReferralStats> {
  return api.get<ReferralStats>('/users/me/referral/');
}
