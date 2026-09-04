"""Emails périodiques (doc 04 §6) — fallback sans Celery/Redis.

- rappels J-1 (fenêtre 23–25h avant le début) et H-2h (1h30–2h30)
- satisfaction 1h après la fin (fenêtre 1h–3h après date_fin)
- récap hebdo : événements des 7 prochains jours à tous les membres
- anti-doublons via les Notification déjà tracées

Usage :
  python manage.py emails_periodiques --dry-run [--limit 50] [--only rappels|satifaction|recap]
Cron (doc 04 §6) :
  */10 * * * * …/manage.py emails_periodiques --only rappels
  */15 * * * * …/manage.py emails_periodiques --only satisfaction
  0 18 * * 0 …/manage.py emails_periodiques --only recap
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.events.models import Evenement, Inscription
from apps.notifications.models import Notification
from apps import emails as mail

User = get_user_model()


class Command(BaseCommand):
    help = 'Envoie les emails périodiques du club (rappels, satisfaction, récap).'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='liste sans envoyer')
        parser.add_argument('--limit', type=int, default=200)
        parser.add_argument('--only', choices=['rappels', 'satisfaction', 'recap'], default=None)

    def handle(self, *args, **opts):
        dry, limit, only = opts['dry_run'], opts['limit'], opts['only']
        total = {'rappels': 0, 'satisfaction': 0, 'recap': 0}
        now = timezone.now()

        def deja(type_notif, objet_id):
            return Notification.objects.filter(type=type_notif, objet_id=str(objet_id)).exists()

        if only in (None, 'rappels'):
            for evt in Evenement.objects.all():
                delta_h = (evt.date_debut - now).total_seconds() / 3600
                echeance = 'J-1' if 23 <= delta_h <= 25 else ('H-2h' if 1.5 <= delta_h <= 2.5 else None)
                if not echeance or deja('rappel', f'{evt.pk}:{echeance}'):
                    continue
                for insc in Inscription.objects.filter(
                        evenement=evt, liste_attente=False).select_related('membre'):
                    if total['rappels'] >= limit:
                        break
                    if dry:
                        self.stdout.write(f'[dry] rappel {echeance} → {insc.membre.email} ({evt.titre})')
                    else:
                        try:
                            mail.send_rappel(insc.membre, evt, echeance)
                        except Exception as exc:
                            self.stderr.write(f'échec rappel {insc.membre.email}: {exc}')
                            continue
                    total['rappels'] += 1

        if only in (None, 'satisfaction'):
            for evt in Evenement.objects.filter(date_fin__isnull=False):
                delta_h = (now - evt.date_fin).total_seconds() / 3600
                if not (1 <= delta_h <= 3) or deja('satisfaction', evt.pk):
                    continue
                for insc in Inscription.objects.filter(
                        evenement=evt, liste_attente=False).select_related('membre'):
                    if total['satisfaction'] >= limit:
                        break
                    if dry:
                        self.stdout.write(f'[dry] satisfaction → {insc.membre.email} ({evt.titre})')
                    else:
                        try:
                            mail.send_satisfaction(insc.membre, evt)
                        except Exception as exc:
                            self.stderr.write(f'échec satisfaction {insc.membre.email}: {exc}')
                            continue
                    total['satisfaction'] += 1

        if only in (None, 'recap'):
            semaine = list(Evenement.objects.filter(
                date_debut__gte=now, date_debut__lte=now + timedelta(days=7)))
            for m in User.objects.filter(is_active=True).exclude(email=''):
                if total['recap'] >= limit:
                    break
                if dry:
                    self.stdout.write(f'[dry] récap → {m.email} ({len(semaine)} événements)')
                else:
                    try:
                        mail.send_recap_hebdo(m, semaine)
                    except Exception as exc:
                        self.stderr.write(f'échec récap {m.email}: {exc}')
                        continue
                total['recap'] += 1

        self.stdout.write(self.style.SUCCESS(
            f'Terminé (dry={dry}) : rappels={total["rappels"]} '
            f'satisfaction={total["satisfaction"]} recap={total["recap"]}'))
