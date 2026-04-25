from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from drf_spectacular.utils import extend_schema

from core.permissions import IsParent, IsAdminRole
from .models import Booking
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingStatusSerializer,
    AdminBookingSerializer,
)


class BookingListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/bookings/ — O'z buyurtmalari
    POST /api/bookings/ — Yangi buyurtma (faqat parent)
    """
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status']
    ordering_fields  = ['-created_at']
    ordering         = ['-created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsParent()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            Q(parent=user) | Q(nanny=user)
        ).select_related('parent', 'nanny').order_by('-created_at')

    @extend_schema(summary='Buyurtmalar ro\'yxati')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary='Yangi buyurtma yaratish')
    def post(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save(_parent=request.user)

        # Async notification
        from apps.notifications.tasks import send_booking_notification
        send_booking_notification.delay(str(booking.id), 'new_booking')

        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )


class BookingDetailView(generics.RetrieveAPIView):
    """GET /api/bookings/<id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = BookingSerializer
    lookup_field       = 'id'

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            Q(parent=user) | Q(nanny=user)
        ).select_related('parent', 'nanny')

    @extend_schema(summary='Buyurtma detail')
    def get(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class BookingStatusView(APIView):
    """
    PATCH /api/bookings/<id>/status/
    State machine orqali holatni o'zgartirish.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Buyurtma holatini o\'zgartirish',
        request=BookingStatusSerializer,
        responses={200: BookingSerializer},
    )
    def patch(self, request, id):
        booking = generics.get_object_or_404(
            Booking.objects.select_related('parent', 'nanny'),
            id=id
        )

        # Foydalanuvchi ushbu buyurtmaga aloqador ekanligini tekshirish
        user = request.user
        if user.role != 'admin' and booking.parent != user and booking.nanny != user:
            return Response(
                {'code': 'FORBIDDEN', 'message': 'Bu buyurtmaga kirish huquqi yo\'q'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BookingStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status    = serializer.validated_data['status']
        cancel_reason = serializer.validated_data.get('cancel_reason', '')

        if new_status == 'cancelled' and cancel_reason:
            booking.cancel_reason = cancel_reason
            booking.save(update_fields=['cancel_reason'])

        booking.transition_to(new_status, request.user)

        # Async notification
        from apps.notifications.tasks import send_booking_notification
        send_booking_notification.delay(str(booking.id), f'booking_{new_status}')

        return Response(BookingSerializer(booking).data)


# ─── Admin views ─────────────────────────────────────────────────────────────

class AdminBookingListView(generics.ListAPIView):
    """Admin: barcha buyurtmalar."""
    permission_classes = [IsAdminRole]
    serializer_class   = AdminBookingSerializer
    queryset           = Booking.objects.select_related('parent', 'nanny').all()
    filter_backends    = [DjangoFilterBackend, OrderingFilter]
    filterset_fields   = ['status']
    ordering           = ['-created_at']

    @extend_schema(summary='Admin: barcha buyurtmalar')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class AdminRecentBookingsView(generics.ListAPIView):
    """Admin: so'nggi buyurtmalar. GET /api/admin/bookings/recent/"""
    permission_classes = [IsAdminRole]
    serializer_class   = AdminBookingSerializer

    def get_queryset(self):
        return Booking.objects.select_related('parent', 'nanny').order_by('-created_at')[:10]

    @extend_schema(summary='Admin: so\'nggi buyurtmalar')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class AdminResolveDisputeView(APIView):
    """Admin: shikoyatni hal qilish."""
    permission_classes = [IsAdminRole]

    @extend_schema(summary='Admin: shikoyatni hal qilish')
    def patch(self, request, id):
        booking = generics.get_object_or_404(Booking, id=id, status='disputed')
        booking.transition_to('resolved', request.user)

        from apps.notifications.tasks import send_booking_notification
        send_booking_notification.delay(str(booking.id), 'booking_resolved')

        return Response({'message': 'Shikoyat hal etildi', 'data': BookingSerializer(booking).data})
