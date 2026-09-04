# 10 — Pistes de fonctionnalités (priorisées, post-v1 technique)

Base : vitrine + espace + back-office + API + emails fonctionnels et testés.
Ci-dessous ce qui manque par rapport aux docs 00–08, classé par valeur/effort.

## P0 — finir le critique Bureau
- [ ] **GestionContenu → API réelle** (aujourd'hui localStorage) : POST actualités/documents/galerie avec upload multipart, `galerie_photos.gere` (P5). Le back est prêt, reste le formulaire d'upload.
- [ ] **Registre membres** (P3/P4) : écran back-office sur `GET /candidatures` + validation en 1 clic (l'API existe, l'écran manque).
- [ ] **Domaine vérifié Resend** : sans lui, aucun mail réel aux membres (422 prouvé). Voir doc 09 §2.

## P1 — vie quotidienne du club
- [ ] **Feuille de présence** : code à 6 chiffres + QR personnel (doc 02 D5), export CSV (`GET .../export-presences.csv` à créer).
- [ ] **Retours + bilan** : formulaire satisfaction front (le mail part déjà) + `POST .../retours`, `PUT .../bilan` + affichage public post-événement.
- [ ] **Calendrier agrégé** : `GET /calendrier`, détection conflits RG-E1, export iCal privé `/ical/moi.ics`.
- [ ] **Convocations UI** : écran SG sur `POST /reunions/convocation` (l'API existe) + réunion datée (modèle manquant).
- [ ] **Comptes rendus** : workflow rédaction → validation → publication (modèle manquant).

## P2 — engagement
- [ ] **Réactions + commentaires** sur Actualités (modèles doc 03 §3, API à créer, RG-C2 audit).
- [ ] **Gamification** : `points` existe déjà sur User — règles d'attribution (présence +5, orga +20, projet +50), badges, `/classement`.
- [ ] **Sondages** : CRUD + votes + résultats (recensement compétences P4 en premier).
- [ ] **PWA installable** : service worker + manifest déjà présents (`manifest.webmanifest`) — tester l'installation mobile + mode hors-ligne.

## P3 — temps réel & passation
- [ ] **Chat par cellule/projet** (Channels) — doc 00 : WhatsApp reste pour le privé, le club garde le fonctionnel.
- [ ] **Notifications WebSocket** (`ws/notifications/`) — la table et le centre in-app existent déjà.
- [ ] **Passation annuelle guidée** : transfert titulaires + archive (doc 02 D14).
- [ ] **Objectifs par poste** : `ObjectifPoste` existe (mission/objectif affichés) — ajouter cible/échéance/progression auto (doc 02 D9).
- [ ] **Uploads prod** : S3/Cloudinary (Render free = éphémère, doc 09 §8).

## Déjà fait (ne pas refaire)
QR adhésion (RG-A2), inscriptions + file d'attente + promotion (RG-E2),
candidatures + anti-doublon (RG-A1), 11 emails + commande périodique,
notifications in-app + prefs, JWT + user embarqué, /me/*, tests 12/12.
