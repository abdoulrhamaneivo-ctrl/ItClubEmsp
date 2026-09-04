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


class PresenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.e = evt(places=10)
        self.m = membre('p@x.com')
        self.orga = membre('orga@x.com')
        from apps.accounts.models import Role
        Role.objects.update_or_create(code='P6', defaults={'titulaire': self.orga})

    def auth(self, u):
        self.client.force_authenticate(u)

    def test_code_genere_6_chiffres(self):
        self.assertRegex(self.e.code_presence, r'^\d{6}$')

    def test_code_cache_public_visible_orga(self):
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/').json()
        self.assertIsNone(r['code_presence'])
        self.auth(self.orga)
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/').json()
        self.assertEqual(r['code_presence'], self.e.code_presence)

    def test_mauvais_code_400_sans_points(self):
        self.auth(self.m)
        r = self.client.post(f'/api/v1/evenements/{self.e.id}/presence', {'code': '000000'})
        self.assertEqual(r.status_code, 400)
        self.m.refresh_from_db()
        self.assertEqual(self.m.points, 0)

    def test_bon_code_present_plus5_et_idempotent(self):
        self.auth(self.m)
        url = f'/api/v1/evenements/{self.e.id}/presence'
        r = self.client.post(url, {'code': self.e.code_presence}).json()
        self.assertEqual(r['statut'], 'present')
        self.assertEqual(r['gagnes'], 5)
        r = self.client.post(url, {'code': self.e.code_presence}).json()
        self.assertEqual(r['statut'], 'deja-present')
        self.m.refresh_from_db()
        self.assertEqual(self.m.points, 5)  # une seule fois

    def test_orga_emarge_sans_code_outsider_403(self):
        self.auth(self.m)
        r = self.client.post(
            f'/api/v1/evenements/{self.e.id}/presence', {'email': 'p@x.com'})
        self.assertEqual(r.status_code, 403)
        self.auth(self.orga)
        r = self.client.post(
            f'/api/v1/evenements/{self.e.id}/presence', {'email': 'p@x.com'}).json()
        self.assertEqual(r['statut'], 'present')

    def test_csv_et_qr_200(self):
        self.auth(self.m)
        self.client.post(f'/api/v1/evenements/{self.e.id}/presence',
                         {'code': self.e.code_presence})
        self.auth(self.orga)
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/export-presences.csv')
        self.assertEqual(r.status_code, 200)
        self.assertIn('p@x.com', r.content.decode('utf-8'))
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/qr-presence')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Type'], 'image/png')

    def test_anonyme_401(self):
        self.assertEqual(
            self.client.post(f'/api/v1/evenements/{self.e.id}/presence',
                             {'code': '123456'}).status_code, 401)


