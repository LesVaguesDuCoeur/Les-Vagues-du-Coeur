const CACHE_NAME="utilitaire-v1";
const URLS_TO_CACHE=["/","/index.html","/admin.html","/emergency.html","/vault.html","/testament.html","/setup.html","/css/style.css","/js/api.js","/js/crypto.js","/js/utils.js","/js/index.js","/js/setup.js","/js/admin.js","/js/emergency.js","/js/vault.js","/js/testament.js","/manifest.json","https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css","https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap","https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(URLS_TO_CACHE)))});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.map(n=>{if(n!==CACHE_NAME)return caches.delete(n)}))))});
