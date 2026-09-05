"""
Settings Django — IT-CLUB EMSP (dev par défaut).
En prod : DJANGO_SETTINGS_MODULE=config.settings_prod (à créer lors du déploiement).
Secrets uniquement via variables d'environnement (jamais dans le repo).
"""
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-only-ne-pas-utiliser-en-prod')
DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ── Apps ─────────────────────────────────────────────────────
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]
THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'corsheaders',
    'drf_spectacular',
    'channels',
]
LOCAL_APPS = [
    'apps.accounts',
    'apps.comms',
    'apps.events',
    'apps.chat',
    'apps.resources',
    'apps.governance',
    'apps.notifications',
]
INSTALLED_APPS = ['daphne'] + DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Channels / WebSocket (chat forum temps réel) ────────────────
ASGI_APPLICATION = 'config.asgi.application'
# InMemoryChannelLayer : parfait pour 1 instance Render (plan gratuit).
# Si passage multi-instances : remplacer par channels_redis.
CHANNEL_LAYERS = {
    'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'},
}

# ── DB : PostgreSQL si DATABASE_URL fournie, sinon SQLite (dev) ──
# Neon : utilise l'URL poolée (…-pooler.…?sslmode=require) et mets
# DB_CONN_MAX_AGE=0 (le pooler gère déjà les connexions persistantes).
DATABASE_URL = os.environ.get('DATABASE_URL')
DB_CONN_MAX_AGE = int(os.environ.get('DB_CONN_MAX_AGE', '600'))
if DATABASE_URL:
    import dj_database_url  # ajouté au moment du déploiement
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL, conn_max_age=DB_CONN_MAX_AGE)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr'
TIME_ZONE = 'Africa/Abidjan'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Emails (Brevo — remplace Resend le 04/09/2026) ──────────────
# Sans BREVO_API_KEY : les envois sont journalisés et ignorés (log-only),
# les vues restent fonctionnelles. Clé jamais dans le repo.
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
BREVO_FROM = os.environ.get('BREVO_FROM', 'onboarding@resend.dev')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://it-club-emsp.vercel.app').rstrip('/')

# ── DRF ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # affinage par vue (rôles doc 01)
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_RATES': {
        'public_write': '20/hour',   # adhésion, login (anti-spam doc 04 §8)
    },
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'IT-CLUB EMSP API',
    'DESCRIPTION': 'API REST de la plateforme du club — contrat du front (docs/04).',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ── CORS : le front (dev + prod Vercel) ──────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5200,http://127.0.0.1:5200,https://it-club-emsp.vercel.app',
).split(',')

JWT_SETTINGS = {
    'ACCESS_TOKEN_LIFETIME_MINUTES': 30,
    'REFRESH_TOKEN_LIFETIME_DAYS': 7,
}
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
