import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class SupportChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer — admin ↔ foydalanuvchi support chati.
    URL: ws/support/<conversation_id>/

    Auth flow (chat.consumers bilan bir xil):
    1. Client ulanadi
    2. Client {"type": "auth", "token": "<jwt>"} yuboradi
    3. Server tekshiradi va {"type": "auth_ok"} yoki yopadi
    4. Shundan keyin {"text": "..."} xabarlari qabul qilinadi
    """

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group = f'support_{self.conversation_id}'
        self.user = None
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

        # ── Autentifikatsiya ────────────────────────────────────────────────────
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

            if not await self._can_access(self.conversation_id, user):
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

        result = await self._save_message(self.conversation_id, self.user, text)
        if result is None:
            await self.send(text_data=json.dumps({'type': 'error', 'reason': 'conversation_closed'}))
            return

        message, updated_at = result

        await self.channel_layer.group_send(
            self.room_group,
            {
                'type':        'support_message',
                'message_id':  str(message.id),
                'sender_id':   str(self.user.id),
                'sender_name': self.user.name,
                'sender_role': self.user.role,
                'text':        text,
                'created_at':  message.created_at.isoformat(),
            }
        )

    async def support_message(self, event):
        await self.send(text_data=json.dumps({
            'type':        'message',
            'message_id':  event['message_id'],
            'sender_id':   event['sender_id'],
            'sender_name': event['sender_name'],
            'sender_role': event['sender_role'],
            'text':        event['text'],
            'created_at':  event['created_at'],
        }))

    @database_sync_to_async
    def _get_user_from_token(self, token_str: str):
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
    def _can_access(self, conversation_id: str, user) -> bool:
        from .models import SupportConversation
        try:
            conv = SupportConversation.objects.get(id=conversation_id)
            return user.role == 'admin' or conv.user_id == user.id
        except SupportConversation.DoesNotExist:
            return False

    @database_sync_to_async
    def _save_message(self, conversation_id: str, sender, text: str):
        from .models import SupportConversation, SupportMessage
        try:
            conv = SupportConversation.objects.get(id=conversation_id)
        except SupportConversation.DoesNotExist:
            return None

        if conv.status == 'closed':
            return None

        # Admin bo'lsa, assign qilish
        if sender.role == 'admin' and conv.admin is None:
            conv.admin = sender

        message = SupportMessage.objects.create(conversation=conv, sender=sender, text=text)
        conv.updated_at = message.created_at
        conv.save(update_fields=['admin', 'updated_at'])
        return message, conv.updated_at
