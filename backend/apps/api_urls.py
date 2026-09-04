"""Routes /api/v1/ + JWT + OpenAPI."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.auth_views import TokenAvecUserView
from apps.views_emails import (
    CandidatureViewSet, NotificationViewSet, inscrire, desinscrire,
    convocation, tester_email, me, mes_inscriptions, mes_cellules,
)
from apps.views_core import (
    CelluleViewSet, BureauViewSet, ActualiteViewSet,
    DocumentViewSet, MediaViewSet, EvenementViewSet, register_candidature,
    presentation,
)

router = DefaultRouter()
router.register('cellules', CelluleViewSet)
router.register('bureau', BureauViewSet)
router.register('actualites', ActualiteViewSet)
router.register('documents', DocumentViewSet)
router.register('galerie', MediaViewSet)
router.register('evenements', EvenementViewSet)
router.register('candidatures', CandidatureViewSet, basename='candidature')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/register-candidature', register_candidature),
    path('api/v1/presentation/', presentation),
    path('api/v1/auth/token', TokenAvecUserView.as_view()),
    path('api/v1/auth/token/refresh', TokenRefreshView.as_view()),
    path('api/v1/evenements/<int:pk>/inscrire', inscrire),
    path('api/v1/evenements/<int:pk>/desinscrire', desinscrire),
    path('api/v1/me/', me),
    path('api/v1/me/inscriptions', mes_inscriptions),
    path('api/v1/me/cellules', mes_cellules),
    path('api/v1/reunions/convocation', convocation),
    path('api/v1/emails/test', tester_email),
    path('api/schema', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs', SpectacularSwaggerView.as_view(url_name='schema')),
]
