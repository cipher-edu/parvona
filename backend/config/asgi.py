import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

django_asgi_app = get_asgi_application()

from apps.chat.routing         import websocket_urlpatterns as chat_ws          # noqa: E402
from apps.support.routing      import websocket_urlpatterns as support_ws       # noqa: E402
from apps.notifications.routing import websocket_urlpatterns as notifications_ws # noqa: E402

application = ProtocolTypeRouter({
    'http':      django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(chat_ws + support_ws + notifications_ws)
    ),
})
