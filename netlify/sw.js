self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('coffre-fort-v1').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/setup.html',
      '/admin.html',
      '/emergency.html',
      '/vault.html',
      '/testament.html',
      '/css/style.css',
      '/js/api.js',
      '/js/crypto.js',
      '/js/utils.js',
      '/js/index.js',
      '/js/setup.js',
      '/js/admin.js',
      '/js/emergency.js',
      '/js/vault.js',
      '/js/testament.js'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});