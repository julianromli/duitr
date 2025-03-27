const CACHE_NAME = 'duitr-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icons/icon-72x72.png',
  '/pwa-icons/icon-96x96.png',
  '/pwa-icons/icon-128x128.png',
  '/pwa-icons/icon-144x144.png',
  '/pwa-icons/icon-152x152.png',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-384x384.png',
  '/pwa-icons/icon-512x512.png',
  '/pwa-icons/maskable-icon.png'
];

// Install event - cache basic resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache open error:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache API requests
                if (!event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });
              
            return response;
          })
          .catch(error => {
            console.log('Fetch failed; returning offline page instead.', error);
            // You could return a custom offline page here
          });
      })
  );
}); 