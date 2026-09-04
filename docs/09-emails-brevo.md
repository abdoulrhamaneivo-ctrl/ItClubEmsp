# 09 — Emails transactionnels (Brevo) + base Neon

> **04/09/2026 : Resend → Brevo.** Le WAF Cloudflare de Resend coupait le TLS
> depuis le réseau de l'EMSP (handshake timeout, jamais résolu). Brevo : 300
> mails/jour gratuits, `api.brevo.com` joignable, pas de blocage. Le code est
> passé à `apps/emails.py` (headers `api-key`, payload `sender/to/htmlContent`).
> Clé : `BREVO_API_KEY` (xkeysib-…), expéditeur : `BREVO_FROM`.

## 1. Vue d'ensemble

| Couche | Choix | Pourquoi |
|---|---|---|
| Envoi | API REST Resend (stdlib `urllib`, zéro dépendance) | gratuit, fiable, pas de SMTP à gérer |
| Clé | `RESEND_API_KEY` **en variable d'environnement uniquement** | jamais dans le repo (`.gitignore` couvre `.env*`) |
| Base | **Neon** (PostgreSQL managé, URL poolée) | gratuit, pas d'ops |
| Journal | table `Notification` | audit + centre in-app (`GET /notifications`) |
| Périodique | `manage.py emails_periodiques` + cron | pas de Celery/Redis à héberger |

## 2. Mise en route Resend (5 min)

1. [brevo.com](https://app.brevo.com) → compte → **SMTP & API** → générer la clé API (xkeysib-…).
2. **Sans domaine vérifié** (état actuel) :
   - `BREVO_FROM = l'email du compte Brevo` (expéditeur validé dans Brevo)
   - destinataires : tout le monde (Brevo ne limite pas tant que l'expéditeur est validé).
   - Brevo sans expéditeur validé → 401/400 ; valider un expéditeur ou un domaine dans Senders.
3. **Pour envoyer aux vrais membres** (obligatoire en prod) :
   - Brevo → **Senders, Domains & Dedicated IPs** → Senders (valider un email) OU Domains (vérifier le domaine, DKIM/DMARC chez le registrar) → statut Validé.
   - puis `BREVO_FROM=club@ton-domaine`.
4. Rotation de clé si elle a fuité (collée dans un chat, commitée…) : Resend → API Keys → Delete + Create.

## 3. Variables d'environnement

| Variable | Local (`backend/.env`, voir `.env.example`) | Render |
|---|---|---|
| `BREVO_API_KEY` | lue depuis `~/.hermes/.env` en dev | **Environment → Add** (secret, jamais dans `render.yaml`) |
| `BREVO_FROM` | email du compte Brevo | `club@ton-domaine` après vérification |
| `FRONTEND_URL` | `https://it-club-emsp.vercel.app` | idem |
| `DATABASE_URL` | URL poolée Neon `…-pooler.…?sslmode=require` | idem (secret Render) |
| `DB_CONN_MAX_AGE` | `0` (pooler Neon) | `0` |

## 4. Base Neon (5 min)

1. [neon.tech](https://neon.tech) → New Project (`itclub-emsp`, région proche : EU) → base `itclubemsp`.
2. Dashboard → **Connection Details** → activer **Pooled connection** → copier l'URL (`?sslmode=require` inclus).
3. Local : `export DATABASE_URL='<url>' DB_CONN_MAX_AGE=0` puis `python manage.py migrate` (+ `shell < fixtures/seed.py` pour une base vierge).
4. Render : Environment → `DATABASE_URL` = l'URL Neon, `DB_CONN_MAX_AGE=0`.
5. Sans `DATABASE_URL`, Django retombe sur SQLite (dev) — aucun crash.

## 5. Les 11 emails (templates `backend/templates/emails/`)

| Déclencheur | Template | Destinataires |
|---|---|---|
| Candidature reçue | `candidature_recue.html` | candidat (auto) |
| Candidature validée | `candidature_validee.html` | nouveau membre (compte créé + cellules) |
| Candidature refusée | `candidature_refusee.html` | candidat |
| Inscription | `inscription_confirmee.html` | inscrit |
| Événement complet | `liste_attente.html` (+ position) | inscrit en attente |
| Désinscription d'un confirmé | `promotion_liste_attente.html` | 1er en attente (promu auto) |
| J-1 / H-2h | `rappel_evenement.html` | inscrits confirmés |
| Convocation (+ H-48h) | `convocation_reunion.html` | Bureau / liste ciblée |
| +1h après fin | `satisfaction_post_activite.html` | inscrits confirmés |
| Dimanche 18h | `recap_hebdo.html` | tous les membres |
| Annonce publiée | `annonce_publiee.html` | membres (ou cellule taguée) |

Règles communes : préfixe `[IT-CLUB EMSP]`, version texte auto (`strip_tags`),
préférences du profil respectées (`User.notif_prefs`, absent = accepté),
**fail-open** (un email en échec ne casse jamais l'API), trace `Notification`
avec `envoye` + `resend_id`.

## 6. Endpoints ajoutés (`/api/v1/`)

| Méthode | Route | Rôle | Effet |
|---|---|---|---|
| GET | `/candidatures/` | P1/P3/P4/staff | liste (sinon `[]`) |
| POST | `/candidatures/{id}/valider/` | P1/P3/P4/staff | crée le compte + cellules + bienvenue |
| POST | `/candidatures/{id}/refuser/` | P1/P3/P4/staff | statut + email de refus |
| POST | `/evenements/{id}/inscrire` | connecté | confirmé OU liste d'attente + email |
| DELETE | `/evenements/{id}/desinscrire` | connecté | libère + promeut le 1er en attente + email |
| POST | `/reunions/convocation` | P1/P3/staff | `{titre, date_str, lieu, ordre_du_jour, emails[] ou tous_membres}` |
| POST | `/emails/test` | staff | `{to}` — vérifie Resend de bout en bout |
| GET | `/notifications/` | connecté | ses notifications (user ou son email) |
| POST | `/notifications/lire/` | connecté | `{ids?}` → marque lues |

Aussi : `EvenementSerializer` expose `date_fin`, et les compteurs
(`inscrits_count`, `places_disponibles`) ne comptent que les **confirmés**.

## 7. Cron (doc 04 §6, sans Celery)

```cron
*/10 * * * * cd /chemin/backend && .venv/bin/python manage.py emails_periodiques --only rappels >> /var/log/itclub-emails.log 2>&1
*/15 * * * * cd /chemin/backend && .venv/bin/python manage.py emails_periodiques --only satisfaction >> /var/log/itclub-emails.log 2>&1
0 18 * * 0 cd /chemin/backend && .venv/bin/python manage.py emails_periodiques --only recap >> /var/log/itclub-emails.log 2>&1
```

`--dry-run --limit N` pour tester sans envoyer. Anti-doublons via les
`Notification` déjà tracées (`rappel`, `satisfaction`).

## 8. Limites connues

- Sans expéditeur validé : Brevo refuse l'envoi (valider un Senders d'abord).
- Uploads Render free : éphémères (S3/Cloudinary plus tard — modèles déjà prêts).
- `perform_create` Annonce boucle sur les membres : OK à l'échelle du club (< 500), passer en tâche de fond au-delà.
