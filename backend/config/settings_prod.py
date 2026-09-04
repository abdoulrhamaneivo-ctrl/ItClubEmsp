"""
Settings PROD — Render (PostgreSQL managé + WhiteNoise + gunicorn).
Variables d'environnement attendues (jamais de secrets dans le repo) :
  DJANGO_SECRET_KEY, DATABASE_URL, DJANGO_ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS
"""
from .settings import *  # noqa: F401,F403
import dj_database_url

DEBUG = False

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']  # requis, pas de défaut

ALLOWED_HOSTS = os.environ['DJANGO_ALLOWED_HOSTS'].split(',')

# ── PostgreSQL managé (Render) ───────────────────────────────
DATABASES = {
    'default': dj_database_url.parse(
        os.environ['DATABASE_URL'],
        conn_max_age=600,
        ssl_require=True,
    )
}

# ── WhiteNoise : les static servis par Django sans reverse-proxy ──
MIDDLEWARE = ['whitenoise.middleware.WhiteNoiseMiddleware'] + MIDDLEWARE
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ── CORS strict : uniquement le front Vercel ─────────────────
CORS_ALLOWED_ORIGINS = os.environ['CORS_ALLOWED_ORIGINS'].split(',')
CORS_ALLOW_CREDENTIALS = True

# ── Sécurité (doc 04 §8) ─────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Médias : disque local Render (persistant sur plan payant ;
#    sur free tier, les uploads sont éphémères — stockage S3 ensuite) ──
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
