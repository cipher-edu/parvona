import { tokenStorage } from '../api/client';
import { DjangoUser } from '../api/types';

/**
 * JWT tokenidan payload ni o'qish (base64 decode).
 */
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json   = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Saqlangan access tokendan user ma'lumotlarini olish.
 * Bu API chaqiruvsiz local holat — sahifa yangilanishida ham ishlaydi.
 */
export function getUserFromToken(): DjangoUser | null {
  const token = tokenStorage.getAccess();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  // JWT muddati tekshiruvi
  const exp = payload.exp as number | undefined;
  if (exp && Date.now() / 1000 > exp) {
    // Muddati o'tgan — lekin refresh token bilan yangilanishi mumkin
    return null;
  }

  return {
    id:         String(payload.user_id || ''),
    email:      String(payload.email   || ''),
    name:       String(payload.name    || ''),
    role:       (payload.role as DjangoUser['role']) || 'parent',
    phone:      '',
    photo:      null,
    is_active:  true,
    created_at: '',
  };
}

/**
 * Foydalanuvchi tizimga kirganmi?
 */
export function isAuthenticated(): boolean {
  return !!tokenStorage.getAccess();
}

/**
 * Foydalanuvchi roli
 */
export function getUserRole(): DjangoUser['role'] | null {
  return getUserFromToken()?.role ?? null;
}
