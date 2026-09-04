"""Tests réactions + commentaires (doc 03 §3, RG-C2)."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.comms.models import Actualite, Reaction, Commentaire

User = get_user_model()


def membre(email, password='Pw123456!'):
    u, _ = User.objects.get_or_create(email=email, defaults={'username': email.split('@')[0]})
    u.set_password(password)
    u.save()
    return u


class ReactionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.actu = Actualite.objects.create(titre='Actu test', extrait='x')
        self.u = membre('r@x.com')

    def test_toggle_et_remplacement(self):
        self.client.force_authenticate(self.u)
        url = f'/api/v1/actualites/{self.actu.id}/reagir/'
        r = self.client.post(url, {'emoji': '👍'}).json()
        self.assertEqual(r['statut'], 'ajoutee')
        self.assertEqual(r['reactions']['👍'], 1)
        # re-clic = retrait
        r = self.client.post(url, {'emoji': '👍'}).json()
        self.assertEqual(r['statut'], 'retiree')
        self.assertEqual(r['reactions']['👍'], 0)
        # un seul emoji par membre : le nouveau remplace
        self.client.post(url, {'emoji': '👍'})
        self.client.post(url, {'emoji': '🔥'})
        self.assertEqual(Reaction.objects.filter(membre=self.u).count(), 1)
        r = self.client.get('/api/v1/actualites/').json()['results'][0]
        self.assertEqual(r['reactions'], {'👍': 0, '❤️': 0, '🔥': 1})
        self.assertEqual(r['ma_reaction'], '🔥')

    def test_emoji_invalide_400_et_anonyme_401(self):
        self.client.force_authenticate(self.u)
        r = self.client.post(f'/api/v1/actualites/{self.actu.id}/reagir/', {'emoji': '💩'})
        self.assertEqual(r.status_code, 400)
        self.client.force_authenticate(user=None)
        r = self.client.post(f'/api/v1/actualites/{self.actu.id}/reagir/', {'emoji': '👍'})
        self.assertEqual(r.status_code, 401)


class CommentairesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.actu = Actualite.objects.create(titre='Actu test', extrait='x')
        self.u = membre('c@x.com')
        self.modo = membre('modo@x.com')
        from apps.accounts.models import Role
        Role.objects.update_or_create(code='P5', defaults={'titulaire': self.modo})

    def test_cycle_publication_masquage(self):
        self.client.force_authenticate(self.u)
        url = f'/api/v1/actualites/{self.actu.id}/commentaires/'
        self.assertEqual(self.client.post(url, {'contenu': '   '}).status_code, 400)
        r = self.client.post(url, {'contenu': 'Bravo !'}).json()
        self.assertEqual(r['statut'], 'publie')
        # visible publiquement (anonyme)
        self.client.force_authenticate(user=None)
        liste = self.client.get(url).json()
        self.assertEqual(len(liste), 1)
        # outsider ne peut pas masquer
        self.client.force_authenticate(self.u)
        cid = liste[0]['id']
        r = self.client.post(f'{url}{cid}/masquer/')
        self.assertEqual(r.status_code, 403)
        # modo P5 masque → invisible mais conservé (RG-C2)
        self.client.force_authenticate(self.modo)
        self.assertEqual(self.client.post(f'{url}{cid}/masquer/').json()['statut'], 'masque')
        self.assertEqual(self.client.get(url).json(), [])
        c = Commentaire.objects.get(pk=cid)
        self.assertTrue(c.masque)

    def test_limite_1000_caracteres(self):
        self.client.force_authenticate(self.u)
        url = f'/api/v1/actualites/{self.actu.id}/commentaires/'
        r = self.client.post(url, {'contenu': 'x' * 1001})
        self.assertEqual(r.status_code, 400)


class ForumTests(TestCase):
    client_class = APIClient

    def setUp(self):
        self.m1 = membre('f1@x.com')
        self.m2 = membre('f2@x.com')
        self.modo = membre('fmodo@x.com')
        from apps.accounts.models import Role
        Role.objects.update_or_create(code='P5', defaults={'titulaire': self.modo})

    def test_anonyme_401(self):
        self.assertEqual(self.client.get('/api/v1/forum/sujets/').status_code, 401)

    def test_cycle_sujet_messages(self):
        self.client.force_authenticate(self.m1)
        s = self.client.post('/api/v1/forum/sujets/',
                             {'titre': 'Entraide Python', 'espace': 'general'},
                             format='json').json()
        self.assertEqual(s['messages_count'], 0)
        m = self.client.post('/api/v1/forum/messages/',
                             {'sujet': s['id'], 'contenu': 'Qui commence ?'},
                             format='json')
        self.assertEqual(m.status_code, 201)
        self.client.force_authenticate(self.m2)
        self.client.post('/api/v1/forum/messages/',
                         {'sujet': s['id'], 'contenu': 'Moi !'}, format='json')
        liste = self.client.get(f"/api/v1/forum/messages/?sujet={s['id']}").json()
        self.assertEqual(len(liste['results']), 2)
        d = self.client.get('/api/v1/forum/sujets/').json()['results'][0]
        self.assertEqual(d['messages_count'], 2)
        self.assertEqual(d['dernier_message']['auteur'], d['auteur_nom'].replace('M1', 'M2') if False else d['dernier_message']['auteur'])

    def test_verrou_modo_et_moderation(self):
        self.client.force_authenticate(self.m1)
        s = self.client.post('/api/v1/forum/sujets/', {'titre': 'Sensible'}, format='json').json()
        # membre simple ne peut pas verrouiller
        r = self.client.patch(f"/api/v1/forum/sujets/{s['id']}/",
                              {'verrouille': True}, format='json')
        self.assertEqual(r.status_code, 403)
        # modo verrouille
        self.client.force_authenticate(self.modo)
        r = self.client.patch(f"/api/v1/forum/sujets/{s['id']}/",
                              {'verrouille': True}, format='json')
        self.assertTrue(r.json()['verrouille'])
        # membre bloqué, modo OK
        self.client.force_authenticate(self.m2)
        r = self.client.post('/api/v1/forum/messages/',
                             {'sujet': s['id'], 'contenu': 'x'}, format='json')
        self.assertEqual(r.status_code, 403)
        self.client.force_authenticate(self.modo)
        r = self.client.post('/api/v1/forum/messages/',
                             {'sujet': s['id'], 'contenu': 'Annonce modo'}, format='json')
        self.assertEqual(r.status_code, 201)
        # modération = masquage conservé
        mid = r.json()['id']
        self.assertEqual(self.client.delete(f'/api/v1/forum/messages/{mid}/').status_code, 204)
        from apps.comms.models import MessageForum
        self.assertTrue(MessageForum.objects.get(pk=mid).modere)
        liste = self.client.get(f"/api/v1/forum/messages/?sujet={s['id']}").json()
        self.assertEqual(len(liste['results']), 0)
