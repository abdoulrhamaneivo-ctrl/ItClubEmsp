# 04 — Architecture back-end (Django) & API

## 1. Vue d'ensemble

```
                    ┌──────────────────────────────┐
  PWA React ────────┤                              │
  (doc 05)   REST ──┤  Django + DRF                │── PostgreSQL
             JWT    │  ├─ apps métier              │── Redis (channels/celery)
  Web admin ──sess.─┤  ├─ permissions par rôle     │── stockage fichiers
  WebSocket ────────┤  ├─ Channels (chat, notifs)  │
  iCal export ──────┤  └─ tâches planifiées        │── SMTP (emails)
                    └──────────────────────────────┘
```

Le back-end sert : l'API REST consommée par la PWA/le front, les WebSockets
(chat + notifications temps réel), l'export iCal, et un Django Admin réservé à l'A5.

## 2. Structure du projet

```
emspclub/
├── manage.py
├── config/                  # projet Django
│   ├── settings/            # base.py, dev.py, prod.py
│   ├── urls.py
│   ├── asgi.py              # Channels
│   └── celery.py
├── apps/
│   ├── accounts/            # User custom, rôles, permissions, adhésion
│   ├── cells/
│   ├── comms/               # annonces, réactions, commentaires
│   ├── forum/
│   ├── events/              # événements, inscriptions, présences, retours
│   ├── planning/            # calendrier, conflits, recap hebdo, iCal
│   ├── workshops/
│   ├── resources/           # bibliothèque, projets, veille, opportunités
│   ├── governance/          # objectifs, comptes rendus, convocations
│   ├── notifications/
│   ├── gamification/
│   ├── polls/
│   ├── chat/
│   └── core/                # AuditLog, Fichier, utilitaires, services partagés
├── fixtures/                # roles.json, permissions.json, badges.json
├── templates/emails/
└── docs/                    # CE dossier de spécifications
```

Règle : la logique métier (règles RG) vit dans des **services** (`apps/<app>/services.py`),
pas dans les vues ni dans les contrôleurs front.

## 3. Stack & dépendances (pyproject/requirements)

| Paquet | Rôle |
|---|---|
| django>=5,<6 | socle |
| djangorestframework | API |
| djangorestframework-simplejwt | auth JWT PWA |
| django-filter | filtres API |
| drf-spectacular | schéma OpenAPI (contrat pour le front) |
| channels + daphne/uvicorn[standard] | WebSocket |
| celery + redis | tâches planifiées (rappels, recap hebdo) |
| django-storages | S3-compatible en prod |
| psycopg[binary] | PostgreSQL prod |
| python-dateutil, icalendar | iCal import/export |

## 4. Authentification & permissions

- **Sessions** Django pour le site web classique et `/admin`.
- **JWT** (access 30 min / refresh 7 j) pour l'API consommée par la PWA.
- Couche permission centrale `apps/accounts/permissions.py` :

```python
def has_perm(user, code: str, obj=None) -> bool:
    """Vérifie les Permission du rôle actif de user.
    scope_cellule: CHEF_CELLULE ne passe que si obj.cellule == scope."""
```

- DRF : classe `RolePermission(BasePermission)` qui lit le code requis déclaré par vue :
  `permission_codes = ["annonce.create_officielle"]`.
- Le flag `interim` du rôle VP ajoute dynamiquement les codes du Président.

## 5. Endpoints API (REST, préfixe `/api/v1/`)

Convention : ViewSets DRF + routers ; sérializers par app ; pagination standard ;
filtres via django-filter ; OpenAPI auto (drf-spectacular).

### accounts
- `POST /auth/register-candidature` — formulaire d'adhésion public (throttle anti-spam)
- `POST /auth/token`, `/auth/token/refresh` — JWT
- `GET/PATCH /me` — profil, préférences notifications
- `GET /me/roles`, `GET /me/badges`
- `GET/POST /candidatures` (SG/P4), `POST /candidatures/{id}/valider|refuser`
- `GET/POST /roles`, `POST /roles/{id}/titulaire` (admin/passation)
- `POST /roles/vp/interim` (activer/désactiver)

### cells
- CRUD `/cellules` (lecture publique vitrine, écriture P4)
- `POST /cellules/{id}/membres` (chef/P4), `GET /cellules/{id}/membres`

### comms
- `GET /annonces?audience=…` (filtrage visibilité côté serveur)
- `POST /annonces`, `PATCH/DELETE /annonces/{id}` selon rôle
- `POST /annonces/{id}/reactions`, `/annonces/{id}/commentaires`

