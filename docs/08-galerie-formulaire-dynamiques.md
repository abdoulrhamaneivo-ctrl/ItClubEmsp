# 08 — Galerie & Formulaire dynamiques

> Complète les docs 05 (front) et 07 (module Notion). Statut : **implémenté côté front**,
> endpoints Django à venir.

## 1. Galerie (photos + vidéos)

### Front

- **Page dédiée `/galerie`** (navbar + raccourci « Voir toute la galerie » depuis la
  section Qui sommes-nous, aperçu 4 médias).
- Grille **masonry dynamique** (CSS columns), filtres par événement + par type
  (photos/vidéos), transitions `AnimatePresence` au filtrage.
- **Lightbox** : ouverture plein écran, navigation ←/→ entre médias, vidéos intégrées
  via YouTube embed (autoplay dans la lightbox).
- Les médias sans vraie photo affichent un **visuel dégradé de la charte + emoji** —
  la page reste belle même avant l'upload des vraies images.

### Données

`src/data/galerie.js` — structure identique à la future réponse Django :

```js
{ id, type: 'photo'|'video', evenement, date, titre, legende,
  src?: '/photos/…',        // photo réelle
  youtube?: 'ID',           // vidéo
  couleur, emoji }          // visuel placeholder de la charte
```

### Back-end à venir (doc 04)

| Besoin | Endpoint prévu |
|---|---|
| Liste des médias | `GET /api/v1/galerie/?evenement=&type=` |
| Upload (P5 Communication) | `POST /api/v1/galerie/` (multipart) |
| Suppression / réordre | `DELETE/PATCH /api/v1/galerie/{id}/` |

Le front bascule en changeant `mediasGalerie` → appel API dans `useApi`.

## 2. Formulaire d'adhésion dynamique

### Principe

Les champs du formulaire ne sont **plus codés en dur** : ils viennent d'une configuration
(`src/data/formulaireConfig.js`) que le Bureau édite depuis le back-office
(**/backoffice/formulaire** → « Éditer le formulaire »).

### Ce que l'éditeur permet (rôles P1/P7/P3/ADMIN)

- **Ajouter** un champ (« Ajouter un champ ») — texte court, e-mail, téléphone/WhatsApp,
  texte long, liste de choix (options éditables)
- **Supprimer** n'importe quel champ
- **Réordonner** (flèches ↑/↓, réordonnancement animé)
- **Rendre obligatoire ou non** (switch)
- **Choisir l'étape** : Étape 1 (Qui es-tu ?) ou Étape 3 (Compléments)
- Texte d'aide / placeholder par champ
- **Réinitialiser** aux champs par défaut · **Enregistrer** (validation : IDs uniques,
  étape 1 non vide)

Le formulaire public (`components/adhesion/Adhesion.jsx`) lit la config à chaque
affichage : rendu dynamique des champs, validation selon `requis`/`type`, payload
envoyé au back = paires `id → valeur` + `cellules[]` + conditions.

### Persistance

| Environnement | Stockage |
|---|---|
| Dev (actuel) | `localStorage['adhesion_form_config']` |
| Prod (à venir) | `GET/PUT /api/v1/adhesion/form-config` (Django, permission P1/P7) |

Le contrat de champ (identique partout) :

```js
{ id, label, type: 'text'|'email'|'tel'|'textarea'|'select',
  groupe: 'identite'|'complement', requis: bool, options?: string[], aide?: string }
```

## 3. Corrections d'affichage livrées dans la même passe

| Problème | Cause | Correction |
|---|---|---|
| Contenu décalé à droite, gauche vide | `Container` MUI plafonné à ~1170px | Sections en `maxWidth={false}` + cap 1440px |
| Carrousel Bureau « ne fonctionne pas » | Décalage en % de la largeur de carte → cartes empilées | Translation en px réels + pointer-events masqués hors zone |
| Carrousel Cellules figé | Les flèches changeaient l'index sans défiler la piste | `scrollTo` centré sur la carte active + snap |
| Navbar invisible en haut | Hero à 30% d'opacité au chargement | Fade du Hero sur le scroll fenêtre + dégradé navbar |
| Sections vides | Opacité liée au scroll cible (0 sur sections hautes) | `whileInView` garanti (voir README, conventions) |
