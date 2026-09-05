"""Chat temps réel du forum (bonus doc 00) : WebSocket par sujet."""
from urllib.parse import urlparse

from django.conf import settings
from django.urls import re_path

from . import consumer

websocket_urlpatterns = [
    re_path(r'^ws/forum/(?P<sujet_id>\d+)/$', consumer.ChatForumConsumer.as_asgi()),
]


class CorsOriginValidator:
    """Origines autorisées = ALLOWED_HOSTS + hôtes de CORS_ALLOWED_ORIGINS.

    AllowedHostsOriginValidator (Channels) n'accepte que ALLOWED_HOSTS :
    en prod, le front Vercel serait rejeté. Ici on aligne sur la même
    liste que le CORS HTTP. Sans Origin (scripts, tests) : on laisse
    passer — l'auth JWT reste obligatoire dans tous les cas.
    """

    def __init__(self, app):
        self.app = app
        hotes = set(h.strip() for h in settings.ALLOWED_HOSTS if h.strip())
        for origine in getattr(settings, 'CORS_ALLOWED_ORIGINS', []) or []:
            try:
                nom = urlparse(origine).hostname
            except Exception:
                nom = None
            if nom:
                hotes.add(nom)
        self.hotes = hotes

    async def __call__(self, scope, receive, send):
        if scope.get('type') == 'websocket':
            entetes = dict(scope.get('headers', []) or [])
            brut = (entetes.get(b'origin') or b'').decode('latin-1')
            hote = urlparse(brut).hostname if brut else None
            if hote and hote not in self.hotes:
                await send({'type': 'websocket.close'})
                return
        await self.app(scope, receive, send)
