/* Service worker PWA — IT-CLUB EMSP (doc 05 §5).
   Stratégie :
   - navigations (HTML) : réseau d'abord (jamais de page périmée),
   - assets versionnés (/assets/*) : cache-first (hash unique = sûr),
   - le reste : réseau direct.
   Le nom de cache suit la version du déploiement (query ?v=…) pour
   purger les vieux caches à chaque mise à jour. */
const CACHE = 'emsp-v2'

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return
  // Navigations : toujours le HTML le plus frais
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')))
    return
  }
  // Assets Vite (hash unique par build) : cache-first + mise en cache
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit ?? fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
        }
        return res
      })),
    )
  }
})
