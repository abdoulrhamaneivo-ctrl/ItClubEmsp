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
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers

from apps.accounts.models import Role, Candidature, MembreCellule
from apps.events.models import Evenement, Inscription
from apps.notifications.models import Notification
from apps import emails as mail
from apps.core_serializers import CandidatureSerializer

logger = logging.getLogger(__name__)
User = get_user_model()

CODES_DECISION = ['P1', 'P3', 'P4']
CODES_CONVOCATION = ['P1', 'P3']


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
        if a_role(self.request.user, ['P1', 'P3', 'P4']):
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
        email = mail.email_de_candidature(cand)
        if not email:
            return Response({'detail': 'Aucun email dans la candidature.'}, status=400)
        nom = mail.nom_de_candidature(cand)
        parts = nom.split()
        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': email.split('@')[0].replace('.', '_')[:150] or f'membre{cand.pk}',
                          'first_name': parts[0] if parts else '',
                          'last_name': ' '.join(parts[1:])},
            )
            if created:
                user.set_unusable_password()
                user.save()
            for cell in cand.cellules_souhaitees.all():
                MembreCellule.objects.get_or_create(cellule=cell, membre=user)
            cand.statut = 'validee'
            cand.traitee_par = request.user
            cand.save(update_fields=['statut', 'traitee_par'])
        envoi = _fail_open('bienvenue', mail.send_candidature_validee, cand, user)
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
    try:
        evt = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=404)
    membre = request.user
    insc, created = Inscription.objects.get_or_create(evenement=evt, membre=membre)
    if not created and not insc.liste_attente:
        return Response({'statut': 'deja-inscrit'})
    confirmes = Inscription.objects.filter(evenement=evt, liste_attente=False).count()
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


# ── Test Resend (staff) ──────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def tester_email(request):
    """POST /api/v1/emails/test {to} — vérifie Resend de bout en bout."""
    to = (request.data.get('to') or '').strip()
    if not to:
        return Response({'detail': 'Champ "to" requis.'}, status=400)
    try:
        res = mail.send_email(
            to, '[IT-CLUB EMSP] Email de test',
            'candidature_recue.html',
            {'nom': 'équipe test', 'cellules': 'toutes les cellules'},
            notif_type='annonce', user=request.user, objet_id='test')
        return Response({'ok': True, 'resend': res})
    except Exception as exc:
        return Response({'ok': False, 'erreur': str(exc)[:300]}, status=502)


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
        return N.objects.filter(destinataire=u) | N.objects.filter(
            destinataire__isnull=True, destinataire_email=u.email)

    @action(detail=False, methods=['post'])
    def lire(self, request):
        qs = self.get_queryset().filter(lu=False)
        ids = request.data.get('ids')
        if ids:
            qs = qs.filter(id__in=ids)
        n = qs.update(lu=True)
        return Response({'marquees_lues': n})
