const CACHE_NAME = 'vault-cache-v1';
const urlsToCache = [
  './index.html',
  './admin.html',
  './emergency.html',
  './vault.html',
  './testament.html',
  './setup.html',
  './css/style.css',
  './js/api.js',
  './js/crypto.js',
  './js/utils.js',
  './js/index.js',
  './js/setup.js',
  './js/admin.js',
  './js/emergency.js',
  './js/vault.js',
  './js/testament.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});