import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket — real-time bildirishnomalar.
    URL: ws/notifications/

    Auth flow (ChatConsumer bilan bir xil):
    1. Client ulanadi
    2. {"type": "auth", "token": "<jwt>"} yuboradi
    3. Server {"type": "auth_ok", "unread_count": N} qaytaradi
    4. Keyin {"type": "notification", ...} push xabarlar keladi
    """

    async def connect(self):
        self.user = None
        await self.accept()

    async def disconnect(self, close_code):
        if self.user is not None:
            await self.channel_layer.group_discard(
                f'notifications_{self.user.id}', self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        msg_type = data.get('type')

        if self.user is None:
            if msg_type != 'auth':
                await self.close(code=4001)
                return
            user = await self._get_user(data.get('token', ''))
            if user is None:
                await self.send(text_data=json.dumps({'type': 'auth_error'}))
                await self.close(code=4001)
                return
            self.user = user
            await self.channel_layer.group_add(
                f'notifications_{user.id}', self.channel_name
            )
            unread = await self._unread_count(user)
            await self.send(text_data=json.dumps({
                'type': 'auth_ok',
                'unread_count': unread,
            }))
            return

        # Mark notification as read
        if msg_type == 'mark_read':
            notif_id = data.get('notification_id')
            if notif_id:
                await self._mark_read(notif_id, self.user)

    # ── Channel layer handlers ──────────────────────────────────────────────

    async def notification_push(self, event):
        """Django signals dan kelgan push xabar."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'id':         event['id'],
            'notif_type': event['notif_type'],
            'title':      event['title'],
            'body':       event['body'],
            'data':       event.get('data', {}),
            'created_at': event['created_at'],
        }))

    async def unread_count(self, event):
        """Unread count yangilanishi."""
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': event['count'],
        }))

    # ── DB helpers ──────────────────────────────────────────────────────────

    @database_sync_to_async
    def _get_user(self, token_str: str):
        try:
            token = AccessToken(token_str)
            return User.objects.get(id=token['user_id'])
        except Exception:
            return None

    @database_sync_to_async
    def _unread_count(self, user) -> int:
        from apps.notifications.models import Notification
        return Notification.objects.filter(user=user, read_at__isnull=True).count()

    @database_sync_to_async
    def _mark_read(self, notif_id: str, user):
        from apps.notifications.models import Notification
        from django.utils import timezone
        Notification.objects.filter(id=notif_id, user=user, read_at__isnull=True).update(
            read_at=timezone.now()
        )
