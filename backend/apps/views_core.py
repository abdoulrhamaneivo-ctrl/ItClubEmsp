"""
API /api/v1/ — ViewSets alignés sur le contrat docs/04 §5.
Lecture publique (vitrine), écriture par rôles (étape 2 : matrice doc 01).
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from apps.accounts.models import Role, Cellule, Candidature
from apps.governance.models import ObjectifPoste
from apps.comms.models import Actualite, Document, Media
from apps.events.models import Evenement
from apps.core_serializers import (
    CelluleSerializer, BureauSerializer, ActualiteSerializer,
    DocumentSerializer, MediaSerializer, EvenementSerializer, CandidatureSerializer,
)

User = get_user_model()


class PublicReadOrStaffWrite(viewsets.ModelViewSet):
    """Lecture ouverte à tous, écriture réservée au staff (étape 2 : rôles doc 01)."""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


# ── Vitrine ─────────────────────────────────────────────────
class CelluleViewSet(PublicReadOrStaffWrite):
    queryset = Cellule.objects.all().prefetch_related('membres')
    serializer_class = CelluleSerializer
    filterset_fields = ['slug']


class BureauViewSet(viewsets.ReadOnlyModelViewSet):
    """Le Bureau : les 10 postes avec titulaires + missions."""
    queryset = Role.objects.filter(code__in=['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'])
    serializer_class = BureauSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ActualiteViewSet(PublicReadOrStaffWrite):
    queryset = Actualite.objects.select_related('tag_cellule', 'auteur').all()
    serializer_class = ActualiteSerializer
    filterset_fields = ['tag_cellule']

    def perform_create(self, serializer):
        actu = serializer.save()
        # Notification email selon audience (doc 02 D3) — fail-open
        try:
            from apps import emails as mail
            if actu.tag_cellule:
                destinataires = User.objects.filter(
                    cellules__cellule=actu.tag_cellule).distinct()
            else:
                destinataires = User.objects.filter(is_active=True).exclude(email='')
            for m in destinataires:
                if not m.email:
                    continue
                try:
                    mail.send_annonce(m.email, m.get_full_name() or m.username, actu, user=m)
                except Exception:
                    continue
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning('Emails annonce ignorés: %s', exc)


class DocumentViewSet(PublicReadOrStaffWrite):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    filterset_fields = ['famille']


class MediaViewSet(PublicReadOrStaffWrite):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    filterset_fields = ['type', 'evenement', 'tag_cellule']


class EvenementViewSet(PublicReadOrStaffWrite):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    filterset_fields = ['type']

    def get_queryset(self):
        from django.utils import timezone
        qs = super().get_queryset()
        a_venir = self.request.query_params.get('a_venir') or self.request.query_params.get('upcoming')
        if str(a_venir).lower() in ('1', 'true'):
            qs = qs.filter(date_debut__gte=timezone.now())
        return qs

    def list(self, request, *args, **kwargs):
        resp = super().list(request, *args, **kwargs)
        # ?limit=N — le front demande les N prochains (sans casser la pagination DRF sinon)
        try:
            limit = int(request.query_params.get('limit', 0))
        except (TypeError, ValueError):
            limit = 0
        if limit > 0 and isinstance(resp.data, dict) and isinstance(resp.data.get('results'), list):
            resp.data['results'] = resp.data['results'][:limit]
            resp.data['count'] = len(resp.data['results'])
        return resp


# ── Public (throttle anti-spam doc 04 §8) ───────────────────
class PublicWriteThrottle(AnonRateThrottle):
    scope = 'public_write'


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([PublicWriteThrottle])
def register_candidature(request):
    """POST /api/v1/auth/register-candidature — le formulaire d'adhésion.

    Accepte le format canonique {donnees: {...}, cellules_souhaitees: [ids|slugs]}
    ET le format plat historique du front {email, nom, ..., cellules: [slugs]}.
    """
    data = dict(request.data)
    donnees = data.get('donnees')
    if not isinstance(donnees, dict):
        # Format plat : tout sauf les clés réservées devient donnees
        reserves = {'cellules_souhaitees', 'cellules', 'donnees'}
        donnees = {k: v for k, v in data.items() if k not in reserves}
    # RG-A1 (doc 02 D2) : un email = une seule candidature active
    from apps import emails as _mail
    email_test = ''
    for k in ('email', 'e-mail', 'courriel', 'mail', 'adresse_email'):
        v = donnees.get(k)
        if isinstance(v, str) and v.strip():
            email_test = v.strip().lower()
            break
    if email_test:
        for c in Candidature.objects.filter(statut='en_attente'):
            if _mail.email_de_candidature(c).strip().lower() == email_test:
                return Response(
                    {'detail': 'Une candidature est déjà en cours pour cet email.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
    cellules_refs = (data.get('cellules_souhaitees')
                     or data.get('cellules') or [])
    if isinstance(cellules_refs, str):
        cellules_refs = [cellules_refs]
    serializer = CandidatureSerializer(
        data={'donnees': donnees, 'cellules_souhaitees': []})
    if serializer.is_valid():
        candidature = serializer.save()
        if cellules_refs:
            refs = [str(r) for r in cellules_refs]
            cellules = Cellule.objects.filter(id__in=[r for r in refs if r.isdigit()]) \
                | Cellule.objects.filter(slug__in=[r for r in refs if not r.isdigit()])
            candidature.cellules_souhaitees.set(cellules.distinct())
        # Email de confirmation (fail-open : la candidature reste créée)
        try:
            from apps import emails as mail
            mail.send_candidature_recue(candidature)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning('Email candidature ignoré: %s', exc)
        return Response(
            {'id': candidature.id, 'message': 'Candidature reçue — réponse sous 48h.'},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def qr_adhesion(request):
    """GET /api/v1/adhesion/qr?source=web — QR du formulaire (RG-A2, PNG)."""
    from django.conf import settings as _s
    from django.http import HttpResponse
    import io
    try:
        import qrcode
    except ImportError:
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Librairie qrcode manquante.'}, status=501)
    source = request.query_params.get('source', 'web')
    url = f'{_s.FRONTEND_URL}/#adhesion?source={source}'
    img = qrcode.make(url, box_size=10, border=2)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return HttpResponse(buf.getvalue(), content_type='image/png')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def presentation(request):
    """GET /api/v1/presentation/ — vitrine « Qui sommes-nous » + stats live."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    piliers = [
        {'numero': '01', 'titre': 'Apprendre en codant vrai',
         'texte': "Pas de sujets abstraits : cette plateforme, les outils du club, les projets — c'est de la vraie techno construite ensemble."},
        {'numero': '02', 'titre': "Se retrouver et s'entraider",
         'texte': "Ateliers, sessions de code, entraide entre cellules : personne n'avance seul, les aînés tirent les nouveaux vers le haut."},
        {'numero': '03', 'titre': 'Ouvrir les horizons',
         'texte': "Hackathons, conférences, sorties, partenariats : le club connecte l'école au monde tech qui l'entoure."},
    ]
    return Response({
        'titre': 'Le IT-CLUB EMSP',
        'intro': "Le IT-CLUB est le club informatique de l'École Multinationale des Postes (EMSP). "
                 "Un espace ouvert à tous les étudiants qui veulent apprendre, coder, partager et "
                 "construire ensemble — sans prérequis, sans sélection.",
        'priorites': piliers,
        'stats': {
            'membres': User.objects.filter(is_active=True).count(),
            'cellules': Cellule.objects.count(),
            'evenements': Evenement.objects.count(),
        },
    })
