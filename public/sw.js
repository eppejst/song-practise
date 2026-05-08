// Service Worker for DnS øveapp
// Bump CACHE_VERSION when you want to force everyone to get fresh assets.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'dns-oveapp-' + CACHE_VERSION;

// Files to pre-cache on install (app shell)
const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './songs.json',
  './logo.png',
];

// ---- Install: pre-cache app shell ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ---- Activate: clean up old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---- Fetch: strategy depends on resource type ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin and CDN requests
  if (url.origin !== location.origin &&
      !url.hostname.includes('cdnjs.cloudflare.com')) {
    return;
  }

  // songs.json → network-first (always try to get fresh song list)
  if (url.pathname.endsWith('songs.json')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Audio and PDF files → cache-first (large, never change)
  if (/\.(mp3|pdf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Everything else (JS, CSS, HTML, images, CDN scripts) → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

// ---- Caching strategies ----

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('Offline', { status: 503 });
}
