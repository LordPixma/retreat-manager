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

// Bump this when the shell changes shape (new files, new caching strategy).
// On install the new SW pre-caches; on activate it deletes any cache name
// that isn't this one, evicting stale builds.
const CACHE = 'checkin-shell-v3';

// Pre-cached so the door tablet boots offline. app.js / app.css / index.html
// are also pre-cached but served network-first (see fetch handler) so the
// PWA self-updates on every reload that has connectivity.
const SHELL = [
  '/checkin/',
  '/checkin/index.html',
  '/checkin/app.css',
  '/checkin/app.js',
  '/checkin/manifest.json',
  // External libs — failing to cache these is non-fatal (network fallback).
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
];

// Network-first for these — always pick up new deploys, fall back to cache
// only when offline. Without this, a service-worker cache hit on app.js
// can leave a device stuck on an old build for days after a fix ships.
const NETWORK_FIRST_PATHS = [
  '/checkin/',
  '/checkin/index.html',
  '/checkin/app.js',
  '/checkin/app.css',
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

  // App-owned files (index.html, app.js, app.css): network-first so a deploy
  // propagates on the next reload, with cache fallback for offline.
  //
  // `cache: 'no-store'` bypasses the BROWSER HTTP cache. Without it, a device
  // that originally fetched these with a long max-age can stay pinned on the
  // old build for hours even after the new SW activates — the SW's fetch()
  // resolves to the stale HTTP cache entry instead of going to origin.
  const isNetworkFirst = NETWORK_FIRST_PATHS.some((p) => url.pathname === p || url.pathname === p + 'index.html');
  if (isNetworkFirst) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return response;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Everything else same-origin (or in our pinned SHELL): cache-first.
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
