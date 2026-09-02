# IT-CLUB EMSP — Front-end

Vitrine publique du club, construite avec **React 19 + Vite + Material UI + framer-motion**.
Structure et conventions définies dans `../docs/05-frontend-pwa-desktop.md`.

## Lancer

```bash
# miroir npm recommandé sur ce réseau (registry.npmjs.org bloqué)
npm install --registry=https://registry.npmmirror.com --no-audit --no-fund

npm run dev      # développement (http://localhost:5200)
npm run build    # production → dist/
npm run preview  # tester le build
```

Le proxy Notion (`../tools/notion_proxy.py`, port 8787) est un service systemd
(`emsp-notion-proxy.service`) — tout-en-un possible via `../dev.sh`.

## Structure

```
src/
├── AppRoot.jsx / routes/AppRoutes.jsx   # routes : Vitrine, /galerie, /login, /espace, /backoffice/*
├── theme.js                             # thème MUI (vert #0F5B3A, émeraude #1FAF72, marine #0D1B2A)
├── data/
│   ├── mock.js · bureau.js · cellules.js · backoffice.js   # données + registre modules BO
│   ├── galerie.js                       # médias (photos + vidéos) — futur GET /api/v1/galerie/
│   └── formulaireConfig.js              # champs du formulaire d'adhésion — EDITABLES back-office
├── features/notion/                     # client proxy Notion + hook useNotionTasks
├── hooks/useApi.js                      # hooks données (mock fallback)
├── lib/api.js                           # couche API (mock dev → Django prod)
├── pages/
│   ├── Galerie.jsx                      # galerie complète : masonry, filtres, lightbox vidéos
│   ├── Login.jsx · Espace.jsx · RequireAuth.jsx
│   └── backoffice/
│       ├── BackofficeLayout.jsx         # menu dynamique par rôle (doc 05 §3)
│       ├── TachesNotion.jsx             # module Notion : lecture + écriture statuts (doc 07)
│       └── EditeurFormulaire.jsx        # éditeur des champs du formulaire d'adhésion
└── components/
    ├── navbar/                          # fixe, dégradé lisible au top, lien Galerie
    ├── hero/ · quisommesnous/ · bureau/ · cellules/
    ├── activites/ · actualites/ · documentation/
    ├── adhesion/Adhesion.jsx            # parcours 3 étapes animé, champs dynamiques
    └── ui-components/                   # DesignSystem, FondPropre, BandeauDefilant…
```

## Conventions d'animation (appliquées à toutes les sections)

- **Jamais d'opacité liée au calcul de scroll cible** (`useScroll target` + `useTransform
  opacity`) : sur des sections hautes elle reste à 0 → contenu invisible. Utiliser
  `whileInView` + `viewport={{ once: true }}`.
- Le Hero fonde son fade sur le scroll **fenêtre** (`useScroll()` sans target).
- Conteneurs de section : `<Container maxWidth={false} sx={{ maxWidth: '1440px !important', px: {xs:2.5, md:4} }}>`
  pour occuper l'espace sur grand écran.
- Carrousels : défilement réel (`scrollTo` centré sur la carte active), jamais un simple
  changement d'index visuel.

## Modules back-office implémentés (au-delà des placeholders)

| Route | Contenu |
|---|---|
| `/backoffice/taches-notion` | Tâches du club (base Notion) — changer les statuts en temps réel |
| `/backoffice/formulaire` | Éditeur du formulaire d'adhésion : ajouter/supprimer/réordonner des champs, obligatoire ou non, type du champ (texte, e-mail, tél, texte long, liste) |

La config du formulaire est persistée en `localStorage` (dev) ; en prod elle passera par
`PUT /api/v1/adhesion/form-config` (Django).

## Scanner qualité

```bash
python3 ../tools/scan_jsx.py   # détecte les imports manquants (hooks, composants JSX) dans tout src/
```

## Prochaines étapes

1. Brancher l'API Django (`POST /api/v1/auth/register-candidature` pour l'adhésion,
   `GET /roles`, `/cellules`, `/evenements`, `/galerie`…) — voir `../docs/04-architecture-backend-api.md`.
2. Upload réel des médias galerie (module P5 Communication).
3. PWA : manifest + service worker (doc 05 §5).
