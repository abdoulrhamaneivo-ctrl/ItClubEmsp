# 03 — Modèle de données

Convention : noms Django. Toutes les tables portent `created_at` / `updated_at`.
Les modèles vivent dans les apps listées en doc 04 §2.

## 1. Comptes & rôles — app `accounts`

### User (AbstractUser)
| Champ | Type | Notes |
|---|---|---|
| email | EmailField unique | identifiant de connexion |
| prenom, nom | CharField | |
| photo | ImageField null | |
| filiere, niveau | CharField blank | ex. « Digitalisation des services, 2e année » |
| telephone_whatsapp | CharField blank | |
| bio | TextField blank | |
| statut_membre | enum: `actif/inactif/fondateur` | fondateurs = registre SG |
| points | IntegerField default 0 | gamification |

### Role
`code` (P1..P10, CHEF_CELLULE, ADMIN), `nom`, `mission_resume` (texte vitrine),
`titulaire_actuel` FK User null — le poste « vacant » est possible.
Un poste = UNE ligne ; la passation change `titulaire_actuel`.

### UserRole
FK User + FK Role + `scope_cellule` FK Cellule null (pour CHEF_CELLULE)
+ `interim` Boolean default False (VP) + `date_debut/date_fin` (historique passation).
Contrainte : un seul titulaire actif par Role (sauf CHEF_CELLULE, par cellule).

### Permission
`code` (`domaine.action`, cf. doc 01), `description`. Table `RolePermission` (M2M).

### CandidatureAdhesion
`prenom/nom/email/telephone/filiere/niveau/motivation`, `cellules_souhaitees` M2M Cellule,
`statut` (`en_attente/validee/refusee`), `source` (`web/qr`),
`traitee_par` FK User null, `traitee_le` datetime null.
→ à la validation : création/activation du compte User lié.

## 2. Cellules & membres — app `cells`

### Cellule
`nom`, `slug`, `description`, `fiche_presentation` (rich text), `couleur` (hex, thème UI),
`active` bool. Règle : signalée « en sommeil » si < 3 membres actifs (propriété calculée).

### CelluleMembership
FK User + FK Cellule + `role_dans_cellule` (`chef/membre`) + `actif` bool + dates.
Un membre peut être dans plusieurs cellules.

## 3. Communication — app `comms`

### Annonce
`titre`, `corps` (markdown), `type` (`officielle/post/cellule`), `audience_cellule` FK null,
`epinglee` bool, `publiee_le` datetime null (programmation), `auteur` FK User,
`pieces_jointes` M2M Fichier, `affiche` ImageField null.
Visibilité calculée : publique si officielle/post ; sinon membres de la cellule.

### Reaction : FK Annonce, FK User, `emoji`. Unique(User, annonce, emoji).
### Commentaire : FK Annonce, FK User auteur, `contenu`, FK self `reponse_a` null, `masque` bool.

## 4. Forum — app `forum`

- **ForumEspace** : `type` (`cellule/projet`), FK cible (Cellule ou Projet), nom.
- **Sujet** : FK espace, FK User auteur, `titre`, `epingle`, `verrouille`, `derniere_activite`.
- **Message** : FK sujet, FK User, `contenu` markdown, `modere` bool. Mentions parsées → notifications.

## 5. Événements — app `events`

### Evenement
`titre`, `type` (`atelier/reunion_bureau/reunion_cellule/competition/hackathon/autre`),
`description`, `debut/fin` datetime, `lieu`, `intervenants` M2M User, `prerequis`,
`places_max` int null (null = illimité), `checklist_logistique` JSON (items {label, fait}),
`statut` (`brouillon/publie/annule/termine`), `cellule` FK null (null = club entier),
`cree_par` FK User, `visible_public` bool.

### Inscription
FK Evenement + FK User, `statut` (`confirme/liste_attente/desinscrit`),
unique(User, evenement). Propriété `places_restantes` sur Evenement.

### Presence
FK Evenement + FK User, `present` bool, `mode_emargement` (`code/qr`), `horodatage`.
Unique(User, evenement).

### RetourActivite
FK Evenement + FK User, `note` 1–5, `commentaire`, unique par couple.

### Bilan : FK Evenement one-to-one, `contenu` markdown, `publie` bool.

## 6. Calendrier — app `planning`

