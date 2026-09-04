"""Tests des règles événements : quota, attente, promotion (doc 02 D5, doc 06 Phase 4)."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from apps.events.models import Evenement, Inscription

User = get_user_model()


def membre(email, password='Pw123456!'):
    u, _ = User.objects.get_or_create(email=email, defaults={'username': email.split('@')[0]})
    u.set_password(password)
    u.save()
    return u


def evt(places=2):
    return Evenement.objects.create(
        titre='Atelier test', type='atelier',
        date_debut=timezone.now() + timedelta(days=3),
        lieu='Salle', places=places, couleur='#2563EB', icone='ampoule')


class InscriptionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.e = evt(places=2)
        self.u1, self.u2, self.u3 = (membre(f't{i}@x.com') for i in (1, 2, 3))

    def auth(self, u):
        self.client.force_authenticate(u)

    def test_quota_puis_attente_puis_promotion(self):
        self.auth(self.u1)
        self.assertEqual(self.client.post(
            f'/api/v1/evenements/{self.e.id}/inscrire').json()['statut'], 'confirme')
        self.auth(self.u2)
        self.assertEqual(self.client.post(
            f'/api/v1/evenements/{self.e.id}/inscrire').json()['statut'], 'confirme')
        self.auth(self.u3)
        r = self.client.post(f'/api/v1/evenements/{self.e.id}/inscrire').json()
        self.assertEqual(r['statut'], 'liste-attente')
        self.assertEqual(r['position'], 1)
        # désinscription u1 → u3 promu
        self.auth(self.u1)
        r = self.client.delete(f'/api/v1/evenements/{self.e.id}/desinscrire').json()
        self.assertEqual(r['place_reattribuee_a'], 't3@x.com')
        self.assertFalse(Inscription.objects.get(evenement=self.e, membre=self.u3).liste_attente)

    def test_double_inscription_idempotente(self):
        self.auth(self.u1)
        url = f'/api/v1/evenements/{self.e.id}/inscrire'
        self.client.post(url)
        self.assertEqual(self.client.post(url).json()['statut'], 'deja-inscrit')
        self.assertEqual(Inscription.objects.filter(evenement=self.e, membre=self.u1).count(), 1)

    def test_anonyme_401(self):
        self.assertEqual(
            self.client.post(f'/api/v1/evenements/{self.e.id}/inscrire').status_code, 401)

    def test_filtres_a_venir_et_limit(self):
        Evenement.objects.create(
            titre='Passé', type='atelier', date_debut=timezone.now() - timedelta(days=30),
            places=0, couleur='#2563EB', icone='ampoule')
        r = self.client.get('/api/v1/evenements/?a_venir=1&limit=1').json()
        titres = [e['titre'] for e in r['results']]
        self.assertNotIn('Passé', titres)
        self.assertLessEqual(len(titres), 1)
        self.assertIn('type_label', r['results'][0])

    def test_compteurs_confirmes_seuls(self):
        self.auth(self.u1)
        self.client.post(f'/api/v1/evenements/{self.e.id}/inscrire')
        self.auth(self.u2)
        self.client.post(f'/api/v1/evenements/{self.e.id}/inscrire')
        self.auth(self.u3)
        self.client.post(f'/api/v1/evenements/{self.e.id}/inscrire')
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/').json()
        self.assertEqual(r['inscrits_count'], 2)
        self.assertEqual(r['places_disponibles'], 0)
