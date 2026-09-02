#!/bin/bash
# Lance le front IT-CLUB EMSP + le proxy Notion pour le développement.
# Le proxy tourne déjà en service systemd — ce script vérifie et complète.
set -e

if ! curl -s --max-time 2 http://127.0.0.1:8787/api/notion/health > /dev/null; then
  echo "▶ Démarrage du proxy Notion (port 8787)…"
  python3 "$(dirname "$0")/tools/notion_proxy.py" &
  sleep 2
else
  echo "✓ Proxy Notion déjà en ligne"
fi

cd "$(dirname "$0")/frontend"
if [ ! -d node_modules ]; then
  echo "▶ Installation des dépendances (miroir npmmirror)…"
  npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
fi

echo "▶ Front : http://localhost:5200  (Ctrl+C pour arrêter)"
npm run dev
