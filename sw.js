const CACHE_NAME = 'en-mastery-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/placement-test.html',
  '/dashboard.html',
  '/lessons.html',
  '/lesson-viewer.html',
  '/exercises.html',
  '/exercise-grammar.html',
  '/exercise-vocab.html',
  '/exercise-listening.html',
  '/exercise-speaking.html',
  '/exercise-writing.html',
  '/exercise-reading.html',
  '/exercise-pronunciation.html',
  '/quiz.html',
  '/review.html',
  '/progress.html',
  '/profile.html',
  '/app.js',
  '/api.js',
  '/storage.js',
  '/srs.js',
  '/speech.js',
  '/css/reset.css',
  '/css/tokens.css',
  '/css/components.css',
  '/css/layout.css',
  '/css/animations.css'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === location.origin && url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          fetch(event.request).then(fetchRes => {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, fetchRes.clone());
            });
          }).catch(() => {});
          return response;
        }
        return fetch(event.request).then(fetchRes => {
          const resClone = fetchRes.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
          return fetchRes;
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
