# Guide du club — IT-CLUB EMSP

> La plateforme en langage simple : ce qu'elle fait, qui fait quoi,
> et que faire quand ça coince. À lire par tout le Bureau.
> Dernière mise à jour : septembre 2026.

---

## 1. Les 3 espaces

| Espace | Adresse | Qui y entre | Contenu |
|---|---|---|---|
| **Vitrine** | `/` | Tout le monde | Accueil, Qui sommes-nous, Bureau, Cellules, Activités, Actualités, Documentation, Galerie, Adhésion |
| **Mon espace** | `/espace` | Membre connecté | Notifications, Mes inscriptions, Ma cellule, Mon profil |
| **Backoffice** | `/backoffice` | Bureau uniquement | Modules selon le poste (voir §3) |

Règle d'or : **tout chiffre affiché vient de la base de données** —
membres du Bureau, cellules, activités à venir, documents, inscriptions,
points. Rien n'est écrit en dur (si le serveur est injoignable, un tiret
`—` s'affiche le temps du chargement).

---

## 2. Le parcours d'un nouveau membre (adhésion)

```
Candidat → formulaire /adhesion → Registre (P1/P3/P4)
    → VALIDÉE → compte créé + email de bienvenue (lien personnel)
        → le membre choisit son mot de passe → connexion → Mon espace
    → REFUSÉE → email de refus
```

1. **Candidature** : le candidat remplit le formulaire public
   (prénom, nom, e-mail, WhatsApp, **filière en liste déroulante**,
   motivation, cellules souhaitées). Les champs sont configurables
   (module *Formulaire*, §6).
2. **Décision** : module *Registre membres* → boutons Valider / Refuser.
   Le message affiché dit honnêtement si l'e-mail est parti
   (« email parti » ou « email NON parti + raison »).
3. **Invitation** : le membre validé reçoit l'e-mail *Bienvenue* avec un
   bouton. Le lien est **personnel, à usage unique, valable 8 minutes** :
   cliqué deux fois = refusé.
4. **Premier login** : page `/definir-mot-de-passe` → il choisit son mot
   de passe → redirection vers la connexion → Mon espace.

---

## 3. Comptes et permissions — qui a droit à quoi

### 3.1 Comptes du Bureau

