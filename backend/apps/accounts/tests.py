"""Tests des règles adhésion + espace membre (doc 02 D2, doc 06 Phase 2)."""
from django.test import TestCase, override_settings
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


# Sans clé dans l'environnement (sinon le log-only attendu part en vrai envoi)
@override_settings(BREVO_API_KEY='', BREVO_FROM='')
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


class GamificationTests(TestCase):
    client_class = APIClient

    def test_bonus_bienvenue_et_classement(self):
        from apps.views_emails import niveau_de
        self.assertEqual(niveau_de(0), 'Nouveau')
        self.assertEqual(niveau_de(5), 'Actif')
        self.assertEqual(niveau_de(20), 'Pilier')
        self.assertEqual(niveau_de(50), 'Légende du club')
        # classement public, sans login
        r = self.client.get('/api/v1/classement/')
        self.assertEqual(r.status_code, 200)

    def test_validation_offre_plus10(self):
        from apps.accounts.models import Candidature
        sg = membre('sg2@x.com')
        donner_role(sg, 'P3')
        self.client.post('/api/v1/auth/register-candidature',
                         {'donnees': {'prenom': 'Bonus', 'nom': 'Test', 'email': 'bonus@x.com'},
                          'cellules_souhaitees': []}, format='json')
        c = Candidature.objects.get()
        self.client.force_authenticate(sg)
        self.client.post(f'/api/v1/candidatures/{c.id}/valider/')
        from django.contrib.auth import get_user_model
        u = get_user_model().objects.get(email='bonus@x.com')
        self.assertEqual(u.points, 10)
        r = self.client.get('/api/v1/classement/').json()
        self.assertTrue(any('Bonus' in (e.get('nom') or '') for e in r))
        # /me/ expose points + niveau
        self.client.force_authenticate(u)
        me = self.client.get('/api/v1/me/').json()
        self.assertEqual(me['points'], 10)
        self.assertEqual(me['niveau'], 'Actif')
        u.delete()


class DefinitionMotDePasseTests(TestCase):
    client_class = APIClient

    def setUp(self):
        self.u = membre('invitemdp@x.com')
        self.u.set_unusable_password()
        self.u.save()

    def test_cycle_invitation(self):
        from apps.views_emails import lien_definition_mdp
        import re
        lien = lien_definition_mdp(self.u)
        self.assertIn('/definir-mot-de-passe?uid=', lien)
        uid = re.search(r'uid=([^&]+)', lien).group(1)
        tok = re.search(r'token=(.+)', lien).group(1)
        url = '/api/v1/auth/definir-mot-de-passe'
        # trop court
        r = self.client.post(url, {'uid': uid, 'token': tok, 'password': 'Court'}, format='json')
        self.assertEqual(r.status_code, 400)
        # token bidon
        r = self.client.post(url, {'uid': uid, 'token': 'faux', 'password': 'BonMotDePasse1!'}, format='json')
        self.assertEqual(r.status_code, 400)
        # OK puis login
        r = self.client.post(url, {'uid': uid, 'token': tok, 'password': 'BonMotDePasse1!'}, format='json')
        self.assertEqual(r.status_code, 200)
        r = self.client.post('/api/v1/auth/token',
                             {'email': 'invitemdp@x.com', 'password': 'BonMotDePasse1!'}, format='json')
        self.assertEqual(r.status_code, 200)
        # lien à usage unique
        r = self.client.post(url, {'uid': uid, 'token': tok, 'password': 'AutreMotDePasse2!'}, format='json')
        self.assertEqual(r.status_code, 400)
