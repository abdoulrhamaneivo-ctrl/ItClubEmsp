# IT-CLUB EMSP — Plateforme du club

Dossier de **spécifications et d'analyse** (pas encore de code). Le back-end Django
sera implémenté à partir de ce dossier ; le front (React/PWA) est spécifié séparément.

## Comment lire ce dossier

| Doc | Contenu |
|---|---|
| [00-vision-perimetre.md](00-vision-perimetre.md) | Vision, périmètre v1, décisions techniques |
| [01-roles-permissions.md](01-roles-permissions.md) | Acteurs, 10 postes du Bureau, matrice de permissions |
| [02-specs-fonctionnelles.md](02-specs-fonctionnelles.md) | Spécifications détaillées par domaine (D1-D14), règles RG |
| [03-modele-donnees.md](03-modele-donnees.md) | Modèle de données complet (tables, champs, relations) |
| [04-architecture-backend-api.md](04-architecture-backend-api.md) | Architecture Django, endpoints API, tâches planifiées, sécurité, tests |
| [05-frontend-pwa-desktop.md](05-frontend-pwa-desktop.md) | Structure front React, PWA installable, desktop |
| [06-plan-mise-en-oeuvre.md](06-plan-mise-en-oeuvre.md) | Phasage d'implémentation + critères de validation |

Source métier : `Cahier_des_charges_Plateforme_Club_Info.pdf` (à la racine).

## Stack arrêtée

Django 5 + DRF (back-end complet) · PostgreSQL · Channels/Celery · React+Vite PWA
(structure documentée, non implémentée ici) · PWA installable = couverture desktop.

## Pour l'implémentation back-end

Donner ce dossier `docs/` en contexte et suivre `06-plan-mise-en-oeuvre.md` phase par phase.
