const _c = "utilitaire-v1";
const _a = [
  "/",
  "/index.html",
  "/setup.html",
  "/admin.html",
  "/emergency.html",
  "/vault.html",
  "/testament.html",
  "/css/style.css",
  "/js/api.js",
  "/js/crypto.js",
  "/js/utils.js",
  "/js/index.js",
  "/js/setup.js",
  "/js/admin.js",
  "/js/emergency.js",
  "/js/vault.js",
  "/js/testament.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js",
  "https://cdn.quilljs.com/1.3.6/quill.snow.css",
  "https://cdn.quilljs.com/1.3.6/quill.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
];
self.addEventListener("install", _e => {
  _e.waitUntil(
    caches.open(_c).then(_k => _k.addAll(_a))
  );
});
self.addEventListener("fetch", _e => {
  if (_e.request.method !== "GET" || _e.request.url.includes("script.google.com") || _e.request.url.includes("ipify.org")) {
    return;
  }
  _e.respondWith(
    caches.match(_e.request).then(_r => {
      return _r || fetch(_e.request).then(_f => {
        return caches.open(_c).then(_k => {
          _k.put(_e.request, _f.clone());
          return _f;
        });
      });
    }).catch(() => {
      if (_e.request.mode === "navigate") {
        return caches.match("/index.html");
      }
    })
  );
});
self.addEventListener("activate", _e => {
  _e.waitUntil(
    caches.keys().then(_k => {
      return Promise.all(
        _k.map(_n => {
          if (_n !== _c) {
            return caches.delete(_n);
          }
        })
      );
    })
  );
});
