# 07 — Module Notion : tâches du club dans le back-office

> Statut : **implémenté** (front + proxy local). Ce doc explique le fonctionnement,
> les choix de sécurité, et la migration prévue quand le back-end Django (doc 04) arrivera.

## 1. Ce que ça fait

Le module **« Tâches Notion »** du back-office (`/backoffice/taches-notion`) affiche
la base Notion **« Tâches »** du QG du Club et permet de **changer le statut d'une tâche
directement depuis l'interface** — l'écriture est répercutée dans Notion instantanément.

- Lecture temps réel : statut, priorité, échéance de chaque tâche
- Écriture : statut uniquement (À faire / En cours / Terminé) — whitelist stricte
- Fallback hors-ligne : cache localStorage → jeu de démo (la page ne casse jamais)
- Mise à jour optimiste : l'UI réagit immédiatement, rollback automatique si Notion refuse

## 2. Architecture (pourquoi un proxy ?)

```
┌──────────────┐   HTTP    ┌─────────────────────┐   HTTPS    ┌──────────────┐
│ Navigateur   │ ────────► │ notion_proxy.py     │ ─────────► │ API Notion   │
│ (React/Vite) │  :8787    │ tools/notion_proxy  │  token     │ (QG du Club) │
└──────────────┘  localhost└─────────────────────┘  serveur   └──────────────┘
```

**Le token Notion ne doit JAMAIS arriver dans le navigateur.** Un token côté client est
lisible par n'importe quel visiteur (devtools, bundle JS). Il vit uniquement dans
`~/.hermes/.env` (référencé par le proxy). C'est le même modèle que le futur back Django :
le front appelle une API interne, jamais Notion directement.

- Le proxy n'écoute que sur `127.0.0.1` (pas d'accès depuis le réseau).
- CORS restreint à `http://localhost:5173` (le dev server Vite).
- `PATCH` n'accepte que `{"statut": ...}` avec validation serveur (pas de titre,
  pas de relations, pas de suppression depuis le front).

## 3. Fichiers

| Fichier | Rôle |
|---|---|
| `tools/notion_proxy.py` | Proxy HTTP stdlib (aucune dépendance). `python3 tools/notion_proxy.py` |
| `frontend/src/features/notion/notionApi.js` | Client du proxy + fallback cache/démo |
| `frontend/src/features/notion/useNotionTasks.js` | Hook : chargement, PATCH optimiste, rollback |
| `frontend/src/pages/backoffice/TachesNotion.jsx` | Écran du module (MUI + framer-motion) |
| `frontend/src/data/backoffice.js` | Entrée de menu `taches-notion` (rôles P1/P2/P3/ADMIN) |

## 4. Lancer en dev

```bash
# Terminal 1 — proxy Notion (port 8787)
python3 tools/notion_proxy.py

# Terminal 2 — front (port 5173)
cd frontend && npm install && npm run dev
```

Puis : se connecter (`/login`, n'importe quel identifiants en mode mock) →
**Back-office → Tâches Notion**.

Endpoints du proxy :

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/notion/health` | Token présent ? |
| GET | `/api/notion/meta` | Options statut/priorité de la base |
| GET | `/api/notion/tasks` | Liste des tâches (JSON simplifié, tri : en cours → échéance) |
| PATCH | `/api/notion/tasks/{id}` | `{"statut": "En cours"}` — statuts whitelistés |

## 5. Sources de données (fallback en cascade)

1. **`notion`** — proxy joignable : données temps réel, lecture + écriture.
2. **`cache`** — proxy injoignable mais cache localStorage existant : lecture seule,
   bandeau orange « hors-ligne ».
3. **`demo`** — ni proxy ni cache : jeu de démo statique, bandeau rouge.

Le statut de la source est affiché en haut du module. Aucun cas ne casse l'UI.

## 6. Migration vers Django (doc 04)

Quand le back-end livrera ses endpoints, le proxy Python est remplacé par :

| Proxy actuel | Future route Django |
|---|---|
| `GET /api/notion/tasks` | `GET /api/v1/taches/` (sync Notion côté serveur, Celery beat) |
| `PATCH /api/notion/tasks/{id}` | `PATCH /api/v1/taches/{id}/` (permission par rôle) |

Côté front, seule la constante `PROXY` de `notionApi.js` change (une URL).
La doc 04 recommande à terme de **migrer les données Notion → PostgreSQL** et de garder
Notion comme outil de visualisation ; ce module continuera alors de fonctionner sans
changement d'interface.

## 7. Limites connues (v1)

- Écriture limitée au champ Statut (priorité/échéance : étendre la whitelist du proxy
  et le formulaire si besoin).
- Pas de création de tâche depuis le front (création dans Notion, lecture ici).
- Le tri et les filtres avancés restent à faire côté client (cols triables).
- Si deux personnes modifient la même tâche en même temps, la dernière écriture gagne
  (pas de verrou — acceptable pour 10 utilisateurs).
