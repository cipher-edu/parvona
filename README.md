<div align="center">

# Parvona

**O'zbekistondagi oilalar va enagalar uchun ishonchli platforma**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat-square&logo=django)](https://www.djangoproject.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Xususiyatlar](#xususiyatlar) · [Arxitektura](#arxitektura) · [O'rnatish](#ornatish) · [API hujjatlar](#api-hujjatlar)

</div>

---

## Loyiha haqida

**Parvona** — oilalarni malakali enagalar bilan bog'lovchi raqamli platforma. Ota-onalar enaga qidiradi, enagalar ish topadi, barcha jarayon — bron qilishdan to to'lovgacha — bitta tizimda amalga oshadi.

## Xususiyatlar

### Ota-onalar uchun
- Enaga qidirish — joylashuv, narx va reytingga qarab filtrlash
- Bron qilish va jadval boshqaruvi
- Click, Payme, Uzum Bank orqali to'lov
- Enaga bilan real-time chat
- Sharhlar va reyting qoldirish
- Referral dasturi
- Push-bildirishnomalar

### Enagalar uchun
- Profil va hujjatlarni yuklash (verifikatsiya)
- Ish jadvali boshqaruvi
- Daromad hisoboti
- Pro obuna (kengaytirilgan imkoniyatlar)
- Onboarding jarayoni

### Admin panel
- Foydalanuvchi va enaga boshqaruvi
- Verifikatsiya ko'rib chiqish
- Bron va to'lov nazorati
- Qo'llab-quvvatlash so'rovlari

## Arxitektura

```
parvona/
├── src/                        # React frontend (landing + dashboard)
│   ├── api/                    # API klient va endpointlar
│   ├── components/             # UI komponentlar
│   ├── pages/                  # Sahifalar (parent / nanny / admin)
│   ├── hooks/                  # Custom React hooks
│   └── store/                  # Zustand state management
├── backend/                    # Django REST API
│   ├── apps/
│   │   ├── users/              # Foydalanuvchilar va Firebase auth
│   │   ├── nannies/            # Enaga profillari va qidiruv
│   │   ├── bookings/           # Bron va holat mashina
│   │   ├── payments/           # Click / Payme / Uzum integratsiya
│   │   ├── chat/               # WebSocket chat
│   │   ├── notifications/      # Push va real-time bildirishnomalar
│   │   ├── reviews/            # Ikki tomonlama sharhlar
│   │   └── support/            # Qo'llab-quvvatlash chatlari
│   ├── config/                 # Django sozlamalari
│   └── core/                   # Umumiy utility va bazaviy klasslar
├── frontend/                   # Admin panel (alohida Vite ilovasi)
├── docker-compose.yml          # Development muhiti
├── docker-compose.prod.yml     # Production muhiti
└── nginx.conf                  # Reverse proxy sozlamalari
```

### Texnologiya steki

| Qatlam | Texnologiya |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| State | Zustand, React Router |
| Xarita | Leaflet, React-Leaflet |
| Backend | Django 5.1, Django REST Framework |
| Auth | Firebase Authentication + JWT |
| Real-time | Django Channels, Redis |
| Vazifa navbati | Celery + Celery Beat |
| Ma'lumotlar bazasi | PostgreSQL |
| Cache | Redis |
| Konteyner | Docker, Docker Compose |
| Veb-server | Nginx |

## O'rnatish

### Talablar

- Docker va Docker Compose
- Node.js 18+
- Python 3.12+

### 1. Reponi klonlash

```bash
git clone https://github.com/cipher-edu/parvona.git
cd parvona
```

### 2. Muhit o'zgaruvchilari

```bash
# Backend
cp backend/.env.example backend/.env
# backend/.env faylini o'zingizning qiymatlaringiz bilan to'ldiring

# Frontend
cp .env.example .env
```

### 3. Docker bilan ishga tushirish

```bash
docker-compose up --build
```

Xizmatlar manzillari:

| Xizmat | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Admin panel | http://localhost:8000/admin/ |
| API hujjatlar | http://localhost:8000/api/schema/swagger-ui/ |

### 4. Backend migratsiyalarni qo'llash

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 5. Frontend (mustaqil ishga tushirish)

```bash
npm install
npm run dev
```

## API hujjatlar

Backend ishga tushgandan keyin Swagger UI orqali barcha endpointlarni ko'rish mumkin:

```
http://localhost:8000/api/schema/swagger-ui/
```

## To'lov tizimlari

Loyihada quyidagi O'zbekiston to'lov tizimlari integratsiya qilingan:

- **Click** — `backend/apps/payments/providers/click.py`
- **Payme** — `backend/apps/payments/providers/payme.py`
- **Uzum Bank** — `backend/apps/payments/providers/uzum.py`

## Production deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

`.env` faylidagi quyidagi qiymatlarni production uchun almashtiring:

```env
DEBUG=False
SECRET_KEY=<kuchli-maxfiy-kalit>
ALLOWED_HOSTS=yourdomain.com
DB_PASSWORD=<kuchli-parol>
```

## Litsenziya

MIT © [cipher-edu](https://github.com/cipher-edu)
