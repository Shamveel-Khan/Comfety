const CACHE = 'comfety-shell-v1';
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'])));
 self.skipWaiting();
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('comfety-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 if (request.method !== 'GET' || url.origin !== self.location.origin) return;
 if (request.mode === 'navigate') {
  event.respondWith(fetch(request).then(response => {
   if (response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put('/',copy)); }
   return response;
  }).catch(()=>caches.match('/')));
 } else if (url.pathname.startsWith('/assets/') || ['/manifest.webmanifest','/icon.svg','/icon-192.png','/icon-512.png'].includes(url.pathname)) {
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
   if (response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(request,copy)); }
   return response;
  })));
 }
});
