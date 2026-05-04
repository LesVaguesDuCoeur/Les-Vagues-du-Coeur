const CACHE_NAME = 'pdfstudio-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/pdf-engine.js',
  '/js/converter.js',
  '/js/watermark.js',
  '/js/signature.js',
  '/js/editor.js',
  '/js/compressor.js',
  '/js/fonts.js',
  '/js/ui.js',
  '/js/utils.js',
  '/js/sw-register.js',
  '/assets/favicon.svg',
  '/assets/logo.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
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
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  const url = new URL(event.request.url);
  const isCdn = url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        if (isCdn) {
           fetch(event.request).then(response => {
               if(response.ok) {
                   caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
               }
           }).catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic' && !isCdn) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch((err) => {
          console.warn('Fetch failed, offline mode ?', err);
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});