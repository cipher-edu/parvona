import logging
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema

from core.permissions import IsAdminRole
from .models import Payment, ProSubscription
from .serializers import PaymentSerializer, InitiatePaymentSerializer
from .providers.payme import PaymeProvider
from .providers.click import ClickProvider

logger = logging.getLogger(__name__)

PROVIDERS = {
    'payme': PaymeProvider,
    'click': ClickProvider,
    # Uzum: to'lov qismida amalga oshiriladi
}


def _get_provider(name: str):
    """Provider klassini olish. Noto'g'ri nom bo'lsa aniq xato qaytaradi."""
    cls = PROVIDERS.get(name)
    if cls is None:
        raise ValueError(f"'{name}' provider hali amalga oshirilmagan. Mavjud: {list(PROVIDERS.keys())}")


class InitiatePaymentView(APIView):
    """POST /api/payments/initiate/ — To'lov sessiyasini boshlash."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='To\'lov boshlash',
        request=InitiatePaymentSerializer,
        responses={200: {'type': 'object', 'properties': {'pay_url': {'type': 'string'}}}},
    )
    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        booking       = serializer._booking
        provider_name = serializer.validated_data['provider']
        return_url    = serializer.validated_data.get('return_url') or request.build_absolute_uri('/')

        try:
            provider_cls = _get_provider(provider_name)
        except ValueError as e:
            return Response(
                {'code': 'PROVIDER_NOT_SUPPORTED', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        provider = provider_cls()
        callback_url = request.build_absolute_uri(f'/api/payments/webhook/{provider_name}/')

        session = provider.create_invoice(
            order_id    = str(booking.id),
            amount      = booking.total_amount * 100,  # so'm → tiyin
            description = f'Parvona — {booking.nanny.name} xizmati',
            callback_url= callback_url,
            return_url  = return_url,
        )

        # Payment yozuvini yaratish yoki olish
        payment, created = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                'provider': provider_name,
                'amount':   booking.total_amount * 100,
                'status':   'pending',
            }
        )
        if not created:
            payment.status = 'pending'
            payment.save(update_fields=['status'])

        return Response({'pay_url': session.pay_url})


@method_decorator(csrf_exempt, name='dispatch')
class PaymeWebhookView(APIView):
    """POST /api/payments/webhook/payme/ — Payme callback."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        provider = PaymeProvider()

        if not provider.verify_signature(request.data, dict(request.headers)):
            logger.warning('Payme: imzo tekshiruvi muvaffaqiyatsiz')
            return Response(
                provider._json_rpc_error(-32504, 'Ruxsat yo\'q', request.data.get('id')),
                status=status.HTTP_200_OK  # Payme 200 kutadi
            )

        try:
            result = provider.parse_webhook(request.data, dict(request.headers))
            _process_payment(result)
            return Response(provider._json_rpc_response({'allow': True}, request.data.get('id')))
        except Exception as e:
            logger.exception(f'Payme webhook xatosi: {e}')
            return Response(
                provider._json_rpc_error(-31008, 'Ichki xato', request.data.get('id')),
                status=status.HTTP_200_OK
            )


@method_decorator(csrf_exempt, name='dispatch')
class ClickWebhookView(APIView):
    """POST /api/payments/webhook/click/ — Click callback."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        provider = ClickProvider()

        if not provider.verify_signature(request.data, dict(request.headers)):
            logger.warning('Click: imzo tekshiruvi muvaffaqiyatsiz')
            return Response({'error': -1, 'error_note': 'Imzo xato'})

        try:
            result = provider.parse_webhook(request.data, dict(request.headers))
            _process_payment(result)
            return Response({'error': 0, 'error_note': 'Success'})
        except Exception as e:
            logger.exception(f'Click webhook xatosi: {e}')
            return Response({'error': -8, 'error_note': 'Ichki xato'})


def _process_payment(result) -> None:
    """Webhook natijasiga ko'ra payment statusini yangilash."""
    try:
        payment = Payment.objects.select_related('booking').get(
            booking_id=result.order_id
        )
    except Payment.DoesNotExist:
        logger.error(f'To\'lov topilmadi: booking_id={result.order_id}')
        return

    if payment.status == 'paid':
        return  # Idempotent

    if result.status == 'paid':
        payment.status         = 'paid'
        payment.paid_at        = timezone.now()
        payment.provider_tx_id = result.provider_tx_id
        payment.metadata       = result.metadata
        payment.save(update_fields=['status', 'paid_at', 'provider_tx_id', 'metadata'])

        # Booking ni active ga o'tkazish
        if payment.booking.status == 'confirmed':
            from apps.notifications.tasks import send_booking_notification
            send_booking_notification.delay(str(payment.booking.id), 'payment_received')

    elif result.status == 'failed':
        payment.status    = 'failed'
        payment.failed_at = timezone.now()
        payment.metadata  = result.metadata
        payment.save(update_fields=['status', 'failed_at', 'metadata'])

    logger.info(f'To\'lov yangilandi: booking={result.order_id} → {result.status}')


