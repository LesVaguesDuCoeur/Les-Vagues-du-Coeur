self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('urgence-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/setup.html',
        '/admin.html',
        '/emergency.html',
        '/css/style.css',
        '/js/api.js',
        '/js/crypto.js',
        '/js/index.js',
        '/js/setup.js',
        '/js/admin.js',
        '/js/emergency.js',
        'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});