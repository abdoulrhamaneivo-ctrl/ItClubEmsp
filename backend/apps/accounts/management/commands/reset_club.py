"""Reset total du club : vide TOUTES les données (seed, membres, contenus)
et ne garde qu'un seul compte ADMIN.

Usage (Render Shell ou local) :
    python manage.py reset_club --email abdoulivo5@gmail.com --password ITClub2026!

IRRÉVERSIBLE : à lancer uniquement quand on veut repartir de zéro.
Le seed automatique du build ne recréera rien (voir build.sh : SEED_DEMO).
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction


class Command(BaseCommand):
    help = 'Vide toutes les données du club, garde un seul admin.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Email du compte admin')
        parser.add_argument('--password', required=True, help='Mot de passe initial')
        parser.add_argument('--nom', default='Abdoul Ivo',
                            help='Nom affiché (défaut: Abdoul Ivo)')

    @transaction.atomic
    def handle(self, *args, **opts):
        from apps.accounts.models import Role, Cellule, MembreCellule, Candidature
        from apps.comms.models import (Actualite, Reaction, Commentaire, Sujet,
                                       MessageForum, Sondage, OptionSondage,
                                       Vote, Document, Media)
        from apps.events.models import Evenement, Inscription, Presence, Retour, Bilan
        from apps.governance.models import (ObjectifPoste, Projet, Opportunite,
                                            RessourceVeille, VoteVeille,
                                            Parametre, CompteRendu)
        from apps.notifications.models import Notification

        email = opts['email'].strip().lower()
        # Contenus (ordre : enfants d'abord à cause des FK)
        for modele in (Vote, OptionSondage, Sondage, MessageForum, Sujet,
                       Commentaire, Reaction, Media, Document, Actualite,
                       Presence, Inscription, Retour, Bilan, Evenement,
                       VoteVeille, RessourceVeille, CompteRendu, Opportunite,
                       Projet, ObjectifPoste, Parametre, Candidature,
                       MembreCellule, Cellule, Notification):
            n, _ = modele.objects.all().delete()
            self.stdout.write(f'  · {modele.__name__} : {n} supprimé(s)')
        # Rôles (postes vidés, pas supprimés : le club garde ses 10 postes)
        for role in Role.objects.all():
            role.titulaire = None
            role.save(update_fields=['titulaire'])
        self.stdout.write('  · Rôles : postes vidés (codes conservés)')
        # Tous les comptes supprimés…
        User = get_user_model()
        n, _ = User.objects.all().delete()
        self.stdout.write(f'  · Comptes supprimés : {n}')
        # …sauf le nouvel admin
        parts = opts['nom'].split()
        admin = User.objects.create_user(
            username=email.split('@')[0].replace('.', '_'),
            email=email,
            password=opts['password'],
            first_name=parts[0] if parts else '',
            last_name=' '.join(parts[1:]),
            is_staff=True,
            is_superuser=True,
        )
        Role.objects.update_or_create(code='ADMIN', defaults={'titulaire': admin})
        self.stdout.write(self.style.SUCCESS(
            f'OK — seul compte : {email} (ADMIN + superuser, '
            f'mot de passe défini, à changer au 1er login).'))
