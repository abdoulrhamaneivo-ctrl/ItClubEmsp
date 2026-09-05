"""
Seed — remplit la base avec les données réelles du club
(mêmes valeurs que les mocks du front : une seule vérité à terme).
Usage : python manage.py shell < fixtures/seed.py   (idempotent)
"""
from django.contrib.auth import get_user_model
from apps.accounts.models import Role, Cellule
from apps.governance.models import ObjectifPoste
from apps.comms.models import Actualite, Document
from apps.events.models import Evenement

User = get_user_model()

print('── Seed IT-CLUB EMSP ──')

# ─────────────────────────────────────────────────────────────
# 1. MEMBRES DU BUREAU (10 postes — noms des mocks du front)
# ─────────────────────────────────────────────────────────────
BUREAU = [
    ('P1',  'IVO ABDOUL RHAMANE NESTOR',   'ivo.abdoul@emsp.int',
        "Anime le Bureau et représente le club auprès de l'école et des partenaires. Publie l'ordre du jour.",
        'Faire passer le club de 40 à 100 membres actifs.'),
    ('P2',  'NASSIROU SALEY HAMIDA',        'nassirou.saley@emsp.int',
        "Supplée le Président. Coordonne les responsables et les cellules.",
        'Lancer le suivi hebdomadaire des projets techniques.'),
    ('P3',  'ABBA KAKA ZARA KOUROU',        'abba.kakazara@emsp.int',
        "Gère les comptes rendus, le registre des membres et les convocations H-48h.",
        'Numériser tout le registre avant la fin du semestre.'),
    ('P4',  'SILUE FOUNGNIGUE YAYA',        'silue.foungnigue@emsp.int',
        "Crée et suit les cellules thématiques. Nomme les chefs de cellule.",
        'Des cellules actives toute l’année.'),
    ('P5',  'CISSE DJENIN',                 'cisse.djenin@emsp.int',
        "Anime les réseaux sociaux, le site et la newsletter du club.",
        'Visibilité maximale du club sur le campus.'),
    ('P6',  'SAÏDOU SAMBA FATOUMA ZAHRA',   'saidou.samba@emsp.int',
        "Organise ateliers, hackathons et sorties. Gère les inscriptions.",
        'Un événement par mois, sans exception.'),
    ('P7',  'OUATTARA IBRAHIM',             'ouattara.ibrahim@emsp.int',
        "Projets internes, R&D, prototypes et solutions techniques.",
        '3 prototypes présentés cette année.'),
    ('P8',  'SAVADOGO RAZAKIM',             'savadogo.razakim@emsp.int',
        "Démarche entreprises, écoles et ONG pour les membres.",
        '5 partenaires actifs signés.'),
    ('P9',  'KARIDIOULA SIE ILYASS YOUSSEF','karidoula.sie@emsp.int',
        "Planifie ateliers, mentorat et veille. Tenir le calendrier.",
        '100% des membres formés sur les bases.'),
    ('P10', 'Responsable des Ateliers',     'ateliers@emsp.int',
        "Conçoit les fiches types d'ateliers et les feuilles de présence.",
        'Un atelier hebdomadaire par cellule.'),
]

for code, nom, email, mission, objectif in BUREAU:
    parts = nom.split()
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email.split('@')[0].replace('.', '_'),
            'first_name': parts[0] if parts else nom,
            'last_name': ' '.join(parts[1:]),
        },
    )
    if created:
        # Bootstrap prod : mot de passe temporaire à changer à la 1re connexion
        # (doc 09 §2). Jamais réinitialisé si le compte existe déjà.
        user.set_password('ITClub2026!')
        user.save(update_fields=['password'])
    elif not (user.password or '').startswith('!'):
        pass  # le membre a déjà son mot de passe : on n'y touche pas
    else:
        # Compte seed créé avant le bootstrap (mdp inutilisable) → réparé
        # à chaque déploiement, jusqu'à ce que le membre se connecte.
        user.set_password('ITClub2026!')
        user.save(update_fields=['password'])
    # Titulaire du poste
    role, role_created = Role.objects.get_or_create(
        code=code,
        defaults={'titulaire': user},
    )
    if role_created or not role.titulaire:
        role.titulaire = user
        role.save(update_fields=['titulaire'])
    # Mission + objectif (governance)
    ObjectifPoste.objects.update_or_create(
        role_code=code,
        defaults={'mission': mission, 'objectif': objectif},
    )
    print(f'  {"＋" if role_created else "·"} {code}  {nom}')

