const CACHE_NAME = 'mini-tools-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './apps-manifest.js',
  './utils/clipboard.js',
  './utils/notify.js',
  './utils/storage.js',
  './utils/dom.js'
];

// Instalace service workeru
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch - načítání z cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Aktivace - smazání starých cache
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
    })
  );
});