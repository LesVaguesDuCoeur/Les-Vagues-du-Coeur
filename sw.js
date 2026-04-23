const CACHE_NAME = 'enfaimsansfil-drive-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/assets/css/reset.css',
  '/assets/css/tokens.css',
  '/assets/css/base.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/assets/css/screens.css',
  '/assets/css/drive.css',
  '/assets/css/responsive.css',
  '/assets/js/data.js',
  '/assets/js/utils.js',
  '/assets/js/toast.js',
  '/assets/js/modal.js',
  '/assets/js/router.js',
  '/assets/js/nav.js',
  '/assets/js/screens/cover.js',
  '/assets/js/screens/before-after.js',
  '/assets/js/screens/drive.js',
  '/assets/js/screens/poles.js',
  '/assets/js/screens/emails.js',
  '/assets/js/screens/chat-vs-whatsapp.js',
  '/assets/js/screens/steps.js',
  '/assets/js/screens/summary.js',
  '/assets/js/app.js',
  '/assets/img/logo.png',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
