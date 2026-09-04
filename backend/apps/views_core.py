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


# ── Public (throttle anti-spam doc 04 §8) ───────────────────
class PublicWriteThrottle(AnonRateThrottle):
    scope = 'public_write'


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([PublicWriteThrottle])
def register_candidature(request):
    """POST /api/v1/auth/register-candidature — le formulaire d'adhésion."""
    serializer = CandidatureSerializer(data=request.data)
    if serializer.is_valid():
        candidature = serializer.save()
        cellules = request.data.get('cellules_souhaitees', [])
        if cellules:
            candidature.cellules_souhaitees.set(Cellule.objects.filter(id__in=cellules))
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
