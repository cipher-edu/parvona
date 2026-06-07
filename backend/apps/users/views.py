import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.core.cache import cache
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse

from core.permissions import IsAdminRole
from .models import User
from .serializers import (
    RegisterSerializer,
    RegisterInitSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AdminUserSerializer,
    FirebaseAuthSerializer,
    TelegramAuthSerializer,
)


class AuthRateThrottle(AnonRateThrottle):
    """Auth endpointlari uchun qat'iy cheklov: 10 ta so'rov/daqiqa."""
    scope = 'auth'

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """Yangi foydalanuvchi ro'yxatdan o'tish."""
    permission_classes  = [AllowAny]
    throttle_classes    = [AuthRateThrottle]
    serializer_class    = RegisterSerializer

    @extend_schema(
        summary='Ro\'yxatdan o\'tish',
        responses={201: UserSerializer},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """Email + parol bilan kirish. Access + refresh token qaytaradi."""
    permission_classes  = [AllowAny]
    throttle_classes    = [AuthRateThrottle]
    serializer_class    = CustomTokenObtainPairSerializer

    @extend_schema(summary='Kirish (JWT)')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """Refresh tokenni blacklist ga qo'shib chiqish."""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary='Chiqish')
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'code': 'MISSING_TOKEN', 'message': 'Refresh token majburiy'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass  # Allaqachon blacklist qilingan bo'lishi mumkin
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    """O'z profilini ko'rish va yangilash."""
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer

    @extend_schema(summary='O\'z profilim')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary='Profilni yangilash')
    def patch(self, request, *args, **kwargs):
        cache.delete(f'user:{request.user.id}')
        return super().partial_update(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        cache.delete(f'user:{request.user.id}')
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    """Parolni o'zgartirish."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Parolni o\'zgartirish',
        request=ChangePasswordSerializer,
        responses={204: None},
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Parol o'zgargandan so'ng barcha refresh tokenlarni blacklist qilish
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            outstanding = OutstandingToken.objects.filter(user=request.user)
            BlacklistedToken.objects.bulk_create(
                [BlacklistedToken(token=t) for t in outstanding],
                ignore_conflicts=True,
            )
        except Exception:
            pass  # token_blacklist app o'rnatilmagan yoki xato

        return Response(status=status.HTTP_204_NO_CONTENT)


class ReferralStatsView(APIView):
    """GET /api/users/me/referral/ — referral kodi va statistika."""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary='Referral statistika')
    def get(self, request):
        user  = request.user
        count = user.referrals.count()
        # Har bir muvaffaqiyatli referal uchun 10,000 so'm bonus (hisoblash uchun)
        bonus = count * 10_000
        return Response({
            'code':             user.referral_code,
            'total_referrals':  count,
            'bonus_earned':     bonus,
        })


# ─── Admin views ─────────────────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    """Admin: barcha foydalanuvchilar ro'yxati."""
    permission_classes = [IsAdminRole]
    serializer_class   = AdminUserSerializer
    queryset           = User.objects.all()
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ['role', 'is_active']
    search_fields      = ['name', 'email', 'phone']
    ordering_fields    = ['created_at', 'name']
    ordering           = ['-created_at']


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """Admin: foydalanuvchini ko'rish va o'zgartirish."""
    permission_classes = [IsAdminRole]
    serializer_class   = AdminUserSerializer
    queryset           = User.objects.all()
    lookup_field       = 'id'


class FirebaseAuthView(APIView):
    """
    POST /api/auth/firebase/
    Firebase ID token ni Django JWT ga almashtirish.
    Frontend Google login qilgandan keyin shu endpointni chaqiradi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Firebase token → Django JWT',
        request=FirebaseAuthSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'access':  {'type': 'string'},
                    'refresh': {'type': 'string'},
                    'user':    {'type': 'object'},
                }
            }
        },
    )
    def post(self, request):
        serializer = FirebaseAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        firebase_token = serializer.validated_data['firebase_token']
        role           = serializer.validated_data.get('role', 'parent')

        # Firebase tokenni tekshirish
        try:
            import firebase_admin
            from firebase_admin import auth as firebase_auth, credentials
            from django.conf import settings
            import os

            # Firebase app ni bir marta initialize qilish
            if not firebase_admin._apps:
                service_account_path = getattr(settings, 'FIREBASE_SERVICE_ACCOUNT_PATH', None)
                if service_account_path and os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                else:
                    # Service account yo'q — faqat projectId bilan
                    project_id = getattr(settings, 'FIREBASE_PROJECT_ID', '')
                    firebase_admin.initialize_app(options={'projectId': project_id})

            decoded = firebase_auth.verify_id_token(firebase_token)
        except Exception as e:
            logger.warning(f'Firebase token xatosi: {e}')
            return Response(
                {'code': 'INVALID_FIREBASE_TOKEN', 'message': 'Firebase token noto\'g\'ri yoki muddati o\'tgan.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        firebase_uid   = decoded['uid']
        email          = decoded.get('email', f'{firebase_uid}@firebase.local')
        name           = decoded.get('name', decoded.get('display_name', 'Foydalanuvchi'))
        photo_url      = decoded.get('picture', '')

        # Django foydalanuvchisini topish yoki yaratish
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'name':      name,
                'role':      role,
                'is_active': True,
            }
        )

        if not created and not user.name and name:
            user.name = name
            user.save(update_fields=['name'])

        # JWT token yaratish
        refresh = RefreshToken.for_user(user)
        refresh['role']  = user.role
        refresh['name']  = user.name
        refresh['email'] = user.email

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class TelegramAuthView(APIView):
    """
    POST /api/auth/telegram/
    Telegram Login Widget ma'lumotlarini tekshirib Django JWT qaytarish.
    TELEGRAM_BOT_TOKEN settings da bo'lishi shart.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Telegram Login Widget → Django JWT',
        request=TelegramAuthSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'access':  {'type': 'string'},
                    'refresh': {'type': 'string'},
                    'user':    {'type': 'object'},
                }
            }
        },
    )
    def post(self, request):
        import hashlib
        import hmac as _hmac
        import time
        from django.conf import settings

        serializer = TelegramAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tg_hash = data.pop('hash')
        role    = data.pop('role', 'parent')

        # HMAC-SHA256 tekshiruv
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            logger.error('TELEGRAM_BOT_TOKEN sozlanmagan')
            return Response(
                {'code': 'NOT_CONFIGURED', 'message': 'Telegram autentifikatsiyasi sozlanmagan'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        check_string = '\n'.join(
            f'{k}={v}' for k, v in sorted(data.items()) if v not in ('', None)
        )
        secret_key    = hashlib.sha256(bot_token.encode()).digest()
        expected_hash = _hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

        if not _hmac.compare_digest(expected_hash, tg_hash):
            return Response(
                {'code': 'INVALID_HASH', 'message': 'Telegram ma\'lumotlari noto\'g\'ri'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Muddati o'tganmi? (24 soat)
        if time.time() - data['auth_date'] > 86400:
            return Response(
                {'code': 'EXPIRED', 'message': 'Telegram sessiyasi muddati o\'tgan, qayta kiring'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        telegram_id = data['id']
        name        = f"{data['first_name']} {data.get('last_name', '')}".strip() or 'Foydalanuvchi'
        photo_url   = data.get('photo_url', '')

        # Django foydalanuvchini topish/yaratish (email telegram_<id>@parvona.uz)
        email = f'telegram_{telegram_id}@parvona.uz'
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'name': name, 'role': role, 'is_active': True},
        )

        if not created and name and (not user.name or user.name == 'Foydalanuvchi'):
            user.name = name
            user.save(update_fields=['name'])

        if created and photo_url:
            user.photo = photo_url
            user.save(update_fields=['photo'])

        refresh = RefreshToken.for_user(user)
        refresh['role']  = user.role
        refresh['name']  = user.name
        refresh['email'] = user.email

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class EmailOTPSendView(APIView):
    """
    POST /api/auth/email-otp/send/
    Foydalanuvchi emailiga 6 raqamli bir martalik kod yuboradi.
    Redis da 5 daqiqa saqlanadi. Har yuborishda yangi kod generatsiya qilinadi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Email OTP yuborish',
        request={'type': 'object', 'properties': {'email': {'type': 'string', 'format': 'email'}}},
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}},
    )
    def post(self, request):
        import secrets
        from django.core.mail import send_mail
        from django.conf import settings as django_settings

        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'code': 'MISSING_EMAIL', 'message': 'Email manzil majburiy'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = str(secrets.randbelow(900000) + 100000)  # kriptografik xavfsiz

        otp_key      = f'email_otp:{email}'
        attempts_key = f'email_otp_attempts:{email}'

        cache.set(otp_key,      otp,  timeout=django_settings.EMAIL_OTP_TIMEOUT)
        cache.set(attempts_key, 0,    timeout=django_settings.EMAIL_OTP_TIMEOUT)

        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
          <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-block;background:#7c3aed;border-radius:12px;padding:12px 20px">
              <span style="color:#fff;font-size:20px;font-weight:700">Parvona</span>
            </div>
          </div>
          <h2 style="color:#1e293b;font-size:22px;font-weight:700;margin:0 0 8px">Kirish kodi</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px">Parvona platformasiga kirish uchun quyidagi kodni kiriting:</p>
          <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:700;color:#7c3aed;margin-bottom:24px">
            {otp}
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
            Kod <strong>5 daqiqa</strong> davomida amal qiladi.<br>
            Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.
          </p>
        </div>
        """

        try:
            send_mail(
                subject='Parvona — Kirish kodingiz',
                message=f'Sizning kirish kodingiz: {otp}\n\nKod 5 daqiqa davomida amal qiladi.',
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_body,
                fail_silently=False,
            )
        except Exception as exc:
            logger.error(f'Email OTP yuborishda xatolik [{email}]: {exc}')
            return Response(
                {'code': 'EMAIL_SEND_ERROR', 'message': 'Email yuborishda xatolik. Keyinroq urinib ko\'ring.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        logger.info(f'Email OTP yuborildi: {email}')
        return Response({'message': 'Kod emailingizga yuborildi'})


class EmailOTPVerifyView(APIView):
    """
    POST /api/auth/email-otp/verify/
    OTP kodni tekshirib JWT qaytaradi. Kod bir martalik — tekshirilgandan so'ng o'chiriladi.
    5 ta noto'g'ri urinishdan keyin kod bekor qilinadi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Email OTP tasdiqlash → JWT',
        request={
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'format': 'email'},
                'otp':   {'type': 'string'},
                'role':  {'type': 'string', 'enum': ['parent', 'nanny']},
            },
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'access':  {'type': 'string'},
                    'refresh': {'type': 'string'},
                    'user':    {'type': 'object'},
                },
            }
        },
    )
    def post(self, request):
        from django.conf import settings as django_settings

        email = request.data.get('email', '').strip().lower()
        otp   = request.data.get('otp',   '').strip()
        role  = request.data.get('role',  'parent')

        if not email or not otp:
            return Response(
                {'code': 'MISSING_FIELDS', 'message': 'Email va OTP kodi majburiy'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role not in ('parent', 'nanny'):
            role = 'parent'

        otp_key      = f'email_otp:{email}'
        attempts_key = f'email_otp_attempts:{email}'

        saved_otp = cache.get(otp_key)
        if not saved_otp:
            return Response(
                {'code': 'OTP_EXPIRED', 'message': 'Kod muddati o\'tgan yoki yuborilmagan. Yangi kod oling.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        attempts = cache.get(attempts_key, 0)
        if attempts >= django_settings.EMAIL_OTP_MAX_TRIES:
            cache.delete(otp_key)
            cache.delete(attempts_key)
            return Response(
                {'code': 'TOO_MANY_ATTEMPTS', 'message': 'Juda ko\'p noto\'g\'ri urinish. Yangi kod oling.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if saved_otp != otp:
            cache.set(attempts_key, attempts + 1, timeout=django_settings.EMAIL_OTP_TIMEOUT)
            remaining = django_settings.EMAIL_OTP_MAX_TRIES - attempts - 1
            return Response(
                {'code': 'INVALID_OTP', 'message': f'Noto\'g\'ri kod. {remaining} ta urinish qoldi.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Bir martalik — o'chirib yuboramiz
        cache.delete(otp_key)
        cache.delete(attempts_key)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'name':      email.split('@')[0].capitalize(),
                'role':      role,
                'is_active': True,
            }
        )

        if not user.is_active:
            return Response(
                {'code': 'ACCOUNT_SUSPENDED', 'message': 'Hisobingiz bloklangan. Qo\'llab-quvvatlash xizmatiga murojaat qiling.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        refresh['role']  = user.role
        refresh['name']  = user.name
        refresh['email'] = user.email

        logger.info(f'Email OTP orqali kirdi: {email} (yangi={created})')

        if user.telegram_user_id:
            try:
                from django.utils import timezone
                from apps.users.management.commands.telegram_handlers import send_notification_to_user
                now = timezone.localtime()
                role_display = {'parent': 'Ota-ona', 'nanny': 'Enaga', 'admin': 'Admin'}.get(user.role, user.role)
                send_notification_to_user(
                    user.telegram_user_id,
                    'Tizimga kirish',
                    f'Hisobingizga muvaffaqiyatli kirildi.\n'
                    f'📅 Sana: {now.strftime("%d.%m.%Y")}\n'
                    f'🕐 Vaqt: {now.strftime("%H:%M")}\n'
                    f'👤 Rol: {role_display}\n'
                    f'📧 Email: {email}',
                )
            except Exception as exc:
                logger.warning(f'Login bildirishnoma yuborishda xato: {exc}')

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class TelegramOTPLoginInitView(APIView):
    """
    POST /api/auth/telegram/otp/init/
    Telefon raqam bo'yicha foydalanuvchini topib, Telegram orqali OTP yuboradi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    def post(self, request):
        import secrets as _secrets
        from django.conf import settings as django_settings

        phone = request.data.get('phone', '').strip()
        if not phone:
            return Response(
                {'code': 'MISSING_PHONE', 'message': 'Telefon raqam majburiy'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # +998901234567, 998901234567, 0901234567 formatlarini normallashtirish
        digits = ''.join(c for c in phone if c.isdigit())
        if digits.startswith('998') and len(digits) == 12:
            normalized = f'+{digits}'
        elif digits.startswith('0') and len(digits) == 10:
            normalized = f'+998{digits[1:]}'
        elif len(digits) == 9:
            normalized = f'+998{digits}'
        else:
            normalized = phone

        users = User.objects.filter(phone=normalized, is_active=True)
        if not users.exists() and len(digits) >= 9:
            users = User.objects.filter(phone__endswith=digits[-9:], is_active=True)

        if not users.exists():
            return Response(
                {'code': 'USER_NOT_FOUND', 'message': 'Bu telefon raqam ro\'yxatda yo\'q'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if users.count() > 1:
            return Response(
                {'code': 'MULTIPLE_ACCOUNTS', 'message': 'Bu raqam bilan bir nechta hisob mavjud. Email orqali kiring.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = users.first()

        bot_name = getattr(django_settings, 'TELEGRAM_BOT_NAME', 'ParvonaBot')
        login_token = _secrets.token_urlsafe(20)
        otp = str(_secrets.randbelow(900000) + 100000)

        cache.set(f'tg_login_otp:{login_token}', otp,         timeout=300)
        cache.set(f'tg_login_uid:{login_token}', str(user.id), timeout=300)

        bot_link = f'https://t.me/{bot_name}?start=LOGIN_{login_token}'

        if user.telegram_user_id:
            try:
                from apps.users.management.commands.telegram_handlers import send_notification_to_user
                send_notification_to_user(
                    user.telegram_user_id,
                    'Kirish kodi',
                    f'Sizning kirish kodingiz: *{otp}*\n\nKod 5 daqiqa amal qiladi.',
                )
            except Exception as exc:
                logger.warning(f'Telegram login OTP yuborishda xato: {exc}')

        logger.info(f'Telegram OTP login boshlandi: {user.email} (tel: {phone})')
        return Response({
            'login_token':  login_token,
            'bot_link':     bot_link,
            'has_telegram': bool(user.telegram_user_id),
            'message':      'Telegram botga o\'ting va OTP kodni oling',
        })


class TelegramOTPLoginVerifyView(APIView):
    """
    POST /api/auth/telegram/otp/verify/
    OTP ni tekshirib JWT qaytaradi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    def post(self, request):
        login_token = request.data.get('login_token', '').strip()
        otp         = request.data.get('otp', '').strip()

        if not login_token or not otp:
            return Response(
                {'code': 'MISSING_FIELDS', 'message': 'login_token va OTP majburiy'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        saved_otp = cache.get(f'tg_login_otp:{login_token}')
        user_id   = cache.get(f'tg_login_uid:{login_token}')

        if not saved_otp or not user_id:
            return Response(
                {'code': 'OTP_EXPIRED', 'message': 'Kod muddati o\'tgan. Qaytadan boshlang.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        attempts_key = f'tg_login_attempts:{login_token}'
        attempts = cache.get(attempts_key, 0)
        if attempts >= 5:
            cache.delete(f'tg_login_otp:{login_token}')
            cache.delete(f'tg_login_uid:{login_token}')
            return Response(
                {'code': 'TOO_MANY_ATTEMPTS', 'message': 'Juda ko\'p urinish. Qaytadan boshlang.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if saved_otp != otp:
            cache.set(attempts_key, attempts + 1, timeout=300)
            remaining = 5 - attempts - 1
            return Response(
                {'code': 'INVALID_OTP', 'message': f'Noto\'g\'ri kod. {remaining} ta urinish qoldi.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        cache.delete(f'tg_login_otp:{login_token}')
        cache.delete(f'tg_login_uid:{login_token}')
        cache.delete(attempts_key)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'code': 'USER_NOT_FOUND', 'message': 'Foydalanuvchi topilmadi'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not user.is_active:
            return Response(
                {'code': 'ACCOUNT_SUSPENDED', 'message': 'Hisobingiz bloklangan'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        refresh['role']  = user.role
        refresh['name']  = user.name
        refresh['email'] = user.email

        # Kirish bildirishnomasini Telegram ga yuborish
        now = timezone.now()
        role_display = {'parent': 'Ota-ona 👨‍👩‍👧', 'nanny': 'Enaga 👩‍🍼', 'admin': 'Admin 🛡️'}.get(user.role, user.role)
        if user.telegram_user_id:
            try:
                from apps.users.management.commands.telegram_handlers import send_notification_to_user
                send_notification_to_user(
                    user.telegram_user_id,
                    'Tizimga kirish',
                    f'Hisobingizga muvaffaqiyatli kirildi.\n'
                    f'📅 Sana: {now.strftime("%d.%m.%Y")}\n'
                    f'🕐 Vaqt: {now.strftime("%H:%M")}\n'
                    f'👤 Rol: {role_display}\n'
                    f'📧 Email: {user.email}',
                )
            except Exception as exc:
                logger.warning(f'Login bildirishnoma yuborishda xato: {exc}')

        logger.info(f'Telegram OTP login: {user.email}')
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class RegisterTelegramInitView(APIView):
    """
    POST /api/auth/register/telegram/init/
    Registratsiya ma'lumotlarini validatsiya qilib Telegram deep link qaytaradi.
    Foydalanuvchi botga o'tib OTP oladi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Telegram OTP ro\'yxatdan o\'tish — link olish',
        responses={200: {'type': 'object', 'properties': {
            'reg_token': {'type': 'string'},
            'bot_link':  {'type': 'string'},
            'message':   {'type': 'string'},
        }}},
    )
    def post(self, request):
        import secrets as _secrets
        from django.conf import settings as django_settings

        serializer = RegisterInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        if User.objects.filter(email=email).exists():
            return Response(
                {'code': 'EMAIL_EXISTS', 'message': 'Bu email allaqachon ro\'yxatdan o\'tgan'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reg_token = _secrets.token_urlsafe(20)
        reg_data  = {
            'email':    email,
            'name':     serializer.validated_data['name'],
            'phone':    serializer.validated_data.get('phone', ''),
            'role':     serializer.validated_data['role'],
            'password': serializer.validated_data['password'],
            'ref_code': serializer.validated_data.get('ref_code', ''),
        }
        cache.set(f'tg_reg:{reg_token}', reg_data, timeout=600)

        bot_name = getattr(django_settings, 'TELEGRAM_BOT_NAME', 'ParvonaBot')
        bot_link = f'https://t.me/{bot_name}?start=OTP_{reg_token}'

        logger.info(f'Telegram registratsiya boshlandi: {email}')
        return Response({
            'reg_token': reg_token,
            'bot_link':  bot_link,
            'message':   'Telegram botga o\'ting va OTP kodni oling',
        })


class RegisterTelegramVerifyView(APIView):
    """
    POST /api/auth/register/telegram/verify/
    Telegram OTP ni tekshirib foydalanuvchi yaratadi va JWT qaytaradi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Telegram OTP tasdiqlash → foydalanuvchi yaratish',
        request={
            'type': 'object',
            'properties': {
                'reg_token': {'type': 'string'},
                'otp':       {'type': 'string'},
            },
        },
        responses={200: {'type': 'object', 'properties': {
            'access':  {'type': 'string'},
            'refresh': {'type': 'string'},
            'user':    {'type': 'object'},
        }}},
    )
    def post(self, request):
        from django.conf import settings as django_settings

        reg_token = request.data.get('reg_token', '').strip()
        otp       = request.data.get('otp', '').strip()

        if not reg_token or not otp:
            return Response(
                {'code': 'MISSING_FIELDS', 'message': 'reg_token va OTP kodi majburiy'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_key      = f'tg_otp:{reg_token}'
        attempts_key = f'tg_otp_attempts:{reg_token}'
        data_key     = f'tg_reg:{reg_token}'
        chat_key     = f'tg_chat:{reg_token}'

        saved_otp = cache.get(otp_key)
        if not saved_otp:
            return Response(
                {'code': 'OTP_EXPIRED', 'message': 'Kod muddati o\'tgan. Telegram botga qayta o\'ting.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        max_tries = getattr(django_settings, 'EMAIL_OTP_MAX_TRIES', 5)
        timeout   = 300
        attempts  = cache.get(attempts_key, 0)

        if attempts >= max_tries:
            cache.delete(otp_key); cache.delete(attempts_key)
            cache.delete(data_key); cache.delete(chat_key)
            return Response(
                {'code': 'TOO_MANY_ATTEMPTS', 'message': 'Juda ko\'p noto\'g\'ri urinish. Qaytadan boshlang.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if saved_otp != otp:
            cache.set(attempts_key, attempts + 1, timeout=timeout)
            remaining = max_tries - attempts - 1
            return Response(
                {'code': 'INVALID_OTP', 'message': f'Noto\'g\'ri kod. {remaining} ta urinish qoldi.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        reg_data       = cache.get(data_key)
        telegram_chat_id = cache.get(chat_key)

        if not reg_data:
            return Response(
                {'code': 'DATA_EXPIRED', 'message': 'Ma\'lumotlar muddati o\'tgan. Qaytadan boshlang.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache.delete(otp_key); cache.delete(attempts_key)
        cache.delete(data_key); cache.delete(chat_key)

        if User.objects.filter(email=reg_data['email']).exists():
            return Response(
                {'code': 'EMAIL_EXISTS', 'message': 'Bu email allaqachon ro\'yxatdan o\'tgan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if telegram_chat_id and User.objects.filter(telegram_user_id=telegram_chat_id).exists():
            return Response(
                {'code': 'TELEGRAM_TAKEN', 'message': 'Bu Telegram profil allaqachon boshqa hisob bilan bog\'liq.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            email    = reg_data['email'],
            name     = reg_data['name'],
            phone    = reg_data.get('phone') or '',
            role     = reg_data['role'],
            password = reg_data['password'],
        )

        if telegram_chat_id:
            user.telegram_user_id = telegram_chat_id
            user.save(update_fields=['telegram_user_id'])

        ref_code = reg_data.get('ref_code', '').strip().upper()
        if ref_code:
            try:
                referrer = User.objects.get(referral_code=ref_code)
                if referrer.id != user.id:
                    user.referred_by = referrer
                    user.save(update_fields=['referred_by'])
            except User.DoesNotExist:
                pass

        refresh = RefreshToken.for_user(user)
        refresh['role']  = user.role
        refresh['name']  = user.name
        refresh['email'] = user.email

        # Admin va yangi foydalanuvchiga Telegram bildirishnoma
        try:
            from apps.notifications.tasks import _tg_notify, _tg_notify_admins
            role_display = {'parent': 'Ota-ona', 'nanny': 'Enaga'}.get(user.role, user.role)
            _tg_notify_admins(
                '🆕 Yangi foydalanuvchi (Telegram)',
                f'👤 {user.name}\n'
                f'📧 {user.email}\n'
                f'📱 {user.phone or "—"}\n'
                f'🎭 Rol: {role_display}\n'
                f'📅 {timezone.now().strftime("%d.%m.%Y %H:%M")}',
            )
            if user.telegram_user_id:
                _tg_notify(
                    user,
                    '🎉 Xush kelibsiz, Parvona!',
                    f'Salom, *{user.name}*!\n'
                    f'Telegram orqali ro\'yxatdan o\'tish yakunlandi.\n'
                    f'🎭 Rolingiz: {role_display}\n\n'
                    f'Parvona — ishonchli enaga topish platformasi.',
                )
        except Exception as exc:
            logger.warning(f'Ro\'yxatdan o\'tish bildirishnoma xatosi: {exc}')

        logger.info(f'Telegram OTP orqali ro\'yxatdan o\'tdi: {reg_data["email"]}')
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class RegisterOTPSendView(APIView):
    """
    POST /api/auth/register/send-otp/
    Ro'yxatdan o'tish ma'lumotlarini validatsiya qilib emailga OTP yuboradi.
    Ma'lumotlar va OTP Redis da 5 daqiqa saqlanadi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Ro\'yxatdan o\'tish OTP yuborish',
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}, 'email': {'type': 'string'}}}},
    )
    def post(self, request):
        import secrets
        from django.core.mail import send_mail
        from django.conf import settings as django_settings

        serializer = RegisterInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        if User.objects.filter(email=email).exists():
            return Response(
                {'code': 'EMAIL_EXISTS', 'message': 'Bu email allaqachon ro\'yxatdan o\'tgan'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = str(secrets.randbelow(900000) + 100000)

        reg_data = {
            'email':    email,
            'name':     serializer.validated_data['name'],
            'phone':    serializer.validated_data.get('phone', ''),
            'role':     serializer.validated_data['role'],
            'password': serializer.validated_data['password'],
            'ref_code': serializer.validated_data.get('ref_code', ''),
        }

        timeout = getattr(django_settings, 'EMAIL_OTP_TIMEOUT', 300)
        cache.set(f'reg_otp:{email}',         otp,      timeout=timeout)
        cache.set(f'reg_otp_attempts:{email}', 0,       timeout=timeout)
        cache.set(f'reg_data:{email}',         reg_data, timeout=timeout)

        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
          <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-block;background:#7c3aed;border-radius:12px;padding:12px 20px">
              <span style="color:#fff;font-size:20px;font-weight:700">Parvona</span>
            </div>
          </div>
          <h2 style="color:#1e293b;font-size:22px;font-weight:700;margin:0 0 8px">Emailingizni tasdiqlang</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px">Parvonaga ro'yxatdan o'tish uchun quyidagi kodni kiriting:</p>
          <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:700;color:#7c3aed;margin-bottom:24px">
            {otp}
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
            Kod <strong>5 daqiqa</strong> davomida amal qiladi.<br>
            Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.
          </p>
        </div>
        """

        try:
            send_mail(
                subject='Parvona — Email tasdiqlash kodi',
                message=f'Ro\'yxatdan o\'tish kodi: {otp}\n\nKod 5 daqiqa davomida amal qiladi.',
                from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@parvona.uz'),
                recipient_list=[email],
                html_message=html_body,
                fail_silently=False,
            )
        except Exception as exc:
            logger.error(f'Ro\'yxatdan o\'tish OTP email xatosi [{email}]: {exc}')
            return Response(
                {'code': 'EMAIL_SEND_ERROR', 'message': 'Email yuborishda xatolik. Keyinroq urinib ko\'ring.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        logger.info(f'Ro\'yxatdan o\'tish OTP yuborildi: {email}')
        return Response({'message': 'Tasdiqlash kodi emailingizga yuborildi', 'email': email})


class RegisterOTPVerifyView(APIView):
    """
    POST /api/auth/register/verify-otp/
    OTP kodni tekshirib foydalanuvchini yaratadi va JWT qaytaradi.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [AuthRateThrottle]

    @extend_schema(
        summary='Ro\'yxatdan o\'tish OTP tasdiqlash → JWT',
        request={
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'format': 'email'},
                'otp':   {'type': 'string'},
            },
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'access':  {'type': 'string'},
                    'refresh': {'type': 'string'},
                    'user':    {'type': 'object'},
                },
            }
        },
    )
    def post(self, request):
        from django.conf import settings as django_settings

        email = request.data.get('email', '').strip().lower()
        otp   = request.data.get('otp',   '').strip()

        if not email or not otp:
            return Response(
                {'code': 'MISSING_FIELDS', 'message': 'Email va OTP kodi majburiy'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_key      = f'reg_otp:{email}'
        attempts_key = f'reg_otp_attempts:{email}'
        data_key     = f'reg_data:{email}'

        saved_otp = cache.get(otp_key)
        if not saved_otp:
            return Response(
                {'code': 'OTP_EXPIRED', 'message': 'Kod muddati o\'tgan. Qaytadan ro\'yxatdan o\'tishni boshlang.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        max_tries = getattr(django_settings, 'EMAIL_OTP_MAX_TRIES', 5)
        timeout   = getattr(django_settings, 'EMAIL_OTP_TIMEOUT', 300)
        attempts  = cache.get(attempts_key, 0)

        if attempts >= max_tries:
            cache.delete(otp_key)
            cache.delete(attempts_key)
            cache.delete(data_key)
            return Response(
                {'code': 'TOO_MANY_ATTEMPTS', 'message': 'Juda ko\'p noto\'g\'ri urinish. Qaytadan ro\'yxatdan o\'tishni boshlang.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if saved_otp != otp:
            cache.set(attempts_key, attempts + 1, timeout=timeout)
            remaining = max_tries - attempts - 1
            return Response(
                {'code': 'INVALID_OTP', 'message': f'Noto\'g\'ri kod. {remaining} ta urinish qoldi.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        reg_data = cache.get(data_key)
        if not reg_data:
            return Response(
                {'code': 'DATA_EXPIRED', 'message': 'Ro\'yxatdan o\'tish ma\'lumotlari muddati o\'tgan. Qaytadan boshlang.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache.delete(otp_key)
        cache.delete(attempts_key)
        cache.delete(data_key)

        if User.objects.filter(email=email).exists():
            return Response(
                {'code': 'EMAIL_EXISTS', 'message': 'Bu email allaqachon ro\'yxatdan o\'tgan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            email    = reg_data['email'],
            name     = reg_data['name'],
            phone    = reg_data.get('phone') or '',
            role     = reg_data['role'],
            password = reg_data['password'],
        )

        ref_code = reg_data.get('ref_code', '').strip().upper()
        if ref_code:
            try:
                referrer = User.objects.get(referral_code=ref_code)
                if referrer.id != user.id:
                    user.referred_by = referrer
                    user.save(update_fields=['referred_by'])
            except User.DoesNotExist:
                pass

        refresh = RefreshToken.for_user(user)
        refresh['role']  = user.role
        refresh['name']  = user.name
        refresh['email'] = user.email

        # Admin va yangi foydalanuvchiga Telegram bildirishnoma
        try:
            from apps.notifications.tasks import _tg_notify, _tg_notify_admins
            role_display = {'parent': 'Ota-ona', 'nanny': 'Enaga'}.get(user.role, user.role)
            _tg_notify_admins(
                '🆕 Yangi foydalanuvchi',
                f'👤 {user.name}\n'
                f'📧 {user.email}\n'
                f'📱 {user.phone or "—"}\n'
                f'🎭 Rol: {role_display}\n'
                f'📅 {timezone.now().strftime("%d.%m.%Y %H:%M")}',
            )
            if user.telegram_user_id:
                _tg_notify(
                    user,
                    '🎉 Xush kelibsiz, Parvona!',
                    f'Salom, *{user.name}*!\n'
                    f'Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi.\n'
                    f'🎭 Sizning rolingiz: {role_display}\n\n'
                    f'Parvona — ishonchli enaga topish platformasi.',
                )
        except Exception as exc:
            logger.warning(f'Ro\'yxatdan o\'tish bildirishnoma xatosi: {exc}')

        logger.info(f'Email OTP orqali ro\'yxatdan o\'tdi: {email}')
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class AdminSuspendUserView(APIView):
    """Admin: foydalanuvchini bloklash / blokdan chiqarish."""
    permission_classes = [IsAdminRole]

    @extend_schema(
        summary='Foydalanuvchini bloklash/faollashtirish',
        responses={200: UserSerializer},
    )
    def patch(self, request, id):
        user = generics.get_object_or_404(User, id=id)
        if user.role == 'admin':
            return Response(
                {'code': 'FORBIDDEN', 'message': 'Admin bloklanmaydi'},
                status=status.HTTP_403_FORBIDDEN
            )
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        action = 'faollashtirildi' if user.is_active else 'bloklandi'
        return Response({'message': f'Foydalanuvchi {action}', 'is_active': user.is_active})


class AdminActivateUserView(APIView):
    """Admin: foydalanuvchini faollashtirish. POST /api/admin/users/<id>/activate/"""
    permission_classes = [IsAdminRole]

    @extend_schema(summary='Foydalanuvchini faollashtirish')
    def post(self, request, id):
        user = generics.get_object_or_404(User, id=id)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'message': 'Foydalanuvchi faollashtirildi', 'is_active': True})


class AdminDeactivateUserView(APIView):
    """Admin: foydalanuvchini bloklash. POST /api/admin/users/<id>/deactivate/"""
    permission_classes = [IsAdminRole]

    @extend_schema(summary='Foydalanuvchini bloklash')
    def post(self, request, id):
        user = generics.get_object_or_404(User, id=id)
        if user.role == 'admin':
            return Response(
                {'code': 'FORBIDDEN', 'message': 'Admin bloklanmaydi'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'message': 'Foydalanuvchi bloklandi', 'is_active': False})


class AdminStatsView(APIView):
    """Admin: umumiy statistika. GET /api/admin/stats/"""
    permission_classes = [IsAdminRole]

    @extend_schema(summary='Admin: umumiy statistika')
    def get(self, request):
        import datetime
        from django.db.models import Sum
        from apps.nannies.models import NannyProfile
        from apps.bookings.models import Booking
        from apps.payments.models import Payment
        from django.utils import timezone

        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end   = this_month_start - datetime.timedelta(seconds=1)
        last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_revenue        = Payment.objects.filter(status='paid').aggregate(s=Sum('amount'))['s'] or 0
        this_month_revenue   = Payment.objects.filter(status='paid', paid_at__gte=this_month_start).aggregate(s=Sum('amount'))['s'] or 0
        last_month_revenue   = Payment.objects.filter(status='paid', paid_at__gte=last_month_start, paid_at__lt=this_month_start).aggregate(s=Sum('amount'))['s'] or 0

        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = round(((this_month_revenue - last_month_revenue) / last_month_revenue) * 100)

        return Response({
            'total_users':            User.objects.count(),
            'total_nannies':          NannyProfile.objects.count(),
            'total_bookings':         Booking.objects.count(),
            'total_revenue':          total_revenue,
            'pending_verifications':  NannyProfile.objects.filter(is_verified=False).count(),
            'active_bookings':        Booking.objects.filter(status='active').count(),
            'new_users_this_month':   User.objects.filter(created_at__gte=this_month_start).count(),
            'revenue_growth':         revenue_growth,
        })

class TelegramConnectView(APIView):
    """POST /api/auth/me/telegram/connect/ and /api/auth/telegram/connect/ (fallback)"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Telegram akkauntini ulash',
        request={'application/json': {'type': 'object', 'properties': {'token': {'type': 'string'}}}},
    )
    def post(self, request):
        from django.core.cache import cache
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'detail': 'token maydoni talab qilinadi.'}, status=400)
        cache_key = f'tg_connect_token:{token}'
        telegram_user_id = cache.get(cache_key)
        if not telegram_user_id:
            return Response(
                {'detail': 'Token topilmadi yoki muddati tugagan.'},
                status=400,
            )
        other = User.objects.filter(
            telegram_user_id=telegram_user_id
        ).exclude(pk=request.user.pk).first()
        if other:
            return Response(
                {'detail': "Bu Telegram akkaunt boshqa foydalanuvchiga bog'langan."},
                status=400,
            )
        request.user.telegram_user_id = telegram_user_id
        request.user.save(update_fields=['telegram_user_id'])
        cache.delete(cache_key)
        return Response({
            'message': 'Telegram akkaunt muvaffaqiyatli ulandi.',
            'user': UserSerializer(request.user).data,
        })


class TelegramDisconnectView(APIView):
    """DELETE /api/auth/me/telegram/connect/ and /api/auth/telegram/connect/ (fallback)"""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary='Telegram akkauntini uzish')
    def delete(self, request):
        if not request.user.telegram_user_id:
            return Response({'detail': 'Telegram akkaunt ulangan emas.'}, status=400)
        request.user.telegram_user_id = None
        request.user.save(update_fields=['telegram_user_id'])
        return Response({'message': 'Telegram akkaunt uzildi.'})

class TelegramConnectionView(APIView):
    """POST+DELETE /api/auth/me/telegram/connect/ and /api/auth/telegram/connect/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.core.cache import cache
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'detail': 'token maydoni talab qilinadi.'}, status=400)
        cache_key = f'tg_connect_token:{token}'
        telegram_user_id = cache.get(cache_key)
        if not telegram_user_id:
            return Response(
                {'detail': 'Token topilmadi yoki muddati tugagan. Botga /connect yuboring.'},
                status=400,
            )
        other = User.objects.filter(
            telegram_user_id=telegram_user_id
        ).exclude(pk=request.user.pk).first()
        if other:
            return Response(
                {'detail': "Bu Telegram akkaunt boshqa foydalanuvchiga bog'langan."},
                status=400,
            )
        request.user.telegram_user_id = telegram_user_id
        request.user.save(update_fields=['telegram_user_id'])
        cache.delete(cache_key)
        return Response({
            'message': 'Telegram akkaunt muvaffaqiyatli ulandi.',
            'user': UserSerializer(request.user).data,
        })

    def delete(self, request):
        if not request.user.telegram_user_id:
            return Response({'detail': 'Telegram akkaunt ulangan emas.'}, status=400)
        request.user.telegram_user_id = None
        request.user.save(update_fields=['telegram_user_id'])
        return Response({'message': 'Telegram akkaunt uzildi.'})
