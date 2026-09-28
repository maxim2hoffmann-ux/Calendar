const CACHE_NAME = 'calendar-v1';
const URLS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Не кэшируем внешние запросы (Unsplash и т.д.)
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then((r) => {
      if (r) return r;
      return fetch(e.request).then((resp) => {
        if (!resp || resp.status !== 200) return resp;
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
