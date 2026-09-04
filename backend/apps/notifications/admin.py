from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('cree_le', 'type', 'titre', 'destinataire_email', 'envoye', 'lu')
    list_filter = ('type', 'envoye', 'lu')
    search_fields = ('titre', 'destinataire_email')
    readonly_fields = ('cree_le',)
