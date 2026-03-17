const CACHE_NAME = 'skymusic-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './server.js'
];

// Install the Service Worker and cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Intercept network requests
self.addEventListener('fetch', event => {
  // Use a Network-First strategy to ensure the app stays up to date
  event.respondWith(
    fetch(event.request).catch(() => {
      // If offline, serve from cache
      return caches.match(event.request);
    })
  );
});
