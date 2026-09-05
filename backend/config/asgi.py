"""
ASGI + WebSocket (chat forum temps réel, Channels 4).
HTTP reste servi par Django classique ; /ws/* passe par le routeur Channels.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from apps.chat.routing import CorsOriginValidator, websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    # HTTP classique (DRF, admin, statiques)
    'http': django_asgi_app,
    # WebSocket : /ws/forum/<sujet_id>/ — origines = CORS HTTP
    'websocket': CorsOriginValidator(
        AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
    ),
})
