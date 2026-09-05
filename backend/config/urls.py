from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.api_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # PROD : Django sert aussi /media/ (petite échelle du club).
    # Fichiers éphémères sur Render (effacés à chaque redéploiement) :
    # les documents importants se re-téléversent après un deploy.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
