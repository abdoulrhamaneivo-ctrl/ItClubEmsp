# 01 — Acteurs, rôles & matrice de permissions

## 1. Principe directeur (cahier des charges §3.3)

> Le back-office doit être **modulaire par rôle**, et non un simple accès « admin » générique.

Implémentation : un utilisateur peut cumuler **plusieurs rôles** (ex. Président + membre
cellule IA). Chaque rôle ouvre des **permissions** précises. Un poste du Bureau = un rôle
nommé ; le titulaire change chaque année, les permissions restent.

```
User ──< UserRole >── Role ──< RolePermission >── Permission
              │
              └── scope optionnel : cellule (pour chef de cellule)
```

## 2. Les acteurs

| # | Acteur | Authentifié | Description |
|---|---|---|---|
| A1 | Visiteur | non | Consulte vitrine, organigramme, cellules, activités publiques ; remplit le formulaire d'adhésion |
| A2 | Membre adhérent | oui | Espace perso, cellules, annonces, inscriptions, présence, forum, ressources, sondages |
| A3 | Chef de cellule | oui | Rôle intermédiaire nommé par le Resp. Cellules ; anime sa cellule (scope = 1 cellule) |
| A4 | Membre du Bureau (10 postes) | oui | Permissions propres à son poste |
| A5 | Administrateur | oui | Webmaster : tout + gestion technique, rôles, passation |

## 3. Les 10 postes du Bureau → permissions

Codes de permission au format `domaine.action`. La matrice ci-dessous est la référence
d'implémentation — Claude la transcrit en fixtures Django.

### P1 — Président
- `annonce.create_officielle`, `annonce.publish`
- `mission.valide_fiche`, `mission.diffuse`
- `dashboard.vue_globale` (activité de chaque poste, objectifs atteints)
- `compterendu.gere_reunions_bureau`

### P2 — Vice-Présidente
- `projet.suivi_technique` (tableau de suivi des projets)
- `dashboard.coordination_inter_postes`
- `president.interim` (hérite des droits du Président quand activé par l'admin/Président)

### P3 — Secrétaire Générale
- `compterendu.redige`, `compterendu.publie`
- `modele_courrier.gere` (modèles officiels)
- `registre_membres.consulte_edite` (y compris fondateurs)
- `archive.depose_documents_officiels`
- `convocation.envoie` (avec rappel automatique 48h avant réunion)

### P4 — Responsable des Cellules
- `cellule.cree_gere`
- `chef_cellule.nomme_revoked`
- `cellule.fiche_presentation` (fiche recrutement publique)
- `sondage.recensement_competences` (lance le sondage compétences/intérêts)
- `candidature.valide_affectation` (valide adhésions + affecte aux cellules, avec la SG)

### P5 — Responsable Communication
- `annonce.publie_posts_affiches`
- `charte_graphique.gere`
- `reseaux_sociaux.gere_liens` (LinkedIn, Instagram, WhatsApp)
- `calendrier_editorial.gere` (hebdomadaire)
- `galerie_photos.gere`

### P6 — Responsable des Activités
- `evenement.cree_gere` (fiche détaillée, checklist logistique)
- `inscription.gere_places`
- `retour.collecte_apres_activite`
- `bilan.publie_ecrit`

### P7 — Responsable Innovation & Solutions
- `adhesion.gere_formulaire` + `adhesion.genere_qrcode`
- `projet.espace_presentation` (projets/idées techniques)
- `veille.page_interne` (veille technologique)

### P8 — Coordinateur Général des Opportunités
- `opportunite.tableau_veille` (hackathons, conférences, partenariats)
- `opportunite.fiche_statut`
- `contact_externe.carnet`

### P9 — Responsable Programmation & Planification
- `calendrier.partage_officiel` (intégration calendrier académique EMSP)
- `calendrier.detecte_conflits`
- `planning.envoi_recap_hebdo`

### P10 — Responsable des Ateliers
- `atelier.planning_hebdo` (visibilité sur les 4 prochains)
- `atelier.fiche_type` (thème, objectif, durée, matériel, intervenant)
- `presence.feuille_numerique`
- `satisfaction.formulaire_post_atelier`

### A3 — Chef de cellule (scope = sa cellule uniquement)
- `annonce.publie_ciblee_cellule`
- `cellule.gere_membres` (min. 3 membres requis pour exister)
- `activite.planifie_reunions_cellule`
- `forum.modere_sa_cellule`

### A5 — Administrateur
- `*.*` + gestion technique : comptes, rôles, sauvegardes, maintenance, passation annuelle
  (`admin.passation` : transfert en masse des postes aux nouveaux titulaires).

## 4. Matrice synthétique « qui voit quoi »

| Espace | Visiteur | Membre | Chef cellule | Bureau | Admin |
|---|---|---|---|---|---|
| Vitrine (accueil, organigramme, activités publiques) | ✅ lecture | ✅ | ✅ | ✅ | ✅ |
| Formulaire d'adhésion | ✅ remplir | ✅ | ✅ | ✅ | ✅ |
| Espace personnel | — | ✅ | ✅ | ✅ | ✅ |
| Annonces générales | — | ✅ lecture | ✅ | ✅ | ✅ |
| Annonces ciblées cellule | — | si membre | ✅ | ✅ | ✅ |
| Forum cellule/projet | — | ✅ | ✅ modère | ✅ | ✅ |
| Inscription événements | — | ✅ | ✅ | ✅ | ✅ |
| Feuilles de présence | — | émarge | sa cellule | P6/P10 | ✅ |
| Ressources bibliothèque | — | ✅ | ✅ | ✅ | ✅ |
| Veille / opportunités | page publique veille simplifiée | ✅ | ✅ | ✅ | ✅ |
| Back-office par rôle | — | — | partiel | ✅ | ✅ |

## 5. Règles de gestion notables

1. **Intérim** : le flag `interim=True` sur le rôle Vice-Présidente active les permissions
   du Président. Activation/désactivation tracée (qui, quand).
2. **Minimum 3 membres par cellule** : contrainte applicative — une cellule sous le seuil
   est marquée « en sommeil » et signalée au Resp. Cellules.
3. **Convocations** : toute réunion de Bureau créée déclenche une notification aux membres
   concernés ; rappel automatique à H-48h.
4. **Passation annuelle** : procédure guidée — l'admin sélectionne chaque poste et désigne
   le nouveau titulaire ; l'ancien perd ses permissions de poste mais reste membre.
5. **Candidature d'adhésion** : statuts `en_attente → validee / refusee`; validation par SG
   OU Resp. Cellules ; à la validation, compte membre créé/activé + affectation cellules.
