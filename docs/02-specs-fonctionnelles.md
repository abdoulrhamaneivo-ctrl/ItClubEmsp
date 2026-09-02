# 02 — Spécifications fonctionnelles par domaine

Chaque domaine décrit : les écrans, les règles métier (RG), et les actions par rôle.
Le détail des modèles de données est en doc 03 ; l'API en doc 04.

---

## D1 — Vitrine publique

**Écrans** : Accueil · Organigramme du Bureau · Cellules · Activités publiques · Veille publique · Adhésion.

- **Accueil** : mission, historique, réalisations, chiffres clés (nb membres, nb activités), CTA « Rejoindre le club ».
- **Organigramme interactif** : 10 cartes poste (photo, poste, titulaire, mission résumée). Source de vérité : `Role.titulaire_actuel` + `Role.mission_resume`.
- **Cellules** : fiche publique par cellule — nom, description, chef, nb membres, projets phares. Bouton candidater vers cette cellule.
- **Activités** : liste passées (bilan + galerie) / à venir (fiche + date).
- **RG-V1** : aucune donnée personnelle au-delà de nom + photo + poste sur la vitrine.
- **RG-V2** : le formulaire d'adhésion est accessible sans compte ET via QR code (`/adhesion?source=qr` → tracke la source).

## D2 — Comptes & adhésion

- **Formulaire public** : prénom, nom, email (@emsp prioritaire mais non bloquant), téléphone WhatsApp, filière/niveau, cellules souhaitées (multi-select), motivation.
- **Flux** : soumission → statut `en_attente` → email de confirmation de réception → validation SG ou Resp. Cellules → création du compte (mot de passe à définir via lien magique) + affectation cellules + email de bienvenue.
- **RG-A1** : un email = une seule candidature active ; doublon détecté → message adapté.
- **RG-A2** : QR code régénéré par P7, encode l'URL d'adhésion, téléchargeable PNG/SVG.
- **Authentification** : email + mot de passe ; sessions pour le web, JWT pour la PWA/API. Reset par email.
- **Espace membre** : profil éditable, mes cellules, mes inscriptions, mes badges/points, mes notifications.

## D3 — Communication & annonces

- **Types d'annonce** : `officielle` (Président, Resp. Comm.), `cellule` (chef de cellule, ciblée), `post` (Resp. Comm., avec affiche image).
- **Écran de composition** : titre, corps riche (markdown), pièce jointe(s)/affiche, audience (tous / cellule X), épingle en tête ?, programmation de publication différée.
- **Fil d'actualité** : tri antéchronologique, épinglées d'abord, filtres (mes cellules / officielles).
- **Interactions** : réactions (👍 ❤️ 🎉 …) et commentaires pour les membres connectés.
- **Notifications** : in-app + email (opt-out granulaire dans le profil) à la publication selon audience.
- **RG-C1** : une annonce `officielle` ne peut être créée que par P1/P5 ; `cellule` uniquement par le chef de LA cellule visée.
- **RG-C2** : modification/suppression tracées (audit log).

## D4 — Forum

- **Structure** : espace par **cellule** + espaces par **projet**. Sujets → messages.
- Permissions : lecture/écriture membres (selon espace), modération chef de cellule (éditer/masquer/épingler/clôturer).
- Mentions `@pseudo` → notification. Recherche plein texte (PostgreSQL FTS).

## D5 — Événements & activités

