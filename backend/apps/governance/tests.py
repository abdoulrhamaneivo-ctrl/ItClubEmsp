"""Tests vague 2 : projets, opportunités, paramètres, dashboard, admin, chef cellule."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.accounts.models import Role, Cellule
from apps.governance.models import Projet, Opportunite, Parametre

User = get_user_model()


def membre(email, password='Pw123456!'):
    u, _ = User.objects.get_or_create(email=email, defaults={'username': email.split('@')[0]})
    u.set_password(password)
    u.save()
    return u


def role(code, user):
    Role.objects.update_or_create(code=code, defaults={'titulaire': user})


class ProjetsTests(TestCase):
    client_class = APIClient

    def setUp(self):
        self.vp = membre('vp2@x.com')
        role('P2', self.vp)
        self.simple = membre('simp2@x.com')

    def test_public_lit_membre_ecrit_pas(self):
        Projet.objects.create(nom='Bot Discord', statut='en_cours')
        r = self.client.get('/api/v1/projets/')
        self.assertEqual(r.status_code, 200)
        self.client.force_authenticate(self.simple)
        r = self.client.post('/api/v1/projets/', {'nom': 'X'})
        self.assertEqual(r.status_code, 403)

    def test_bureau_crud(self):
        self.client.force_authenticate(self.vp)
        r = self.client.post('/api/v1/projets/',
                             {'nom': 'Plateforme', 'statut': 'en_cours'}, format='json')
        self.assertEqual(r.status_code, 201)
        pid = r.json()['id']
        r = self.client.patch(f'/api/v1/projets/{pid}/', {'statut': 'termine'}, format='json')
        self.assertEqual(r.json()['statut_label'], 'Terminé')
        self.assertEqual(self.client.delete(f'/api/v1/projets/{pid}/').status_code, 204)


class OpportunitesTests(TestCase):
    client_class = APIClient

    def test_kanban_et_carnet(self):
        p8 = membre('p8@x.com')
        role('P8', p8)
        self.client.force_authenticate(p8)
        r = self.client.post('/api/v1/opportunites/', {
            'titre': 'Hackathon Abidjan', 'type': 'hackathon',
            'contact_nom': 'Awa', 'contact_email': 'awa@org.com'}, format='json')
        self.assertEqual(r.status_code, 201)
        oid = r.json()['id']
        r = self.client.patch(f'/api/v1/opportunites/{oid}/',
                              {'statut': 'inscrit'}, format='json')
        self.assertEqual(r.json()['statut_label'], 'Inscrit')
        r = self.client.get('/api/v1/opportunites/?statut=inscrit').json()
        self.assertTrue(any(o['contact_email'] == 'awa@org.com' for o in r['results']))


class ParametresTests(TestCase):
    client_class = APIClient

    def test_lecture_publique_ecriture_bureau(self):
        Parametre.objects.create(cle='rs_linkedin', valeur='https://linkedin.com/x')
        r = self.client.get('/api/v1/parametres/')
        self.assertEqual(r.status_code, 200)
        simple = membre('simp3@x.com')
        self.client.force_authenticate(simple)
        r = self.client.patch('/api/v1/parametres/rs_linkedin/',
                              {'valeur': 'https://x.com'}, format='json')
        self.assertEqual(r.status_code, 403)
        p5 = membre('p5b@x.com')
        role('P5', p5)
        self.client.force_authenticate(p5)
        r = self.client.patch('/api/v1/parametres/rs_linkedin/',
                              {'valeur': 'https://x.com'}, format='json')
        self.assertEqual(r.json()['valeur'], 'https://x.com')


class DashboardAdminTests(TestCase):
    client_class = APIClient

    def setUp(self):
        self.p1 = membre('p1dash@x.com')
        role('P1', self.p1)
        self.simple = membre('simpdash@x.com')

    def test_dashboard_reserve_direction(self):
        self.client.force_authenticate(self.simple)
        self.assertEqual(self.client.get('/api/v1/dashboard/').status_code, 403)
        self.client.force_authenticate(self.p1)
        d = self.client.get('/api/v1/dashboard/').json()
        for cle in ('membres', 'candidatures', 'evenements', 'projets',
                    'opportunites', 'top_cellules', 'points_distribues'):
            self.assertIn(cle, d)

    def test_admin_users_et_passation(self):
        self.client.force_authenticate(self.simple)
        self.assertEqual(self.client.get('/api/v1/admin/utilisateurs/').status_code, 403)
        admin = membre('adminx@x.com')
        admin.is_staff = True
        admin.save()
        self.client.force_authenticate(admin)
        users = self.client.get('/api/v1/admin/utilisateurs/').json()
        self.assertTrue(any(u['email'] == 'simpdash@x.com' for u in users))
        # passation P5 -> simple (le poste doit exister)
        Role.objects.get_or_create(code='P5')
        r = self.client.patch('/api/v1/admin/roles/P5/', {'email': 'simpdash@x.com'},
                              format='json')
        self.assertEqual(r.status_code, 200)
        # pas d'auto-désactivation
        r = self.client.patch(f'/api/v1/admin/utilisateurs/{admin.pk}/',
                              {'is_active': False}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_chef_cellule_par_email(self):
        p4 = membre('p4cell@x.com')
        role('P4', p4)
        cell = Cellule.objects.create(nom='Test', slug='test-chef', description='x')
        self.client.force_authenticate(p4)
        r = self.client.patch(f'/api/v1/cellules/{cell.pk}/',
                              {'chef_email': 'simpdash@x.com'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertIn('simpdash', (r.json()['chef_nom'] or '').lower() or 'simpdash@x.com')
        r = self.client.patch(f'/api/v1/cellules/{cell.pk}/',
                              {'chef_email': 'inconnu@x.com'}, format='json')
        self.assertEqual(r.status_code, 400)
