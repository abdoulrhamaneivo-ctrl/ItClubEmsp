"""APIs liées aux emails et aux flux métier (doc 02 D2/D5/D9/D10, doc 04 §5).

- Candidatures : liste (Bureau) + valider/refuser (P1/P3/P4/staff).
- Inscriptions événements : inscrire (gère liste d'attente) / désinscrire
  (promouvant le premier en attente) — doc 02 D5, RG-E2.
- Convocation : envoi ciblé (P1/P3/staff) — doc 02 D9.
- Test : vérification Resend par le staff.
- Notifications : centre in-app du membre (doc 02 D10).
"""
import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action, throttle_classes
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers

from apps.accounts.models import Role, Cellule, Candidature, MembreCellule
from apps.events.models import Evenement, Inscription
from apps.notifications.models import Notification
from apps import emails as mail
from apps.core_serializers import CandidatureSerializer

logger = logging.getLogger(__name__)
User = get_user_model()

CODES_DECISION = ['P1', 'P3', 'P4', 'ADMIN']
CODES_CONVOCATION = ['P1', 'P3', 'ADMIN']
CODES_PRESENCE = ['P1', 'P6', 'ADMIN']
POINTS_PRESENCE = 5
POINTS_BIENVENUE = 10

# Niveaux calculés (pas de modèle : seuils stables doc 00 bonus)
NIVEAUX = [
    (50, 'Légende du club'),
    (20, 'Pilier'),
    (5, 'Actif'),
    (0, 'Nouveau'),
]


def niveau_de(points):
    for seuil, label in NIVEAUX:
        if (points or 0) >= seuil:
            return label
    return 'Nouveau'


def a_role(user, codes):
    """Membre du Bureau sur l'un des postes (ou staff)."""
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    return Role.objects.filter(code__in=codes, titulaire=user).exists()


