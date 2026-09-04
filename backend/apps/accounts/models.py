"""
Models des apps — IT-CLUB EMSP.
Structure alignée sur docs/03-modele-donnees.md et les mocks du front
(frontend/src/lib/api.js) : le front passe en API réelle sans changer
la forme des données.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid


# ═══════════════════════════ accounts ═══════════════════════════
CODES_ROLES = [
    ('P1', 'Président'), ('P2', 'Vice-Présidente'), ('P3', 'Secrétaire Générale'),
    ('P4', 'Responsable des Cellules'), ('P5', 'Responsable Communication'),
    ('P6', 'Responsable des Activités'), ('P7', 'Resp. Innovation & Solutions'),
    ('P8', 'Coordinateur des Opportunités'), ('P9', 'Resp. Programmation'),
    ('P10', 'Responsable des Ateliers'),
    ('CHEF_CELLULE', 'Chef de cellule'), ('MEMBRE', 'Membre'), ('ADMIN', 'Administrateur'),
]

STATUT_CANDIDATURE = [
    ('en_attente', 'En attente'), ('validee', 'Validée'), ('refusee', 'Refusée'),
]


class User(AbstractUser):
    """Membre du club. email = identifiant (auth @emsp.int en prod)."""
    email = models.EmailField('E-mail', unique=True)
    photo = models.ImageField('Photo', upload_to='photos/membres/', blank=True, null=True)
    promotion = models.CharField('Promotion', max_length=20, blank=True)
    telephone = models.CharField('Téléphone', max_length=20, blank=True)
    notif_prefs = models.JSONField(
        'Préférences notifications (doc 02 D10)',
        default=dict, blank=True,
        help_text='{"rappel": true, "recap": false…} — absent = accepté.',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.get_full_name() or self.username


class Role(models.Model):
    """Poste du Bureau — titulaire unique + période (passation doc 01)."""
    code = models.CharField('Code', max_length=20, choices=CODES_ROLES, unique=True)
    titulaire = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='roles')
    interim = models.BooleanField('Intérim (VP)', default=False)
    depuis = models.DateField('En poste depuis', null=True, blank=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} — {self.get_code_display()}'


class Cellule(models.Model):
    nom = models.CharField('Nom', max_length=60)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    programme = models.JSONField('Programme', default=list)  # puces du front
    couleur = models.CharField('Couleur charte', max_length=9, default='#1FAF72')
    couleur_fonce = models.CharField('Couleur texte (WCAG)', max_length=9, default='#0E7A50')
    icone = models.CharField('Id icône front', max_length=30, default='web')
    chef = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cellules_dirigees')
    ordre = models.PositiveSmallIntegerField('Ordre d’affichage', default=0)

    class Meta:
        ordering = ['ordre', 'nom']
        verbose_name_plural = 'cellules'

    def __str__(self):
        return self.nom


class MembreCellule(models.Model):
    """Appartenance d'un membre à une cellule."""
    cellule = models.ForeignKey(Cellule, on_delete=models.CASCADE, related_name='membres')
    membre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cellules')
    depuis = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('cellule', 'membre')


class Candidature(models.Model):
    """Formulaire d'adhésion public (POST /auth/register-candidature)."""
    # Champs dynamiques du formulaire (configurable back-office, doc 08)
    donnees = models.JSONField('Réponses du formulaire', default=dict)
    cellules_souhaitees = models.ManyToManyField(Cellule, blank=True)
    statut = models.CharField(max_length=12, choices=STATUT_CANDIDATURE, default='en_attente')
    traitee_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='candidatures_traitees')
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cree_le']
        verbose_name = 'candidature'
        indexes = [models.Index(fields=['statut'])]  # RG-A1 : scan des en_attente

    def __str__(self):
        return f'Candidature #{self.pk} ({self.statut})'


