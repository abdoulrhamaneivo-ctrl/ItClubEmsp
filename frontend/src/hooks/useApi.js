import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

/**
 * Hooks données — même contrat qu'avant { data, loading, error, refetch },
 * mais servis par React Query : cache 60s, déduplication des appels
 * simultanés, refetch intelligent. Aucun composant n'a changé.
 */
function requete(cle, fn) {
  const { data = null, isLoading, isError, error, refetch } = useQuery({
    queryKey: cle,
    queryFn: fn,
  })
  return {
    data,
    loading: isLoading,
    error: isError ? (error?.message ?? 'Erreur de chargement') : null,
    refetch: () => { refetch() },
  }
}

export function useApi(fetchFn, deps = []) {
  return requete(['custom', ...deps.map(String)], fetchFn)
}

export function useBureau() {
  return requete(['bureau'], () => api.getBureau())
}

export function useCellules() {
  return requete(['cellules'], () => api.getCellules())
}

export function useActivites(params = {}) {
  return requete(['evenements', params], () => api.getActivites(params))
}

export function useActualites(params = {}) {
  return requete(['actualites', params], () => api.getActualites(params))
}

export function usePresentation() {
  return requete(['presentation'], () => api.getPresentation())
}