def _fail_open(action_label, fn, *args, **kwargs):
    """Envoi d'email : ne casse jamais la réponse API."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.warning('Email %s ignoré (fail-open): %s', action_label, exc)
        return {'skipped': f'fail-open: {exc}'}


# ── Candidatures ─────────────────────────────────────────────
class CandidatureViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /candidatures (Bureau : P1/P3/P4/staff)."""
    queryset = Candidature.objects.all().prefetch_related('cellules_souhaitees')
    serializer_class = CandidatureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if a_role(self.request.user, ['P1', 'P3', 'P4', 'ADMIN']):
            return qs
        return qs.none()

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Crée le compte, affecte les cellules, envoie la bienvenue."""
        if not a_role(request.user, CODES_DECISION):
            return Response({'detail': 'Réservé au Bureau (P1/P3/P4).'}, status=403)
        cand = self.get_object()
        if cand.statut == 'validee':
            return Response({'detail': 'Déjà validée.'}, status=400)
        email = (mail.email_de_candidature(cand) or '').strip().lower()
        if not email:
            return Response({'detail': 'Aucun email dans la candidature.'}, status=400)
        nom = mail.nom_de_candidature(cand)
        parts = nom.split()
        base_username = (email.split('@')[0].replace('.', '_')[:140] or f'membre{cand.pk}')
        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email__iexact=email,
                defaults={'email': email,
                          'username': base_username,
                          'first_name': parts[0] if parts else '',
                          'last_name': ' '.join(parts[1:])},
            )
            if created:
                # Collision de username possible (même préfixe) → suffixe unique
                if User.objects.filter(username=user.username).exclude(pk=user.pk).exists():
                    user.username = f'{base_username}_{cand.pk}'[:150]
                user.set_unusable_password()
                user.save()
            for cell in cand.cellules_souhaitees.all():
                MembreCellule.objects.get_or_create(cellule=cell, membre=user)
            if created:
                # Bonus de bienvenue gamification (+10, une seule fois)
                from django.db.models import F as _F
                User.objects.filter(pk=user.pk).update(points=_F('points') + POINTS_BIENVENUE)
                user.refresh_from_db()
            cand.statut = 'validee'
            cand.traitee_par = request.user
            cand.save(update_fields=['statut', 'traitee_par'])
        # Invitation : le membre choisit son mot de passe (compte créé sans mdp)
        lien = lien_definition_mdp(user) if (created or not user.has_usable_password()) else None
        envoi = _fail_open('bienvenue', mail.send_candidature_validee, cand, user, lien)
        return Response({'id': cand.id, 'statut': 'validee', 'user_id': user.id,
                         'compte_cree': created, 'email': envoi})

    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        if not a_role(request.user, CODES_DECISION):
            return Response({'detail': 'Réservé au Bureau (P1/P3/P4).'}, status=403)
        cand = self.get_object()
        if cand.statut == 'refusee':
            return Response({'detail': 'Déjà refusée.'}, status=400)
        cand.statut = 'refusee'
        cand.traitee_par = request.user
        cand.save(update_fields=['statut', 'traitee_par'])
        envoi = _fail_open('refus', mail.send_candidature_refusee, cand)
        return Response({'id': cand.id, 'statut': 'refusee', 'email': envoi})


# ── Inscriptions événements ──────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def inscrire(request, pk):
    """POST /api/v1/evenements/{id}/inscrire — confirme ou met en attente."""
    from django.db import transaction as _tx
    with _tx.atomic():
        try:
            evt = Evenement.objects.select_for_update().get(pk=pk)
        except Evenement.DoesNotExist:
            return Response({'detail': 'Événement introuvable.'}, status=404)
        membre = request.user
        insc, created = Inscription.objects.get_or_create(evenement=evt, membre=membre)
        if not created and not insc.liste_attente:
            return Response({'statut': 'deja-inscrit'})
        # La ligne créée (liste_attente=False par défaut) ne doit pas se compter elle-même
        confirmes = Inscription.objects.filter(
            evenement=evt, liste_attente=False).exclude(pk=insc.pk).count()
        complet = evt.places > 0 and confirmes >= evt.places
        if complet:
            insc.liste_attente = True
            insc.save(update_fields=['liste_attente'])
            position = Inscription.objects.filter(
                evenement=evt, liste_attente=True, cree_le__lte=insc.cree_le).count()
            envoi = _fail_open('liste-attente', mail.send_liste_attente, insc, position)
            return Response({'statut': 'liste-attente', 'position': position, 'email': envoi},
                            status=201 if created else 200)
        insc.liste_attente = False
        insc.save(update_fields=['liste_attente'])
        envoi = _fail_open('confirmation', mail.send_inscription_confirmee, insc)
        return Response({'statut': 'confirme', 'email': envoi},
                        status=201 if created else 200)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def desinscrire(request, pk):
    """DELETE …/desinscrire — libère la place, promeut le 1er en attente."""
    try:
        insc = Inscription.objects.get(evenement_id=pk, membre=request.user)
    except Inscription.DoesNotExist:
        return Response({'detail': 'Pas inscrit.'}, status=404)
    evt, etait_confirme = insc.evenement, not insc.liste_attente
    insc.delete()
    promu = None
    if etait_confirme and evt.places > 0:
        suivant = Inscription.objects.filter(
            evenement=evt, liste_attente=True).order_by('cree_le').first()
        if suivant:
            suivant.liste_attente = False
            suivant.save(update_fields=['liste_attente'])
            _fail_open('promotion', mail.send_promotion, suivant)
            promu = suivant.membre.email
    return Response({'statut': 'desinscrit', 'place_reattribuee_a': promu})


# ── Convocation (P1/P3/staff) ────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def convocation(request):
    """Envoie une convocation (+ rappel H-48h géré par la commande périodique)."""
    if not a_role(request.user, CODES_CONVOCATION):
        return Response({'detail': 'Réservé au Bureau (P1/P3).'}, status=403)
    titre = (request.data.get('titre') or '').strip()
    emails = request.data.get('emails') or []
    tous = bool(request.data.get('tous_membres'))
    if not titre or (not emails and not tous):
        return Response({'detail': 'titre + emails (ou tous_membres) requis.'}, status=400)
    if tous:
        emails = list(User.objects.filter(is_active=True).exclude(email='')
                      .values_list('email', flat=True))
    date_str = request.data.get('date_str', '')
    lieu = request.data.get('lieu', '')
    ordre = request.data.get('ordre_du_jour', '')
    envoyes, ignores = 0, []
    for email in emails:
        nom = email.split('@')[0].replace('.', ' ').replace('_', ' ')
        try:
            mail.send_convocation(email, nom, titre, date_str, lieu, ordre)
            envoyes += 1
        except Exception as exc:
            ignores.append({'email': email, 'erreur': str(exc)[:120]})
    return Response({'envoyes': envoyes, 'ignores': ignores})


# ── Test Brevo (Bureau) ──────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def tester_email(request):
    """POST /api/v1/emails/test {to} — vérifie Brevo de bout en bout (P1/P3/P5/ADMIN)."""
    if not a_role(request.user, ['P1', 'P3', 'P5', 'ADMIN']):
        return Response({'detail': 'Réservé au Bureau (P1/P3/P5).'}, status=403)
    to = (request.data.get('to') or '').strip()
    if not to:
        return Response({'detail': 'Champ "to" requis.'}, status=400)
    try:
        res = mail.send_email(
            to, '[IT-CLUB EMSP] Email de test',
            'candidature_recue.html',
            {'nom': 'équipe test', 'cellules': 'toutes les cellules'},
            notif_type='annonce', user=request.user, objet_id='test')
        envoye = not res.get('skipped')
        return Response({'ok': envoye, 'resultat': res})
    except Exception as exc:
        return Response({'ok': False, 'erreur': str(exc)[:300]}, status=502)


# ── Présences : émargement + points (doc 02 D5, gamification) ────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def marquer_presence(request, pk):
    """POST /api/v1/evenements/{id}/presence — {code} (membre) ou {email} (orga Bureau)."""
    from apps.events.models import Presence
    from django.db.models import F
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)

    email_orga = (request.data.get('email') or '').strip().lower()
    if email_orga:
        # Émargement manuel par l'orga (pas de code requis)
        if not a_role(request.user, CODES_PRESENCE):
            return Response({'detail': 'Réservé aux organisateurs (P1/P6).'}, status=403)
        try:
            cible = User.objects.get(email__iexact=email_orga)
        except User.DoesNotExist:
            return Response({'detail': 'Membre introuvable.'}, status=404)
        marque_par = request.user
    else:
        cible = request.user
        marque_par = None
        code = (request.data.get('code') or '').strip()
        if not evt.code_presence or code != evt.code_presence:
            return Response({'detail': 'Code incorrect.'}, status=400)

    _, cree = Presence.objects.get_or_create(
        evenement=evt, membre=cible, defaults={'marque_par': marque_par})
    if not cree:
        return Response({'statut': 'deja-present', 'points': cible.points})
    # +5 pts une seule fois (incrément atomique)
    User.objects.filter(pk=cible.pk).update(points=F('points') + POINTS_PRESENCE)
    cible.refresh_from_db()
    return Response({'statut': 'present', 'points': cible.points, 'gagnes': POINTS_PRESENCE})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def liste_presences(request, pk):
    """GET /api/v1/evenements/{id}/presence — feuille d'émargement (orga)."""
    from apps.events.models import Presence
    if not a_role(request.user, CODES_PRESENCE):
        return Response({'detail': 'Réservé aux organisateurs (P1/P6).'}, status=403)
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)
    lignes = Presence.objects.filter(evenement=evt).select_related('membre', 'marque_par')
    return Response({
        'evenement': evt.titre,
        'code': evt.code_presence,
        'presents': [{
            'email': p.membre.email,
            'nom': p.membre.get_full_name() or p.membre.username,
            'marque_le': p.marque_le,
            'par_orga': p.marque_par is not None,
        } for p in lignes],
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_presences_csv(request, pk):
    """GET /api/v1/evenements/{id}/export-presences.csv — export Excel (orga)."""
    import csv
    from io import StringIO
    from django.http import HttpResponse
    from apps.events.models import Presence
    if not a_role(request.user, CODES_PRESENCE):
        return Response({'detail': 'Réservé aux organisateurs (P1/P6).'}, status=403)
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)
    buf = StringIO()
    buf.write('﻿')  # BOM : Excel ouvre en UTF-8
    w = csv.writer(buf, delimiter=';')
    w.writerow(['nom', 'email', 'marque_le', 'par_orga'])
    for p in Presence.objects.filter(evenement=evt).select_related('membre', 'marque_par'):
        w.writerow([p.membre.get_full_name() or p.membre.username, p.membre.email,
                    p.marque_le.strftime('%d/%m/%Y %H:%M'), 'oui' if p.marque_par else 'non'])
    resp = HttpResponse(buf.getvalue(), content_type='text/csv; charset=utf-8')
    resp['Content-Disposition'] = f'attachment; filename="presences-evenement-{pk}.csv"'
    return resp


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def qr_presence(request, pk):
    """GET /api/v1/evenements/{id}/qr-presence — QR du code (orga, vidéoprojecteur)."""
    from django.http import HttpResponse
    import io
    try:
        import qrcode
    except ImportError:
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Librairie qrcode manquante.'}, status=501)
    if not a_role(request.user, CODES_PRESENCE):
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Réservé aux organisateurs (P1/P6).'}, status=403)
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Événement introuvable.'}, status=404)
    img = qrcode.make(f'ITCLUB-PRESENCE:{evt.pk}:{evt.code_presence}', box_size=10, border=2)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return HttpResponse(buf.getvalue(), content_type='image/png')


# ── Calendrier : conflits + iCal (doc 00 #6, RG-E1) ─────────────
def _fin_ou_defaut(debut, fin):
    from datetime import timedelta
    return fin or (debut + timedelta(hours=2))


def conflits_evenement(debut, fin, lieu, exclure_pk=None):
    """Conflits = même lieu + horaires qui se chevauchent (RG-E1)."""
    lieu = (lieu or '').strip()
    if not lieu:
        return []
    qs = Evenement.objects.exclude(pk=exclure_pk).filter(lieu__iexact=lieu)
    fin = _fin_ou_defaut(debut, fin)
    trouves = []
    for e in qs:
        e_fin = _fin_ou_defaut(e.date_debut, e.date_fin)
        if e.date_debut < fin and e_fin > debut:
            trouves.append({'id': e.id, 'titre': e.titre,
                            'date': e.date_debut, 'lieu': e.lieu})
    return trouves


def _ics_date(dt):
    from datetime import timezone as _dt_tz
    from django.utils import timezone as _tz
    dt = dt if dt.tzinfo else _tz.make_aware(dt)
    return dt.astimezone(_dt_tz.utc).strftime('%Y%m%dT%H%M%SZ')


def _ics_evenement(e):
    from django.utils import timezone as _tz
    lignes = ['BEGIN:VEVENT', f'UID:evt-{e.pk}@itclub.emsp',
              f'DTSTAMP:{_ics_date(_tz.now())}',
              f'DTSTART:{_ics_date(e.date_debut)}',
              f'DTEND:{_ics_date(_fin_ou_defaut(e.date_debut, e.date_fin))}',
              f'SUMMARY:{e.titre}',
              f'LOCATION:{e.lieu or ""}']
    if e.description:
        desc = e.description.replace('\n', '\\n').replace(',', '\\,')[:500]
        lignes.append(f'DESCRIPTION:{desc}')
    lignes.append('END:VEVENT')
    return '\r\n'.join(lignes)


def _reponse_ics(nom_fichier, evenements):
    from django.http import HttpResponse
    corps = '\r\n'.join(['BEGIN:VCALENDAR', 'VERSION:2.0',
                         'PRODID:-//IT-CLUB EMSP//Calendrier//FR',
                         'X-WR-CALNAME:IT-CLUB EMSP',
                         *[_ics_evenement(e) for e in evenements],
                         'END:VCALENDAR', ''])
    resp = HttpResponse(corps, content_type='text/calendar; charset=utf-8')
    resp['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
    return resp


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def calendrier_ics(request):
    """GET /api/v1/calendrier.ics — à abonner dans Google Agenda / Apple."""
    from django.utils import timezone
    evts = Evenement.objects.filter(date_debut__gte=timezone.now()).order_by('date_debut')[:100]
    return _reponse_ics('itclub-emsp.ics', evts)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def evenement_ics(request, pk):
    """GET /api/v1/evenements/{id}.ics — un seul événement."""
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)
    return _reponse_ics(f'evenement-{pk}.ics', [evt])


# ── Classement gamification (public, top 20, doc 00 bonus) ────
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def classement(request):
    """GET /api/v1/classement/ — [{nom, points, niveau}], points > 0."""
    joueurs = User.objects.filter(is_active=True, points__gt=0).order_by('-points')[:20]
    return Response([{
        'nom': u.get_full_name() or u.username,
        'points': u.points,
        'niveau': niveau_de(u.points),
    } for u in joueurs])


# ── Dashboard global P1/P2 + Admin (doc 01) ─────────────────────
CODES_DASHBOARD = ['P1', 'P2', 'ADMIN']
CODES_PASSATION = ['P1', 'ADMIN']


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard(request):
    """GET /api/v1/dashboard/ — chiffres clés du club (P1/P2/staff)."""
    if not a_role(request.user, CODES_DASHBOARD):
        return Response({'detail': 'Réservé à la direction (P1/P2).'}, status=403)
    from django.db.models import Count, Sum
    from apps.events.models import Inscription, Presence
    from apps.governance.models import Projet, Opportunite
    users = User.objects.filter(is_active=True)
    parts = {c['statut']: c['n'] for c in
             Candidature.objects.values('statut').annotate(n=Count('id'))}
    cellules = Cellule.objects.annotate(n=Count('membres')).order_by('-n')
    return Response({
        'membres': users.count(),
        'points_distribues': users.aggregate(s=Sum('points'))['s'] or 0,
        'candidatures': {
            'en_attente': parts.get('en_attente', 0),
            'validee': parts.get('validee', 0),
            'refusee': parts.get('refusee', 0),
        },
        'evenements': {
            'total': Evenement.objects.count(),
            'inscrits_confirmes': Inscription.objects.filter(liste_attente=False).count(),
            'en_attente': Inscription.objects.filter(liste_attente=True).count(),
            'presents': Presence.objects.count(),
        },
        'projets': {c['statut']: c['n'] for c in
                    Projet.objects.values('statut').annotate(n=Count('id'))},
        'opportunites': {c['statut']: c['n'] for c in
                         Opportunite.objects.values('statut').annotate(n=Count('id'))},
        'top_cellules': [{'nom': c.nom, 'membres': c.n} for c in cellules[:4]],
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def stats_publiques(request):
    """GET /api/v1/stats-publiques/ — chiffres vitrine (zéro chiffre en dur).

    Bureau, cellules, activités à venir, documents, actualités : tout
    vient de la base. Cache navigateur 5 min (données non sensibles)."""
    from django.utils import timezone
    from apps.comms.models import Actualite, Document
    from apps.events.models import Evenement
    return Response({
        'membres_bureau': Role.objects.exclude(titulaire=None).count(),
        'cellules': Cellule.objects.count(),
        'activites_a_venir': Evenement.objects.filter(
            date_debut__gte=timezone.now()).count(),
        'documents': Document.objects.count(),
        'actualites': Actualite.objects.count(),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_utilisateurs(request):
    """GET /api/v1/admin/utilisateurs — annuaire complet (ADMIN/staff)."""
    u = request.user
    if not (u.is_staff or a_role(u, ['ADMIN'])):
        return Response({'detail': 'Réservé à l’administrateur.'}, status=403)
    lignes = User.objects.all().order_by('-date_joined')[:200]
    return Response([{
        'id': x.id,
        'nom': x.get_full_name() or x.username,
        'email': x.email,
        'points': x.points,
        'niveau': niveau_de(x.points),
        'roles': [r.code for r in x.roles.all()],
        'is_active': x.is_active,
    } for x in lignes])


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_utilisateur_maj(request, pk):
    """PATCH /api/v1/admin/utilisateurs/{id} {is_active} (ADMIN/staff)."""
    u = request.user
    if not (u.is_staff or a_role(u, ['ADMIN'])):
        return Response({'detail': 'Réservé à l’administrateur.'}, status=403)
    try:
        cible = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'Introuvable.'}, status=404)
    if cible.pk == u.pk and request.data.get('is_active') is False:
        return Response({'detail': 'On ne se désactive pas soi-même.'}, status=400)
    if 'is_active' in request.data:
        cible.is_active = bool(request.data['is_active'])
        cible.save(update_fields=['is_active'])
    return Response({'id': cible.id, 'is_active': cible.is_active})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_roles(request):
    """GET /api/v1/admin/roles — les 10 postes + titulaires (P1/ADMIN/staff)."""
    u = request.user
    if not (u.is_staff or a_role(u, CODES_PASSATION)):
        return Response({'detail': 'Réservé à la direction.'}, status=403)
    roles = Role.objects.filter(
        code__in=['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10']
    ).select_related('titulaire').order_by('code')
    return Response([{
        'code': r.code,
        'poste': r.get_code_display(),
        'titulaire': (r.titulaire.get_full_name() or r.titulaire.username)
        if r.titulaire else None,
        'titulaire_email': r.titulaire.email if r.titulaire else None,
    } for r in roles])


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_role_passation(request, code):
    """PATCH /api/v1/admin/roles/{code} {email} — passation (P1/ADMIN/staff)."""
    u = request.user
    if not (u.is_staff or a_role(u, CODES_PASSATION)):
        return Response({'detail': 'Réservé à la direction.'}, status=403)
    try:
        role = Role.objects.get(code=code)
    except Role.DoesNotExist:
        return Response({'detail': 'Poste introuvable.'}, status=404)
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        role.titulaire = None
        role.save(update_fields=['titulaire'])
        return Response({'code': role.code, 'titulaire': None})
    try:
        nouveau = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        return Response({'detail': 'Aucun membre actif avec cet email.'}, status=400)
    role.titulaire = nouveau
    role.save(update_fields=['titulaire'])
    return Response({'code': role.code,
                     'titulaire': nouveau.get_full_name() or nouveau.username})


# ── Retours & bilan post-activité (doc 02 D5, P6) ────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def donner_retour(request, pk):
    """POST /evenements/{id}/retour {note, avis} — 1 par membre, modifiable."""
    from apps.events.models import Retour
    from django.db import IntegrityError
    from django.db.models import Avg, Count
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)
    try:
        note = int(request.data.get('note'))
    except (TypeError, ValueError):
        return Response({'detail': 'Note 1-5 requise.'}, status=400)
    if not 1 <= note <= 5:
        return Response({'detail': 'Note entre 1 et 5.'}, status=400)
    avis = (request.data.get('avis') or '').strip()[:1000]
    retour, cree = Retour.objects.update_or_create(
        evenement=evt, membre=request.user,
        defaults={'note': note, 'avis': avis})
    # Recharge frais pour la moyenne exacte
    from django.db.models import Avg
    agg = Retour.objects.filter(evenement=evt).aggregate(moyenne=Avg('note'), n=Count('id'))
    return Response({'statut': 'modifie' if not cree else 'enregistre',
                     'note_moyenne': round(agg['moyenne'], 1), 'nb_retours': agg['n']})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def retours_liste(request, pk):
    """GET /evenements/{id}/retours — avis membres (organisateur P1/P6)."""
    from apps.events.models import Retour
    if not a_role(request.user, CODES_PRESENCE):
        return Response({'detail': 'Réservé aux organisateurs (P1/P6).'}, status=403)
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)
    from django.db.models import Avg, Count
    agg = Retour.objects.filter(evenement=evt).aggregate(moyenne=Avg('note'), n=Count('id'))
    lignes = Retour.objects.filter(evenement=evt).select_related('membre')
    return Response({
        'evenement': evt.titre,
        'note_moyenne': round(agg['moyenne'], 1) if agg['moyenne'] else None,
        'nb_retours': agg['n'],
        'avis': [{
            'nom': r.membre.get_full_name() or r.membre.username,
            'note': r.note, 'avis': r.avis, 'cree_le': r.cree_le,
        } for r in lignes],
    })


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def bilan_evenement(request, pk):
    """GET/PATCH /evenements/{id}/bilan — brouillon orga, publie → vitrine."""
    from apps.events.models import Bilan
    from django.utils import timezone
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)
    if request.method == 'GET':
        if not a_role(request.user, CODES_PRESENCE):
            return Response({'detail': 'Réservé aux organisateurs (P1/P6).'}, status=403)
        bilan = getattr(evt, 'bilan', None)
        return Response({'evenement': evt.titre,
                         'bilan': None if bilan is None else {
                             'texte': bilan.texte, 'points_forts': bilan.points_forts,
                             'points_ameliorer': bilan.points_ameliorer,
                             'publie': bilan.publie}})
    if not a_role(request.user, CODES_PRESENCE):
        return Response({'detail': 'Réservé aux organisateurs (P1/P6).'}, status=403)
    bilan, _ = Bilan.objects.get_or_create(evenement=evt)
    if 'texte' in request.data:
        texte = (request.data.get('texte') or '').strip()
        if not texte:
            return Response({'detail': 'Le bilan ne peut pas être vide.'}, status=400)
        bilan.texte = texte
    for champ in ('points_forts', 'points_ameliorer'):
        if champ in request.data:
            setattr(bilan, champ, (request.data.get(champ) or '').strip())
    if 'publie' in request.data:
        bilan.publie = bool(request.data['publie'])
        if bilan.publie and not bilan.texte.strip():
            return Response({'detail': 'Rédige le bilan avant de publier.'}, status=400)
    bilan.save()
    return Response({'statut': 'publie' if bilan.publie else 'brouillon',
                     'texte': bilan.texte, 'points_forts': bilan.points_forts,
                     'points_ameliorer': bilan.points_ameliorer})


