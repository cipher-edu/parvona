from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsNanny, IsAdminRole
from core.utils.geo import filter_by_radius
from core.utils.cache import invalidate_nanny_cache
from .models import NannyProfile, NannyAvailability
from .serializers import (
    NannyProfileSerializer,
    NannyProfileDetailSerializer,
    NannyProfileWriteSerializer,
    AdminVerifyNannySerializer,
    NannyAvailabilitySerializer,
    NannyAvailabilityWriteSerializer,
)
from .filters import NannyFilter


class NannyListView(generics.ListAPIView):
    """
    GET /api/nannies/
    Barcha tasdiqlangan va faol enagalar ro'yxati.
    Filter, qidiruv, geo-radius, cache qo'llab-quvvatlanadi.
    """
    permission_classes = []   # Public endpoint
    serializer_class   = NannyProfileSerializer
    filterset_class    = NannyFilter
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields      = ['location_name', 'user__name']
    ordering_fields    = ['rating', 'hourly_rate', 'experience', 'created_at']
    ordering           = ['-rating']

    def get_queryset(self):
        return NannyProfile.objects.filter(
            status='active',
            is_verified=True,
        ).select_related('user').only(
            'id', 'age', 'experience', 'hourly_rate', 'skills',
            'location_name', 'latitude', 'longitude',
            'rating', 'reviews_count', 'is_verified', 'status', 'created_at',
            'user__id', 'user__name', 'user__photo',
        )

    @extend_schema(
        summary='Enagalar ro\'yxati',
        parameters=[
            OpenApiParameter('lat',       float,  description='Kenglik (geo qidiruv)'),
            OpenApiParameter('lon',       float,  description='Uzunlik (geo qidiruv)'),
            OpenApiParameter('radius_km', float,  description='Radius km da (default 20)'),
            OpenApiParameter('min_rate',  int,    description='Minimal soatlik narx'),
            OpenApiParameter('max_rate',  int,    description='Maksimal soatlik narx'),
            OpenApiParameter('skill',     str,    description='Ko\'nikma kodi'),
        ]
    )
    def list(self, request, *args, **kwargs):
        cache_key = f'nannies:{request.GET.urlencode()}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        queryset = self.filter_queryset(self.get_queryset())

        # Geo filter — agar lat/lon berilgan bo'lsa
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        if lat and lon:
            radius_km = float(request.query_params.get('radius_km', 20))
            queryset  = filter_by_radius(queryset, float(lat), float(lon), radius_km)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response   = self.get_paginated_response(serializer.data)
            # response.data — paginated dict: {count, next, previous, results}
            cache.set(cache_key, response.data, timeout=300)
            return response

        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, timeout=300)
        return Response(serializer.data)


class NannyDetailView(generics.RetrieveAPIView):
    """GET /api/nannies/<id>/"""
    permission_classes = []
    serializer_class   = NannyProfileDetailSerializer
    queryset           = NannyProfile.objects.select_related('user')
    lookup_field       = 'id'

    @extend_schema(summary='Enaga profili detail')
    def retrieve(self, request, *args, **kwargs):
        cache_key = f'nanny:detail:{kwargs["id"]}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        response = super().retrieve(request, *args, **kwargs)
        # response.data — serializer dict (renderer wraps it later)
        cache.set(cache_key, response.data, timeout=600)
        return response


class MyNannyProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT/PATCH /api/nannies/me/
    Enaga o'z profilini boshqaradi.
    """
    permission_classes = [IsNanny]

    def get_object(self):
        profile, _ = NannyProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'age':           20,
                'experience':    0,
                'hourly_rate':   30_000,
                'bio':           '',
                'location_name': '',
                'skills':        [],
            }
        )
        return profile

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return NannyProfileWriteSerializer
        return NannyProfileDetailSerializer

    def perform_update(self, serializer):
        # serializer.save() returns the updated profile instance
        profile = serializer.save()
        invalidate_nanny_cache(str(profile.id))

    @extend_schema(summary='O\'z enaga profilim')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary='Profilni yangilash')
    def patch(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)


# ─── Admin views ─────────────────────────────────────────────────────────────

class AdminNannyListView(generics.ListAPIView):
    """Admin: barcha enaga profillari."""
    permission_classes = [IsAdminRole]
    serializer_class   = NannyProfileDetailSerializer
    queryset           = NannyProfile.objects.select_related('user').all()
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ['is_verified', 'status']
    search_fields      = ['user__name', 'user__email', 'location_name']
    ordering           = ['-created_at']

    @extend_schema(summary='Admin: barcha enagalar')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class AdminVerifyNannyView(APIView):
    """Admin: enagani tasdiqlash / tasdiqni olib tashlash."""
    permission_classes = [IsAdminRole]

    @extend_schema(
        summary='Enagani tasdiqlash',
        request=AdminVerifyNannySerializer,
        responses={200: NannyProfileDetailSerializer},
    )
    def patch(self, request, id):
        profile    = generics.get_object_or_404(NannyProfile, id=id)
        serializer = AdminVerifyNannySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile.is_verified = serializer.validated_data['is_verified']
        profile.verified_by = request.user if profile.is_verified else None
        profile.verified_at = timezone.now() if profile.is_verified else None
        profile.save(update_fields=['is_verified', 'verified_by', 'verified_at'])

        invalidate_nanny_cache(str(profile.id))

        # Enagaga Telegram bildirishnoma
        try:
            from apps.notifications.tasks import _tg_notify
            if profile.is_verified:
                _tg_notify(
                    profile.user,
                    '✅ Profilingiz tasdiqlandi!',
                    f'Salom, *{profile.user.name}*!\n'
                    f'Sizning Parvona enaga profilingiz admin tomonidan tasdiqlandi.\n'
                    f'Endi ota-onalar sizni ko\'rishi mumkin. 🎉',
                )
            else:
                _tg_notify(
                    profile.user,
                    '⚠️ Profil tasdiqdan o\'chirildi',
                    f'Salom, *{profile.user.name}*!\n'
                    f'Sizning profil tasdiqingiz olib tashlandi.\n'
                    f'Batafsil ma\'lumot uchun saytga kiring yoki admin bilan bog\'laning.',
                )
        except Exception:
            pass

        action = 'tasdiqlandi' if profile.is_verified else 'tasdiq olib tashlandi'
        return Response({
            'message': f'Enaga {action}',
            'data':    NannyProfileDetailSerializer(profile).data,
        })


class NannyAvailabilityView(APIView):
    """
    GET  /api/nannies/me/availability/?year=2026&month=4
    POST /api/nannies/me/availability/  — bulk upsert {items:[{date,status},...]}
    """
    permission_classes = [IsNanny]

    def get(self, request):
        year  = request.query_params.get('year',  timezone.now().year)
        month = request.query_params.get('month', timezone.now().month)
        qs = NannyAvailability.objects.filter(
            nanny=request.user,
            date__year=year,
            date__month=month,
        )
        return Response(NannyAvailabilitySerializer(qs, many=True).data)

    def post(self, request):
        ser = NannyAvailabilityWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        items = ser.validated_data['items']
        for item in items:
            if item['status'] == 'available':
                # delete row — available is the default (no row = available)
                NannyAvailability.objects.filter(
                    nanny=request.user, date=item['date']
                ).delete()
            else:
                NannyAvailability.objects.update_or_create(
                    nanny=request.user,
                    date=item['date'],
                    defaults={'status': item['status']},
                )
        return Response({'saved': len(items)})


class NannyAvailabilityPublicView(generics.ListAPIView):
    """
    GET /api/nannies/<id>/availability/?year=2026&month=4
    Parent uchun — faqat band/tatil kunlar qaytariladi.
    """
    permission_classes = []
    serializer_class   = NannyAvailabilitySerializer

    def get_queryset(self):
        nanny_id = self.kwargs['id']
        year  = self.request.query_params.get('year',  timezone.now().year)
        month = self.request.query_params.get('month', timezone.now().month)
        return NannyAvailability.objects.filter(
            nanny_id=nanny_id,
            date__year=year,
            date__month=month,
        )


class AdminVerifyNannyPostView(APIView):
    """Admin: enagani tasdiqlash. POST /api/admin/nannies/<id>/verify/"""
    permission_classes = [IsAdminRole]

    @extend_schema(summary='Enagani tasdiqlash (POST)')
    def post(self, request, id):
        profile = generics.get_object_or_404(NannyProfile, id=id)
        profile.is_verified = True
        profile.verified_by = request.user
        profile.verified_at = timezone.now()
        profile.save(update_fields=['is_verified', 'verified_by', 'verified_at'])
        invalidate_nanny_cache(str(profile.id))
        try:
            from apps.notifications.tasks import _tg_notify
            _tg_notify(
                profile.user,
                '✅ Profilingiz tasdiqlandi!',
                f'Salom, *{profile.user.name}*!\n'
                f'Sizning Parvona enaga profilingiz tasdiqlandi.\n'
                f'Endi ota-onalar sizni ko\'rishi mumkin. 🎉',
            )
        except Exception:
            pass
        return Response({'message': 'Enaga tasdiqlandi', 'is_verified': True})


class AdminUnverifyNannyView(APIView):
    """Admin: enaga tasdiqlashni bekor qilish. POST /api/admin/nannies/<id>/unverify/"""
    permission_classes = [IsAdminRole]

    @extend_schema(summary='Enaga tasdiqlashini bekor qilish (POST)')
    def post(self, request, id):
        profile = generics.get_object_or_404(NannyProfile, id=id)
        profile.is_verified = False
        profile.verified_by = None
        profile.verified_at = None
        profile.save(update_fields=['is_verified', 'verified_by', 'verified_at'])
        invalidate_nanny_cache(str(profile.id))
        try:
            from apps.notifications.tasks import _tg_notify
            _tg_notify(
                profile.user,
                '⚠️ Profil tasdiqdan o\'chirildi',
                f'Salom, *{profile.user.name}*!\n'
                f'Sizning profil tasdiqingiz olib tashlandi.\n'
                f'Batafsil ma\'lumot uchun admin bilan bog\'laning.',
            )
        except Exception:
            pass
        return Response({'message': 'Enaga tasdiqlanmagan deb belgilandi', 'is_verified': False})
