#!/usr/bin/env bash
# Build Render — install + collectstatic + migrations
set -e
cd backend
pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input --settings=config.settings_prod
python manage.py migrate --settings=config.settings_prod

# Seed idempotent : ne crée que ce qui manque (relançable à chaque déploiement)
python manage.py shell --settings=config.settings_prod < fixtures/seed.py
echo "BUILD_OK"
