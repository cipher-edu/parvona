from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ — O'z xabarnomalarim."""
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        # ?unread=true — faqat o'qilmaganlar
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(read_at__isnull=True)
        return qs.order_by('-created_at')

    @extend_schema(summary='Xabarnomalar ro\'yxati')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class NotificationReadView(APIView):
    """PATCH /api/notifications/<id>/read/ — Xabarnomani o'qildi deb belgilash."""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary='Xabarnomani o\'qildi deb belgilash', responses={200: NotificationSerializer})
    def patch(self, request, id):
        notif = generics.get_object_or_404(
            Notification,
            id=id,
            user=request.user,
        )
        if not notif.read_at:
            notif.read_at = timezone.now()
            notif.save(update_fields=['read_at'])
        return Response(NotificationSerializer(notif).data)


class NotificationReadAllView(APIView):
    """POST /api/notifications/read-all/ — Barchasini o'qildi deb belgilash."""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary='Barchasini o\'qildi deb belgilash', responses={200: None})
    def post(self, request):
        count = Notification.objects.filter(
            user=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({'message': f'{count} ta xabarnoma o\'qildi deb belgilandi'})


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count/"""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary='O\'qilmagan xabarnomalar soni')
    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            read_at__isnull=True,
        ).count()
        return Response({'unread_count': count})
