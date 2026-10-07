const CACHE_NAME = 'mihrab-v1-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './quran_books.json',
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Tajawal:wght@400;500;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/gh/quran/quran.com-frontend@master/public/fonts/quran/hafs/uthmanic_hafs_v22.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // تخزين الاستجابات الناجحة تلقائياً في الخلفية
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(() => {
      // إذا انقطع الإنترنت ولم تكن الصفحة مخزنة، ارجع لـ index.html
      return caches.match('./index.html');
    })
  );
});
