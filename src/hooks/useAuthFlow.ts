import { useState, useCallback } from 'react';

const KEY = 'parvona_auth_flow';

interface FlowState {
  tab: 'login' | 'register';
  loginMode: 'password' | 'otp';
  otpStep: 1 | 2;
  otpEmail: string;
  otpRole: 'parent' | 'nanny';
  regStep: 'form' | 'otp' | 'telegram-otp';
  regOtpMethod: 'email' | 'telegram';
  regEmail: string;
  regTelegramToken: string;
  regTelegramBotLink: string;
}

const DEFAULTS: FlowState = {
  tab: 'login',
  loginMode: 'password',
  otpStep: 1,
  otpEmail: '',
  otpRole: 'parent',
  regStep: 'form',
  regOtpMethod: 'email',
  regEmail: '',
  regTelegramToken: '',
  regTelegramBotLink: '',
};

function load(): FlowState {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function clearAuthFlow() {
  try { sessionStorage.removeItem(KEY); } catch {}
}

export function useAuthFlow() {
  const [state, setRaw] = useState<FlowState>(load);

  const set = useCallback((patch: Partial<FlowState>) => {
    setRaw(prev => {
      const next = { ...prev, ...patch };
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    clearAuthFlow();
    setRaw({ ...DEFAULTS });
  }, []);

  return { ...state, set, clear };
}
