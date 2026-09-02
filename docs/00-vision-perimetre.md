# 00 — Vision & périmètre

## 1. Le projet en une phrase

Plateforme web du **IT-CLUB EMSP** : centraliser la communication, la gestion des membres,
des cellules thématiques et le suivi des activités, pour remplacer WhatsApp comme canal
d'annonces officielles et donner à chaque poste du Bureau un espace de gestion dédié.

## 2. Problèmes à résoudre (extraits du cahier des charges)

| Problème actuel | Réponse de la plateforme |
|---|---|
| Messages noyés dans WhatsApp | Fil d'annonces officielles structuré, par poste/cellule |
| Annonces non structurées | Fiches typées : événement, annonce officielle, opportunité |
| Responsabilités floues | Back-office modulaire : chaque poste a SES outils |
| Pas de traçabilité | Inscriptions, présences, comptes rendus, objectifs archivés |
| Outil inadapté à l'association | Plateforme pensée pour le fonctionnement du club |

## 3. Périmètre fonctionnel (v1 complète — décision d'Ivo)

**Toutes les fonctionnalités du cahier des charges sont dans le périmètre v1**, y compris
les bonus (badges/gamification, sondages, chat temps réel, intégration Google Calendar).
Le développement sera néanmoins **phasé** (voir doc 06) : on livre d'abord ce qui est
critique pour le Bureau (adhésion + QR code, calendrier), puis le reste.

### 3.1 Domaines fonctionnels

1. **Adhésion & membres** — formulaire public + QR code, validation, registre, annuaire
2. **Cellules thématiques** — Web, IA, Cybersécurité, Design… chefs nommés, min. 3 membres
3. **Communication** — annonces (officielles / ciblées cellule), commentaires/réactions, notifications
4. **Forum** — discussions par cellule et par projet
5. **Événements & activités** — fiches détaillées, inscriptions avec quota, feuilles de présence numérique, retours/satisfaction, bilans
6. **Calendrier** — partagé, détection de conflits, récap hebdomadaire auto, export iCal/Google Calendar
7. **Ateliers** — planning hebdo (4 prochains visibles), fiche atelier type, présence, satisfaction post-atelier
8. **Ressources & projets** — bibliothèque de documents/liens, espace projets, veille technologique, mini-portfolio
9. **Opportunités** — hackathons/conférences/partenariats, fiche par opportunité avec statut, carnet de contacts externes
10. **Gouvernance** — objectifs & indicateurs par poste, comptes rendus de réunion, tableau de suivi projets techniques (Vice-Présidente)
11. **Back-office par rôle** — 10 postes du Bureau + chef de cellule + admin (voir doc 01)
12. **Bonus v1** — badges/points de participation, sondages, chat temps réel

## 4. Contraintes clés

- **Budget** : privilégier gratuit/faible coût → hébergement type Railway/Render + PostgreSQL managé ou SQLite au départ.
- **Délais Bureau** : formulaire d'adhésion + QR code avant campagne publique ; calendrier opérationnel sous 72h après installation du Bureau.
- **Équipe** : membres volontaires de la cellule Web → code documenté, guide d'installation, passation facile.
- **Public** : étudiants → responsive mobile-first, < 3s par page, pics de charge aux inscriptions.
- **Passation annuelle** : l'admin doit pouvoir transférer le back-office aux futurs bureaux.

## 5. Décisions techniques (arrêtées)

| Sujet | Décision | Justification |
|---|---|---|
| Back-end | **Django 5.x + Django REST Framework** | Choix d'Ivo ; Python, batteries incluses, ORM solide, admin natif comme filet |
| Base de données | PostgreSQL en prod, SQLite en dev | Standard Django, coût zéro au départ |
| Auth | Sessions Django (web) + tokens JWT (API/PWA) via `djangorestframework-simplejwt` | Double surface web + app |
| Front-end | React (structure fournie dans doc 05) — le front n'est PAS implémenté ici | Séparation back/front demandée par Ivo |
| PWA | Service worker + manifest, installable sur mobile | Bonus cahier des charges |
| Desktop | La PWA installable couvre desktop (Chrome/Edge « Installer l'app »). Une coquille Tauri/Electron optionnelle est documentée en doc 05 §6 mais n'est pas prioritaire | Éviter double maintenance |
| Temps réel (chat, notifs) | Django Channels (WebSocket) | Natif Django |
| Tâches planifiées | Celery + Redis OU `django-crontab`/management commands (selon hébergement) | Rappels, récap hebdo, détection conflits |
| Fichiers | Stockage local en dev, S3-compatible (ou Cloudinary free tier) en prod | Budget contraint |

## 6. Hors périmètre

- Paiement en ligne (cotisations) — pas demandé.
- Multi-langue — français uniquement pour la v1.
- Application native iOS/Android.

## 7. Livrables associés au projet

Conformes au cahier des charges §7 : maquettes (front, plus tard), charte graphique,
plateforme, documentation technique (ce dossier `docs/`), guides utilisateur différenciés
(membre / bureau), procédure de passation.
