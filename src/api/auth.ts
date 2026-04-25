import { api, tokenStorage } from './client';
import { AuthTokens } from './types';

/**
 * Firebase ID tokenini Django JWT ga almashtirish.
 * Foydalanuvchi Google bilan login qilgandan keyin chaqiriladi.
 */
export async function exchangeFirebaseToken(
  firebaseToken: string,
  role: 'parent' | 'nanny' = 'parent',
): Promise<AuthTokens> {
  const data = await api.publicPost<AuthTokens>('/api/auth/firebase/', {
    firebase_token: firebaseToken,
    role,
  });
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
}

/**
 * Email + parol bilan login qilish.
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const data = await api.publicPost<AuthTokens>('/api/auth/login/', {
    email,
    password,
  });
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
}

/**
 * Yangi foydalanuvchi ro'yxatdan o'tish (email + parol).
 * Register → avtomatik login.
 */
export async function registerUser(payload: {
  email: string;
  name: string;
  phone?: string;
  role: 'parent' | 'nanny';
  password: string;
  password2: string;
  ref_code?: string;
}): Promise<AuthTokens> {
  // 1. Ro'yxatdan o'tish
  await api.publicPost('/api/auth/register/', payload);
  // 2. Avtomatik login
  const tokens = await loginWithEmail(payload.email, payload.password);
  return tokens;
}

/**
 * Tizimdan chiqish — tokenni blacklist ga qo'shish.
 */
export async function logout(): Promise<void> {
  const refresh = tokenStorage.getRefresh();
  if (refresh) {
    try {
      await api.post('/api/auth/logout/', { refresh });
    } catch {
      // Server xatosi bo'lsa ham local tokenlarni tozalaymiz
    }
  }
  tokenStorage.clearTokens();
}

/**
 * Telegram Login Widget orqali autentifikatsiya.
 * @param data Telegram callback ma'lumotlari (id, first_name, hash, auth_date, ...)
 * @param role Foydalanuvchi roli
 */
export async function telegramAuth(
  data: Record<string, string | number>,
  role: 'parent' | 'nanny' = 'parent',
): Promise<AuthTokens> {
  const result = await api.publicPost<AuthTokens>('/api/auth/telegram/', { ...data, role });
  tokenStorage.setTokens(result.access, result.refresh);
  return result;
}

/**
 * Email ga 6 raqamli OTP kodi yuborish.
 */
export async function sendEmailOTP(email: string): Promise<void> {
  await api.publicPost('/api/auth/email-otp/send/', { email });
}

/**
 * Ro'yxatdan o'tish: ma'lumotlarni validatsiya qilib emailga OTP yuborish.
 */
export async function registerSendOTP(payload: {
  email: string;
  name: string;
  phone?: string;
  role: 'parent' | 'nanny';
  password: string;
  password2: string;
  ref_code?: string;
}): Promise<{ message: string; email: string }> {
  return api.publicPost('/api/auth/register/send-otp/', payload);
}

/**
 * Ro'yxatdan o'tish OTPsini tasdiqlash → foydalanuvchi yaratiladi va JWT qaytariladi.
 */
export async function registerVerifyOTP(
  email: string,
  otp: string,
): Promise<AuthTokens> {
  const data = await api.publicPost<AuthTokens>('/api/auth/register/verify-otp/', { email, otp });
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
}

/**
 * Ro'yxatdan o'tish: Telegram bot deep link olish.
 */
export async function registerTelegramInit(payload: {
  email: string;
  name: string;
  phone?: string;
  role: 'parent' | 'nanny';
  password: string;
  password2: string;
  ref_code?: string;
}): Promise<{ reg_token: string; bot_link: string; message: string }> {
  return api.publicPost('/api/auth/register/telegram/init/', payload);
}

/**
 * Ro'yxatdan o'tish: Telegram OTP ni tasdiqlash → JWT olish.
 */
export async function registerTelegramVerify(
  reg_token: string,
  otp: string,
): Promise<AuthTokens> {
  const data = await api.publicPost<AuthTokens>('/api/auth/register/telegram/verify/', { reg_token, otp });
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
}

/**
 * OTP kodni tekshirib JWT olish.
 */
export async function verifyEmailOTP(
  email: string,
  otp: string,
  role: 'parent' | 'nanny' = 'parent',
): Promise<AuthTokens> {
  const data = await api.publicPost<AuthTokens>('/api/auth/email-otp/verify/', { email, otp, role });
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
}

/**
 * O'z profilini olish.
 */
export async function getMe() {
  return api.get('/api/auth/me/');
}

/**
 * Telegram OTP login: emailni yuborib bot link olish.
 */
export async function telegramOTPLoginInit(
  phone: string,
): Promise<{ login_token: string; bot_link: string; has_telegram: boolean; message: string }> {
  return api.publicPost('/api/auth/telegram/otp/init/', { phone });
}

/**
 * Telegram OTP login: kodni tasdiqlash → JWT olish.
 */
export async function telegramOTPLoginVerify(
  login_token: string,
  otp: string,
): Promise<AuthTokens> {
  const data = await api.publicPost<AuthTokens>('/api/auth/telegram/otp/verify/', { login_token, otp });
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
}
