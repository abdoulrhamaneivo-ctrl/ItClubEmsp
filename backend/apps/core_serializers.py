"""
Serializers — forme identique aux mocks du front (frontend/src/lib/api.js
et lib/contenu.js) pour basculer USE_MOCK=false sans toucher aux pages.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.accounts.models import Role, Cellule, Candidature
from apps.governance.models import ObjectifPoste
from apps.comms.models import Actualite, Document, Media
from apps.events.models import Evenement, Inscription

User = get_user_model()


class MembreMiniSerializer(serializers.ModelSerializer):
    """Mini profil (initiale calculée côté front)."""
    nom = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'nom', 'photo']

    def get_nom(self, obj):
        return obj.get_full_name() or obj.username


class CelluleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cellule
        fields = ['id', 'nom', 'slug', 'description', 'programme', 'couleur',
                  'couleurFonce', 'icone', 'membres', 'ordre']
        read_only_fields = ['id']

    membres = serializers.SerializerMethodField()
    couleurFonce = serializers.CharField(source='couleur_fonce')

    def get_membres(self, obj):
        return obj.membres.count()


class BureauSerializer(serializers.ModelSerializer):
    """Membre du Bureau : poste + titulaire + mission/objectif (governance)."""
    poste = serializers.CharField(source='get_code_display')
    nom = serializers.SerializerMethodField()
    mission = serializers.SerializerMethodField()
    objectif = serializers.SerializerMethodField()
    couleur = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'code', 'poste', 'nom', 'mission', 'objectif', 'couleur', 'interim']

    def get_nom(self, obj):
        return obj.titulaire.get_full_name() if obj.titulaire else '—'

    def get_photo(self, obj):
        return obj.titulaire.photo.url if obj.titulaire and obj.titulaire.photo else None

    def get_mission(self, obj):
        o = (self.context.get('objectifs') or {}).get(obj.code)
        if o is None:
            o = ObjectifPoste.objects.filter(role_code=obj.code).first()
        return o.mission if o else ''

    def get_objectif(self, obj):
        o = (self.context.get('objectifs') or {}).get(obj.code)
        if o is None:
            o = ObjectifPoste.objects.filter(role_code=obj.code).first()
        return o.objectif if o else ''

    def get_couleur(self, obj):
        # couleur par code de poste (charte front)
        couleurs = {'P1': '#1FAF72', 'P2': '#2563EB', 'P3': '#7B61FF',
                    'P4': '#0EA5E9', 'P5': '#F5A623', 'P6': '#10B981',
                    'P7': '#8B5CF6', 'P8': '#F97316', 'P9': '#06B6D4', 'P10': '#EF4444'}
        return couleurs.get(obj.code, '#1FAF72')

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['photo'] = self.get_photo(instance)
        return rep


class ActualiteSerializer(serializers.ModelSerializer):
    tag_cellule_nom = serializers.CharField(source='tag_cellule.nom', read_only=True, default=None)
    tag_cellule_couleur = serializers.CharField(source='tag_cellule.couleur', read_only=True, default=None)
    auteur_nom = serializers.SerializerMethodField()
    auteur_initiale = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    ma_reaction = serializers.SerializerMethodField()
    commentaires_count = serializers.SerializerMethodField()

    class Meta:
        model = Actualite
        fields = ['id', 'titre', 'extrait', 'image', 'tag_cellule', 'tag_cellule_nom',
                  'tag_cellule_couleur', 'auteur_nom', 'auteur_initiale',
                  'reactions', 'ma_reaction', 'commentaires_count', 'date']

    def get_auteur_nom(self, obj):
        return obj.auteur.get_full_name() if obj.auteur else 'Le Bureau'

    def get_auteur_initiale(self, obj):
        return (obj.auteur.get_full_name() or 'B')[0] if obj.auteur else 'B'

    EMOJIS_REACTIONS = ['👍', '❤️', '🔥']

    def _reactions_liste(self, obj):
        # Préfetchées par le viewset (zéro requête) ; fallback sinon
        try:
            return list(obj.reactions.all())
        except Exception:
            return []

    def get_reactions(self, obj):
        comptes = {e: 0 for e in self.EMOJIS_REACTIONS}
        for r in self._reactions_liste(obj):
            if r.emoji in comptes:
                comptes[r.emoji] += 1
        return comptes

    def get_ma_reaction(self, obj):
        req = (self.context or {}).get('request')
        u = getattr(req, 'user', None)
        if not (u and u.is_authenticated):
            return None
        for r in self._reactions_liste(obj):
            if r.membre_id == u.id:
                return r.emoji
        return None

    def get_commentaires_count(self, obj):
        try:
            return sum(1 for c in obj.commentaires.all() if not c.masque)
        except Exception:
            from apps.comms.models import Commentaire
            return Commentaire.objects.filter(actualite=obj, masque=False).count()


class DocumentSerializer(serializers.ModelSerializer):
    famille_id = serializers.CharField(source='famille')
    format = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['slug', 'titre', 'description', 'fichier', 'famille_id', 'couleur', 'format', 'date']

    def get_format(self, obj):
        nom = (obj.fichier.name or '').lower()
        return 'PDF' if nom.endswith('.pdf') else 'DOCX' if nom.endswith(('.docx', '.doc')) else 'FICHIER'


class MediaSerializer(serializers.ModelSerializer):
    type = serializers.CharField()
    url = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ['id', 'titre', 'legende', 'type', 'image', 'url', 'youtube_id',
                  'evenement', 'tag_cellule', 'icone', 'date']

    def get_url(self, obj):
        if obj.type == 'video' and obj.youtube_id:
            return f'https://www.youtube.com/embed/{obj.youtube_id}'
        return obj.image.url if obj.image else None


class EvenementSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source='date_debut')
    type_label = serializers.CharField(source='get_type_display', read_only=True)
    places_disponibles = serializers.SerializerMethodField()
    inscrits_count = serializers.SerializerMethodField()
    code_presence = serializers.SerializerMethodField()
    presents_count = serializers.SerializerMethodField()

    class Meta:
        model = Evenement
        fields = ['id', 'titre', 'description', 'type', 'type_label', 'couleur', 'date', 'date_fin', 'lieu',
                  'places', 'places_disponibles', 'inscrits_count', 'presents_count',
                  'code_presence', 'icone']

    def get_inscrits_count(self, obj):
        # Confirmés uniquement (annoté en 1 requête ; fallback si absent)
        if hasattr(obj, '_confirmes'):
            return obj._confirmes
        return obj.inscrits.filter(inscription__liste_attente=False).count()

    def get_places_disponibles(self, obj):
        if obj.places == 0:
            return None
        confirmes = obj._confirmes if hasattr(obj, '_confirmes') else \
            obj.inscrits.filter(inscription__liste_attente=False).count()
        return max(0, obj.places - confirmes)

    def get_presents_count(self, obj):
        if hasattr(obj, '_presents'):
            return obj._presents
        return obj.presences.count()

    def get_code_presence(self, obj):
        # Code réservé aux organisateurs (P1/P6/staff) — jamais public
        req = (self.context or {}).get('request')
        u = getattr(req, 'user', None)
        if not (u and u.is_authenticated):
            return None
        if getattr(u, 'is_staff', False):
            return obj.code_presence or None
        try:
            from apps.accounts.models import Role
            if Role.objects.filter(code__in=['P1', 'P6', 'ADMIN'], titulaire=u).exists():
                return obj.code_presence or None
        except Exception:
            pass
        return None


class CandidatureSerializer(serializers.ModelSerializer):
    """Formulaire d'adhésion public — donnees = JSON dynamique du formulaire."""
    class Meta:
        model = Candidature
        fields = ['id', 'donnees', 'cellules_souhaitees', 'statut', 'cree_le']
        read_only_fields = ['id', 'statut', 'cree_le']


