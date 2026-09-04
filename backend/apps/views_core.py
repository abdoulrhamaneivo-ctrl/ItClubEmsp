"""
API /api/v1/ — ViewSets alignés sur le contrat docs/04 §5.
Lecture publique (vitrine), écriture par rôles (étape 2 : matrice doc 01).
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes, action
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from apps.accounts.models import Role, Cellule, Candidature
from apps.governance.models import ObjectifPoste, Projet, Opportunite, Parametre
from apps.comms.models import Actualite, Document, Media, Sujet, MessageForum, Sondage, OptionSondage, Vote
from apps.events.models import Evenement
from apps.core_serializers import (
    CelluleSerializer, BureauSerializer, ActualiteSerializer,
    DocumentSerializer, MediaSerializer, EvenementSerializer, CandidatureSerializer,
    ProjetSerializer, OpportuniteSerializer, ParametreSerializer,
    SujetSerializer, MessageForumSerializer, SondageSerializer,
)

User = get_user_model()


def _est_modo(user):
    """Modération forum : staff ou P1/P5/ADMIN."""
    if not (user and user.is_authenticated):
        return False
    if getattr(user, 'is_staff', False):
        return True
    try:
        return Role.objects.filter(
            code__in=['P1', 'P5', 'ADMIN'], titulaire=user).exists()
    except Exception:
        return False


class BureauWritePermission(permissions.BasePermission):
    """Lecture publique ; écriture réservée au Bureau (doc 01 : rôles P1-P10,
    CHEF_CELLULE, ADMIN) ou staff Django."""

    CODES_BUREAU = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10',
                    'CHEF_CELLULE', 'ADMIN']

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.is_staff:
            return True
        try:
            return bool(u.roles.filter(code__in=self.CODES_BUREAU).exists())
        except Exception:
            return False


class PublicReadOrStaffWrite(viewsets.ModelViewSet):
    """Lecture ouverte à tous, écriture réservée au Bureau (doc 01)."""
    permission_classes = [BureauWritePermission]


# ── Vitrine ─────────────────────────────────────────────────
class CelluleViewSet(PublicReadOrStaffWrite):
    queryset = Cellule.objects.all().prefetch_related('membres')
    serializer_class = CelluleSerializer
    filterset_fields = ['slug']


class BureauViewSet(viewsets.ReadOnlyModelViewSet):
    """Le Bureau : les 10 postes avec titulaires + missions."""
    queryset = Role.objects.filter(code__in=['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10']).select_related('titulaire')
    serializer_class = BureauSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_serializer_context(self):
        # Missions + objectifs en UNE requête (évite 2N requêtes du serializer)
        ctx = super().get_serializer_context()
        ctx['objectifs'] = {o.role_code: o for o in ObjectifPoste.objects.all()}
        return ctx


class ActualiteViewSet(PublicReadOrStaffWrite):
    queryset = Actualite.objects.select_related('tag_cellule', 'auteur').all()
    serializer_class = ActualiteSerializer
    filterset_fields = ['tag_cellule']

    def get_queryset(self):
        from django.db.models import Prefetch
        from apps.comms.models import Commentaire
        return super().get_queryset().prefetch_related(
            'reactions',
            Prefetch('commentaires',
                     queryset=Commentaire.objects.filter(masque=False).select_related('auteur')),
        )

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated])
    def reagir(self, request, pk=None):
        """POST /actualites/{id}/reagir {emoji} — toggle (re-clic = retrait)."""
        from apps.comms.models import Reaction
        from apps.core_serializers import ActualiteSerializer as S
        actu = self.get_object()
        emoji = (request.data.get('emoji') or '').strip()
        if emoji not in S.EMOJIS_REACTIONS:
            return Response({'detail': f'Emoji parmi {", ".join(S.EMOJIS_REACTIONS)} requis.'},
                            status=400)
        existante = Reaction.objects.filter(
            actualite=actu, membre=request.user, emoji=emoji).first()
        if existante:
            existante.delete()
            statut = 'retiree'
        else:
            # Un seul emoji par membre et par actu : remplace l'ancien
            Reaction.objects.filter(actualite=actu, membre=request.user).delete()
            Reaction.objects.create(actualite=actu, membre=request.user, emoji=emoji)
            statut = 'ajoutee'
        return Response({'statut': statut, **self._compte_reactions(actu, request.user)})

    @action(detail=True, methods=['get', 'post'],
            permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def commentaires(self, request, pk=None):
        """GET liste (public) / POST {contenu, reponse_a?} (membre)."""
        from apps.comms.models import Commentaire
        actu = self.get_object()
        if request.method == 'GET':
            qs = actu.commentaires.filter(masque=False).select_related('auteur')
            return Response([{
                'id': c.id,
                'auteur': (c.auteur.get_full_name() or c.auteur.username) if c.auteur else 'Ancien membre',
                'contenu': c.contenu,
                'reponse_a': c.reponse_a_id,
                'cree_le': c.cree_le,
            } for c in qs])
        if not request.user.is_authenticated:
            return Response({'detail': 'Connecte-toi pour commenter.'}, status=401)
        contenu = (request.data.get('contenu') or '').strip()
        if not contenu:
            return Response({'detail': 'Commentaire vide.'}, status=400)
        if len(contenu) > 1000:
            return Response({'detail': '1000 caractères maximum.'}, status=400)
        reponse_a = request.data.get('reponse_a')
        parent = None
        if reponse_a:
            parent = Commentaire.objects.filter(pk=reponse_a, actualite=actu).first()
            if parent is None:
                return Response({'detail': 'Commentaire parent introuvable.'}, status=400)
        c = Commentaire.objects.create(
            actualite=actu, auteur=request.user, contenu=contenu, reponse_a=parent)
        return Response({'id': c.id, 'statut': 'publie'}, status=201)

    @action(detail=True, methods=['post'],
            url_path=r'commentaires/(?P<cid>[^/.]+)/masquer')
    def masquer_commentaire(self, request, pk=None, cid=None):
        """POST …/commentaires/{id}/masquer — modération P1/P5 (RG-C2)."""
        from apps.comms.models import Commentaire
        from apps.accounts.models import Role
        u = request.user
        ok = u.is_authenticated and (
            u.is_staff or Role.objects.filter(
                code__in=['P1', 'P5', 'ADMIN'], titulaire=u).exists())
        if not ok:
            return Response({'detail': 'Réservé à la modération (P1/P5).'}, status=403)
        c = Commentaire.objects.filter(pk=cid, actualite_id=pk).first()
        if c is None:
            return Response({'detail': 'Introuvable.'}, status=404)
        c.masque = True
        c.save(update_fields=['masque'])
        return Response({'statut': 'masque'})

    @staticmethod
    def _compte_reactions(actu, user):
        from apps.comms.models import Reaction
        from apps.core_serializers import ActualiteSerializer as S
        comptes = {e: 0 for e in S.EMOJIS_REACTIONS}
        mienne = None
        for r in Reaction.objects.filter(actualite=actu):
            if r.emoji in comptes:
                comptes[r.emoji] += 1
            if user.is_authenticated and r.membre_id == user.id:
                mienne = r.emoji
        return {'reactions': comptes, 'ma_reaction': mienne}

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


class ProjetViewSet(PublicReadOrStaffWrite):
    """Suivi des projets techniques (P2/P7) — lecture publique, écriture Bureau."""
    queryset = Projet.objects.select_related('responsable', 'cellule').all()
    serializer_class = ProjetSerializer
    filterset_fields = ['statut', 'cellule']


class OpportuniteViewSet(PublicReadOrStaffWrite):
    """Veille + carnet de contacts (P8) — lecture publique, écriture Bureau."""
    queryset = Opportunite.objects.all()
    serializer_class = OpportuniteSerializer
    filterset_fields = ['type', 'statut']


class ParametreViewSet(PublicReadOrStaffWrite):
    """Réglages club (P5) : réseaux sociaux, bannière… lecture publique."""
    queryset = Parametre.objects.all()
    serializer_class = ParametreSerializer
    pagination_class = None

    def create(self, request, *args, **kwargs):
        # Upsert par clé : le premier enregistrement crée, les suivants modifient
        from rest_framework.response import Response as _R
        cle = (request.data.get('cle') or '').strip()
        if not cle:
            return _R({'detail': 'Clé requise.'}, status=400)
        obj, _ = Parametre.objects.update_or_create(
            cle=cle, defaults={'valeur': request.data.get('valeur', '')})
        return _R(ParametreSerializer(obj).data, status=200)


class DocumentViewSet(PublicReadOrStaffWrite):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    filterset_fields = ['famille']


class SujetViewSet(viewsets.ModelViewSet):
    """Forum : sujets par espace (membres connectés uniquement)."""
    queryset = Sujet.objects.select_related('auteur', 'cellule', 'projet').all()
    serializer_class = SujetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['espace', 'cellule', 'projet']

    def get_queryset(self):
        from django.db.models import Prefetch
        return super().get_queryset().prefetch_related(
            Prefetch('messages',
                     queryset=MessageForum.objects.filter(modere=False).select_related('auteur')),
        )

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

    def perform_update(self, serializer):
        # Épingler / verrouiller = modération ; le reste = auteur ou modo
        data = serializer.validated_data
        if ('epingle' in data or 'verrouille' in data) and not _est_modo(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Réservé à la modération (P1/P5).')
        inst = self.get_object()
        if inst.auteur_id != self.request.user.id and not _est_modo(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul l’auteur modifie son sujet.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.auteur_id != self.request.user.id and not _est_modo(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul l’auteur supprime son sujet.')
        instance.delete()


class MessageForumViewSet(viewsets.ModelViewSet):
    """Forum : messages (?sujet=). Verrouillé = lecture seule sauf modo."""
    queryset = MessageForum.objects.select_related('auteur').all()
    serializer_class = MessageForumSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['sujet']
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        # Modérés invisibles (conservés en base pour l'audit)
        return super().get_queryset().filter(modere=False)

    def perform_create(self, serializer):
        sujet = serializer.validated_data['sujet']
        if sujet.verrouille and not _est_modo(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Sujet verrouillé.')
        contenu = (serializer.validated_data.get('contenu') or '').strip()
        if not contenu:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'contenu': 'Message vide.'})
        msg = serializer.save(auteur=self.request.user, contenu=contenu)
        Sujet.objects.filter(pk=sujet.pk).update(derniere_activite=msg.cree_le)

    def perform_destroy(self, instance):
        # Modération par masquage (conservé en base, comme les commentaires)
        if not _est_modo(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Réservé à la modération (P1/P5).')
        instance.modere = True
        instance.save(update_fields=['modere'])


class MediaViewSet(PublicReadOrStaffWrite):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    filterset_fields = ['type', 'evenement', 'tag_cellule']


class SondageViewSet(viewsets.ModelViewSet):
    """Sondages membres (bonus doc 00) : création ouverte, clôture auteur/modo."""
    queryset = Sondage.objects.select_related('auteur', 'cellule').all()
    serializer_class = SondageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['cellule', 'clos']

    def get_queryset(self):
        from django.db.models import Prefetch
        return super().get_queryset().prefetch_related(
            Prefetch('options', queryset=OptionSondage.objects.prefetch_related('votes')),
        )

    def perform_create(self, serializer):
        options = self.request.data.get('options') or []
        if isinstance(options, str):
            options = [o.strip() for o in options.split('\n') if o.strip()]
        options = [str(o).strip() for o in options if str(o).strip()][:10]
        if len(options) < 2:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'options': '2 options minimum.'})
        sondage = serializer.save(auteur=self.request.user)
        for texte in options:
            OptionSondage.objects.create(sondage=sondage, texte=texte[:120])

    def perform_update(self, serializer):
        inst = self.get_object()
        data = serializer.validated_data
        # Clore / rouvrir = auteur ou modo ; le reste = auteur seul
        if 'clos' in data and data['clos'] != inst.clos:
            if inst.auteur_id != self.request.user.id and not _est_modo(self.request.user):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Seul l’auteur clôt son sondage.')
        elif inst.auteur_id != self.request.user.id and not _est_modo(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul l’auteur modifie son sondage.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.auteur_id != self.request.user.id and not _est_modo(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul l’auteur supprime son sondage.')
        instance.delete()

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated])
    def voter(self, request, pk=None):
        """POST /sondages/{id}/voter {option} — toggle si multiple, sinon remplace."""
        sondage = self.get_object()
        if sondage.clos:
            return Response({'detail': 'Sondage clôturé.'}, status=400)
        try:
            option = OptionSondage.objects.get(pk=request.data.get('option'), sondage=sondage)
        except (OptionSondage.DoesNotExist, TypeError, ValueError):
            return Response({'detail': 'Option introuvable.'}, status=400)
        existant = Vote.objects.filter(option=option, membre=request.user).first()
        if existant:
            existant.delete()
            statut = 'retire'
        else:
            if not sondage.choix_multiple:
                Vote.objects.filter(option__sondage=sondage, membre=request.user).delete()
            Vote.objects.create(option=option, membre=request.user)
            statut = 'vote'
        # Recharge sans cache prefetch (sinon compteurs périmés dans la réponse)
        from apps.comms.models import Sondage as _S
        frais = _S.objects.prefetch_related('options__votes').select_related(
            'auteur', 'cellule').get(pk=sondage.pk)
        data = SondageSerializer(frais, context={'request': request}).data
        return Response({'statut': statut, 'sondage': data})


class EvenementViewSet(PublicReadOrStaffWrite):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    filterset_fields = ['type']

    def perform_create(self, serializer):
        # RG-E1 : refuse la double réservation de salle (même lieu + chevauchement)
        from apps.views_emails import conflits_evenement
        data = serializer.validated_data
        conflits = conflits_evenement(
            data['date_debut'], data.get('date_fin'),
            data.get('lieu', ''), exclure_pk=None)
        if conflits:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'conflit': f"Salle déjà prise : {conflits[0]['titre']} "
                           f"({conflits[0]['date'].strftime('%d/%m %Hh%M')}).",
                'conflits': conflits,
            })
        serializer.save()

    def perform_update(self, serializer):
        from apps.views_emails import conflits_evenement
        inst = self.get_object()
        data = serializer.validated_data
        conflits = conflits_evenement(
            data.get('date_debut', inst.date_debut),
            data.get('date_fin', inst.date_fin),
            data.get('lieu', inst.lieu), exclure_pk=inst.pk)
        if conflits:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'conflit': f"Salle déjà prise : {conflits[0]['titre']} "
                           f"({conflits[0]['date'].strftime('%d/%m %Hh%M')}).",
                'conflits': conflits,
            })
        serializer.save()

    def get_queryset(self):
        from django.utils import timezone
        from django.db.models import Count, Q
        qs = super().get_queryset().annotate(
            # Confirmés en UNE requête (évite 2N requêtes des compteurs)
            _confirmes=Count('inscrits', filter=Q(inscription__liste_attente=False)),
            _presents=Count('presences', distinct=True),
        )
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
