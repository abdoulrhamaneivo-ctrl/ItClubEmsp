"""
Seed — remplit la base avec les données actuelles des mocks du front
(une seule source de vérité : la base. Le front basculera USE_MOCK=false).
Usage : python manage.py shell < fixtures/seed.py
"""
from django.contrib.auth import get_user_model
from apps.accounts.models import Role, Cellule
from apps.governance.models import ObjectifPoste
from apps.comms.models import Actualite, Document
from apps.events.models import Evenement
from datetime import datetime, date

User = get_user_model()

print('── Seed IT-CLUB EMSP ──')

# ── Membres du Bureau (vrais noms) ──
bureau = [
    ('IVO ABDOUL RHAMANE NESTOR', 'ivo.abdoul@emsp.int', 'P1'),
    ('NASSIROU SALEY HAMIDA', 'nassirou.hamina@emsp.int', 'P2'),
    ('ABBA KAKA ZARA KOUROU', 'abba.kakazara@emsp.int', 'P3'),
]
users = {}
for nom, email, code in bureau:
    u, created = User.objects.get_or_create(
        email=email,
        defaults={'username': email.split('@')[0], 'first_name': nom.split()[0], 'last_name': ' '.join(nom.split()[1:])},
    )
    users[code] = u
    print(f'  {"＋" if created else "·"} User {nom}')

# ── Rôles (10 postes) ──
roles_data = [
    ('P1', 'Président', 'IVO ABDOUL RHAMANE NESTOR'),
    ('P2', 'Vice-Présidente', 'NASSIROU SALEY HAMIDA'),
    ('P3', 'Secrétaire Générale', 'ABBA KAKA ZARA KOUROU'),
]
missions = {
    'P1': ("Anime le Bureau et représente le club auprès de l'école et des partenaires.",
           'Faire passer le club de 40 à 100 membres actifs.'),
    'P2': ('Coordonne les responsables et supplée le Président.',
           'Lancer le suivi hebdo des projets techniques.'),
    'P3': ('Gère les comptes rendus, le registre des membres et les convocations.',
           'Numériser tout le registre avant la fin du semestre.'),
}
for code, poste, nom in roles_data:
    role, created = Role.objects.get_or_create(
        code=code,
        defaults={'titulaire': users.get(code)},
    )
    if created and code in missions:
        mission, objectif = missions[code]
        ObjectifPoste.objects.get_or_create(role_code=code, defaults={'mission': mission, 'objectif': objectif})
    print(f'  {"＋" if created else "·"} Role {code} {poste}')

# ── Cellules ──
cellules_data = [
    ('web', 'Cellule Web', 'Construisons les plateformes du club et des projets réels : React, Django, déploiement continu. Ici, on apprend en shipant.',
     ['Maîtriser React 19 et Tailwind', 'Backend Django REST', 'Déploiement Vercel + Railway'],
     '#1FAF72', '#0E7A50', 14),
    ('ia', 'Cellule IA', 'Exploration pratique de l’intelligence artificielle : modèles de langage, vision par ordinateur, projets concrets avec les dernières bibliothèques.',
     ['Fondamentaux des LLMs', 'Fine-tuning et RAG', 'Projet IA pour le club'],
     '#2563EB', '#1D4ED8', 9),
    ('cyber', 'Cellule Cybersécurité', 'Apprendre à penser comme un attaquant pour mieux défendre : CTF, analyse de vulnérabilités, bonnes pratiques.',
     ['Bases réseaux et Linux', 'Challenges CTF', 'Audit de la plateforme du club'],
     '#0F5B3A', '#0B7A4B', 11),
    ('design', 'Cellule Design', 'UX/UI, identité visuelle, motion design — donner au club et à ses projets une identité qui inspire.',
     ['Design system du club', 'Figma et prototypes', 'Motion pour les réseaux'],
     '#7B61FF', '#5B3FD6', 7),
]
for slug, nom, desc, programme, coul, fonce, nb in cellules_data:
    cell, created = Cellule.objects.get_or_create(
        slug=slug,
        defaults={'nom': nom, 'description': desc, 'programme': programme,
                  'couleur': coul, 'couleur_fonce': fonce,
                  'icone': slug, 'ordre': len(cellules_data)},
    )
    print(f'  {"＋" if created else "·"} Cellule {nom}')

# ── Actualités (celles du front) ──
actus_data = [
    ('Vibeathon 2.0 — les inscriptions sont ouvertes',
     '48h de code, de design et de pitch. équipes de 4, toutes les cellules mélangées.',
     'web'),
    ('Nouvelle charte graphique adoptée',
     'Le Design a livré la nouvelle identité : logo, couleurs, typographies. Elle s’applique à tous les supports.',
     'design'),
]
for titre, extrait, slug_cell in actus_data:
    a, created = Actualite.objects.get_or_create(
        titre=titre, defaults={'extrait': extrait, 'auteur': users['P1']},
    )
    print(f'  {"＋" if created else "·"} Actualité {titre[:40]}…')

# ── Documents ──
docs_data = [
    ('charte', 'Charte du club', 'Nos valeurs, notre façon de travailler.', 'fondamentaux', 'Charte_IT_CLUB_EMSP.pdf', '#1FAF72'),
    ('reglement', 'Règlement intérieur', 'Les règles du jeu, simples et claires.', 'fondamentaux', 'IT-CLUB EMSP.pdf', '#1FAF72'),
    ('missions', 'Rôles et missions', 'Qui fait quoi au Bureau — détaillé poste par poste.', 'vie', 'Doc1_Roles_Missions_Nominations.docx', '#2563EB'),
    ('pv1', 'PV Réunion 1', 'Compte rendu de la réunion d’installation.', 'archives', 'Compte_Rendu_Reunion_1_IT_Club_EMSP.docx.pdf', '#7B61FF'),
]
for doc_id, titre, desc, famille, fichier, coul in docs_data:
    d, created = Document.objects.get_or_create(
        slug=doc_id, defaults={'titre': titre, 'description': desc, 'famille': famille,
                             'fichier': f'documents/{fichier}', 'couleur': coul},
    )
    print(f'  {"＋" if created else "·"} Document {titre}')

# ── Événements ──
events_data = [
    ('Atelier Git & GitHub', 'Versionner son code, collaborer, publier. Apporte ton laptop.', 'atelier', '2026-10-12T15:00:00', 'Salle info 2', 25, '#2563EB', 'ampoule'),
    ('Hackathon interne — 48h', 'Construis une app de A à Z avec ta cellule. Jury : le Bureau + invités.', 'competition', '2026-10-25T09:00:00', 'Amphi A', 60, '#1FAF72', 'trophee'),
]
for titre, desc, type_e, date_debut, lieu, places, coul, icone in events_data:
    e, created = Evenement.objects.get_or_create(
        titre=titre,
        defaults={'description': desc, 'type': type_e, 'date_debut': date_debut,
                  'lieu': lieu, 'places': places, 'couleur': coul, 'icone': icone},
    )
    print(f'  {"＋" if created else "·"} Événement {titre}')

print('── Seed terminé ──')
