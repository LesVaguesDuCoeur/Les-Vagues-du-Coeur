const CACHE_NAME="utilitaire-cache-v1";
const urlsToCache=["/","/index.html","/admin.html","/emergency.html","/vault.html","/testament.html","/setup.html","/css/style.css","/js/api.js","/js/crypto.js","/js/utils.js","/js/index.js","/js/setup.js","/js/admin.js","/js/emergency.js","/js/vault.js","/js/testament.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.map(c=>{if(c!==CACHE_NAME)return caches.delete(c);}))));self.clients.claim();});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(r=>{if(r)return r;return fetch(e.request).then(f=>{if(!f||f.status!==200||f.type!=="basic")return f;let rc=f.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,rc));return f;});}));});