- E-mail : `prenom.nom@emsp.int` (comptes créés automatiquement).
- Mot de passe initial : **`ITClub2026!`** — à changer au 1er login
  (Mon espace → profil → *Mot de passe*, l'ancien est demandé).
- Le mot de passe initial est remis **à chaque déploiement** uniquement
  aux comptes qui n'ont jamais défini le leur : un mot de passe
  personnel n'est **jamais** écrasé.

### 3.2 Matrice des permissions

L'ADMIN voit tout. Le membre simple n'a que son espace
(vitrine, forum, sondages). Le **serveur applique les mêmes règles**
que cette table (tricher par l'URL = page vide ou 403).

| Poste | Modules |
|---|---|
| **P1 Président** | Annonces, Dashboard, Tâches Notion, Comptes rendus, Contenu, Formulaire |
| **P2 Vice-Présidente** | Dashboard, Suivi projets, Tâches Notion |
| **P3 Secrétaire Générale** | Tâches Notion, Comptes rendus, Registre membres, Contenu, Formulaire |
| **P4 Resp. Cellules** | Registre membres, Cellules |
| **P5 Resp. Communication** | Annonces, Communication, Contenu |
| **P6 Resp. Activités** | Événements, Retours & bilans |
| **P7 Resp. Innovation** | Suivi projets, Adhésion & QR, Formulaire |
| **P8 Coordinateur Opportunités** | Opportunités |
| **P9 Resp. Programmation** | Calendrier |
| **P10 Resp. Ateliers** | Ateliers |
| **CHEF_CELLULE** | Annonces |
| **ADMIN (Président)** | Tout + Administration (comptes, passation, permissions, annuaire) |

La matrice est visible en couleurs dans
Backoffice → **Administration → onglet Permissions**.

### 3.3 Passation et continuité

Module *Administration → Postes & passation* : saisir l'e-mail du nouveau
titulaire → effet immédiat (vitrine + permissions). Comptes : activation /
désactivation par interrupteur. En cas d'urgence totale, le super-utilisateur
Django (`/admin`) existe côté serveur.

---

## 4. La vie des activités (cycle complet)

```
P10/P6 crée (affiche + vidéo) → membres s'inscrivent → jour J :
code à 6 chiffres / QR (+5 pts) → retours (note + avis)
→ bilan P6 publié → export CSV
```

1. **Création** (module *Ateliers*, P10) : titre, date, lieu, places
   (0 = illimité) + **affiche photo** + **lien vidéo** (teaser/replay).
   Salle déjà prise sur le créneau = refusé automatiquement avec message.
2. **Inscriptions** : le membre clique *S'inscrire* (Confirmé, ou liste
   d'attente avec numéro si complet). Annulation possible.
   Non connecté = invité à se connecter.
3. **Jour J — émargement** : le code à 6 chiffres s'affiche dans le module
   *Événements* ; le membre le saisit dans Mon espace → **+5 points**,
   badge de présence. QR projetable au vidéoprojecteur. Nouveau membre :
   **+10 points** de bienvenue. Niveaux : Actif (5), Pilier (20),
   Légende (50).
4. **Retours** : après l'activité, note 1–5 + avis libre (1 par membre).
5. **Bilan** (P6, module *Bilans*) : texte + points forts + à améliorer,
   publié → visible sur la vitrine.
6. **Convocations** (P1/P3, module *Comptes rendus → Convoquer*) : ciblées
   (Bureau ou tous), **rappel automatique 48h avant**, export CSV.
7. **Calendrier** : bouton `.ics` (Mon espace, module Calendrier) pour
   importer dans Google Agenda / Outlook.

---

## 5. Publications : photo, vidéo, fichiers

| Contenu | Photo (upload) | Vidéo | Fichier | Où on le crée |
|---|---|---|---|---|
| Actualité | ✅ | ✅ lien | — | Contenu → Actualités |
| Activité / Atelier | ✅ affiche | ✅ lien teaser/replay | — | Ateliers |
| Compte rendu | ✅ | ✅ lien | — | Comptes rendus |
| Document | — | — | ✅ PDF/DOC | Contenu → Documents |
| Galerie | ✅ | ✅ YouTube (ID) | — | Contenu → Galerie |
| Photo de profil | ✅ | — | — | Mon espace → profil |

**Règle vidéo** : on colle un **lien** (YouTube, Drive), on ne téléverse
jamais de fichier vidéo — trop lourd pour l'hébergement gratuit, et les
fichiers du serveur s'effacent à chaque redéploiement.
Limite photo de profil : 5 Mo (JPG/PNG/WebP).

---

## 6. Exports CSV (Excel)

Chaque bouton *Download/CSV* télécharge un tableur (ouverture directe
dans Excel, accents gérés). Le bouton n'apparaît que si le poste y a droit.

| Export | Où | Qui |
|---|---|---|
| Présences d'un événement | Événements | P1, P6 |
| Annuaire des membres | Registre (ADMIN) · Admin → Permissions | ADMIN |
| Membres d'une cellule | Cellules (bouton CSV par ligne) | P1, P4 |
| Résultats d'un sondage | Sondages (carte, Bureau) | P1, P3, P5 |
| Comptes rendus | Comptes rendus | P1, P3 |
| Retours (par événement) | Bilans | P1, P6 |

---

## 7. Forum, sondages, veille, gamification

- **Forum** (connecté) : espaces général / cellule / projet. Sujets
  épinglés, verrouillés (lecture seule sauf modos P1/P5), modération par
  masquage (le message reste visible des modos).
- **Sondages** : simple (le nouveau vote remplace) ou choix multiples,
  résultats en direct + *ma sélection*, clôture par l'auteur ou un modo.
- **Veille** (P7 + membres) : liens partagés votables.
- **Gamification** : +10 bienvenue, +5 présence, niveaux, classement
  visible dans Mon espace.

---

## 8. E-mails automatiques (Brevo)

Gratuit : 300 e-mails/jour. Chaque envoi important part seul :

- candidature reçue / validée (avec lien d'invitation) / refusée ;
- convocation + rappel 48h ; rappel d'activité J-1/H-2h ; récap du dimanche ;
- promotion de liste d'attente ; retour post-activité.

**Préférences** : Mon espace → profil → *Notifications par email*
(le membre coupe ce qu'il ne veut plus ; le club ne peut pas forcer).

### Config Render (à vérifier si 0 mail part)

1. Service `itclub-emsp-api` → **Environment** :
   `BREVO_API_KEY` = clé **`xkeysib-…`** (la clé API, pas la SMTP),
   `BREVO_FROM` = le Gmail validé dans Brevo (jamais vide).
2. Redéployer. Se connecter.
3. Backoffice → Communication → **Tester l'envoi** vers son Gmail :
   - « Email parti » → vérifier boîte + spams ;
   - « Non parti : … » → la cause exacte s'affiche
     (clé absente, expéditeur absent, erreur Brevo…).

---

## 9. Quand ça coince (dépannage)

| Symptôme | Cause probable | Faire |
|---|---|---|
| *Mot de passe incorrect* | Compte sans mot de passe / frappe | `ITClub2026!` exact (! final) ; redéployer le backend (le seed répare à chaque déploiement) |
| *Bouton Connexion muet ~50s* | Render gratuit endormi | Laisser la page ouverte (message affiché après 8s), c'est normal au 1er clic |
| *401 après 30 min* | Session expirée | Le refresh auto reconnecte ; sinon déconnexion → reconnexion (refresh valable 7 j) |
| *0 mail part* | Clé SMTP au lieu d'API, ou expéditeur vide | §8 : clé `xkeysib` + Gmail + bouton test |
| *Page backoffice verte et vide* | Module d'un autre poste (favori, URL tapée) | Retour au hub `/backoffice` (redirection auto) ; demander le bon poste |
| *Aucun module au hub* | Compte sans poste | Contacter le Président (passation) |
| *Page adhésion vide* | Vieille URL preview figée | Utiliser `it-club-emsp.vercel.app` ou le déploiement le plus récent, jamais l'ancienne preview |
| *Contenu caché / chevauché* | Vieux cache navigateur | Ctrl+Shift+R ; navigation privée pour vérifier |

---

## 10. Technique en bref (pour les curieux)

- **Base** Neon (PostgreSQL) → **serveur** Render (Django, `build.sh` :
  migrations + seed idempotent à chaque déploiement) → **site** Vercel
  (`VITE_API_URL` pointe vers l'API).
- Chaque `git push` doit être **redéployé** sur Render (backend) et
  Vercel (front) : Deployments → le plus récent.
- Secrets **jamais dans le code** : dashboard Render (sync: false),
  `.env` local. En cas de fuite : régénérer côté Brevo/Neon.
- Uploads Render = **éphémères** (effacés à chaque redéploiement) :
  photos d'illustration OK, documents importants = les re-téléverser
  après un redéploiement (prévoir Cloudinary/S3 un jour).

---

*Un problème non listé ? Noter l'heure, la page, le message exact
(console F12) et le transmettre au P7 / à l'admin avec une capture.*
