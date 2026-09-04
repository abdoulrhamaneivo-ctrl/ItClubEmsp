import { QueryClient } from '@tanstack/react-query'

/**
 * Client React Query partagé — une seule instance pour toute l'app.
 * staleTime 60s : Naviguer↔retour ne refetch pas ; déduplication des
 * appels simultanés intégrée (remplace l'ancien cache manuel de api.js).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Après une écriture (inscription, candidature…) : rafraîchit les lectures liées. */
export function invaliderCacheMetier() {
  queryClient.invalidateQueries({ predicate: (q) =>
    ['evenements', 'espace', 'notifications', 'candidatures',
     'actualites', 'documents', 'galerie', 'presentation',
     'bureau', 'cellules'].includes(q.queryKey[0]) })
}
