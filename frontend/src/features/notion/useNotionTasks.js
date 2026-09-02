import { useCallback, useEffect, useState } from 'react'
import { notionApi } from './notionApi'

/**
 * features/notion/useNotionTasks.js
 * Charge les tâches Notion (via proxy), gère les 3 sources (notion/cache/demo)
 * et la mise à jour optimiste du statut (repli automatique si le proxy est down).
 */
export function useNotionTasks() {
  const [taches, setTaches] = useState([])
  const [source, setSource] = useState('chargement')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState({}) // id → true pendant un PATCH

  const charger = useCallback(async () => {
    setChargement(true)
    const d = await notionApi.getTaches()
    setTaches(d.taches)
    setSource(d.source)
    setErreur(d.erreur)
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  /** Mise à jour optimiste : l'UI change tout de suite, rollback si Notion refuse. */
  const majStatut = useCallback(async (id, statut) => {
    const avant = taches.find((t) => t.id === id)
    if (!avant || avant.statut === statut) return
    setEnCours((m) => ({ ...m, [id]: true }))
    setTaches((ts) => ts.map((t) => (t.id === id ? { ...t, statut } : t)))
    try {
      await notionApi.majStatut(id, statut)
      setSource('notion')
      setErreur(null)
      // resynchronisation silencieuse pour récupérer modifie_le etc.
      const d = await notionApi.getTaches()
      setTaches(d.taches)
      setSource(d.source)
    } catch (e) {
      setTaches((ts) => ts.map((t) => (t.id === id ? { ...t, statut: avant.statut } : t)))
      setErreur(`Mise à jour refusée : ${e.message}`)
    } finally {
      setEnCours((m) => ({ ...m, [id]: false }))
    }
  }, [taches])

  return { taches, source, erreur, chargement, majStatut, recharger: charger, enCours }
}

export default useNotionTasks
