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

    class Meta:
        ordering = ['date_debut']

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
