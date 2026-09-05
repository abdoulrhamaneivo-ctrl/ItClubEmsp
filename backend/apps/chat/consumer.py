"""Consumer WebSocket du chat forum — JWT à la connexion, persistance en base.

Protocole :
- Client : ws(s)://…/ws/forum/<sujet_id>/?token=<access JWT>
- Serveur → client : {type: 'connected', sujet, verrouille}
- Serveur → tous : {type: 'chat_message', message: {id, sujet, auteur_nom, contenu, cree_le}}
- Serveur → l'auteur : {type: 'error', detail: …} si refus (verrouillé, vide, trop long)
- Ping/Pong : {type: 'ping'} → {type: 'pong'} (keepalive proxy)
- Fermetures : 4401 = sans token/invalide, 4404 = sujet inconnu.
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

MAX_LONGUEUR = 2000


class ChatForumConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.sujet_id = self.scope['url_route']['kwargs']['sujet_id']
        self.group = f'forum_{self.sujet_id}'
        self.user = await self._authentifier()
        if self.user is None:
            await self.close(code=4401)
            return
        self.scope['user'] = self.user
        verrouille = await self._sujet_verrouille()
        if verrouille is None:
            await self.close(code=4404)
            return
        self.verrouille = verrouille
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.send_json({'type': 'connected', 'sujet': int(self.sujet_id),
                              'verrouille': self.verrouille})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Keepalive proxy (Render/Netlify coupent les sockets oisives)
        if content.get('type') == 'ping':
            await self.send_json({'type': 'pong'})
            return
        if content.get('type') != 'message':
            return
        texte = (content.get('contenu') or '').strip()
        if not texte:
            await self._erreur('Message vide.')
            return
        if len(texte) > MAX_LONGUEUR:
            await self._erreur(f'Message trop long ({MAX_LONGUEUR} caractères max).')
            return
        if self.verrouille:
            await self._erreur('Sujet verrouillé — lecture seule.')
            return
        message = await self._enregistrer(texte)
        if message is None:
            await self._erreur('Sujet verrouillé — lecture seule.')
            return
        await self.channel_layer.group_send(self.group, {
            'type': 'chat_message',
            'message': message,
        })

    # ── Handlers de diffusion ────────────────────────────────
    async def chat_message(self, event):
        await self.send_json({'type': 'chat_message', 'message': event['message']})

    async def message_retire(self, event):
        await self.send_json({'type': 'message_retire',
                              'message_id': event['message_id']})

    async def _erreur(self, detail):
        await self.send_json({'type': 'error', 'detail': detail})

    # ── Base de données (async) ──────────────────────────────
    @database_sync_to_async
    def _authentifier(self):
        """JWT passé en query param ?token= — le navigateur ne peut pas
        mettre d'en-tête Authorization sur un WebSocket."""
        try:
            qs = parse_qs(self.scope['query_string'].decode())
            brut = (qs.get('token') or [''])[0]
            token = AccessToken(brut)
            user_id = token['user_id']
        except (TokenError, KeyError, IndexError, AttributeError):
            return None
        from django.contrib.auth import get_user_model
        try:
            return get_user_model().objects.get(pk=user_id, is_active=True)
        except get_user_model().DoesNotExist:
            return None

    @database_sync_to_async
    def _sujet_verrouille(self):
        from apps.comms.models import Sujet
        try:
            return Sujet.objects.filter(pk=self.sujet_id).values_list('verrouille', flat=True).first()
        except (ValueError, TypeError):
            return None

    @database_sync_to_async
    def _enregistrer(self, texte):
        """Persiste le message ; retourne None si le sujet vient d'être verrouillé."""
        from apps.comms.models import Sujet, MessageForum
        verrou = Sujet.objects.filter(pk=self.sujet_id).values_list('verrouille', flat=True).first()
        if verrou:
            self.verrouille = True
            return None
        msg = MessageForum.objects.create(sujet_id=self.sujet_id, auteur=self.user,
                                          contenu=texte[:MAX_LONGUEUR])
        Sujet.objects.filter(pk=self.sujet_id).update(
            derniere_activite=msg.cree_le)
        return {'id': msg.id, 'sujet': int(self.sujet_id),
                'auteur_nom': self.user.get_full_name() or self.user.username,
                'contenu': msg.contenu, 'cree_le': msg.cree_le.isoformat()}
