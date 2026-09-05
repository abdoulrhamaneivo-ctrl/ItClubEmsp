"""Tests du chat temps réel (WebSocket forum) — JWT, verrou, diffusion REST→WS."""
import asyncio
import json

from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
# TransactionTestCase (et non TestCase) : le consumer tourne dans un
# thread async qui ne voit pas la transaction ouverte de TestCase
# (SQLite : "database table is locked"). Recommandé par Channels.
from django.test import TransactionTestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.comms.models import MessageForum, Sujet
from config.asgi import application


def membre(email, nom='Test', prenom='T'):
    User = get_user_model()
    u, _ = User.objects.get_or_create(
        email=email,
        defaults={'username': email.split('@')[0], 'first_name': prenom,
                  'last_name': nom},
    )
    u.set_password('Pw123456!')
    u.save()
    return u


def connecter(sujet_id, token=None):
    url = f'/ws/forum/{sujet_id}/'
    if token:
        url += f'?token={token}'
    # Origin requis par AllowedHostsOriginValidator (les navigateurs
    # l'envoient toujours ; le communicateur de test non)
    return WebsocketCommunicator(
        application, url, headers=[(b'origin', b'http://localhost')])


class ChatForumTests(TransactionTestCase):
    def setUp(self):
        self.m1 = membre('chat1@x.com', nom='Chat1')
        self.m2 = membre('chat2@x.com', nom='Chat2')
        self.sujet = Sujet.objects.create(titre='Salon live', espace='general',
                                          auteur=self.m1)
        self.tok1 = str(AccessToken.for_user(self.m1))
        self.tok2 = str(AccessToken.for_user(self.m2))

    def test_sans_token_refuse_4401(self):
        async def inner():
            com = connecter(self.sujet.pk)
            connecte, code = await com.connect()
            self.assertFalse(connecte)
            self.assertEqual(code, 4401)
            await com.disconnect()
        asyncio.run(inner())

    def test_sujet_inconnu_4404(self):
        async def inner():
            com = connecter(999999, self.tok1)
            connecte, code = await com.connect()
            self.assertFalse(connecte)
            self.assertEqual(code, 4404)
            await com.disconnect()
        asyncio.run(inner())

    def test_origine_pirate_rejetee(self):
        async def inner():
            com = WebsocketCommunicator(
                application, f'/ws/forum/{self.sujet.pk}/?token={self.tok1}',
                headers=[(b'origin', b'https://evil.example')])
            connecte, _ = await com.connect()
            self.assertFalse(connecte)
            await com.disconnect()
        asyncio.run(inner())

    def test_message_diffuse_aux_deux_et_persiste(self):
        async def inner():
            c1 = connecter(self.sujet.pk, self.tok1)
            c2 = connecter(self.sujet.pk, self.tok2)
            ok1, _ = await c1.connect()
            ok2, _ = await c2.connect()
            self.assertTrue(ok1 and ok2)
            # Handshake 'connected' des deux côtés
            self.assertEqual((await c1.receive_json_from())['type'], 'connected')
            self.assertEqual((await c2.receive_json_from())['type'], 'connected')
            # m1 parle → les deux reçoivent
            await c1.send_json_to({'type': 'message', 'contenu': 'Salut le live !'})
            r1 = await c1.receive_json_from()
            r2 = await c2.receive_json_from()
            self.assertEqual(r1['type'], 'chat_message')
            self.assertEqual(r1['message']['contenu'], 'Salut le live !')
            self.assertEqual(r2['message']['contenu'], 'Salut le live !')
            self.assertEqual(r1['message']['id'], r2['message']['id'])
            await c1.disconnect()
            await c2.disconnect()
        asyncio.run(inner())
        self.assertEqual(MessageForum.objects.filter(sujet=self.sujet).count(), 1)

    def test_verrouille_bloque_mais_reste_lisible(self):
        self.sujet.verrouille = True
        self.sujet.save(update_fields=['verrouille'])

        async def inner():
            com = connecter(self.sujet.pk, self.tok1)
            ok, _ = await com.connect()
            self.assertTrue(ok)  # lecture OK
            hello = await com.receive_json_from()
            self.assertTrue(hello['verrouille'])
            await com.send_json_to({'type': 'message', 'contenu': 'bloqué ?'})
            rep = await com.receive_json_from()
            self.assertEqual(rep['type'], 'error')
            await com.disconnect()
        asyncio.run(inner())
        self.assertEqual(MessageForum.objects.filter(sujet=self.sujet).count(), 0)

    def test_ping_pong(self):
        async def inner():
            com = connecter(self.sujet.pk, self.tok1)
            ok, _ = await com.connect()
            self.assertTrue(ok)
            await com.receive_json_from()  # connected
            await com.send_json_to({'type': 'ping'})
            self.assertEqual((await com.receive_json_from())['type'], 'pong')
            await com.disconnect()
        asyncio.run(inner())

    def test_post_rest_diffuse_vers_ws(self):
        """POST /forum/messages/ → la socket ouverte reçoit le message."""
        from asgiref.sync import sync_to_async
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(self.m2)

        async def inner():
            com = connecter(self.sujet.pk, self.tok1)
            ok, _ = await com.connect()
            self.assertTrue(ok)
            await com.receive_json_from()  # connected
            # POST REST (synchrone) depuis un thread : asyncio interdit
            # les appels ORM synchrones dans le contexte async
            r = await sync_to_async(client.post, thread_sensitive=False)(
                '/api/v1/forum/messages/',
                {'sujet': self.sujet.pk, 'contenu': 'Depuis le REST'},
                format='json')
            self.assertEqual(r.status_code, 201)
            recu = await com.receive_json_from(timeout=5)
            self.assertEqual(recu['type'], 'chat_message')
            self.assertEqual(recu['message']['contenu'], 'Depuis le REST')
            await com.disconnect()
        asyncio.run(inner())