### SourceCalendrierExterne : `nom`, `url_ical`, `active` (calendrier académique EMSP).
### EvenementExterne (import iCal) : uid, titre, debut/fin, source FK.
Détection conflit = chevauchement temporel entre Evenement et Evenement/EvenementExterne.
### RecapHebdoLog : date_envoi, destinataires count (traçabilité).

## 7. Ateliers — app `workshops`
Réutilise Evenement (`type=atelier`) via modèle profil :

### AtelierInfo : FK Evenement one-to-one + `objectif_pedagogique`, `materiel_requis`,
`serie_recurrence` CharField null, `fiche_type_source` FK self null (duplication).

## 8. Ressources & projets — app `resources`

### Fichier : fichier FileField, `nom`, `taille`, `mime`, uploade_par.
### Ressource : `titre`, `type` (`document/lien/tutoriel/code/veille`), lien URL null,
fichier FK null, tags M2M Tag, cellule FK null, visible_membres_only bool.
### Tag : nom unique, slug.
### Projet : `nom`, `slug`, description, `statut` (`idee/en_cours/en_pause/livre`),
cellules M2M, porteurs M2M User, `avancement_pct` int, captures M2M Fichier, `lien_repo`,
`lien_demo`, `presentable_portfolio` bool.
### Opportunite : `titre`, type (`hackathon/conference/partenariat/autre`), description,
`date_limite` date null, lien, `statut_kanban` (`reperee/interessante/partagee/close`),
`ajoutee_par` FK User.
### ContactExterne : nom, organisation, email, telephone, notes. Accès P8/Admin.

## 9. Gouvernance — app `governance`

### ObjectifPoste : FK Role, `libelle`, `indicateur` (`manuel/taux_participation/nb_activites/
nb_membres_cellule/abonnes_reseaux`), `cible` decimal, `valeur_manuelle` null,
`progression_auto` bool (calculée depuis les données réelles), `echeance` date.
### CompteRendu : `titre`, `date_reunion`, `contenu` markdown, PJ M2M Fichier,
`statut` (`redaction/valide/publie`), `redige_par`, `valide_par` null.
### ModeleCourrier : titre, fichier/template, categorie.

## 10. Notifications & audit — apps `notifications`, `core`

### Notification : FK User destinataire, `type`, `titre`, `corps`, `lien` (route in-app),
`lu` bool, `lu_le`. Index (user, lu, -created_at).
### AuditLog : FK User acteur, `action`, `objet_type`, `objet_id`, `details` JSON. Immuable.
### RegleGamification : `code_evenement`, `points`. Badge : nom, icône, critère (auto json / manuel). UserBadge : FK User+Badge, date.
### Sondage : question(s) JSON, `anonyme` bool, dates ouverture, cellule FK null, createur.
VoteSondage : FK sondage+User unique, choix JSON.

## 11. Chat (bonus) — app `chat`

Canal (`type`: cellule/projet, FK cible) → MessageChat (FK canal, FK User, contenu, horodatage). Consommateur WebSocket par canal.

## 12. Relations clés (schéma logique)

```
User ─┬─< UserRole >─ Role ─< RolePermission >─ Permission
      ├─< CelluleMembership >─ Cellule
      ├─< Inscription >─ Evenement ─┬─< Presence
      │                             ├─ AtelierInfo (1-1)
      │                             ├─ Bilan (1-1)
      │                             └─< RetourActivite
      ├─< Annonce (auteur) ─< Reaction / Commentaire
      ├─< Message (forum) >─ Sujet >─ ForumEspace
      ├─< Notification
      └─< UserBadge >─ Badge

CandidatureAdhesion >─ Cellule        ObjectifPoste >─ Role >─ User (titulaire_actuel)
CompteRendu                           Projet >< Cellule, Projet >< User (porteurs)
```

## 13. Principes d'implémentation pour Claude

1. Chaque règle RG du doc 02 devient soit une contrainte DB, soit une méthode de modèle
   (`clean()`), soit une règle de serializer — avec test dédié.
2. Visibilité : centraliser dans une couche de querysets/services (jamais dispersée dans les vues).
3. Tout changement sensible (rôles, publications, modération) écrit dans `AuditLog`.
4. Migrations initiales chargées via fixtures : 10 rôles P1-P10 + permissions de la matrice doc 01.
5. PostgreSQL FTS pour recherche (annonces, forum, ressources) ; fallback `icontains` SQLite en dev.
