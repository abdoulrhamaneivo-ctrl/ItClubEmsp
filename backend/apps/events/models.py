from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()
from apps.accounts.models import Cellule
from django.db import models


# ═══════════════════════════ events ═══════════════════════════
class Evenement(models.Model):
    """Activité à venir (timeline du front) + inscriptions."""
    TYPES = [('atelier', 'Atelier'), ('competition', 'Compétition'), ('conference', 'Conférence'), ('sortie', 'Sortie')]
    titre = models.CharField(max_length=140)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=12, choices=TYPES, default='atelier')
    couleur = models.CharField(max_length=9, default='#2563EB')
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField('Fin (satisfaction envoyée 1h après)', null=True, blank=True)
    lieu = models.CharField(max_length=140, blank=True)
    places = models.PositiveIntegerField('Places (0 = illimité)', default=0)
    icone = models.CharField('Id icône front', max_length=30, default='ampoule')
    inscrits = models.ManyToManyField(User, through='Inscription', related_name='evenements_inscrits', blank=True)
    code_presence = models.CharField(
        'Code de présence (6 chiffres, feuille émargement doc 02 D5)',
        max_length=6, blank=True, default='',
        help_text='Généré automatiquement ; affiché au vidéoprojecteur le jour J.',
    )

    class Meta:
        ordering = ['date_debut']
        indexes = [models.Index(fields=['date_debut'])]  # tri + filtre a_venir

    def save(self, *args, **kwargs):
        if not self.code_presence:
            import secrets
            self.code_presence = f'{secrets.randbelow(900000) + 100000}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.titre


class Inscription(models.Model):
    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE)
    membre = models.ForeignKey(User, on_delete=models.CASCADE)
    liste_attente = models.BooleanField(default=False)
    confirme = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('evenement', 'membre')
        indexes = [models.Index(fields=['evenement', 'liste_attente'])]  # compteurs + promotion


class Presence(models.Model):
    """Émargement : qui était vraiment là (doc 02 D5)."""
    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE, related_name='presences')
    membre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='presences')
    marque_le = models.DateTimeField(auto_now_add=True)
    marque_par = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text='Orga ayant émargé (null = auto via code).',
    )

    class Meta:
        unique_together = ('evenement', 'membre')
        indexes = [models.Index(fields=['evenement'])]


class Retour(models.Model):
    """Retour post-activité (doc 02 D5) : note 1-5 + avis libre, 1 par membre."""
    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE, related_name='retours')
    membre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='retours')
    note = models.PositiveSmallIntegerField('Note 1-5')
    avis = models.TextField('Avis libre', max_length=1000, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('evenement', 'membre')
        ordering = ['-cree_le']
        indexes = [models.Index(fields=['evenement'])]


class Bilan(models.Model):
    """Bilan écrit de l'événement (P6) — affiché public après publication."""
    evenement = models.OneToOneField(Evenement, on_delete=models.CASCADE, related_name='bilan')
    texte = models.TextField('Bilan')
    points_forts = models.TextField('Points forts', blank=True)
    points_ameliorer = models.TextField('À améliorer', blank=True)
    publie = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Bilan — {self.evenement.titre}'
