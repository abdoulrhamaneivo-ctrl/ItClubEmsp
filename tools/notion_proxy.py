#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proxy Notion local pour le front IT-CLUB EMSP (port 8787, localhost uniquement).

Pourquoi ce proxy ? Le token Notion ne doit JAMAIS arriver dans le navigateur
(lisible par n'importe quel visiteur via les devtools). Le front appelle ce proxy
qui, lui seul, détient le token et parle à l'API Notion.

Endpoints :
  GET  /api/notion/health         → {"ok": true}
  GET  /api/notion/meta           → options de statut/priorité de la base Tâches
  GET  /api/notion/tasks          → liste des tâches (JSON simplifié)
  PATCH /api/notion/tasks/<id>    → {"statut": "Terminé"} (whitelist de champs)

En prod, ce rôle sera repris par le back-end Django (doc 04) — voir docs/07-module-notion.md.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8787
HERMES_ENV = os.path.expanduser("~/.hermes/.env")
NOTION_VERSION = "2025-09-03"

# Champs modifiables via PATCH (whitelist — jamais le titre ni les relations depuis le front)
STATUTS_AUTORISES = {"À faire", "En cours", "Terminé"}


def load_key():
    try:
        with open(HERMES_ENV) as f:
            for line in f:
                if line.startswith("NOTION_API_KEY="):
                    return line.strip().split("=", 1)[1]
    except FileNotFoundError:
        pass
    return None


KEY = load_key()


def notion(method, url, data=None, timeout=15):
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, method=method)
    r.add_header("Authorization", f"Bearer {KEY}")
    r.add_header("Notion-Version", NOTION_VERSION)
    r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return json.loads(resp.read())


def ds_id_taches():
    """Retrouve la data source « Tâches » par recherche (pas d'ID codé en dur)."""
    raw, cursor = [], None
    while True:
        payload = {"page_size": 100}
        if cursor:
            payload["start_cursor"] = cursor
        d = notion("POST", "https://api.notion.com/v1/search", payload)
        raw.extend(d.get("results", []))
        if not d.get("has_more"):
            break
        cursor = d.get("next_cursor")
    for it in raw:
        if it["object"] == "data_source":
            title = "".join(x["plain_text"] for x in it.get("title", []))
            if title == "Tâches":
                return it["id"]
    return None


DS_TACHES = None


def resolve_ds():
    global DS_TACHES
    if DS_TACHES is None:
        DS_TACHES = ds_id_taches()
        if DS_TACHES:
            print(f"[notion_proxy] Data source Tâches trouvée : {DS_TACHES}")
    return DS_TACHES


def simplifier_ligne(row):
    tache, statut, priorite, echeance = "", "", "", ""
    for name, v in row.get("properties", {}).items():
        t = v.get("type")
        if t == "title":
            tache = "".join(x["plain_text"] for x in v.get("title", []))
        elif t == "status" and v.get("status"):
            statut = v["status"]["name"]
        elif t == "select" and v.get("select"):
            if name == "Priorité":
                priorite = v["select"]["name"]
        elif t == "date" and v.get("date") and name == "Échéance":
            echeance = v["date"]["start"][:10]
    return {
        "id": row["id"],
        "tache": tache,
        "statut": statut,
        "priorite": priorite,
        "echeance": echeance,
        "modifie_le": row.get("last_edited_time", ""),
    }


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "http://localhost:5200")
        self.send_header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code, obj):
        payload = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self._cors()
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/notion/health":
            return self._json(200, {"ok": bool(KEY), "token": bool(KEY)})
        if not KEY:
            return self._json(503, {"erreur": "NOTION_API_KEY absente de ~/.hermes/.env"})
        try:
            if self.path == "/api/notion/meta":
                dsid = resolve_ds()
                if not dsid:
                    return self._json(404, {"erreur": "Data source « Tâches » introuvable"})
                schema = notion("GET", f"https://api.notion.com/v1/data_sources/{dsid}")
                statuts, priorites = [], []
                for name, p in schema.get("properties", {}).items():
                    if p.get("type") == "status":
                        statuts = [g["option"]["name"] for g in p.get("status", {}).get("groups", [])] \
                            or [o["name"] for o in p.get("status", {}).get("options", [])]
                    if p.get("type") == "select" and name == "Priorité":
                        priorites = [o["name"] for o in p.get("select", {}).get("options", [])]
                return self._json(200, {"statuts": statuts, "priorites": priorites})
            if self.path == "/api/notion/tasks":
                dsid = resolve_ds()
                if not dsid:
                    return self._json(404, {"erreur": "Data source « Tâches » introuvable"})
                q = notion("POST", f"https://api.notion.com/v1/data_sources/{dsid}/query", {"page_size": 100})
                taches = [simplifier_ligne(r) for r in q.get("results", [])]
                taches.sort(key=lambda t: (t["statut"] == "Terminé", t["echeance"] or "9999", t["tache"]))
                return self._json(200, {"taches": taches, "source": "notion"})
            return self._json(404, {"erreur": "Endpoint inconnu"})
        except urllib.error.URLError as e:
            return self._json(502, {"erreur": f"Notion injoignable : {e}"})
        except Exception as e:
            return self._json(500, {"erreur": f"{e.__class__.__name__}: {e}"})

    def do_PATCH(self):
        if not KEY:
            return self._json(503, {"erreur": "NOTION_API_KEY absente"})
        if not self.path.startswith("/api/notion/tasks/"):
            return self._json(404, {"erreur": "Endpoint inconnu"})
        page_id = self.path.rsplit("/", 1)[-1]
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self._json(400, {"erreur": "JSON invalide"})
        statut = body.get("statut")
        if statut not in STATUTS_AUTORISES:
            return self._json(400, {"erreur": f"statut invalide (autorisés : {sorted(STATUTS_AUTORISES)})"})
        try:
            notion("PATCH", f"https://api.notion.com/v1/pages/{page_id}",
                   {"properties": {"Statut": {"status": {"name": statut}}}})
            print(f"[notion_proxy] PATCH {page_id[:8]}… → Statut={statut}")
            return self._json(200, {"ok": True, "id": page_id, "statut": statut})
        except urllib.error.HTTPError as e:
            return self._json(e.code, {"erreur": f"Notion a refusé : {e.code}"})
        except Exception as e:
            return self._json(500, {"erreur": f"{e.__class__.__name__}: {e}"})

    def log_message(self, fmt, *args):
        pass  # logs gérés manuellement


def main():
    if not KEY:
        print("ERREUR : NOTION_API_KEY introuvable dans ~/.hermes/.env", file=sys.stderr)
        sys.exit(1)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"[notion_proxy] Proxy Notion en écoute sur http://127.0.0.1:{PORT}")
    print(f"[notion_proxy] Résolution de la data source « Tâches »…")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[notion_proxy] Arrêt.")


if __name__ == "__main__":
    main()
