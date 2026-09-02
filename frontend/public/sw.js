/* Service worker PWA — IT-CLUB EMSP (doc 05 §5).
   Stratégie : cache-first pour les assets, réseau direct pour le reste. */
const CACHE = 'emsp-v1'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  // Assets locaux en cache-first
  if (e.request.method === 'GET' && url.origin === self.location.origin && /\/assets\/|\.png$|\.svg$|\.ico$|\.js$|\.css$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit ?? fetch(e.request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy))
        return res
      })),
    )
  }
})
