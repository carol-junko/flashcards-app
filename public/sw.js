// Service worker: makes the app installable and usable offline.
//
// Strategy (no build plugin needed):
//   - install:     cache the app shell (index.html + the JS/CSS it references)
//   - pages:       network first, cached app shell when offline
//   - /assets/*:   cache first (file names contain a content hash, so they never change)
//   - /data/*:     stale-while-revalidate: decks you've opened work offline,
//                  and content updates arrive on the next visit
//
// Bump VERSION to force every client to drop its old caches.
const VERSION = 'v2'
const CACHE = `flashcards-${VERSION}`
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/data/languages.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(SHELL)
      // Also cache the hashed JS/CSS bundles that index.html points to, so the
      // very first offline launch works even though they were loaded before
      // this service worker existed.
      const html = await (await fetch('/index.html', { cache: 'no-store' })).text()
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll(assets)
      // Deck catalogues (small) so the deck lists work offline
      const languages = await (await fetch('/data/languages.json')).json()
      await cache.addAll(languages.map((l) => `/data/manifests/${l.id}-manifest.json`))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith('flashcards-') && k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

async function networkFirstPage(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE)
    cache.put('/index.html', response.clone())
    return response
  } catch {
    // Offline: every route (/learn/…, /plan/…) is served by the same app shell
    return (await caches.match('/index.html')) || Response.error()
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const refresh = fetch(request)
    .then((response) => {
      // Only cache real JSON: SPA hosts answer missing files with index.html
      const isJson = (response.headers.get('content-type') || '').includes('json')
      if (response.ok && isJson) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached || Response.error())
  if (cached) {
    event.waitUntil(refresh) // update in the background
    return cached
  }
  return refresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
  } else if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request))
  } else if (url.pathname.startsWith('/data/')) {
    event.respondWith(staleWhileRevalidate(request, event))
  }
})
