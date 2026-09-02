/**
 * features/notion/notionApi.js
 * Client du proxy Notion local (tools/notion_proxy.py, port 8787).
 * Fallback : cache localStorage (dernières données vues) puis jeu de démo statique.
 * En prod, ce client pointera vers le back-end Django (doc 04) — mêmes routes.
 */

const PROXY = import.meta.env.VITE_NOTION_PROXY_URL ?? 'http://127.0.0.1:8787'
const CACHE_KEY = 'notion_tasks_cache'

/** Jeu de démo — uniquement si le proxy est éteint ET aucun cache disponible. */
const DEMO = [
  { id: 'demo-1', tache: 'Proposer un plan d’activités pour les 2 premiers mois', statut: 'En cours', priorite: 'Haute', echeance: '2026-04-27' },
  { id: 'demo-2', tache: 'Créer le calendrier partagé officiel du club', statut: 'À faire', priorite: 'Haute', echeance: '' },
  { id: 'demo-3', tache: 'Créer le formulaire d’adhésion en ligne et le QR code', statut: 'Terminé', priorite: 'Haute', echeance: '' },
  { id: 'demo-4', tache: 'Effectuer une veille sur les hackathons des 3 prochains mois', statut: 'À faire', priorite: 'Moyenne', echeance: '' },
  { id: 'demo-5', tache: 'Sondage auprès des membres sur les thématiques d’ateliers', statut: 'À faire', priorite: 'Moyenne', echeance: '' },
]

function lireCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return Array.isArray(data.taches) && data.taches.length ? data : null
  } catch {
    return null
  }
}

function ecrireCache(taches) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ taches, cache_le: new Date().toISOString() }))
  } catch { /* quota dépassé : tant pis, le cache est un bonus */ }
}

async function fetchJson(path, options) {
  const res = await fetch(`${PROXY}${path}`, options)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.erreur || `Proxy ${res.status}`)
    err.status = res.status
    throw err
  }
  return body
}

export const notionApi = {
  /** Ping du proxy. */
  async health() {
    try {
      const d = await fetchJson('/api/notion/health')
      return d.ok
    } catch {
      return false
    }
  },

  /** Liste des tâches avec fallback progressif : proxy → cache local → démo. */
  async getTaches() {
    try {
      const d = await fetchJson('/api/notion/tasks')
      ecrireCache(d.taches)
      return { taches: d.taches, source: 'notion',erreur: null }
    } catch (e) {
      const cache = lireCache()
      if (cache) return { taches: cache.taches, source: 'cache', erreur: `${e.message} — affichage du cache local` }
      return { taches: DEMO, source: 'demo', erreur: `${e.message} — affichage du jeu de démo` }
    }
  },

  /** Met à jour le statut d'une tâche (Notion uniquement — le cache se rafraîchit après). */
  async majStatut(id, statut) {
    return fetchJson(`/api/notion/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
  },
}

export default notionApi
