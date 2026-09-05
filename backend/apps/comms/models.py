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
    video_url = models.URLField('Lien vidéo (reportage, interview…)', max_length=500, blank=True,
                                help_text='Coller le lien — les fichiers lourds ne passent pas par le serveur.')
    tag_cellule = models.ForeignKey(Cellule, on_delete=models.SET_NULL, null=True, blank=True, related_name='actualites')
    auteur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'actualites'

    def __str__(self):
        return self.titre


class Reaction(models.Model):
    """Réaction emoji sur une actualité (doc 03 §3). Re-clic = retrait."""
    actualite = models.ForeignKey(Actualite, on_delete=models.CASCADE, related_name='reactions')
    membre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')
    emoji = models.CharField(max_length=8)

    class Meta:
        unique_together = ('actualite', 'membre', 'emoji')
        indexes = [models.Index(fields=['actualite'])]


class Commentaire(models.Model):
    """Commentaire (RG-C2 : modération par masquage, jamais supprimé en dur)."""
    actualite = models.ForeignKey(Actualite, on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='commentaires')
    contenu = models.TextField(max_length=1000)
    reponse_a = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                                  related_name='reponses')
    masque = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['cree_le']
        indexes = [models.Index(fields=['actualite', 'masque'])]


class Sujet(models.Model):
    """Sujet de discussion du forum (doc 03 §4) : général, cellule ou projet."""
    ESPACES = [('general', 'Général'), ('cellule', 'Cellule'), ('projet', 'Projet')]
    espace = models.CharField(max_length=10, choices=ESPACES, default='general')
    cellule = models.ForeignKey('accounts.Cellule', on_delete=models.CASCADE,
                                null=True, blank=True, related_name='sujets')
    projet = models.ForeignKey('governance.Projet', on_delete=models.CASCADE,
                               null=True, blank=True, related_name='sujets')
    titre = models.CharField(max_length=140)
    auteur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='sujets_forum')
    epingle = models.BooleanField(default=False)
    verrouille = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)
    derniere_activite = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-epingle', '-derniere_activite']
        indexes = [models.Index(fields=['espace', 'cellule', 'projet'])]

    def __str__(self):
        return self.titre


class MessageForum(models.Model):
    """Message du forum (modération par masquage, comme les commentaires)."""
    sujet = models.ForeignKey(Sujet, on_delete=models.CASCADE, related_name='messages')
    auteur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='messages_forum')
    contenu = models.TextField(max_length=2000)
    modere = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['cree_le']
        indexes = [models.Index(fields=['sujet', 'modere'])]


class Sondage(models.Model):
    """Sondage (bonus doc 00, P4 recensement) : simple ou choix multiples."""
    titre = models.CharField(max_length=140)
    description = models.TextField(blank=True)
    auteur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='sondages')
    cellule = models.ForeignKey('accounts.Cellule', on_delete=models.CASCADE,
                                null=True, blank=True, related_name='sondages')
    choix_multiple = models.BooleanField(default=False)
    clos = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cree_le']
        indexes = [models.Index(fields=['cellule'])]

    def __str__(self):
        return self.titre


class OptionSondage(models.Model):
    sondage = models.ForeignKey(Sondage, on_delete=models.CASCADE, related_name='options')
    texte = models.CharField(max_length=120)

    class Meta:
        ordering = ['id']


class Vote(models.Model):
    option = models.ForeignKey(OptionSondage, on_delete=models.CASCADE, related_name='votes')
    membre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes_sondages')

    class Meta:
        unique_together = ('option', 'membre')
        indexes = [models.Index(fields=['option'])]


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


