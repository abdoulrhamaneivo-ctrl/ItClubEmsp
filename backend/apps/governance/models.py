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


class Parametre(models.Model):
    """Réglage affichable/modifiable : réseaux sociaux, bannière… (P5)."""
    cle = models.SlugField('Clé', primary_key=True, max_length=60)
    valeur = models.TextField('Valeur', blank=True)
    modifie_le = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.cle


