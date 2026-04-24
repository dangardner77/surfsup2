const CACHE_NAME = 'surfsup-v1';
const urlsToCache = [
  '.',
  'index.html',
  'script.js',
  'manifest.json'
];

// Install event - cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for dynamic content, cache first for static
self.addEventListener('fetch', event => {
  const { request } = event;

  // For JSON data files, use network-first strategy
  if (request.url.includes('.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
  } else {
    // For static assets, use cache-first strategy
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
        .catch(() => caches.match('index.html'))
    );
  }
});
