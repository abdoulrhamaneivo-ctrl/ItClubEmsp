from apps.accounts.models import CODES_ROLES
from django.db import models


# ═══════════════════════════ governance ═══════════════════════════
class ObjectifPoste(models.Model):
    """L'objectif prioritaire affiché sous la mission de chaque poste."""
    role_code = models.CharField('Poste', max_length=20, choices=CODES_ROLES)
    mission = models.TextField('Mission')
    objectif = models.TextField('Objectif prioritaire')

    class Meta:
        unique_together = ('role_code',)

    def __str__(self):
        return self.get_role_code_display()


class Projet(models.Model):
    """Projet technique du club — suivi VP (P2) + Innovation (P7)."""
    STATUTS = [('idee', 'Idée'), ('en_cours', 'En cours'), ('termine', 'Terminé')]
    nom = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    statut = models.CharField(max_length=10, choices=STATUTS, default='idee')
    responsable = models.ForeignKey('accounts.User', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='projets_diriges')
    cellule = models.ForeignKey('accounts.Cellule', on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='projets')
    lien = models.URLField('Lien (repo, démo…)', blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-maj_le']

    def __str__(self):
        return self.nom


class Opportunite(models.Model):
    """Veille hackathons / conférences / partenariats — P8 + carnet de contacts."""
    TYPES = [('hackathon', 'Hackathon'), ('conference', 'Conférence'), ('partenariat', 'Partenariat')]
    STATUTS = [('veille', 'En veille'), ('interesse', 'Intéressé'),
               ('inscrit', 'Inscrit'), ('cloture', 'Clôturé')]
    titre = models.CharField(max_length=140)
    type = models.CharField(max_length=12, choices=TYPES, default='hackathon')
    statut = models.CharField(max_length=10, choices=STATUTS, default='veille')
    date_limite = models.DateField('Date limite', null=True, blank=True)
    lien = models.URLField('Lien externe', blank=True)
    contact_nom = models.CharField('Contact (nom)', max_length=120, blank=True)
    contact_email = models.EmailField('Contact (email)', blank=True)
    notes = models.TextField(blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date_limite', '-maj_le']

    def __str__(self):
        return self.titre


class RessourceVeille(models.Model):
    """Veille technologique interne (P7, doc 02 D8) : lien partagé votable."""
    THEMES = [('ia', 'IA & Data'), ('web', 'Web & Mobile'), ('cyber', 'Cybersécurité'),
              ('cloud', 'Cloud & DevOps'), ('autre', 'Autre')]
    titre = models.CharField(max_length=200)
    lien = models.URLField('Lien')
    theme = models.CharField(max_length=12, choices=THEMES, default='autre')
    resume = models.TextField('Résumé', max_length=600, blank=True)
    partage_par = models.ForeignKey('accounts.User', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='veilles')
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cree_le']
        indexes = [models.Index(fields=['theme'])]

    def __str__(self):
        return self.titre


class VoteVeille(models.Model):
    """Upvote d'une ressource de veille — 1 par membre, toggle."""
    ressource = models.ForeignKey(RessourceVeille, on_delete=models.CASCADE, related_name='votes')
    membre = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='votes_veille')

    class Meta:
        unique_together = ('ressource', 'membre')
        indexes = [models.Index(fields=['ressource'])]


class Parametre(models.Model):
    """Réglage affichable/modifiable : réseaux sociaux, bannière… (P5)."""
    cle = models.SlugField('Clé', primary_key=True, max_length=60)
    valeur = models.TextField('Valeur', blank=True)
    modifie_le = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.cle


class CompteRendu(models.Model):
    """CR de réunion (doc 01 P3) : brouillon → en validation → publié."""
    STATUTS = [('brouillon', 'Brouillon'), ('en_validation', 'En validation'),
               ('publie', 'Publié')]
    titre = models.CharField(max_length=140)
    reunion_date = models.DateField('Date de la réunion')
    lieu = models.CharField(max_length=140, blank=True)
    ordre_du_jour = models.TextField('Ordre du jour', blank=True)
    contenu = models.TextField('Contenu')
    image = models.ImageField('Photo du rapport', upload_to='comptes-rendus/', blank=True, null=True)
    video_url = models.URLField('Lien vidéo (YouTube, Drive…)', max_length=500, blank=True,
                                help_text='Coller le lien de la vidéo — les fichiers lourds ne passent pas par le serveur.')
    statut = models.CharField(max_length=14, choices=STATUTS, default='brouillon')
    auteur = models.ForeignKey('accounts.User', on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='crs_rediges')
    valide_par = models.ForeignKey('accounts.User', on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='crs_valides')
    publie_le = models.DateTimeField(null=True, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-reunion_date', '-maj_le']

    def __str__(self):
        return self.titre


