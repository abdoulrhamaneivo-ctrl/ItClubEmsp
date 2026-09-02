# 06 — Plan de mise en œuvre (pour Claude / l'équipe)

> Ce doc est le mode d'emploi d'exécution : quand tu (Claude) implémentes le back-end,
> suis ces phases dans l'ordre. Chaque phase finit par des critères de validation testables.

## 0. Règles transverses

1. Lis d'abord 00 → 05 ; les règles RG du doc 02 et la matrice du doc 01 sont la source
   de vérité. En cas de doute, ne pas inventer : poser la question ou choisir le plus
   conservateur et le documenter.
2. Un commit par étape, messages conventionnels (`feat(events): liste d'attente`).
3. Aucune fonctionnalité sans au moins un test couvrant sa règle métier.
4. Chaque phase se termine par : `pytest` vert + `manage.py migrate` propre +
   vérification manuelle via `/api/schema/` (Swagger).

## Phase 1 — Socle (≈ 2-3 jours)

- Projet Django (`config/`, settings base/dev/prod), User custom, apps vides selon doc 04 §2.
- Modèles rôles/permissions (doc 01), fixtures P1-P10 + permissions, commande `seed_bureau`.
- Auth JWT + sessions, endpoint `GET /me/roles`.
- AuditLog + Fichier partagés.
- ✅ Validation : login JWT OK ; un user avec rôle P3 reçoit ses codes de permission ;
  matrice de permissions paramétrée verte.

## Phase 2 — Adhésion & membres (priorité Bureau)

- CandidatureAdhesion publique + throttling, emails confirmation/validation,
  workflow de validation SG/P4, génération QR code (lib `qrcode`),
  registre membres (dont fondateurs).
- ✅ Validation : parcours complet visiteur → candidature → validation → compte actif,
  testé automatiquement ; QR code téléchargeable.

## Phase 3 — Cellules & communication

- Cellules, memberships (règle min. 3 membres), chefs nommés par P4.
- Annonces (types, audiences, épinglage, programmation), réactions, commentaires.
- Notifications in-app + email, centre de notifications.
- ✅ Validation : annonce ciblée visible seulement des membres de la cellule (test).

## Phase 4 — Événements & calendrier

- Evenements CRUD + publication, inscriptions/quota/liste d'attente, présence (code + QR),
  retours + bilans, ateliers (fiche type, 4 prochains).
- Calendrier agrégé, sources iCal externes, détection conflits, export iCal privé,
  rappels + recap hebdo (Celery beat OU commands cron).
- Convocations H-48h (SG).
- ✅ Validation : cycle événement complet automatisé ; conflit détecté ; iCal abonné
  lu par un client externe.

## Phase 5 — Ressources, projets, veille, opportunités

- Bibliothèque (upload, tags, recherche), projets (+portfolio), veille interne,
  kanban opportunités, carnet contacts (accès restreint P8/Admin).

## Phase 6 — Gouvernance

- Objectifs par poste (progression auto branchée sur les données réelles),
  comptes rendus (workflow rédaction→validation→publication), modèles de courriers,
  dashboard global Président/P2.

## Phase 7 — Bonus & polish

- Gamification (règles points, badges, classement), sondages, chat temps réel (Channels),
  passation annuelle guidée (A5), sauvegardes planifiées, documentation technique finale
  (installation, administration) + guides utilisateur « membre » et « bureau ».

## Phase 8 — Front-end (dépôt/équipe séparée)

- Suivre doc 05 : shell + vitrine → espace membre → back-office dynamique par rôle → PWA.
- Consommer l'OpenAPI généré ; types générés automatiquement.

## Déploiement

1. Staging Railway/Render dès la phase 2 (le Bureau peut tester le formulaire + QR tôt —
   exigence de délai du cahier des charges).
2. Prod après recette (phase 4+) : Postgres managé, Redis, S3-compatible, SMTP,
   HTTPS/HSTS, sauvegardes activées.

## Critères de réussite globaux (cahier des charges §9)

- Adoption : taux de connexion et d'inscriptions suivis via dashboard.
- Chaque poste utilise son espace → mesuré par AuditLog.
- Passation réalisable en < 1 h par un admin non développeur.
