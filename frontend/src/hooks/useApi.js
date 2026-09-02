import { useState, useEffect } from 'react'
import { api } from '../lib/api'

/**
 * Hook générique pour données API avec fallback mock + loading/error.
 */
export function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchFn()
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, deps)

  return { data, loading, error, refetch: () => { setLoading(true); fetchFn().then(d => setData(d)).catch(e => setError(e.message)).finally(() => setLoading(false)) } }
}

/**
 * Hooks spécialisés
 */
export function useBureau() {
  return useApi(() => api.getBureau(), [])
}

export function useCellules() {
  return useApi(() => api.getCellules(), [])
}

export function useActivites(params = {}) {
  return useApi(() => api.getActivites(params), [JSON.stringify(params)])
}

export function useActualites(params = {}) {
  return useApi(() => api.getActualites(params), [JSON.stringify(params)])
}

export function usePresentation() {
  return useApi(() => api.getPresentation(), [])
}