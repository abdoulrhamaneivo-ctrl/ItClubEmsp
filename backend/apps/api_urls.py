"""Routes /api/v1/ + JWT + OpenAPI."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.views_core import (
    CelluleViewSet, BureauViewSet, ActualiteViewSet,
    DocumentViewSet, MediaViewSet, EvenementViewSet, register_candidature,
)

router = DefaultRouter()
router.register('cellules', CelluleViewSet)
router.register('bureau', BureauViewSet)
router.register('actualites', ActualiteViewSet)
router.register('documents', DocumentViewSet)
router.register('galerie', MediaViewSet)
router.register('evenements', EvenementViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/register-candidature', register_candidature),
    path('api/v1/auth/token', TokenObtainPairView.as_view()),
    path('api/v1/auth/token/refresh', TokenRefreshView.as_view()),
    path('api/schema', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs', SpectacularSwaggerView.as_view(url_name='schema')),
]
