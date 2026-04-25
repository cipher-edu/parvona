from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationListSerializer,
    MessageSerializer, MessageCreateSerializer,
)


class ConversationListView(generics.ListAPIView):
    """GET /api/chat/ — Foydalanuvchining barcha suhbatlari."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ConversationListSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            Conversation.objects
            .filter(Q(booking__parent=user) | Q(booking__nanny=user))
            .select_related('booking', 'booking__parent', 'booking__nanny')
            .prefetch_related('messages')
            .order_by('-updated_at')
        )


class ConversationView(generics.RetrieveAPIView):
    """GET /api/chat/<booking_id>/ — Suhbatni olish (yaratish ham)."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ConversationSerializer

    def get_object(self):
        from apps.bookings.models import Booking
        booking = generics.get_object_or_404(Booking, id=self.kwargs['booking_id'])

        user = self.request.user
        if user.role != 'admin' and booking.parent != user and booking.nanny != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()

        conv, _ = Conversation.objects.get_or_create(booking=booking)
        return conv

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class MessageListView(generics.ListAPIView):
    """GET /api/chat/<booking_id>/messages/ — Xabarlar ro'yxati."""
    permission_classes = [IsAuthenticated]
    serializer_class   = MessageSerializer

    def get_queryset(self):
        from apps.bookings.models import Booking
        booking = generics.get_object_or_404(Booking, id=self.kwargs['booking_id'])

        user = self.request.user
        if user.role != 'admin' and booking.parent != user and booking.nanny != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()

        conv, _ = Conversation.objects.get_or_create(booking=booking)

        # O'qilmagan xabarlarni o'qildi deb belgilash
        Message.objects.filter(
            conversation=conv, read_at__isnull=True,
        ).exclude(sender=user).update(read_at=timezone.now())

        return conv.messages.select_related('sender').order_by('created_at')


class MessageCreateView(generics.CreateAPIView):
    """POST /api/chat/<booking_id>/messages/ — Xabar yuborish."""
    permission_classes = [IsAuthenticated]
    serializer_class   = MessageCreateSerializer

    def create(self, request, *args, **kwargs):
        from apps.bookings.models import Booking
        booking = generics.get_object_or_404(Booking, id=kwargs['booking_id'])

        user = request.user
        if booking.parent != user and booking.nanny != user:
            return Response(
                {'code': 'FORBIDDEN', 'message': 'Kirish huquqi yo\'q'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conv, _ = Conversation.objects.get_or_create(booking=booking)
        message = Message.objects.create(
            conversation=conv,
            sender=request.user,
            text=serializer.validated_data['text'],
        )

        # Kelgan xabarlarni o'qildi deb belgilash
        Message.objects.filter(
            conversation=conv, read_at__isnull=True,
        ).exclude(sender=request.user).update(read_at=timezone.now())

        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
