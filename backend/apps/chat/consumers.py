import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer — real-time chat.
    URL: ws/chat/<booking_id>/

    Auth flow (token URL-da emas, xabar orqali):
    1. Client ulanadi (hech qanday token yo'q)
    2. Server ulanishni qabul qiladi (hali autentifikatsiyasiz)
    3. Client birinchi xabar sifatida {"type": "auth", "token": "<jwt>"} yuboradi
    4. Server tokenni tekshiradi va {"type": "auth_ok"} qaytaradi
    5. Shundan keyin oddiy {"text": "..."} xabarlari qabul qilinadi
    """

    async def connect(self):
        self.booking_id = self.scope['url_route']['kwargs']['booking_id']
        self.room_group = f'chat_{self.booking_id}'
        self.user = None  # Auth bo'lgunga qadar None
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group') and self.user is not None:
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        msg_type = data.get('type')

        # ── Autentifikatsiya xabari ─────────────────────────────────────────────
        if self.user is None:
            if msg_type != 'auth':
                await self.close(code=4001)
                return

            token_str = data.get('token', '')
            user = await self._get_user_from_token(token_str)
            if user is None:
                await self.send(text_data=json.dumps({'type': 'auth_error', 'reason': 'invalid_token'}))
                await self.close(code=4001)
                return

            if not await self._can_access(self.booking_id, user):
                await self.send(text_data=json.dumps({'type': 'auth_error', 'reason': 'forbidden'}))
                await self.close(code=4003)
                return

            self.user = user
            await self.channel_layer.group_add(self.room_group, self.channel_name)
            await self.send(text_data=json.dumps({'type': 'auth_ok'}))
            return

        # ── Oddiy xabar ────────────────────────────────────────────────────────
        text = data.get('text', '').strip()
        if not text:
            return

        message = await self._save_message(self.booking_id, self.user, text)

        await self.channel_layer.group_send(
            self.room_group,
            {
                'type':        'chat_message',
                'message_id':  str(message.id),
                'sender_id':   str(self.user.id),
                'sender_name': self.user.name,
                'text':        text,
                'created_at':  message.created_at.isoformat(),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type':        'message',
            'message_id':  event['message_id'],
            'sender_id':   event['sender_id'],
            'sender_name': event['sender_name'],
            'text':        event['text'],
            'created_at':  event['created_at'],
        }))

    @database_sync_to_async
    def _get_user_from_token(self, token_str: str):
        """JWT access token orqali foydalanuvchini topish."""
        from rest_framework_simplejwt.tokens import AccessToken
        from apps.users.models import User

        if not token_str:
            return None
        try:
            token   = AccessToken(token_str)
            user_id = token['user_id']
            return User.objects.get(id=user_id, is_active=True)
        except Exception:
            return None

    @database_sync_to_async
    def _can_access(self, booking_id: str, user) -> bool:
        from apps.bookings.models import Booking
        from django.db.models import Q
        return Booking.objects.filter(
            Q(parent=user) | Q(nanny=user),
            id=booking_id,
        ).exists()

    @database_sync_to_async
    def _save_message(self, booking_id: str, sender, text: str):
        from apps.bookings.models import Booking
        from .models import Conversation, Message
        booking = Booking.objects.get(id=booking_id)
        conv, _ = Conversation.objects.get_or_create(booking=booking)
        return Message.objects.create(conversation=conv, sender=sender, text=text)
