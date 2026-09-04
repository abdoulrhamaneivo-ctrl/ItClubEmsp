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
        o = ObjectifPoste.objects.filter(role_code=obj.code).first()
        return o.mission if o else ''

    def get_objectif(self, obj):
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

    class Meta:
        model = Actualite
        fields = ['id', 'titre', 'extrait', 'image', 'tag_cellule', 'tag_cellule_nom',
                  'tag_cellule_couleur', 'auteur_nom', 'auteur_initiale', 'date']

    def get_auteur_nom(self, obj):
        return obj.auteur.get_full_name() if obj.auteur else 'Le Bureau'

    def get_auteur_initiale(self, obj):
        return (obj.auteur.get_full_name() or 'B')[0] if obj.auteur else 'B'


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
    places_disponibles = serializers.SerializerMethodField()
    inscrits_count = serializers.SerializerMethodField()

    class Meta:
        model = Evenement
        fields = ['id', 'titre', 'description', 'type', 'couleur', 'date', 'date_fin', 'lieu',
                  'places', 'places_disponibles', 'inscrits_count', 'icone']

    def get_inscrits_count(self, obj):
        # Confirmés uniquement (la liste d'attente n'occupe pas de place)
        return obj.inscrits.filter(inscription__liste_attente=False).count()

    def get_places_disponibles(self, obj):
        if obj.places == 0:
            return None
        confirmes = obj.inscrits.filter(inscription__liste_attente=False).count()
        return max(0, obj.places - confirmes)


class CandidatureSerializer(serializers.ModelSerializer):
    """Formulaire d'adhésion public — donnees = JSON dynamique du formulaire."""
    class Meta:
        model = Candidature
        fields = ['id', 'donnees', 'cellules_souhaitees', 'statut', 'cree_le']
        read_only_fields = ['id', 'statut', 'cree_le']