class InscriptionMembreSerializer(serializers.ModelSerializer):
    """Inscription vue par le membre : événement embarqué (Espace)."""
    evenement = EvenementSerializer(read_only=True)

    class Meta:
        from apps.events.models import Inscription as I
        model = I
        fields = ['id', 'evenement', 'liste_attente', 'confirme', 'cree_le']
        read_only_fields = fields


class ProfilSerializer(serializers.ModelSerializer):
    """Profil membre (GET/PATCH /me) — doc 04 §5 accounts."""
    nom = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    niveau = serializers.SerializerMethodField()

    class Meta:
        from django.contrib.auth import get_user_model as _gum
        model = _gum()
        fields = ['id', 'nom', 'email', 'photo', 'promotion', 'telephone',
                  'notif_prefs', 'points', 'niveau', 'roles']
        read_only_fields = ['id', 'nom', 'email', 'photo', 'points', 'niveau', 'roles']

    def get_niveau(self, obj):
        from apps.views_emails import niveau_de
        return niveau_de(getattr(obj, 'points', 0))

    def get_nom(self, obj):
        return obj.get_full_name() or obj.username

    def get_roles(self, obj):
        codes = [{'code': r.code} for r in obj.roles.all()]
        try:
            if obj.cellules_dirigees.exists() and not any(r['code'] == 'CHEF_CELLULE' for r in codes):
                codes.append({'code': 'CHEF_CELLULE'})
        except Exception:
            pass
        return codes or [{'code': 'MEMBRE'}]