class ProSubscriptionView(APIView):
    """
    GET  /api/payments/pro/  — joriy obuna holati
    POST /api/payments/pro/  — yangi obuna yaratish (demo: to'lovsiz)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = request.user.pro_subscription
            return Response({
                'is_pro':     sub.is_valid,
                'plan':       sub.plan,
                'expires_at': sub.expires_at,
            })
        except ProSubscription.DoesNotExist:
            return Response({'is_pro': False, 'plan': None, 'expires_at': None})

    def post(self, request):
        plan = request.data.get('plan', 'monthly')
        if plan not in ('monthly', 'yearly'):
            return Response({'code': 'INVALID_PLAN'}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.role != 'nanny':
            return Response({'code': 'ONLY_NANNIES'}, status=status.HTTP_403_FORBIDDEN)

        delta = timezone.timedelta(days=30 if plan == 'monthly' else 365)
        sub, created = ProSubscription.objects.get_or_create(
            nanny=request.user,
            defaults={'plan': plan, 'expires_at': timezone.now() + delta, 'is_active': True},
        )
        if not created:
            # Extend existing subscription
            base = max(sub.expires_at, timezone.now())
            sub.plan       = plan
            sub.expires_at = base + delta
            sub.is_active  = True
            sub.save(update_fields=['plan', 'expires_at', 'is_active'])

        return Response({
            'is_pro':     True,
            'plan':       sub.plan,
            'expires_at': sub.expires_at,
        })


class PaymentStatusView(APIView):
    """GET /api/payments/status/<booking_id>/ — to'lov holatini tekshirish."""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary='To\'lov holati')
    def get(self, request, booking_id):
        try:
            payment = Payment.objects.get(booking_id=booking_id)
        except Payment.DoesNotExist:
            return Response({'status': 'no_payment', 'amount': 0, 'provider': None})
        # Faqat buyurtma egasi ko'ra oladi
        if payment.booking.parent != request.user and payment.booking.nanny != request.user:
            return Response({'code': 'FORBIDDEN'}, status=status.HTTP_403_FORBIDDEN)
        return Response({
            'status':   payment.status,
            'provider': payment.provider,
            'amount':   payment.amount,
            'paid_at':  payment.paid_at,
        })


# ─── Admin views ─────────────────────────────────────────────────────────────

class AdminPaymentListView(generics.ListAPIView):
    """Admin: barcha to'lovlar."""
    permission_classes = [IsAdminRole]
    serializer_class   = PaymentSerializer
    queryset           = Payment.objects.select_related('booking').all()
    filterset_fields   = ['status', 'provider']
    ordering           = ['-created_at']

    @extend_schema(summary='Admin: barcha to\'lovlar')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class AdminPaymentStatsView(APIView):
    """Admin: to'lov statistikasi. GET /api/admin/payments/stats/"""
    permission_classes = [IsAdminRole]

    @extend_schema(summary='Admin: to\'lov statistikasi')
    def get(self, request):
        from django.db.models import Sum
        total_revenue = Payment.objects.filter(status='paid').aggregate(s=Sum('amount'))['s'] or 0
        return Response({
            'total_revenue': total_revenue,
            'paid_count':    Payment.objects.filter(status='paid').count(),
            'failed_count':  Payment.objects.filter(status='failed').count(),
            'pending_count': Payment.objects.filter(status='pending').count(),
        })
