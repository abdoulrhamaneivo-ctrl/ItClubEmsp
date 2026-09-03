from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()
from apps.accounts.models import Cellule
from django.db import models


# ═══════════════════════════ comms ═══════════════════════════
class Actualite(models.Model):
    """Actualité avec image + tag cellule (front : fil Actualites)."""
    titre = models.CharField(max_length=140)
    extrait = models.TextField(blank=True)
    image = models.ImageField(upload_to='actualites/', blank=True, null=True)
    tag_cellule = models.ForeignKey(Cellule, on_delete=models.SET_NULL, null=True, blank=True, related_name='actualites')
    auteur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'actualites'

    def __str__(self):
        return self.titre


class Document(models.Model):
    """Document officiel classé par famille (front : Documentation)."""
    FAMILLES = [('fondamentaux', 'Fondamentaux'), ('vie', 'Vie du club'), ('archives', 'Archives')]
    slug = models.SlugField(primary_key=True, max_length=40)
    titre = models.CharField(max_length=140)
    description = models.TextField(blank=True)
    fichier = models.FileField(upload_to='documents/')
    famille = models.CharField(max_length=14, choices=FAMILLES, default='fondamentaux')
    couleur = models.CharField(max_length=9, default='#1FAF72')
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.titre


class Media(models.Model):
    """Photo/vidéo de la galerie (YouTube = champ youtube_id)."""
    TYPES = [('photo', 'Photo'), ('video', 'Vidéo')]
    titre = models.CharField(max_length=140)
    legende = models.TextField(blank=True)
    type = models.CharField(max_length=6, choices=TYPES, default='photo')
    image = models.ImageField(upload_to='galerie/', blank=True, null=True)
    youtube_id = models.CharField('ID YouTube', max_length=24, blank=True)
    evenement = models.CharField('Événement (filtre)', max_length=80, blank=True)
    tag_cellule = models.ForeignKey(Cellule, on_delete=models.SET_NULL, null=True, blank=True)
    icone = models.CharField('Id icône front', max_length=30, default='trophee')
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'médias'

    def __str__(self):
        return self.titre


