"""Remplit la base de référence SANS toucher aux comptes.

Recrée : missions + objectifs des 10 postes, 4 cellules.
Ne crée, ne modifie, ne supprime AUCUN utilisateur.

Usage (Render Shell ou local) :
    python manage.py remplir_base

Relançable sans doublons (update_or_create partout).
"""
from django.core.management.base import BaseCommand
from django.db import transaction

OBJECTIFS = [
    ('P1', "Anime le Bureau et représente le club auprès de l'école et des partenaires. Publie l'ordre du jour.",
     'Faire passer le club de 40 à 100 membres actifs.'),
    ('P2', 'Supplée le Président. Coordonne les responsables et les cellules.',
     'Lancer le suivi hebdomadaire des projets techniques.'),
    ('P3', 'Gère les comptes rendus, le registre des membres et les convocations H-48h.',
     'Numériser tout le registre avant la fin du semestre.'),
    ('P4', 'Crée et suit les cellules thématiques. Nomme les chefs de cellule.',
     'Des cellules actives toute l’année.'),
    ('P5', 'Anime les réseaux sociaux, le site et la newsletter du club.',
     'Visibilité maximale du club sur le campus.'),
    ('P6', 'Organise ateliers, hackathons et sorties. Gère les inscriptions.',
     'Un événement par mois, sans exception.'),
    ('P7', 'Projets internes, R&D, prototypes et solutions techniques.',
     '3 prototypes présentés cette année.'),
    ('P8', 'Démarche entreprises, écoles et ONG pour les membres.',
     '5 partenaires actifs signés.'),
    ('P9', 'Planifie ateliers, mentorat et veille. Tenir le calendrier.',
     '100% des membres formés sur les bases.'),
    ('P10', "Conçoit les fiches types d'ateliers et les feuilles de présence.",
     'Un atelier hebdomadaire par cellule.'),
]

CELLULES = [
    ('web', 'Cellule Web',
     'Développement front & back : React, Django, déploiement. Le club construit ses propres outils ici.',
     ['React + Vite, Material UI', 'Python / Django / API REST', 'Git, déploiement cloud'],
     '#1FAF72', '#0E7A50', 'web', 1),
    ('ia', 'Cellule IA',
     "Intelligence artificielle et données : modèles, ateliers Python, projets d'agents.",
     ['Bases de Python data', 'LLMs, prompts, agents IA', 'Mini-projets encadrés'],
     '#2563EB', '#1D4ED8', 'ia', 2),
    ('cyber', 'Cellule Cybersécurité',
     "Sécurité offensive & défensive : CTF, bonnes pratiques, sensibilisation de l'école.",
     ['Bases Linux & réseaux', 'Challenges CTF débutants', 'Sécurité au quotidien'],
     '#0F5B3A', '#0B7A4B', 'cyber', 3),
    ('design', 'Cellule Design',
     'UI/UX, identité visuelle, montage vidéo — tout ce qui rend le club visible.',
     ['Figma & design system', 'Montage vidéo (bannières du club)', 'Charte graphique'],
     '#7B61FF', '#5B3FD6', 'design', 4),
]


class Command(BaseCommand):
    help = 'Remplit objectifs + cellules sans toucher aux comptes.'

    @transaction.atomic
    def handle(self, *args, **opts):
        from apps.governance.models import ObjectifPoste
        from apps.accounts.models import Cellule

        for code, mission, objectif in OBJECTIFS:
            ObjectifPoste.objects.update_or_create(
                role_code=code, defaults={'mission': mission, 'objectif': objectif})
            self.stdout.write(f'  · {code} : mission + objectif')
        for slug, nom, desc, programme, coul, fonce, icone, ordre in CELLULES:
            Cellule.objects.update_or_create(
                slug=slug,
                defaults={'nom': nom, 'description': desc, 'programme': programme,
                          'couleur': coul, 'couleur_fonce': fonce,
                          'icone': icone, 'ordre': ordre})
            self.stdout.write(f'  · Cellule {nom}')
        self.stdout.write(self.style.SUCCESS(
            'OK — objectifs + cellules en place, comptes intacts.'))
