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


