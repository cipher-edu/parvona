"""
Demo ma'lumotlar yaratish:
  python manage.py seed_data
  python manage.py seed_data --flush   # Avval tozalab keyin yaratadi
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction


# ─── Uzbek demo ma'lumotlar ───────────────────────────────────────────────────

PARENT_USERS = [
    {"name": "Dilnoza Yusupova",   "email": "dilnoza@example.com",  "phone": "+998901234567"},
    {"name": "Barno Toshmatova",   "email": "barno@example.com",    "phone": "+998901234568"},
    {"name": "Gulnora Mirzayeva",  "email": "gulnora@example.com",  "phone": "+998901234569"},
    {"name": "Sarvinoz Xoliqova",  "email": "sarvinoz@example.com", "phone": "+998901234570"},
    {"name": "Mohira Karimova",    "email": "mohira@example.com",   "phone": "+998901234571"},
]

NANNY_USERS = [
    {"name": "Aziza Raximova",    "email": "aziza@example.com",   "phone": "+998901234572"},
    {"name": "Feruza Nazarova",   "email": "feruza@example.com",  "phone": "+998901234573"},
    {"name": "Zulfiya Qodirov",   "email": "zulfiya@example.com", "phone": "+998901234574"},
    {"name": "Maftuna Abdullayeva","email": "maftuna@example.com","phone": "+998901234575"},
    {"name": "Nargiza Xasanova",  "email": "nargiza@example.com", "phone": "+998901234576"},
    {"name": "Dilorom Ergasheva", "email": "dilorom@example.com", "phone": "+998901234577"},
    {"name": "Sabohat Tursunova", "email": "sabohat@example.com", "phone": "+998901234578"},
]

NANNY_PROFILES = [
    {
        "age": 26, "experience": 4, "hourly_rate": 40000,
        "bio": "Assalomu alaykum! Men 4 yillik tajribaga ega enagaman. Bolalar psixologiyasi bo'yicha maxsus kurslarni tamomlaganman. Chaqaloqlar va maktab yoshidagi bolalar bilan ishlashni yaxshi ko'raman.",
        "skills": ["infant_care", "school_prep", "first_aid"],
        "location_name": "Navoiy shahri", "latitude": 40.0844, "longitude": 65.3792,
        "is_verified": True,
    },
    {
        "age": 29, "experience": 6, "hourly_rate": 50000,
        "bio": "Professional enaga. Ingliz tili o'qituvchisi sifatida bolalarga dars berib kelaman. Birinchi yordam bo'yicha sertifikatim bor.",
        "skills": ["english", "tutoring", "school_prep", "first_aid"],
        "location_name": "Navoiy, Karmana tumani", "latitude": 40.1451, "longitude": 65.3627,
        "is_verified": True,
    },
    {
        "age": 32, "experience": 8, "hourly_rate": 60000,
        "bio": "8 yillik tajribam bor. Maxsus ehtiyojli bolalar bilan ishlash bo'yicha maxsus ta'lim olganman. Sabr-toqatli va mehribon enaga.",
        "skills": ["special_needs", "infant_care", "cooking", "first_aid"],
        "location_name": "Navoiy, Qiziltepa tumani", "latitude": 40.2137, "longitude": 65.5234,
        "is_verified": True,
    },
    {
        "age": 23, "experience": 2, "hourly_rate": 30000,
        "bio": "Yosh va faol enaga. Bolalar bilan o'yin orqali o'qitish metodikasini bilaman. Pedagogika kollejini tamomlaganman.",
        "skills": ["school_prep", "tutoring", "cooking"],
        "location_name": "Navoiy shahri", "latitude": 40.0950, "longitude": 65.3850,
        "is_verified": False,
    },
    {
        "age": 35, "experience": 10, "hourly_rate": 70000,
        "bio": "10 yillik tajriba. Chaqaloqlar parvarishi bo'yicha mutaxassis. Ko'plab oilalarga yordam berib kelaman. Haydovchilik guvohnomam bor.",
        "skills": ["infant_care", "first_aid", "cooking", "driving"],
        "location_name": "Navoiy, Navbahor tumani", "latitude": 40.0650, "longitude": 65.4100,
        "is_verified": True,
    },
    {
        "age": 28, "experience": 5, "hourly_rate": 45000,
        "bio": "Ingliz va rus tillarini bilaman. Bolalarga ikki tilda ta'lim beraman. Maktabga tayyorlov kurslarida o'qitganman.",
        "skills": ["english", "school_prep", "tutoring"],
        "location_name": "Navoiy shahri, Ravshan mahallasi", "latitude": 40.0780, "longitude": 65.3680,
        "is_verified": True,
    },
    {
        "age": 30, "experience": 7, "hourly_rate": 55000,
        "bio": "Oilaviy enaga. Bir vaqtning o'zida 2-3 nafar bolani parvarishlay olaman. Ovqat pishirishni yaxshi bilaman.",
        "skills": ["infant_care", "cooking", "school_prep", "first_aid"],
        "location_name": "Navoiy, Toshko'mir shahri", "latitude": 40.5523, "longitude": 65.9870,
        "is_verified": True,
    },
]

REVIEW_TEXTS = [
    "Juda yaxshi enaga! Farzandim uni juda yaxshi ko'rib qoldi. Tavsiya qilaman.",
    "Mas'uliyatli va mehribon. Bolam bilan chiroyli munosabatda bo'ladi.",
    "Professional darajada ishlaydi. Vaqtida keladi, topshiriqlarni bajaradi.",
    "Bolam uning darslaridan keyin ingliz tilida gapira boshladi. Rahmat!",
    "Zo'r enaga! Uyni ham tartibda ushlab turadi. Juda mamnunmiz.",
    "Birinchi marta enaga yolladik va juda to'g'ri tanlov qildik.",
    "Sabr-toqatli, bolalarga nisbatan chidamli. Tavsiya qilaman.",
    "Farzandlarim uni kutib olishadi. Ajoyib inson.",
    "Narxi adolatli, xizmat sifati yuqori. Davom ettiramiz.",
    "Maxsus ehtiyojli bolam bilan juda yaxshi muomala qiladi.",
]

ADDRESSES = [
    "Navoiy sh., Ravshan ko'chasi 15-uy",
    "Navoiy sh., Bog'ishamol mahallasi, 7-uy",
    "Karmana tumani, Markaziy ko'cha 42",
    "Navoiy sh., Yangi hayot ko'chasi 3",
    "Navoiy sh., Neftchi mahallasi, 11-uy",
]


class Command(BaseCommand):
    help = "Demo ma'lumotlar yaratadi: admin, parents, nannies, bookings, reviews, payments, notifications"

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Avval barcha ma\'lumotlarni o\'chiradi',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['flush']:
            self._flush()
        else:
            # Allaqachon seed qilingan bo'lsa — o'tkazib yuborish
            from apps.users.models import User
            if User.objects.filter(email='admin@parvona.uz').exists():
                self.stdout.write(self.style.WARNING(
                    "Demo ma'lumotlar allaqachon mavjud. Qayta yuklash uchun --flush ishlating."
                ))
                return

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Parvona Demo Ma\'lumotlar ===\n'))

        admin     = self._create_admin()
        parents   = self._create_parents()
        nannies   = self._create_nannies()
        bookings  = self._create_bookings(parents, nannies)
        self._create_reviews(bookings)
        self._create_payments(bookings)
        self._create_notifications(parents, nannies)

        self.stdout.write(self.style.SUCCESS('\n✓ Barcha demo ma\'lumotlar yaratildi!\n'))
        self.stdout.write(self.style.WARNING('━' * 45))
        self.stdout.write(f"  Admin:    admin@parvona.uz / admin1234")
        self.stdout.write(f"  Swagger:  http://localhost:8000/api/docs/")
        self.stdout.write(f"  Admin UI: http://localhost:8000/admin/")
        self.stdout.write(self.style.WARNING('━' * 45 + '\n'))

    # ─── flush ───────────────────────────────────────────────────────────────

    def _flush(self):
        from apps.notifications.models import Notification
        from apps.payments.models import Payment
        from apps.reviews.models import Review
        from apps.chat.models import Message, Conversation
        from apps.bookings.models import Booking
        from apps.nannies.models import NannyProfile
        from apps.users.models import User

        self.stdout.write(self.style.WARNING('  Eski ma\'lumotlar o\'chirilmoqda...'))
        Notification.objects.all().delete()
        Payment.objects.all().delete()
        Review.objects.all().delete()
        Message.objects.all().delete()
        Conversation.objects.all().delete()
        Booking.objects.all().delete()
        NannyProfile.objects.all().delete()
        User.objects.filter(email__endswith='@example.com').delete()
        User.objects.filter(email='admin@parvona.uz').delete()
        self.stdout.write(self.style.SUCCESS('  ✓ Tozalandi\n'))

    # ─── admin ───────────────────────────────────────────────────────────────

    def _create_admin(self):
        from apps.users.models import User
        admin, created = User.objects.get_or_create(
            email='admin@parvona.uz',
            defaults={
                'name':         'Super Admin',
                'role':         'admin',
                'is_staff':     True,
                'is_superuser': True,
                'phone':        '+998900000000',
            }
        )
        admin.set_password('admin1234')
        admin.save(update_fields=['password'])
        status = 'yaratildi' if created else 'mavjud'
        self.stdout.write(f"  👤 Admin {status}: admin@parvona.uz / admin1234")
        return admin

    # ─── parents ─────────────────────────────────────────────────────────────

    def _create_parents(self):
        from apps.users.models import User
        parents = []
        self.stdout.write('\n  Ota-onalar:')
        for data in PARENT_USERS:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'role': 'parent'}
            )
            user.set_password('password123')
            user.save(update_fields=['password'])
            parents.append(user)
            icon = '✓' if created else '→'
            self.stdout.write(f"    {icon} {user.name}")
        return parents

    # ─── nannies ─────────────────────────────────────────────────────────────

    def _create_nannies(self):
        from apps.users.models import User
        from apps.nannies.models import NannyProfile
        nannies = []
        self.stdout.write('\n  Enagalar:')
        for i, (user_data, profile_data) in enumerate(zip(NANNY_USERS, NANNY_PROFILES)):
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={**user_data, 'role': 'nanny'}
            )
            user.set_password('password123')
            user.save(update_fields=['password'])

            profile, _ = NannyProfile.objects.get_or_create(
                user=user,
                defaults=profile_data,
            )
            nannies.append(user)
            verified = '✓ Tasdiqlangan' if profile.is_verified else '○ Tasdiqlanmagan'
            self.stdout.write(
                f"    → {user.name} | {profile.hourly_rate:,} so'm/soat | {verified}"
            )
        return nannies

    # ─── bookings ────────────────────────────────────────────────────────────

    def _create_bookings(self, parents, nannies):
        from apps.bookings.models import Booking
        from apps.nannies.models import NannyProfile

        bookings = []
        today    = date.today()
        self.stdout.write('\n  Buyurtmalar:')

        scenarios = [
            # (parent_idx, nanny_idx, days_offset_start, days_offset_end, hours, status)
            (0, 0,  -30, -24, 8, 'completed'),
            (1, 1,  -20, -15, 6, 'completed'),
            (2, 2,  -10,  -5, 4, 'completed'),
            (0, 4,   -7,  -3, 5, 'completed'),
            (3, 5,   -5,  -2, 6, 'completed'),
            (1, 0,   -3,   1, 8, 'active'),
            (4, 2,    1,   5, 4, 'confirmed'),
            (2, 3,    3,   8, 6, 'confirmed'),
            (3, 1,    5,  10, 5, 'pending'),
            (0, 6,    7,  12, 7, 'pending'),
            (4, 4,  -15, -12, 8, 'cancelled'),
            (1, 5,  -25, -20, 4, 'disputed'),
        ]

        STATUS_TIMESTAMPS = {
            'confirmed': {'confirmed_at': timezone.now() - timedelta(days=1)},
            'active':    {'confirmed_at': timezone.now() - timedelta(days=3), 'started_at': timezone.now() - timedelta(hours=2)},
            'completed': {'confirmed_at': timezone.now() - timedelta(days=10), 'started_at': timezone.now() - timedelta(days=8), 'completed_at': timezone.now() - timedelta(days=1)},
            'cancelled': {'cancelled_at': timezone.now() - timedelta(days=5)},
            'disputed':  {'confirmed_at': timezone.now() - timedelta(days=20), 'started_at': timezone.now() - timedelta(days=18), 'completed_at': timezone.now() - timedelta(days=10)},
        }

        for pi, ni, d_start, d_end, hours, status in scenarios:
            parent       = parents[pi]
            nanny        = nannies[ni]
            start_date   = today + timedelta(days=d_start)
            end_date     = today + timedelta(days=d_end)
            nanny_profile = NannyProfile.objects.get(user=nanny)

            days         = (end_date - start_date).days + 1
            total_amount = int(days * hours * nanny_profile.hourly_rate)

            booking = Booking.objects.create(
                parent       = parent,
                nanny        = nanny,
                status       = status,
                start_date   = start_date,
                end_date     = end_date,
                hours_per_day = hours,
                hourly_rate  = nanny_profile.hourly_rate,
                total_amount = total_amount,
                address      = random.choice(ADDRESSES),
                notes        = "Bolalar bilan ehtiyotkorlik bilan muomala qiling." if random.random() > 0.5 else "",
                cancel_reason = "Shaxsiy sabablarga ko'ra" if status == 'cancelled' else "",
                **STATUS_TIMESTAMPS.get(status, {}),
            )
            bookings.append(booking)
            self.stdout.write(
                f"    → {parent.name} ↔ {nanny.name} | {status} | {total_amount:,} so'm"
            )

        return bookings

    # ─── reviews ─────────────────────────────────────────────────────────────

    def _create_reviews(self, bookings):
        from apps.reviews.models import Review

        completed = [b for b in bookings if b.status == 'completed']
        self.stdout.write('\n  Sharhlar:')

        for booking in completed:
            if Review.objects.filter(booking=booking).exists():
                continue
            rating = random.choices([5, 5, 5, 4, 4, 3], k=1)[0]
            review = Review.objects.create(
                booking = booking,
                author  = booking.parent,
                target  = booking.nanny,
                rating  = rating,
                text    = random.choice(REVIEW_TEXTS),
            )
            self.stdout.write(
                f"    → {booking.parent.name} → {booking.nanny.name}: {'★' * rating}"
            )

        # Ratinglarni hisoblash
        from django.db.models import Avg, Count
        from apps.nannies.models import NannyProfile

        for profile in NannyProfile.objects.all():
            stats = Review.objects.filter(target=profile.user).aggregate(
                avg=Avg('rating'), count=Count('id')
            )
            if stats['avg']:
                profile.rating        = round(stats['avg'], 1)
                profile.reviews_count = stats['count']
                profile.save(update_fields=['rating', 'reviews_count'])

    # ─── payments ────────────────────────────────────────────────────────────

    def _create_payments(self, bookings):
        from apps.payments.models import Payment

        self.stdout.write('\n  To\'lovlar:')

        pay_statuses = {
            'completed': ('paid', 'payme'),
            'active':    ('paid', 'click'),
            'confirmed': ('pending', 'payme'),
            'disputed':  ('paid', 'click'),
        }

        for booking in bookings:
            if booking.status not in pay_statuses:
                continue
            if Payment.objects.filter(booking=booking).exists():
                continue

            pay_status, provider = pay_statuses[booking.status]
            payment = Payment.objects.create(
                booking        = booking,
                provider       = provider,
                amount         = booking.total_amount * 100,
                status         = pay_status,
                provider_tx_id = f'{provider.upper()}-{str(booking.id)[:8].upper()}' if pay_status == 'paid' else None,
                paid_at        = timezone.now() - timedelta(days=1) if pay_status == 'paid' else None,
                metadata       = {'source': 'seed'},
            )
            self.stdout.write(
                f"    → {provider} | {booking.total_amount:,} so'm | {pay_status}"
            )

    # ─── notifications ────────────────────────────────────────────────────────

    def _create_notifications(self, parents, nannies):
        from apps.notifications.models import Notification

        self.stdout.write('\n  Xabarnomalar:')
        created_count = 0

        notifs = [
            # (user, type, title, body, read)
            (parents[0], 'booking_confirmed', 'Buyurtma tasdiqlandi ✓', 'Aziza Raximova buyurtmangizni tasdiqladi.', True),
            (parents[1], 'booking_completed', 'Xizmat yakunlandi',      'Xizmat muvaffaqiyatli yakunlandi. Sharh qoldiring!', True),
            (parents[2], 'new_booking',        'Yangi buyurtma',         'Buyurtmangiz enagaga yuborildi.', False),
            (parents[3], 'payment_received',   'To\'lov qabul qilindi',  'Buyurtma uchun to\'lov tasdiqlandi.', False),
            (parents[4], 'booking_cancelled',  'Buyurtma bekor',         'Buyurtma bekor qilindi.', False),
            (nannies[0], 'new_booking',         'Yangi buyurtma!',        'Dilnoza Yusupova sizga buyurtma yubordi.', True),
            (nannies[1], 'new_booking',         'Yangi buyurtma!',        'Barno Toshmatova sizga buyurtma yubordi.', False),
            (nannies[2], 'nanny_verified',      'Profil tasdiqlandi ✓',   'Tabriklaymiz! Profilingiz admin tomonidan tasdiqlandi.', False),
            (nannies[4], 'payment_received',    'To\'lov qabul qilindi 💰', 'Xizmat uchun to\'lov muvaffaqiyatli amalga oshirildi.', True),
            (nannies[5], 'review_received',     'Yangi sharh',            'Sizga yangi sharh qoldirildi. Ko\'ring!', False),
        ]

        for user, ntype, title, body, is_read in notifs:
            Notification.objects.create(
                user    = user,
                type    = ntype,
                title   = title,
                body    = body,
                read_at = timezone.now() - timedelta(hours=2) if is_read else None,
            )
            created_count += 1

        self.stdout.write(f"    → {created_count} ta xabarnoma yaratildi")