### forum
- `/espaces`, `/espaces/{id}/sujets`, `/sujets/{id}/messages`, modération PATCH

### events
- CRUD `/evenements` (+ `GET /evenements?a_venir=1`)
- `POST /evenements/{id}/inscriptions` (gère liste d'attente), `DELETE` = désinscription
- `GET /evenements/{id}/feuille-presence`, `POST /evenements/{id}/emarger` (code ou QR)
- `POST /evenements/{id}/retours`, `PUT /evenements/{id}/bilan`
- `GET /evenements/{id}/export-presences.csv`

### planning
- `GET /calendrier?de=&a=` — vue agrégée club + cellules + externes
- `GET/POST /sources-externes` (admin/P9), import iCal asynchrone
- `POST /calendrier/check-conflits` — appelé au formulaire de création
- `GET /ical/moi.ics` — abonnement privé (token par utilisateur)

### workshops
- `GET /ateliers/prochains?limit=4`, CRUD fiches types, duplication

### resources
- `/ressources` (+upload multipart), `/projets`, `/opportunites` (PATCH statut kanban),
  `/contacts-externes` (P8/admin), `/veille` (ressources type=veille + votes)

### governance
- `/objectifs` (progression auto recalculée), `/comptes-rendus` (+ workflow valider/publier),
  `/modeles-courriers`
- `GET /dashboard/global` (Président/P2 : widgets agrégés)

### notifications
- `GET /notifications`, `POST /notifications/lire`, préférences dans `/me`
- WebSocket : `ws://.../ws/notifications/` — poussées temps réel

### chat, polls, gamification
- WS `/ws/chat/<canal>/`, REST historique
- `/sondages`, `/sondages/{id}/votes`, résultats agrégés
- `/classement`, règles admin

## 6. Tâches planifiées (Celery beat)

| Tâche | Fréquence | Effet |
|---|---|---|
| rappels_evenements | toutes les 10 min | J-1 et H-2h aux inscrits |
| convocation_h48 | horaire | rappel H-48h des réunions Bureau |
| satisfaction_post_activite | toutes les 15 min | 1h après fin → aux présents |
| recap_hebdomadaire | dimanche 18:00 | email planning semaine suivante |
| import_calendriers_externes | 2×/jour | sync iCal académique |
| promotion_liste_attente | à la volée (signal) | place libérée → premier listé notifié |
| sauvegarde_db | quotidienne | dump + upload stockage, rotation 14 j |

Fallback sans Redis/Celery (petit hébergement) : management commands + cron système,
même logique dans `apps/<x>/management/commands/run_rappels.py`.

## 7. Emails transactionnels

Templates Jinja/Django dans `templates/emails/` : confirmation candidature, bienvenue/validation,
convocation + rappels, inscription confirmée/promotion liste d'attente, récap hebdo,
satisfaction. Expéditeur unique `noreply@…`, désinscription gérée par préférences profil.

## 8. Sécurité

- Throttling DRF sur endpoints publics (adhésion, login).
- Validation uploads (taille max 20 Mo, whitelist MIME), scans de nom de fichier.
- CORS restreint au domaine front ; CSRF pour surfaces session.
- Secrets uniquement via variables d'environnement (jamais dans le repo).
- AuditLog immuable sur : rôles/passation, publication/modération, validation adhésions.
- Backup chiffré quotidien (cf. §6) + procédure de restauration documentée.

## 9. Environnements & déploiement

| Env | But | Hébergement cible |
|---|---|---|
| local/dev | développement membres cellule Web | SQLite + runserver + Redis docker optionnel |
| staging | recette Bureau | Railway/Render free tier |
| prod | mise en ligne officielle | Railway/Render + Postgres managé + S3-compatible |

Dockerfile fourni ; `settings/prod.py` : DEBUG=False, HTTPS, HSTS, collectstatic.
Variables d'env : `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `SMTP_*`, `S3_*`.

## 10. Tests (exigence : chaque règle RG testée)

- pytest + pytest-django. Un test minimum par règle RG du doc 02.
- Tests de permissions transversaux : matrice doc 01 paramétrée (`@pytest.mark.parametrize`
  rôle × endpoint attendu OK/403).
- Tests temps réel : Channels `WebsocketCommunicator` (chat, notifications).
- Factories (factory-boy) pour users/rôles/événements.
