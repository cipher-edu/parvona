# Changelog

## 2026-04-24

### Email OTP (Magic Code) Login

Foydalanuvchilar email orqali bir martalik kod (OTP) bilan kirish imkoniyati qo'shildi.

#### Backend

**`backend/config/settings/base.py`**
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` sozlamalari qo'shildi
- `EMAIL_OTP_TIMEOUT = 300` (5 daqiqa)
- `EMAIL_OTP_MAX_TRIES = 5` (brute-force himoya)

**`backend/apps/users/views.py`**
- `EmailOTPSendView` — `POST /api/auth/email-otp/send/`
  - `secrets.randbelow` bilan kriptografik xavfsiz 6 raqamli OTP
  - Redis da 5 daqiqa saqlash
  - HTML + text formatida email yuborish
- `EmailOTPVerifyView` — `POST /api/auth/email-otp/verify/`
  - 5 marta noto'g'ri urinishdan keyin OTP bekor qilinadi
  - Bir martalik: tekshirilgandan so'ng Redis dan o'chiriladi
  - Yangi foydalanuvchi bo'lsa avtomatik yaratiladi
  - JWT access + refresh token qaytaradi

**`backend/apps/users/urls.py`**
- `email-otp/send/` va `email-otp/verify/` endpointlari ro'yxatdan o'tkazildi

**`backend/.env`**
- SMTP sozlamalari: `agency@enagam.uz`, `mail.enagam.uz:587`

#### Frontend

**`src/api/auth.ts`**
- `sendEmailOTP(email)` — OTP yuborish
- `verifyEmailOTP(email, otp, role)` — OTP tasdiqlash, JWT saqlash

**`src/store/useAuthStore.ts`**
- `loginWithEmailOTP(email, otp, role?)` action qo'shildi

**`src/App.tsx`** — `AuthModal` komponenti
- Login tabida "Parol bilan" / "Email kod bilan" toggle
- OTP rejimi 2 bosqich: email kiritish → 6 raqamli kod kiritish
- Rol tanlash (ota-ona / enaga)
- 60 soniyalik countdown va "Qayta yuborish" tugmasi
- Modal yopilganda OTP holati to'liq reset bo'ladi

#### Infra

**`docker-compose.yml`**
- `db` porti `5433:5432` ga o'zgartirildi (5432 band edi)
- `api` porti `8001:8000` ga o'zgartirildi (8000 band edi)

**`vite.config.ts`**
- Proxy manzili `localhost:8001` ga yangilandi

#### Ishlaydigan manzillar

| Xizmat | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8001 |
| Swagger | http://localhost:8001/api/docs/ |

---

## 2026-04-17

### Tuzatishlar

**API URL xatolari**
- `src/api/users.ts` — `/api/users/me/` → `/api/auth/me/`
- `src/api/referral.ts` — `/api/users/me/referral/` → `/api/auth/me/referral/`
- `src/pages/admin/AdminProfilePage.tsx` — `/api/users/me/change-password/` → `/api/auth/me/password/`

**Profil sahifalari (loader muammosi)**
- `ProfilePage.tsx` (ota-ona) — `if (!user) return` olib tashlandi; `djangoUser` mavjud bo'lsa darhol ko'rsatiladi, Firestore fon rejimida yangilanadi
- `NannyProfilePage.tsx` (enaga) — xuddi shu tuzatish; `handleSave` email foydalanuvchilar uchun ham ishlaydi; `handleFirestoreError` ga bog'liqlik olib tashlandi

**WebSocket (useNotifications.ts)**
- React StrictMode da qayta ulanish loop muammosi tuzatildi — `destroyed` ref orqali intentional yopishda reconnect to'xtatiladi
- `ws.onclose = null` cleanup da qo'shildi
- WS URL dinamik hisoblash: `VITE_WS_URL` → `VITE_API_URL` → `window.location.host` fallback

**Telegram bot**
- `telegram_handlers.py` — sinxron Django ORM chaqiruvlari `@sync_to_async` bilan o'raldi (async handler ichida crash bo'lar edi)
- `docker-compose.yml` — `telegram_bot` servisi qo'shildi (polling mode)
- `backend/.env` — `TELEGRAM_BOT_TOKEN` o'rnatildi
