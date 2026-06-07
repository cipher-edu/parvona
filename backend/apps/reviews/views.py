from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django.db.models import Q
from drf_spectacular.utils import extend_schema

from apps.bookings.models import Booking
from apps.bookings.serializers import BookingSerializer
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer


class ReviewListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reviews/  — Mening sharhlarim (berganlarim + olganlarim)
    POST /api/reviews/  — Yangi sharh qoldirish (faqat completed booking uchun)
    """
    permission_classes = [IsAuthenticated]
    filter_backends    = [OrderingFilter]
    ordering_fields    = ['-created_at', 'rating']
    ordering           = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        user = self.request.user
        # O'zim yozganlar yoki menga yozilganlar
        return Review.objects.filter(
            Q(author=user) | Q(target=user)
        ).select_related('author', 'target', 'booking').order_by('-created_at')

    @extend_schema(summary='Sharhlar ro\'yxati')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary='Sharh qoldirish',
        request=ReviewCreateSerializer,
        responses={201: ReviewSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = ReviewCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        try:
            from apps.notifications.tasks import _tg_notify
            stars = '⭐' * review.rating
            author_role = 'Ota-ona' if review.author.role == 'parent' else 'Enaga'
            _tg_notify(
                review.target,
                f'⭐ Yangi sharh — {stars}',
                f'\U0001f464 {author_role}: *{review.author.name}*\n'
                f'⭐ Baho: {review.rating}/5  {stars}\n'
                + (f'\U0001f4ac "{review.text[:200]}"' if review.text else ''),
            )
        except Exception:
            pass

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class NannyReviewListView(generics.ListAPIView):
    """GET /api/nannies/<nanny_id>/reviews/ — Enaga sharhlari."""
    permission_classes = []  # Public
    serializer_class   = ReviewSerializer
    filter_backends    = [OrderingFilter]
    ordering_fields    = ['-created_at', 'rating']
    ordering           = ['-created_at']

    def get_queryset(self):
        return Review.objects.filter(
            target_id=self.kwargs['nanny_id']
        ).select_related('author', 'target', 'booking')

    @extend_schema(summary='Enaga sharhlari ro\'yxati')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class MyReviewsView(generics.ListAPIView):
    """GET /api/reviews/my/ — O'zim qoldirgan sharhlar."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            author=self.request.user
        ).select_related('author', 'target', 'booking')


class ReceivedReviewsView(generics.ListAPIView):
    """GET /api/reviews/received/ — Menga qoldirilgan sharhlar."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            target=self.request.user
        ).select_related('author', 'target', 'booking')


class PendingReviewsView(generics.ListAPIView):
    """
    GET /api/reviews/pending/
    Foydalanuvchi sharh qoldirishi mumkin bo\'lgan yakunlangan bronlar.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        reviewed_booking_ids = Review.objects.filter(
            author=user
        ).values_list('booking_id', flat=True)

        return Booking.objects.filter(
            Q(parent=user) | Q(nanny=user),
            status='completed',
        ).exclude(
            id__in=reviewed_booking_ids
        ).select_related('parent', 'nanny').order_by('-completed_at')

    @extend_schema(summary='Sharh kutayotgan bronlar')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class LatestReviewsView(generics.ListAPIView):
    """GET /api/reviews/latest/ — Oxirgi sharhlar (public)."""
    permission_classes = []
    serializer_class   = ReviewSerializer

    def get_queryset(self):
        return Review.objects.select_related(
            'author', 'target', 'booking'
        ).order_by('-created_at')[:20]

    @extend_schema(summary='Oxirgi sharhlar (public)')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
