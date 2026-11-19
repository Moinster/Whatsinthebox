// Service worker for What's in the Box. Filled in by scripts/build-web.mjs.
// Every built file is cached at install, so the app opens with no connection.
const CACHE = 'witb-__VERSION__';
const FILES = __FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('witb-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Page loads (including scanned QR links) get the app shell: fresh when online, cached when not.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(new URL('./', self.registration.scope))
        .then((response) => (response.ok ? response : Promise.reject(response)))
        .catch(() => caches.match('./', { cacheName: CACHE })),
    );
    return;
  }

  event.respondWith(caches.match(request, { cacheName: CACHE }).then((cached) => cached || fetch(request)));
});
