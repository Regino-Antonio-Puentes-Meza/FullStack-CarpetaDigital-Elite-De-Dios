// Service Worker simplificado para caching básico
// Nota: El caching principal se maneja en memoria mediante JavaScript
const CACHE_NAME = 'elite-de-dios-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Caching pasivo en segundo plano (sin interferir con la lógica principal)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.includes('/assets/')) {
    return;
  }

  // Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
