"""Routes /api/v1/ + JWT + OpenAPI."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.auth_views import TokenAvecUserView
from apps.views_emails import (
    CandidatureViewSet, NotificationViewSet, inscrire, desinscrire,
    convocation, tester_email, me, mes_inscriptions, mes_cellules,
    marquer_presence, liste_presences, export_presences_csv, qr_presence,
    classement, calendrier_ics, evenement_ics,
    dashboard, admin_utilisateurs, admin_utilisateur_maj,
    admin_roles, admin_role_passation,
)
from apps.views_core import (
    CelluleViewSet, BureauViewSet, ActualiteViewSet,
    DocumentViewSet, MediaViewSet, EvenementViewSet, register_candidature,
    presentation, qr_adhesion, ProjetViewSet, OpportuniteViewSet, ParametreViewSet,
    SujetViewSet, MessageForumViewSet,
)

router = DefaultRouter()
router.register('cellules', CelluleViewSet)
router.register('bureau', BureauViewSet)
router.register('actualites', ActualiteViewSet)
router.register('documents', DocumentViewSet)
router.register('galerie', MediaViewSet)
router.register('evenements', EvenementViewSet)
router.register('projets', ProjetViewSet)
router.register('opportunites', OpportuniteViewSet)
router.register('parametres', ParametreViewSet)
router.register('forum/sujets', SujetViewSet, basename='sujet')
router.register('forum/messages', MessageForumViewSet, basename='message')
router.register('candidatures', CandidatureViewSet, basename='candidature')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Routes avec extension AVANT le router (sinon DRF les lit comme suffixe de format)
    path('api/v1/evenements/<int:pk>.ics', evenement_ics),
    path('api/v1/evenements/<int:pk>/export-presences.csv', export_presences_csv),
    path('api/v1/calendrier.ics', calendrier_ics),
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/register-candidature', register_candidature),
    path('api/v1/adhesion/qr', qr_adhesion),
    path('api/v1/presentation/', presentation),
    path('api/v1/auth/token', TokenAvecUserView.as_view()),
    path('api/v1/auth/token/refresh', TokenRefreshView.as_view()),
    path('api/v1/evenements/<int:pk>/inscrire', inscrire),
    path('api/v1/evenements/<int:pk>/desinscrire', desinscrire),
    path('api/v1/evenements/<int:pk>/presence', marquer_presence),
    path('api/v1/evenements/<int:pk>/presence/', liste_presences),
    path('api/v1/evenements/<int:pk>/qr-presence', qr_presence),
    path('api/v1/me/', me),
    path('api/v1/classement/', classement),
    path('api/v1/me/inscriptions', mes_inscriptions),
    path('api/v1/me/cellules', mes_cellules),
    path('api/v1/reunions/convocation', convocation),
    path('api/v1/dashboard/', dashboard),
    path('api/v1/admin/utilisateurs/', admin_utilisateurs),
    path('api/v1/admin/utilisateurs/<int:pk>/', admin_utilisateur_maj),
    path('api/v1/admin/roles/', admin_roles),
    path('api/v1/admin/roles/<str:code>/', admin_role_passation),
    path('api/v1/emails/test', tester_email),
    path('api/schema', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs', SpectacularSwaggerView.as_view(url_name='schema')),
]
