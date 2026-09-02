# 05 — Front-end : structure, PWA, desktop

> Rappel de la décision d'Ivo : le front n'est **pas implémenté dans ce dépôt** — ce doc
> fixe la structure et les conventions pour que l'équipe (ou Claude) puisse le construire
> sans re-discuter les choix. Le back-end (doc 04) est livré indépendamment et testable
> via l'OpenAPI (`/api/schema/`).

## 1. Choix

- **React 18 + Vite + TypeScript**, React Router, TanStack Query (cache serveur),
  Tailwind CSS, Zustand (état client léger).
- Une seule base de code → site web + PWA + coquille desktop optionnelle.

## 2. Arborescence

```
frontend/
├── public/
│   ├── manifest.webmanifest      # PWA
│   ├── icons/                    # 192/512, maskable
│   └── sw.js                     # service worker (Workbox)
├── src/
│   ├── app/                      # routes, layout shell
│   │   ├── routes.tsx
│   │   └── layouts/PublicLayout.tsx / MemberLayout.tsx / BackofficeLayout.tsx
│   ├── pages/
│   │   ├── public/               # Accueil, Organigramme, Cellules, Activités, Veille, Adhésion
│   │   ├── member/               # Profil, Fil annonces, Forum, Calendrier,
│   │   │                         # Événement(fiche), Mes inscriptions, Ressources,
│   │   │                         # Opportunités, Notifications, Classement
│   │   └── backoffice/           # un module par poste (voir §4)
│   ├── features/<domaine>/       # composants métier + hooks API par domaine
│   ├── lib/api/                  # client HTTP (fetch), types générés depuis OpenAPI
│   ├── stores/                   # auth store, notifications store (WS)
│   └── components/ui/            # design system (boutons, cartes, modales…)
└── package.json
```

Règle : les pages orchestrent, la logique vit dans `features/<domaine>/` (hooks + composants).

## 3. Zones d'interface

1. **Vitrine publique** — sans connexion ; charte graphique du club (logo/couleurs fournis
   par la Resp. Communication) ; mobile-first.
2. **Espace membre** — layout avec barre latérale (web) / onglets bas (mobile PWA) :
   fil d'annonces, calendrier, forum, mes activités, ressources.
3. **Back-office par rôle** — le menu du back-office est **dynamique** : construit à partir
   de `GET /me/roles` (codes de permission renvoyés par le back). Un membre du Bureau ne
   voit que SES outils. C'est la traduction UI de « back-office modulaire par rôle ».

## 4. Modules back-office ↔ postes

| Route backoffice | Poste | Contenu |
|---|---|---|
| `/bo/annonces` | P1, P5 (+P3 cellule) | composer/fil officiel, programmation, épinglage |
| `/bo/dashboard` | P1, P2 | widgets objectifs, activité par poste, effectifs |
| `/bo/projets-suivi` | P2, P7 | tableau projets (statut, avancement) |
| `/bo/comptes-rendus` | P3, P1 | rédiger, valider, publier, archiver ; convocations |
| `/bo/registre-membres` | P3, P4 | registre complet, fondateurs, validation candidatures |
| `/bo/cellules` | P4 | créer/gérer cellules, nommer chefs, fiche recrutement |
| `/bo/communication` | P5 | posts/affiches, galerie, calendrier éditorial, réseaux sociaux |
| `/bo/evenements` | P6 | fiches, checklist, places, retours, bilans |
| `/bo/adhesion` | P7 | formulaire, QR code (télécharger/imprimer), stats sources |
| `/bo/opportunites` | P8 | kanban opportunités, carnet contacts |
| `/bo/calendrier` | P9 | calendrier admin, sources externes, conflits, recap hebdo |
| `/bo/ateliers` | P10 | planning, fiches types, feuilles présence, satisfaction |
| `/bo/admin` | A5 | comptes, rôles/passation, configuration, audit, sauvegardes |

## 5. PWA

- `manifest.webmanifest` : name « IT-CLUB EMSP », standalone, thème = couleur charte.
- Service worker (Workbox) :
  - **precache** : shell de l'app ;
  - **runtime** : cache-first sur assets, network-first sur GET API (fallback page hors-ligne),
    jamais de cache sur POST/auth.
- Installable Android/iOS (« Ajouter à l'écran d'accueil ») et desktop Chrome/Edge.
- Notifications push : v1 = notifications in-app via WebSocket quand l'app est ouverte ;
  Web Push (VAPID) documenté comme amélioration ultérieure (nécessite clés serveur).

## 6. Desktop

**Priorité : la PWA installable couvre le besoin desktop** (fenêtre dédiée, icône dock/barre).

Coquille native optionnelle (documentée, non prioritaire) :

- **Tauri 2** recommandé (binaire léger ~10 Mo vs Electron ~150 Mo) : pointe l'URL prod,
  ajoute icônes natives et ouverture au démarrage. Aucune duplication de code.
- Electron uniquement si besoin de modules Node spécifiques — pas le cas ici.

## 7. Conventions UI

- Charte du club : variables CSS (`--club-primary`, `--club-accent`) alimentées par la
  configuration (charte gérable par P5 côté back-office).
- Responsive : mobile ≤ 768 px prioritaire (étudiants) ; tables back-office en cartes sur mobile.
- Accessibilité de base : contrastes, labels de formulaires, focus visibles.
- Langue : français unique.
- Performance : code-splitting par route, images lazy, budget < 3 s (cahier des charges §5.2).

## 8. Contrat avec le back-end

- Types TS **générés** depuis l'OpenAPI (`openapi-typescript`) — jamais écrits à la main.
- Auth JWT stockée en mémoire + refresh silencieux ; 401 → redirection login.
- WebSocket notifications : reconnexion automatique exponentielle.
