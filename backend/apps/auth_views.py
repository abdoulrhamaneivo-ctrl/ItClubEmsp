"""
Authentification — TokenObtainPairPair élargi :
la réponse contient access + refresh + user {nom, roles} comme le
front l'attend (stores/auth.js) et comme le mock le simulait.
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers


class TokenAvecUserSerializer(TokenObtainPairSerializer):
    """Ajoute le profil complet du user à la réponse du token."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Claims utiles côté front sans re-fetch
        token['nom'] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        roles = []
        for role in user.roles.all():
            roles.append({'code': role.code})
        # chef de cellule : rôle implicite si dirige une cellule
        if user.cellules_dirigees.exists() and not any(r['code'] == 'CHEF_CELLULE' for r in roles):
            roles.append({'code': 'CHEF_CELLULE'})

        data['user'] = {
            'id': user.id,
            'nom': user.get_full_name() or user.username,
            'email': user.email,
            'photo': user.photo.url if user.photo else None,
            'roles': roles or [{'code': 'MEMBRE'}],
        }
        return data


class TokenAvecUserView(TokenObtainPairView):
    serializer_class = TokenAvecUserSerializer
