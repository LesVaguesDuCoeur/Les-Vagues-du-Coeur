self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('coffre-v1').then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './css/style.css',
        './js/api.js',
        './js/crypto.js',
        './js/utils.js',
        './js/index.js'
      ]);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});