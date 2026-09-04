"""Centre de notifications in-app + journal des emails (doc 02 D10)."""
from django.db import models
from django.conf import settings

TYPES_NOTIFICATION = [
    ('annonce', 'Annonce publiée'),
    ('candidature', 'Adhésion'),
    ('inscription', 'Inscription événement'),
    ('rappel', 'Rappel J-1 / H-2h'),
    ('convocation', 'Convocation / rappel H-48h'),
    ('satisfaction', 'Retour post-activité'),
    ('recap', 'Récap hebdomadaire'),
    ('promotion', 'Promotion liste d’attente'),
]


class Notification(models.Model):
    """Une ligne = un message destiné à un membre (in-app + trace email)."""
    type = models.CharField(max_length=14, choices=TYPES_NOTIFICATION)
    titre = models.CharField(max_length=140)
    message = models.TextField(blank=True)
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name='notifications',
    )
    destinataire_email = models.EmailField(blank=True)
    objet_id = models.CharField('Id objet lié (événement, candidature…)', max_length=40, blank=True)
    envoye = models.BooleanField('Email parti (False = log-only / prefs / erreur)', default=True)
    resend_id = models.CharField('Id Resend', max_length=40, blank=True)
    lu = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cree_le']

    def __str__(self):
        return f'[{self.type}] {self.titre} → {self.destinataire_email or self.destinataire}'