# ADMIN au Président (P1) — transférable ensuite via backoffice Admin.
try:
    _p1 = User.objects.get(email__iexact='ivo.abdoul@emsp.int')
    Role.objects.update_or_create(code='ADMIN', defaults={'titulaire': _p1})
    print('  · ADMIN  ivo.abdoul@emsp.int')
except User.DoesNotExist:
    print('  ! P1 absent — ADMIN non attribué')

# ─────────────────────────────────────────────────────────────
# 2. CELLULES (4 — charte et icônes du front)
# ─────────────────────────────────────────────────────────────
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

for slug, nom, desc, programme, coul, fonce, icone, ordre in CELLULES:
    cell, created = Cellule.objects.update_or_create(
        slug=slug,
        defaults={'nom': nom, 'description': desc, 'programme': programme,
                  'couleur': coul, 'couleur_fonce': fonce, 'icone': icone, 'ordre': ordre},
    )
    print(f'  {"＋" if created else "·"} Cellule {nom}')

# ─────────────────────────────────────────────────────────────
# 3. ACTUALITÉS (2 — celles du front, extraites proprement)
# ─────────────────────────────────────────────────────────────
ACTUS = [
    ('Vibeathon 2.0 — les inscriptions sont ouvertes',
     '48h de code, de design et de pitch. Équipes de 4, toutes les cellules mélangées.',
     'web'),
    ('Nouvelle charte graphique adoptée',
     "Le Design a livré la nouvelle identité : logo, couleurs, typographies. Elle s'applique à tous les supports.",
     'design'),
]

p1 = User.objects.filter(email='ivo.abdoul@emsp.int').first()
for titre, extrait, slug_cell in ACTUS:
    cellule = Cellule.objects.filter(slug=slug_cell).first()
    act, created = Actualite.objects.get_or_create(
        titre=titre,
        defaults={'extrait': extrait, 'auteur': p1, 'tag_cellule': cellule},
    )
    print(f'  {"＋" if created else "·"} Actualité : {titre[:44]}…')

# ─────────────────────────────────────────────────────────────
# 4. DOCUMENTS (4 — fichiers réellement présents dans public/documents/)
# ─────────────────────────────────────────────────────────────
DOCS = [
    ('charte', 'Charte du club', 'Nos valeurs, notre façon de travailler ensemble.', 'fondamentaux', 'Charte_IT_CLUB_EMSP.pdf', '#1FAF72'),
    ('reglement', 'Règlement intérieur', 'Les règles du jeu, simples et claires.', 'fondamentaux', 'IT-CLUB EMSP.pdf', '#1FAF72'),
    ('missions', 'Rôles et missions', 'Qui fait quoi au Bureau — détaillé poste par poste.', 'vie', 'Doc1_Roles_Missions_Nominations.docx', '#2563EB'),
    ('pv1', 'PV Réunion 1', "Compte rendu de la réunion d'installation du Bureau.", 'archives', 'Compte_Rendu_Reunion_1_IT_Club_EMSP.docx.pdf', '#7B61FF'),
]

for slug, titre, desc, famille, fichier, coul in DOCS:
    d, created = Document.objects.update_or_create(
        slug=slug,
        defaults={'titre': titre, 'description': desc, 'famille': famille,
                  'fichier': f'documents/{fichier}', 'couleur': coul},
    )
    print(f'  {"＋" if created else "·"} Document : {titre}')

# ─────────────────────────────────────────────────────────────
# 5. ÉVÉNEMENTS (2 — prochains du front)
# ─────────────────────────────────────────────────────────────
EVENTS = [
    ('Atelier Git & GitHub', 'Versionner son code, collaborer, publier. Apporte ton laptop.',
     'atelier', '2026-10-12T15:00:00+00:00', 'Salle info 2', 25, '#2563EB', 'ampoule'),
    ('Hackathon interne — 48h', 'Construis une app de A à Z avec ta cellule. Jury : le Bureau + invités.',
     'competition', '2026-10-25T09:00:00+00:00', 'Amphi A', 60, '#1FAF72', 'trophee'),
]

for titre, desc, type_e, date_debut, lieu, places, coul, icone in EVENTS:
    e, created = Evenement.objects.update_or_create(
        titre=titre,
        defaults={'description': desc, 'type': type_e, 'date_debut': date_debut,
                  'lieu': lieu, 'places': places, 'couleur': coul, 'icone': icone},
    )
    print(f'  {"＋" if created else "·"} Événement : {titre}')

print('── Seed terminé (idempotent : relançable sans doublons) ──')