- **Fiche événement** : titre, type (atelier/réunion/compétition/hackathon/autre), description, date+heure début/fin, lieu, intervenant(s), prérequis, places max, checklist logistique (items cochables), statut (`brouillon/publie/annule/termine`), événement lié à une cellule ou club entier.
- **Inscriptions** : bouton « Je participe » si places restantes ; liste d'attente automatique quand complet ; désinscription possible jusqu'à H-2h → libère la place (premier de la liste d'attente promu + notifié).
- **Feuille de présence numérique** : générée à partir des inscrits ; modes d'émargement : code à 6 chiffres affiché sur place, OU scan du QR personnel du membre. Export CSV.
- **Retours** : formulaire satisfaction auto-envoyé 1h après la fin aux présents (note 1-5 + commentaire). Bilan écrit publié par P6 sur la fiche → visible publiquement une fois l'événement terminé.
- **Rappels automatiques** : J-1 et H-2h aux inscrits.
- **RG-E1** : conflit de dates détecté à la création (chevauchement avec autre événement ou entrée du calendrier académique) → avertissement bloquant sauf confirmation motivée (P9).
- **RG-E2** : taux de participation = présents / inscrits ; alimente les indicateurs d'objectifs (D9) et les points de gamification.

## D6 — Calendrier & planification (P9)

- Vue mois/semaine/liste ; sources superposées : activités club, réunions Bureau, réunions cellules, **calendrier académique EMSP** (import iCal administrable).
- Détection de conflits (cf. RG-E1) en temps réel à la création/modification.
- **Récap hebdomadaire** : email automatique chaque dimanche 18h à tous les membres actifs — événements de la semaine à venir.
- Exports : abonnement iCal personnel (URL privée), synchronisation Google Calendar côté client.

## D7 — Ateliers (P10)

- Cas particulier d'événement avec champs enrichis : objectif pédagogique, durée, matériel requis, intervenant, série/récurrence hebdomadaire.
- Page « Prochains ateliers » : les 4 prochains, cartes attractives.
- Bibliothèque de fiches atelier types réutilisables (duplication → nouvel atelier planifié).

## D8 — Ressources, projets, veille, opportunités

- **Bibliothèque** : documents (PDF, slides, archives), liens externes ; tags + cellule + type (cours/tutoriel/code/veille) ; recherche ; upload réservé membres, modération chef/admin.
- **Projets** : fiche projet — nom, cellule(s), porteur(s), statut (`idee/en_cours/en_pause/livre`), description, captures, dépôt lien. Espace public de présentation (P7) + tableau de suivi technique (P2, mêmes données, vue interne avec avancement %).
- **Veille technologique interne** (P7) : articles/liens partagés votables, par thématique.
- **Opportunités** (P8) : tableau kanban simple (`repérée/intéressante/partagée/close`) — hackathons, conférences, partenariats ; fiche : date limite, lien, description ; carnet de contacts externes (accès P8+Admin uniquement).
- **Mini-portfolio** : page vitrine alimentée par les projets `livre`.

## D9 — Gouvernance & objectifs

- **Objectifs par poste** : libellé, indicateur lié (ex. `taux_participation`, `nb_activites`, `abonnes_instagram`), cible, échéance, progression calculée automatiquement quand l'indicateur est branché sur les données réelles, sinon saisie manuelle justifiée.
- **Comptes rendus** : rédaction (SG) → validation Président → publication + archivage ; pièces jointes ; registre daté consultable Bureau (+membres si diffusé).
- **Convocations** : création réunion → notification immédiate + rappel H-48h automatique (exigence §3.3 SG).
- **Modèles de courriers officiels** : bibliothèque de templates téléchargeables.
- **Dashboard global Président/P2** : widgets — objectifs par poste (feux vert/orange/rouge), activité récente par poste, effectifs cellules, prochaines échéances.

## D10 — Notifications & emails (transverse)

Canal in-app (temps réel via WebSocket) + email transactionnel (SMTP gratuit type Resend/Mailgun free tier). Types : annonce, convocation+rappel48h, inscription confirmée/place libérée, rappels J-1/H-2h, satisfaction post-activité, récap hebdo, validation adhésion, mention forum, badge obtenu. Préférences par type dans le profil. Table `Notification` persistée = centre de notifications in-app avec lu/non-lu.

## D11 — Gamification (bonus)

- Points : présence atelier +5, organisation événement +20, message utile (réaction ≥3) +2, projet livré +50… (table de règles paramétrable admin).
- Badges : seuils automatiques (« Assidu » 5 présences, « Bâtisseur » premier projet livré…) + badges manuels attribués par le Bureau.
- Classement amical visible membres ; affiché sur profil.

## D12 — Sondages (bonus)

Créés par Bureau/chefs de cellule : question(s) simples, choix multiples, anonyme ou signé, dates d'ouverture. Résultats graphiques temps réel. Usage typique : sondage de recensement compétences (P4), satisfaction globale.

## D13 — Chat temps réel (bonus)

Canaux par cellule + canaux projet, via Django Channels. Historique conservé, recherche. Pas de DM individuels en v1 (éviter la dérive messagerie privée — le club garde WhatsApp pour ça).

## D14 — Administration technique (A5)

- Gestion comptes (désactivation, reset), gestion rôles/postes + **passation annuelle guidée**, configuration (charte, liens sociaux, calendrier académique), audit log consultable, sauvegarde base (dump chiffré planifié + export téléchargeable), monitoring basique.
