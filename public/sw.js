const CACHE_NAME = 'webos-quebec-v1.0.0';
const RUNTIME_CACHE = 'webos-runtime';

const STATIC_ASSETS = [
  '/',
  '/webos-quebec.html',
  'https://cdn.tailwindcss.com',
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

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
  } else {
    event.respondWith(fetch(request));
  }
});

const aiPersistenceState = {
  enabled: false,
  aiEngineState: null,
  lastActivity: null,
  keepAliveInterval: null
};

function startKeepAlive() {
  if (aiPersistenceState.keepAliveInterval) return;

  aiPersistenceState.keepAliveInterval = setInterval(() => {
    self.clients.matchAll().then(clients => {
      if (clients.length === 0) {
        stopKeepAlive();
      }
    });
  }, 30000);
}

function stopKeepAlive() {
  if (aiPersistenceState.keepAliveInterval) {
    clearInterval(aiPersistenceState.keepAliveInterval);
    aiPersistenceState.keepAliveInterval = null;
  }
}

self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'ai-persistence-enable') {
    aiPersistenceState.enabled = true;
    aiPersistenceState.lastActivity = Date.now();
    startKeepAlive();

    event.ports[0]?.postMessage({ type: 'ai-persistence-enabled' });

    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'ai-persistence-enabled' });
      });
    });
    return;
  }

  if (type === 'ai-persistence-disable') {
    aiPersistenceState.enabled = false;
    aiPersistenceState.aiEngineState = null;
    stopKeepAlive();

    event.ports[0]?.postMessage({ type: 'ai-persistence-disabled' });

    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'ai-persistence-disabled' });
      });
    });
    return;
  }

  if (type === 'ai-persistence-status') {
    const status = {
      enabled: aiPersistenceState.enabled,
      hasState: !!aiPersistenceState.aiEngineState,
      lastActivity: aiPersistenceState.lastActivity
    };

    event.ports[0]?.postMessage({ type: 'ai-persistence-status', status });

    if (event.source) {
      event.source.postMessage({ type: 'ai-persistence-status', status });
    }
    return;
  }

  if (type === 'ai-persistence-store') {
    if (aiPersistenceState.enabled) {
      aiPersistenceState.aiEngineState = data;
      aiPersistenceState.lastActivity = Date.now();
      event.ports[0]?.postMessage({ type: 'ai-persistence-stored', success: true });
    } else {
      event.ports[0]?.postMessage({ type: 'ai-persistence-stored', success: false });
    }
    return;
  }

  if (type === 'ai-persistence-retrieve') {
    event.ports[0]?.postMessage({
      type: 'ai-persistence-retrieved',
      state: aiPersistenceState.aiEngineState
    });
    return;
  }

  if (type === 'ai-persistence-clear') {
    aiPersistenceState.aiEngineState = null;
    event.ports[0]?.postMessage({ type: 'ai-persistence-cleared' });
    return;
  }
});