class CalendrierTests(TestCase):
    client_class = APIClient

    def setUp(self):
        self.orga = membre('cal@x.com')
        from apps.accounts.models import Role
        Role.objects.update_or_create(code='P6', defaults={'titulaire': self.orga})
        self.client.force_authenticate(self.orga)
        # Référence : 12/10/2026 15h-17h, Salle info 2 (base vide en test)
        from django.utils import timezone
        from datetime import datetime
        self.base = Evenement.objects.create(
            titre='Atelier ref', type='atelier',
            date_debut=timezone.make_aware(datetime(2026, 10, 12, 15, 0)),
            date_fin=timezone.make_aware(datetime(2026, 10, 12, 17, 0)),
            lieu='Salle info 2', places=10, couleur='#2563EB', icone='ampoule')

    def test_conflit_meme_salle_refuse(self):
        payload = {'titre': 'Doublon', 'type': 'atelier', 'date': '2026-10-12T15:30:00Z',
                   'lieu': 'Salle info 2'}
        r = self.client.post('/api/v1/evenements/', payload, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('conflit', r.json())

    def test_autre_salle_meme_heure_ok(self):
        payload = {'titre': 'Ailleurs', 'type': 'atelier', 'date': '2026-10-12T15:30:00Z',
                   'lieu': 'Salle info 9'}
        r = self.client.post('/api/v1/evenements/', payload, format='json')
        self.assertEqual(r.status_code, 201)
        r.json()['id'] and Evenement.objects.filter(pk=r.json()['id']).delete()

    def test_meme_salle_horaire_different_ok(self):
        payload = {'titre': 'Plus tard', 'type': 'atelier', 'date': '2026-10-12T18:30:00Z',
                   'lieu': 'Salle info 2'}
        r = self.client.post('/api/v1/evenements/', payload, format='json')
        self.assertEqual(r.status_code, 201)
        Evenement.objects.filter(pk=r.json()['id']).delete()

    def test_ics_global_et_unitaire(self):
        r = self.client.get('/api/v1/calendrier.ics')
        self.assertEqual(r.status_code, 200)
        self.assertIn('text/calendar', r['Content-Type'])
        contenu = r.content.decode('utf-8')
        self.assertIn('BEGIN:VCALENDAR', contenu)
        self.assertIn('BEGIN:VEVENT', contenu)
        e = self.base
        r = self.client.get(f'/api/v1/evenements/{e.pk}.ics')
        self.assertEqual(r.status_code, 200)
        self.assertIn(f'UID:evt-{e.pk}@itclub.emsp', r.content.decode('utf-8'))
        r = self.client.get('/api/v1/evenements/99999.ics')
        self.assertEqual(r.status_code, 404)


class RetoursBilanTests(TestCase):
    client_class = APIClient

    def setUp(self):
        self.e = evt(places=10)
        self.m = membre('rb@x.com')
        self.m2 = membre('rb2@x.com')
        self.orga = membre('orgarb@x.com')
        from apps.accounts.models import Role
        Role.objects.update_or_create(code='P6', defaults={'titulaire': self.orga})

    def auth(self, u):
        self.client.force_authenticate(u)

    def test_note_valide_et_moyenne(self):
        self.auth(self.m)
        r = self.client.post(f'/api/v1/evenements/{self.e.id}/retour', {'note': 6}, format='json')
        self.assertEqual(r.status_code, 400)
        r = self.client.post(f'/api/v1/evenements/{self.e.id}/retour', {'note': 4, 'avis': 'Très bien'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.auth(self.m2)
        self.client.post(f'/api/v1/evenements/{self.e.id}/retour', {'note': 2}, format='json')
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/').json()
        self.assertEqual(r['note_moyenne'], 3.0)
        self.assertEqual(r['nb_retours'], 2)
        self.assertEqual(r['mon_retour']['note'], 2)

    def test_modifiable_une_ligne(self):
        self.auth(self.m)
        self.client.post(f'/api/v1/evenements/{self.e.id}/retour', {'note': 3}, format='json')
        self.client.post(f'/api/v1/evenements/{self.e.id}/retour', {'note': 5, 'avis': 'Génial'}, format='json')
        from apps.events.models import Retour
        self.assertEqual(Retour.objects.filter(membre=self.m).count(), 1)
        self.assertEqual(Retour.objects.get(membre=self.m).note, 5)

    def test_retours_reserves_orga(self):
        self.auth(self.m)
        self.assertEqual(self.client.get(f'/api/v1/evenements/{self.e.id}/retours/').status_code, 403)
        self.auth(self.orga)
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/retours/')
        self.assertEqual(r.status_code, 200)

    def test_bilan_publication_et_vitrine(self):
        self.auth(self.orga)
        r = self.client.patch(f'/api/v1/evenements/{self.e.id}/bilan/', {'publie': True}, format='json')
        self.assertEqual(r.status_code, 400)  # vide
        r = self.client.patch(f'/api/v1/evenements/{self.e.id}/bilan/',
                              {'texte': 'Bilan du hackathon', 'points_forts': 'Ambiance',
                               'publie': True}, format='json')
        self.assertEqual(r.json()['statut'], 'publie')
        # visible publiquement sur l'événement
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/').json()
        self.assertEqual(r['bilan']['texte'], 'Bilan du hackathon')
        # non publié = invisible
        self.client.patch(f'/api/v1/evenements/{self.e.id}/bilan/', {'publie': False}, format='json')
        r = self.client.get(f'/api/v1/evenements/{self.e.id}/').json()
        self.assertIsNone(r['bilan'])
