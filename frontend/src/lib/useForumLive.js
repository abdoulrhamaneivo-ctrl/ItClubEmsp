import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from './api'

/**
 * Fil de discussion en direct (chat forum, doc 00 bonus).
 * Ouvre ws(s)://…/ws/forum/<sujet>/?token=<JWT> et fusionne les
 * messages reçus dans le cache React Query — sans rechargement.
 * Envoi par WS si connecté, sinon repli REST (qui diffuse aussi).
 * En mode mock (sans VITE_API_URL) : REST uniquement, rien ne change.
 */

function baseWs() {
  const base = import.meta.env.VITE_API_URL ?? ''
  if (base) return base.replace(/^http/, 'ws')
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.hostname}:8000`
}

export function useForumLive(sujetId, { onErreur } = {}) {
  const client = useQueryClient()
  const [connecte, setConnecte] = useState(false)
  const wsRef = useRef(null)
  const essaisRef = useRef(0)
  const timersRef = useRef([])
  const reel = !!import.meta.env.VITE_API_URL

  useEffect(() => {
    if (!sujetId || !reel) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    let ferme = false

    const recevoir = (msg) => {
      if (msg.type === 'chat_message' && msg.message) {
        client.setQueryData(['forum-messages', sujetId], (anciens = []) => (
          anciens.some((m) => m.id === msg.message.id) ? anciens : [...anciens, msg.message]
        ))
        client.invalidateQueries({ queryKey: ['forum-sujets'] })
      } else if (msg.type === 'message_retire') {
        client.setQueryData(['forum-messages', sujetId], (anciens = []) => (
          anciens.filter((m) => m.id !== msg.message_id)
        ))
        client.invalidateQueries({ queryKey: ['forum-sujets'] })
      } else if (msg.type === 'error') {
        onErreur?.(msg.detail ?? 'Message refusé')
      }
    }

    const connecter = () => {
      if (ferme) return
      let ws
      try {
        ws = new WebSocket(`${baseWs()}/ws/forum/${sujetId}/?token=${encodeURIComponent(token)}`)
      } catch {
        return
      }
      wsRef.current = ws
      ws.onopen = () => {
        essaisRef.current = 0
        setConnecte(true)
        // Keepalive : Render coupe les sockets oisives (~55 s)
        timersRef.current.push(setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
        }, 25000))
      }
      ws.onmessage = (e) => {
        try { recevoir(JSON.parse(e.data)) } catch { /* trame ignorée */ }
      }
      ws.onclose = (e) => {
        setConnecte(false)
        wsRef.current = null
        timersRef.current.forEach(clearInterval)
        timersRef.current = []
        // 4401 = token invalide, 4404 = sujet supprimé : inutile de réessayer
        if (ferme || e.code === 4401 || e.code === 4404) return
        const delai = Math.min(1000 * 2 ** essaisRef.current, 8000)
        essaisRef.current += 1
        timersRef.current.push(setTimeout(connecter, delai))
      }
    }

    connecter()
    return () => {
      ferme = true
      timersRef.current.forEach((t) => { clearInterval(t); clearTimeout(t) })
      timersRef.current = []
      try { wsRef.current?.close() } catch { /* déjà fermée */ }
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sujetId, reel])

  /** Envoie : WS si connecté, sinon REST (diffusé aussi aux autres). */
  const envoyer = async (texte) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', contenu: texte }))
      return 'ws'
    }
    await api.posterMessage(sujetId, texte)
    client.invalidateQueries({ queryKey: ['forum-messages', sujetId] })
    client.invalidateQueries({ queryKey: ['forum-sujets'] })
    return 'rest'
  }

  return { connecte, envoyer, tempsReel: reel }
}
