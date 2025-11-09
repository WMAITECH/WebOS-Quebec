const CACHE_NAME = 'webos-quebec-v1.0.0';
const RUNTIME_CACHE = 'webos-runtime';

const STATIC_ASSETS = [
  '/',
  '/webos-quebec.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin && !url.hostname.includes('supabase')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request, { mode: 'cors' }).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          if (response.type === 'opaque' || response.type === 'cors') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  } else {
    event.respondWith(fetch(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});