from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone

from core.permissions import IsAdminRole
from .models import SupportConversation, SupportMessage
from .serializers import (
    SupportConversationSerializer,
    SupportConversationListSerializer,
    SupportMessageSerializer,
)


class ConversationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/support/  — Foydalanuvchi: o'z suhbatlarini ko'rish.
                          Admin: barcha suhbatlarni ko'rish.
    POST /api/support/  — Foydalanuvchi: yangi yordam so'rovi yaratish.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return SupportConversationListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            SupportConversation.objects
            .select_related('user', 'admin')
            .prefetch_related('messages')
        )
        if user.role == 'admin':
            return qs.order_by('-updated_at')
        return qs.filter(user=user).order_by('-updated_at')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        if request.user.role == 'admin':
            return Response(
                {'code': 'FORBIDDEN', 'message': 'Admin yangi suhbat ocholmaydi'},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Foydalanuvchining ochiq suhbati allaqachon bormi?
        existing = SupportConversation.objects.filter(
            user=request.user, status='open'
        ).first()
        if existing:
            serializer = SupportConversationListSerializer(
                existing, context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        subject = request.data.get('subject', 'Yordam so\'rovi')
        conv = SupportConversation.objects.create(user=request.user, subject=subject)

        # Adminga Telegram bildirishnoma
        try:
            from apps.notifications.tasks import _tg_notify_admins
            _tg_notify_admins(
                '🆘 Yangi yordam so\'rovi',
                f'👤 {request.user.name} ({request.user.email})\n'
                f'📋 Mavzu: {subject}\n'
                f'Adminpanelda ko\'rib chiqing.',
            )
        except Exception:
            pass

        serializer = SupportConversationListSerializer(conv, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(generics.RetrieveAPIView):
    """GET /api/support/<id>/ — Suhbat tafsilotlari (xabarlar bilan)."""
    permission_classes = [IsAuthenticated]
    serializer_class   = SupportConversationSerializer

    def get_object(self):
        user = self.request.user
        conv = generics.get_object_or_404(SupportConversation, id=self.kwargs['id'])
        if user.role != 'admin' and conv.user != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        # O'qilmagan xabarlarni belgilash
        SupportMessage.objects.filter(
            conversation=conv, read_at__isnull=True,
        ).exclude(sender=user).update(read_at=timezone.now())
        return conv


class MessageListView(generics.ListAPIView):
    """GET /api/support/<id>/messages/ — Xabarlar ro'yxati."""
    permission_classes = [IsAuthenticated]
    serializer_class   = SupportMessageSerializer

    def get_queryset(self):
        user = self.request.user
        conv = generics.get_object_or_404(SupportConversation, id=self.kwargs['id'])
        if user.role != 'admin' and conv.user != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        SupportMessage.objects.filter(
            conversation=conv, read_at__isnull=True,
        ).exclude(sender=user).update(read_at=timezone.now())
        return conv.messages.select_related('sender').order_by('created_at')


class MessageSendView(APIView):
    """POST /api/support/<id>/send/ — Xabar yuborish."""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        user = request.user
        conv = generics.get_object_or_404(SupportConversation, id=id)

        if user.role != 'admin' and conv.user != user:
            return Response(
                {'code': 'FORBIDDEN', 'message': 'Kirish huquqi yo\'q'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if conv.status == 'closed':
            return Response(
                {'code': 'CLOSED', 'message': 'Suhbat yopilgan'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        text = request.data.get('text', '').strip()
        if not text:
            return Response(
                {'code': 'EMPTY', 'message': 'Xabar bo\'sh bo\'lishi mumkin emas'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Admin bo'lsa, suhbatga assign qilish
        if user.role == 'admin' and conv.admin is None:
            conv.admin = user
            conv.save(update_fields=['admin', 'updated_at'])

        message = SupportMessage.objects.create(conversation=conv, sender=user, text=text)
        SupportConversation.objects.filter(id=conv.id).update(updated_at=timezone.now())

        # Xabar qabul qiluvchiga Telegram bildirishnoma
        try:
            from apps.notifications.tasks import _tg_notify, _tg_notify_admins
            short_text = text[:150] + ('…' if len(text) > 150 else '')
            if user.role == 'admin':
                # Admin javob yozdi → foydalanuvchiga bildirish
                _tg_notify(
                    conv.user,
                    '💬 Admindan javob keldi',
                    f'📋 Mavzu: {conv.subject}\n'
                    f'💬 "{short_text}"\n\n'
                    f'Saytga o\'ting va javobni ko\'ring.',
                )
            else:
                # Foydalanuvchi yozdi → adminga bildirish
                _tg_notify_admins(
                    '💬 Yordam xabari',
                    f'👤 {user.name} ({user.email})\n'
                    f'📋 {conv.subject}\n'
                    f'💬 "{short_text}"',
                )
        except Exception:
            pass

        return Response(SupportMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class CloseConversationView(APIView):
    """POST /api/support/<id>/close/ — Suhbatni yopish (faqat admin)."""
    permission_classes = [IsAdminRole]

    def post(self, request, id):
        conv = generics.get_object_or_404(SupportConversation, id=id)
        conv.status = SupportConversation.STATUS_CLOSED
        conv.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'closed'})


class ReopenConversationView(APIView):
    """POST /api/support/<id>/reopen/ — Suhbatni qayta ochish."""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        conv = generics.get_object_or_404(SupportConversation, id=id)
        user = request.user
        if user.role != 'admin' and conv.user != user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        conv.status = SupportConversation.STATUS_OPEN
        conv.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'open'})
