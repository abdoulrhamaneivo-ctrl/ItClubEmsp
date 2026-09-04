from django.contrib import admin
from .models import Candidature, Role, Cellule


@admin.register(Candidature)
class CandidatureAdmin(admin.ModelAdmin):
    list_display = ('id', 'statut', 'cree_le', 'traitee_par')
    list_filter = ('statut',)
    readonly_fields = ('cree_le',)


admin.site.register(Role)
admin.site.register(Cellule)
