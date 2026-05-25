/*
  Service worker for the check-in PWA.

  Strategy:
    * Cache-first for the static app shell so the door tablet boots the UI
      even when the venue WiFi is wobbly.
    * Network-only for /api/* — actual check-in POSTs must hit the live
      server, and the offline queue is managed in app.js (not here) so we
      can show queue depth in the UI.

  The cache version is bumped manually when the shell changes. Old caches
  are deleted on activate. We deliberately skip Background Sync because
  iOS Safari doesn't support it; app.js polls for online and drains the
  queue itself.
*/

const CACHE = 'checkin-shell-v1';

const SHELL = [
  '/checkin/',
  '/checkin/index.html',
  '/checkin/app.css',
  '/checkin/app.js',
  '/checkin/manifest.json',
  // External libs — failing to cache these is non-fatal (network fallback).
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(SHELL).catch((err) => {
        // Some shell entries may fail (CDN flakey, CORS); cache what we can.
        console.warn('[sw] partial shell cache', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // Only intercept GETs

  const url = new URL(req.url);

  // API calls always go to the network — never serve a stale check-in
  // result from cache.
  if (url.pathname.startsWith('/api/')) return;

  // App shell + same-origin static: cache-first, fall back to network and
  // update cache opportunistically.
  if (url.origin === self.location.origin || SHELL.some((s) => req.url === s)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          if (response.ok && (url.origin === self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return response;
        });
      })
    );
  }
});
