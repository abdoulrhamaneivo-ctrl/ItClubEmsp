"""Tests des règles adhésion + espace membre (doc 02 D2, doc 06 Phase 2)."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.accounts.models import Role, Cellule, Candidature
from apps.notifications.models import Notification

User = get_user_model()


def membre(email='membre@x.com', password='Pw123456!'):
    u, _ = User.objects.get_or_create(email=email, defaults={'username': email.split('@')[0]})
    u.set_password(password)
    u.save()
    return u


def donner_role(user, code):
    Role.objects.update_or_create(code=code, defaults={'titulaire': user})


class CandidatureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cell = Cellule.objects.create(nom='Cellule Web', slug='web')

    def test_creation_publique_et_confirmation_tracee(self):
        r = self.client.post('/api/v1/auth/register-candidature',
                             {'donnees': {'prenom': 'A', 'nom': 'B', 'email': 'ab@x.com'},
                              'cellules_souhaitees': [self.cell.id]}, format='json')
        self.assertEqual(r.status_code, 201)
        c = Candidature.objects.get()
        self.assertEqual(c.statut, 'en_attente')
        self.assertEqual(list(c.cellules_souhaitees.all()), [self.cell])
        # log-only sans clé Resend : tracé, pas d'envoi
        n = Notification.objects.filter(type='candidature').first()
        self.assertIsNotNone(n)
        self.assertFalse(n.envoye)

    def test_rg_a1_doublon_refuse(self):
        payload = {'donnees': {'email': 'AB@x.com'}, 'cellules_souhaitees': []}
        self.assertEqual(self.client.post(
            '/api/v1/auth/register-candidature', payload, format='json').status_code, 201)
        r = self.client.post('/api/v1/auth/register-candidature',
                             {'donnees': {'email': 'ab@X.com'}, 'cellules_souhaitees': []},
                             format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('déjà en cours', r.json()['detail'])

    def test_validation_cree_compte_et_cellules(self):
        sg = membre('sg@x.com')
        donner_role(sg, 'P3')
        self.client.post('/api/v1/auth/register-candidature',
                         {'donnees': {'prenom': 'New', 'nom': 'Membre', 'email': 'new@x.com'},
                          'cellules_souhaitees': [self.cell.id]}, format='json')
        c = Candidature.objects.get()
        self.client.force_authenticate(sg)
        r = self.client.post(f'/api/v1/candidatures/{c.id}/valider/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['statut'], 'validee')
        u = User.objects.get(email='new@x.com')
        self.assertTrue(u.cellules.filter(cellule=self.cell).exists())
        self.assertFalse(u.has_usable_password())  # lien magique / reset à venir

    def test_validation_sans_droit_rejetee(self):
        outsider = membre('out@x.com')
        self.client.post('/api/v1/auth/register-candidature',
                         {'donnees': {'email': 'v@x.com'}, 'cellules_souhaitees': []}, format='json')
        c = Candidature.objects.get()
        self.client.force_authenticate(outsider)
        r = self.client.post(f'/api/v1/candidatures/{c.id}/valider/')
        self.assertIn(r.status_code, (403, 404))

    def test_refus_trace(self):
        p1 = membre('p1@x.com')
        donner_role(p1, 'P1')
        self.client.post('/api/v1/auth/register-candidature',
                         {'donnees': {'email': 'r@x.com'}, 'cellules_souhaitees': []}, format='json')
        c = Candidature.objects.get()
        self.client.force_authenticate(p1)
        r = self.client.post(f'/api/v1/candidatures/{c.id}/refuser/')
        self.assertEqual(r.status_code, 200)
        c.refresh_from_db()
        self.assertEqual(c.statut, 'refusee')
        self.assertEqual(c.traitee_par, p1)


class EspaceMembreTests(TestCase):
    client_class = APIClient

    def test_me_et_prefs(self):
        u = membre('pref@x.com')
        c = self.client
        c.force_authenticate(u)
        self.assertEqual(c.get('/api/v1/me/').status_code, 200)
        r = c.patch('/api/v1/me/', {'notif_prefs': {'recap': False}, 'hack': 1}, format='json')
        self.assertEqual(r.status_code, 200)
        u.refresh_from_db()
        self.assertEqual(u.notif_prefs, {'recap': False})  # 'hack' ignoré
        # prefs invalides rejetées
        r = c.patch('/api/v1/me/', {'notif_prefs': 'non'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_me_anonyme_401(self):
        self.assertEqual(self.client.get('/api/v1/me/').status_code, 401)
