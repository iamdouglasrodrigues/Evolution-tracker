const CACHE_NAME = 'pplul-v2'

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/favicon.svg',
]

// Install: precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// Activate: purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // HTML navigation: network first, cache fallback (ensures latest version)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const clone = resp.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          return resp
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Hashed assets (JS/CSS from Vite build): cache first (immutable)
  if (request.url.match(/\/assets\/.+\.[a-f0-9]+\.(js|css)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((resp) => {
          const clone = resp.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          return resp
        })
      })
    )
    return
  }

  // Other resources: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((resp) => {
        const clone = resp.clone()
        caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        return resp
      }).catch(() => cached)

      return cached || networkFetch
    })
  )
})
