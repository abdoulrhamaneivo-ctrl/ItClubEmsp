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
                  'couleurFonce', 'icone', 'membres', 'ordre',
                  'chef_nom', 'chef_email']
        read_only_fields = ['id']

    membres = serializers.SerializerMethodField()
    couleurFonce = serializers.CharField(source='couleur_fonce')
    chef_nom = serializers.SerializerMethodField()
    chef_email = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def get_membres(self, obj):
        return obj.membres.count()

    def get_chef_nom(self, obj):
        c = getattr(obj, 'chef', None)
        if not c:
            return None
        try:
            return c.get_full_name() or c.username
        except Exception:
            return None

    def validate_chef_email(self, value):
        value = (value or '').strip().lower()
        if not value:
            return ''
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Aucun compte avec cet email.')
        return value

    def update(self, instance, validated_data):
        email = validated_data.pop('chef_email', None)
        if email is not None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            instance.chef = User.objects.filter(email__iexact=email).first() if email else None
        return super().update(instance, validated_data)

    def create(self, validated_data):
        validated_data.pop('chef_email', None)
        return super().create(validated_data)


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
        fields = ['id', 'titre', 'extrait', 'image', 'video_url', 'tag_cellule', 'tag_cellule_nom',
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
    note_moyenne = serializers.SerializerMethodField()
    nb_retours = serializers.SerializerMethodField()
    mon_retour = serializers.SerializerMethodField()
    bilan = serializers.SerializerMethodField()

    class Meta:
        model = Evenement
        fields = ['id', 'titre', 'description', 'type', 'type_label', 'couleur', 'date', 'date_fin', 'lieu',
                  'places', 'places_disponibles', 'inscrits_count', 'presents_count',
                  'code_presence', 'note_moyenne', 'nb_retours', 'mon_retour',
                  'bilan', 'icone', 'image', 'video_url']

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

    def get_note_moyenne(self, obj):
        # Moyenne des retours (annotée si liste ; fallback sinon)
        retours = getattr(obj, '_retours', None)
        if retours is None:
            retours = list(obj.retours.all())
        if not retours:
            return None
        return round(sum(r.note for r in retours) / len(retours), 1)

    def get_nb_retours(self, obj):
        retours = getattr(obj, '_retours', None)
        if retours is not None:
            return len(retours)
        return obj.retours.count()

    def get_mon_retour(self, obj):
        req = (self.context or {}).get('request')
        u = getattr(req, 'user', None)
        if not (u and u.is_authenticated):
            return None
        retours = getattr(obj, '_retours', None)
        liste = retours if retours is not None else obj.retours.all()
        for r in liste:
            if r.membre_id == u.id:
                return {'note': r.note, 'avis': r.avis}
        return None

    def get_bilan(self, obj):
        try:
            bilan = obj.bilan  # OneToOne — requête par objet, listes courtes
        except Exception:
            return None
        if bilan is None or not bilan.publie:
            return None
        return {'texte': bilan.texte, 'points_forts': bilan.points_forts,
                'points_ameliorer': bilan.points_ameliorer}


class CandidatureSerializer(serializers.ModelSerializer):
    """Formulaire d'adhésion public — donnees = JSON dynamique du formulaire."""
    class Meta:
        model = Candidature
        fields = ['id', 'donnees', 'cellules_souhaitees', 'statut', 'cree_le']
        read_only_fields = ['id', 'statut', 'cree_le']


class ProjetSerializer(serializers.ModelSerializer):
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    responsable_nom = serializers.SerializerMethodField()
    cellule_nom = serializers.CharField(source='cellule.nom', read_only=True, default=None)

    class Meta:
        from apps.governance.models import Projet as _P
        model = _P
        fields = ['id', 'nom', 'description', 'statut', 'statut_label',
                  'responsable', 'responsable_nom', 'cellule', 'cellule_nom',
                  'lien', 'cree_le', 'maj_le']
        read_only_fields = ['id', 'cree_le', 'maj_le']

    def get_responsable_nom(self, obj):
        r = getattr(obj, 'responsable', None)
        if not r:
            return None
        try:
            return r.get_full_name() or r.username
        except Exception:
            return None


class OpportuniteSerializer(serializers.ModelSerializer):
    responsable_nom = serializers.SerializerMethodField()
    type_label = serializers.CharField(source='get_type_display', read_only=True)
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        from apps.governance.models import Opportunite as _Op
        model = _Op
        fields = ['id', 'titre', 'type', 'type_label', 'statut', 'statut_label',
                  'date_limite', 'lien', 'contact_nom', 'contact_email', 'notes',
                  'responsable_nom', 'cree_le']
        read_only_fields = ['id', 'cree_le', 'maj_le']

    def _nom(self, user):
        if not user:
            return None
        try:
            return user.get_full_name() or user.username
        except Exception:
            return None

    def get_responsable_nom(self, obj):
        return self._nom(getattr(obj, 'responsable', None))


class VeilleSerializer(serializers.ModelSerializer):
    """Ressource de veille : + votes, mon vote, auteur (doc 02 D8)."""
    votes_count = serializers.SerializerMethodField()
    jai_vote = serializers.SerializerMethodField()
    auteur = serializers.SerializerMethodField()
    theme_label = serializers.CharField(source='get_theme_display', read_only=True)

    class Meta:
        from apps.governance.models import RessourceVeille as _RV
        model = _RV
        fields = ['id', 'titre', 'lien', 'theme', 'theme_label', 'resume',
                  'votes_count', 'jai_vote', 'auteur', 'cree_le']
        read_only_fields = ['id', 'cree_le']

    def get_votes_count(self, obj):
        votes = getattr(obj, '_votes', None)
        return votes if votes is not None else obj.votes.count()

    def get_jai_vote(self, obj):
        req = (self.context or {}).get('request')
        u = getattr(req, 'user', None)
        if not (u and u.is_authenticated):
            return False
        if getattr(obj, '_mes_votes', None) is not None:
            return u.id in obj._mes_votes
        cache = getattr(obj, '_prefetched_objects_cache', {}) or {}
        if 'votes' in cache:
            return any(v.membre_id == u.id for v in cache['votes'])
        return obj.votes.filter(membre_id=u.id).exists()

    def get_auteur(self, obj):
        a = getattr(obj, 'partage_par', None)
        if not a:
            return 'Ancien membre'
        try:
            return a.get_full_name() or a.username
        except Exception:
            return 'Ancien membre'


class ParametreSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.governance.models import Parametre as _Pa
        model = _Pa
        fields = ['cle', 'valeur', 'modifie_le']
        read_only_fields = ['modifie_le']


class CompteRenduSerializer(serializers.ModelSerializer):
    """CR : auteur + validateur + libellé statut (doc 01 P3)."""
    auteur_nom = serializers.SerializerMethodField()
    valide_par_nom = serializers.SerializerMethodField()
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        from apps.governance.models import CompteRendu as _CR
        model = _CR
        fields = ['id', 'titre', 'reunion_date', 'lieu', 'ordre_du_jour',
                  'contenu', 'image', 'video_url', 'statut', 'statut_label',
                  'auteur_nom', 'valide_par_nom', 'publie_le', 'maj_le']
        read_only_fields = ['id', 'publie_le', 'maj_le']

    def _nom(self, user):
        if not user:
            return None
        try:
            return user.get_full_name() or user.username
        except Exception:
            return None

    def get_auteur_nom(self, obj):
        return self._nom(getattr(obj, 'auteur', None)) or 'Ancien membre'

    def get_valide_par_nom(self, obj):
        return self._nom(getattr(obj, 'valide_par', None))


class SujetSerializer(serializers.ModelSerializer):
    """Sujet du forum : auteur + compteurs + dernier message (doc 03 §4)."""
    auteur_nom = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()
    dernier_message = serializers.SerializerMethodField()
    espace_label = serializers.SerializerMethodField()

    class Meta:
        from apps.comms.models import Sujet as _S
        model = _S
        fields = ['id', 'espace', 'espace_label', 'cellule', 'projet',
                  'titre', 'auteur_nom', 'epingle', 'verrouille',
                  'messages_count', 'dernier_message', 'cree_le',
                  'derniere_activite']
        read_only_fields = ['id', 'cree_le', 'derniere_activite']

    def _non_modere(self, obj):
        try:
            return [m for m in obj.messages.all() if not m.modere]
        except Exception:
            from apps.comms.models import MessageForum
            return list(MessageForum.objects.filter(sujet=obj, modere=False))

    def get_auteur_nom(self, obj):
        a = getattr(obj, 'auteur', None)
        if not a:
            return 'Ancien membre'
        try:
            return a.get_full_name() or a.username
        except Exception:
            return 'Ancien membre'

    def get_messages_count(self, obj):
        return len(self._non_modere(obj))

    def get_dernier_message(self, obj):
        msgs = self._non_modere(obj)
        if not msgs:
            return None
        d = msgs[-1]
        a = getattr(d, 'auteur', None)
        try:
            nom = (a.get_full_name() or a.username) if a else 'Ancien membre'
        except Exception:
            nom = 'Ancien membre'
        return {'auteur': nom, 'cree_le': d.cree_le}

    def get_espace_label(self, obj):
        if obj.espace == 'cellule' and getattr(obj, 'cellule_id', None):
            try:
                return obj.cellule.nom
            except Exception:
                pass
        if obj.espace == 'projet' and getattr(obj, 'projet_id', None):
            try:
                return obj.projet.nom
            except Exception:
                pass
        return 'Général'


class MessageForumSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()

    class Meta:
        from apps.comms.models import MessageForum as _M
        model = _M
        fields = ['id', 'sujet', 'auteur_nom', 'contenu', 'cree_le']
        read_only_fields = ['id', 'cree_le']

    def get_auteur_nom(self, obj):
        a = getattr(obj, 'auteur', None)
        if not a:
            return 'Ancien membre'
        try:
            return a.get_full_name() or a.username
        except Exception:
            return 'Ancien membre'


class SondageSerializer(serializers.ModelSerializer):
    """Sondage + options avec compteurs + mes votes (doc 00 bonus)."""
    auteur_nom = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    mes_votes = serializers.SerializerMethodField()
    total_votes = serializers.SerializerMethodField()
    cellule_nom = serializers.SerializerMethodField()

    class Meta:
        from apps.comms.models import Sondage as _So
        model = _So
        fields = ['id', 'titre', 'description', 'auteur_nom', 'cellule',
                  'cellule_nom', 'choix_multiple', 'clos',
                  'options', 'mes_votes', 'total_votes', 'cree_le']
        read_only_fields = ['id', 'cree_le']

    def _votes_par_option(self, obj):
        try:
            opts = list(obj.options.all())
        except Exception:
            from apps.comms.models import OptionSondage
            opts = list(OptionSondage.objects.filter(sondage=obj))
        comptes = {}
        for o in opts:
            try:
                comptes[o.id] = o.votes.count()
            except Exception:
                comptes[o.id] = 0
        return opts, comptes

    def get_auteur_nom(self, obj):
        a = getattr(obj, 'auteur', None)
        if not a:
            return 'Ancien membre'
        try:
            return a.get_full_name() or a.username
        except Exception:
            return 'Ancien membre'

    def get_cellule_nom(self, obj):
        try:
            return obj.cellule.nom if obj.cellule_id else None
        except Exception:
            return None

    def get_options(self, obj):
        opts, comptes = self._votes_par_option(obj)
        return [{'id': o.id, 'texte': o.texte, 'votes': comptes.get(o.id, 0)} for o in opts]

    def get_mes_votes(self, obj):
        req = (self.context or {}).get('request')
        u = getattr(req, 'user', None)
        if not (u and u.is_authenticated):
            return []
        opts, _ = self._votes_par_option(obj)
        miennes = []
        for o in opts:
            try:
                if o.votes.filter(membre_id=u.id).exists():
                    miennes.append(o.id)
            except Exception:
                pass
        return miennes

    def get_total_votes(self, obj):
        from apps.comms.models import Vote
        return Vote.objects.filter(option__sondage=obj).count()


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
