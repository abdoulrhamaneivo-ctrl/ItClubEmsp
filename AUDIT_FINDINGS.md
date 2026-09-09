# Audit IT-CLUB EMSP — 20 améliorations priorisées

## P1 — Impact utilisateur direct (à corriger en premier)

1. **frontend/src/pages/Espace.jsx:601-605** — Notifications : état `null` affiche données mock au lieu d'un loader squelette → l'utilisateur croit que ce sont ses vraies notifs
2. **frontend/src/pages/Espace.jsx:637** — Inscriptions : `inscApi === null` → fallback `MES_INSCRIPTIONS` (données en dur) au lieu d'état vide/loading
3. **frontend/src/pages/Espace.jsx:739** — Ma cellule : `cellulesApi` vide → fallback `MA_CELLULE` en dur, pas d'état vide réel
4. **frontend/src/lib/api.js:8** — `USE_MOCK = !BASE_URL` : mode mock actif par défaut si `VITE_API_URL` non défini → toute la vitrine affiche du faux
5. **frontend/src/lib/api.js:13-59** — Objet `mocks` de 50+ lignes (bureau, cellules, activités, actualités, présentation) encore utilisé comme fallback partout
6. **frontend/src/pages/Espace.jsx:709-713** — Émargement : pas de spinner pendant `marquerPresence`, juste bouton désactivé → aucune feedback visuel
7. **frontend/src/components/adhesion/Adhesion.jsx:86-109** — Soumission candidature : pas de confirmation avant envoi (action sensible), pas de toast succès/erreur clair
8. **frontend/src/pages/Forum.jsx:276-284** — Modération message : `window.confirm` natif (inaccessible, pas stylé) pour suppression définitive
9. **frontend/src/pages/Veille.jsx:53-60** — Suppression veille : pas de confirmation, pas de toast, erreur silencieuse (`catch { notify }`)
10. **frontend/src/components/actualites/Actualites.jsx:61-68** — Réaction actualité : erreur silencieuse (`catch { /* silencieux */ }`), l'utilisateur ne sait pas si ça a marché

## P2 — Incohérences front/back & dette technique importante

11. **backend/apps/views_core.py:116,122,137,262,269,276,299,351,391,399,444,514,519,593** — 14 ViewSets sans pagination (`pagination_class` manquant ou `None`) → réponses géantes, perf mobile
12. **backend/apps/views_core.py:646-656** — `EvenementViewSet.list()` tronque manuellement `results[:limit]` au lieu d'utiliser `PageNumberPagination` + `page_size`
13. **backend/apps/core_serializers.py:169-193** — `ActualiteSerializer._reactions_liste()` appelée 3x (`get_reactions`, `get_ma_reaction`, `get_commentaires_count`) → 3 parcours liste par objet
14. **backend/apps/core_serializers.py:234-319** — `EvenementSerializer` : 10 `SerializerMethodField` dont `get_code_presence` fait requête `Role` par objet si pas préchargé
15. **backend/apps/core_serializers.py:379-425** — `VeilleSerializer.get_votes_count` + `get_jai_vote` : `obj.votes.count()` + `obj.votes.filter()` → 2 requêtes/objet si pas annoté
16. **backend/apps/core_serializers.py:548-615** — `SondageSerializer._votes_par_option()` appelée 2x (`get_options`, `get_mes_votes`) → double parcours + `o.votes.count()` par option
17. **backend/apps/views_core.py:237-256** — `ActualiteViewSet.perform_create()` : boucle `for m in destinataires` + `send_email` séquentiel → bloque la réponse, pas de task asynchrone
18. **frontend/src/lib/api.js:265-274** — `publierActualite` envoie `video_url` mais `ActualiteSerializer` ne l'expose pas (champ absent du `fields`)
19. **frontend/src/lib/api.js:495-508** — `sauverProjet` envoie `statut_label`, `responsable_nom`, `cellule_nom`, `cree_le`, `maj_le` (read-only côté back) → bruit inutile
20. **frontend/src/lib/api.js:777-780** — `getCandidatures` retourne mock en dur au lieu d'appeler `/api/v1/candidatures/` (endpoint existe dans `views_emails.py:70`)

## P3 — Petits bugs & nettoyage

- **backend/apps/core_serializers.py:20,22** — Import `OpportuniteSerializer` dupliqué (lignes 20 et 22)
- **frontend/src/pages/Espace.jsx:89** — Palette : "Notifications" et "Non lues" utilisent même icône `NotificationsIcon`
- **frontend/src/pages/Espace.jsx:346** — `useEffect` scroll-spy : dépendance manquante `refs` (ESLint disabled)
- **frontend/src/pages/Veille.jsx:168** — `const [donnees, setDonnees] = useState(v)` : état dérivé des props (anti-pattern React)
- **frontend/src/components/adhesion/Adhesion.jsx:53-54** — `champs` via `useMemo(chargerConfig)` mais `setDonnees` rappelle `chargerConfig()` à l'init
- **backend/apps/views_core.py:130** — `_compte_reactions` déclaré `staticmethod` mais appelé via `self._compte_reactions(actu, request.user)` ligne 171
- **frontend/src/pages/backoffice/BackofficeLayout.jsx:274** — `navigate` importé inutilisé dans `PlaceholderModule`
## ⚠️ Action Render requise (cron emails) — à faire une fois dans le dashboard
Le service cron « itclub-emsp-emails » doit avoir dans Environment les mêmes secrets que l'API :
- DJANGO_SECRET_KEY = (copier la valeur générée du service itclub-emsp-api)
- DATABASE_URL = (même Neon poolée)
- BREVO_API_KEY = (même clé)
render.yaml déclare ces variables en sync: false — Render ne les crée pas tout seul.
Le prochain run du cron (6h UTC) passera dès que ces 3 vars sont collées.