# ── Mot de passe : invitation + définition (comptes créés sans mdp) ─
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

_generateur_mdp = PasswordResetTokenGenerator()


def lien_definition_mdp(user):
    """Lien d'invitation : le membre choisit son mot de passe (valide
    jusqu'à la première définition — le token s'invalide au changement)."""
    from django.conf import settings
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = _generateur_mdp.make_token(user)
    base = settings.FRONTEND_URL.rstrip('/')
    return f'{base}/definir-mot-de-passe?uid={uid}&token={token}'


# Même compteur anti-spam que views_core (import direct = circulaire)
from rest_framework.throttling import AnonRateThrottle


class InvitationThrottle(AnonRateThrottle):
    scope = 'public_write'


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([InvitationThrottle])
def definir_mot_de_passe(request):
    """POST /api/v1/auth/definir-mot-de-passe {uid, token, password}."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    password = (request.data.get('password') or '')
    if len(password) < 8:
        return Response({'detail': '8 caractères minimum.'}, status=400)
    try:
        pk = force_str(urlsafe_base64_decode(request.data.get('uid', '')))
        user = User.objects.get(pk=pk, is_active=True)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({'detail': 'Lien invalide ou expiré.'}, status=400)
    if not _generateur_mdp.check_token(user, request.data.get('token', '')):
        return Response({'detail': 'Lien invalide ou expiré.'}, status=400)
    user.set_password(password)
    user.save(update_fields=['password'])
    return Response({'statut': 'ok'})


# ── Espace membre : /me/* (doc 04 §5 accounts) ────────────────
@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """Profil du membre connecté + préférences notifications (PATCH partiel)."""
    from apps.core_serializers import ProfilSerializer
    if request.method == 'PATCH':
        allowed = {'promotion', 'telephone', 'notif_prefs'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        if 'notif_prefs' in data and not isinstance(data['notif_prefs'], dict):
            return Response({'detail': 'notif_prefs doit être un objet.'}, status=400)
        for k, v in data.items():
            setattr(request.user, k, v)
        request.user.save(update_fields=[k for k in data] or None)
    return Response(ProfilSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def changer_mot_de_passe(request):
    """POST /api/v1/me/mot-de-passe {ancien, nouveau} — rotation par le membre."""
    ancien = request.data.get('ancien') or ''
    nouveau = request.data.get('nouveau') or ''
    if len(nouveau) < 8:
        return Response({'detail': '8 caractères minimum.'}, status=400)
    u = request.user
    if u.has_usable_password() and not u.check_password(ancien):
        return Response({'detail': 'Mot de passe actuel incorrect.'}, status=400)
    u.set_password(nouveau)
    u.save(update_fields=['password'])
    return Response({'statut': 'ok'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mes_inscriptions(request):
    """Inscriptions du membre (confirmées + attente) — Espace."""
    from apps.core_serializers import InscriptionMembreSerializer
    qs = Inscription.objects.filter(membre=request.user).select_related('evenement')
    return Response(InscriptionMembreSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mes_cellules(request):
    """Cellules du membre — Espace."""
    from apps.core_serializers import CelluleSerializer
    qs = Cellule.objects.filter(membres__membre=request.user).distinct()
    return Response(CelluleSerializer(qs, many=True).data)


# ── Notifications in-app ─────────────────────────────────────
class NotificationSerializer(drf_serializers.ModelSerializer):
    class Meta:
        from apps.notifications.models import Notification as N
        model = N
        fields = ['id', 'type', 'titre', 'message', 'objet_id', 'lu', 'cree_le']
        read_only_fields = fields


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /notifications — uniquement les siennes. POST /lire → tout marquer lu."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from apps.notifications.models import Notification as N
        u = self.request.user
        return (N.objects.filter(destinataire=u) | N.objects.filter(
            destinataire__isnull=True, destinataire_email=u.email)).distinct()

    @action(detail=False, methods=['post'])
    def lire(self, request):
        qs = self.get_queryset().filter(lu=False)
        ids = request.data.get('ids')
        if ids:
            qs = qs.filter(id__in=ids)
        n = qs.update(lu=True)
        return Response({'marquees_lues': n})
