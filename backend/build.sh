#!/usr/bin/env bash
# Build Render — install + collectstatic + migrations + seed.
# Lancé depuis backend/ (rootDir Render). Les migrations passent par la
# connexion DIRECTE Neon si fournie (le pooler transactionnel casse les DDL).
set -e
cd "$(dirname "$0")"
pip install --upgrade pip
pip install -r requirements.txt

export DJANGO_SETTINGS_MODULE=config.settings_prod
python manage.py collectstatic --no-input

if [ -n "${NEON_DIRECT_URL:-}" ]; then
  export DATABASE_URL="$NEON_DIRECT_URL"
fi
python manage.py migrate

# Seed OPT-IN uniquement (base prod nettoyée : aucun re-seed surprise).
# Pour repeupler une base de démo : SEED_DEMO=1 dans l'environnement.
if [ "${SEED_DEMO:-0}" = "1" ]; then
  python manage.py shell < fixtures/seed.py
fi
echo "BUILD_OK"
