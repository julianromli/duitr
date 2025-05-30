// Cache version identifier - update this when the cache should be refreshed
const CACHE_NAME = 'duitr-v8';

// URLs to cache initially
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-customizer.html',
  '/pwa-icons/new/192.png',
  '/pwa-icons/new/128.png',
  '/pwa-icons/new/96.png',
  '/pwa-icons/new/32.png',
  '/pwa-icons/new/apple-touch-icon.png',
  '/pwa-icons/icon-72x72.png',
  '/pwa-icons/icon-96x96.png',
  '/pwa-icons/icon-128x128.png',
  '/pwa-icons/icon-144x144.png',
  '/pwa-icons/icon-152x152.png',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-384x384.png',
  '/pwa-icons/icon-512x512.png',
  '/pwa-icons/maskable-icon.png',
  '/pwa-icons/apple-touch-icon.png'
];

// Install event - cache basic resources and create offline page
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...', event);
  
  // Don't force activation - wait until current pages using old service worker are closed
  // This prevents disrupting the user's active sessions
  // self.skipWaiting().then(() => console.log('[Service Worker] skipWaiting succeeded'));
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell and content');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Cache failure:', err);
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...', event);
  
  // Claim clients immediately
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim().then(() => {
        console.log('[Service Worker] Claimed all clients');
        
        // Notify clients about the update
        return self.clients.matchAll().then(clients => {
          return Promise.all(clients.map(client => {
            // Send update message to each client
            return client.postMessage({
              type: 'SERVICE_WORKER_ACTIVATED',
              version: CACHE_NAME
            });
          }));
        });
      })
    ])
  );
});

// Helper function to determine if a request is navigational
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Helper function to determine if a response is valid
const isValidResponse = (response) => {
  return response && response.status === 200 && response.type === 'basic';
};

// Helper function to check if a request is authentication related
const isAuthRequest = (url) => {
  return url.pathname.includes('/auth/') || 
         url.search.includes('code=') || 
         url.search.includes('access_token=') ||
         url.hash.includes('access_token=');
};

// Add no-cache headers to response
const addNoCacheHeaders = (response) => {
  if (!response || !response.headers) {
    return response;
  }
  
  // Clone the response to modify headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  newHeaders.set('Pragma', 'no-cache');
  newHeaders.set('Expires', '0');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip handling authentication-related requests
  if (isAuthRequest(requestUrl)) {
    console.log('[Service Worker] Skipping service worker for auth request:', requestUrl.pathname);
    // Let the browser handle these directly
    return;
  }
  
  // For HTML requests (like navigation), always go to network first, then cache
  // This ensures users always get the latest HTML
  if (isNavigationRequest(event.request) || 
      requestUrl.pathname.endsWith('.html') || 
      requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (isValidResponse(response)) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);
            });
          }
          // Add no-cache headers
          return addNoCacheHeaders(response);
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no match in cache, serve offline page for navigation requests
              return caches.match('/duitr-offline.html');
            });
        })
    );
    return;
  }
  
  // For API requests, use network-only
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('[Service Worker] API fetch error:', error);
          return new Response(JSON.stringify({ 
            error: 'You are offline and this action requires network connectivity.'
          }), { 
            headers: { 'Content-Type': 'application/json' },
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }
  
  // For static assets, use network-first for JS, then cache
  if (requestUrl.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (isValidResponse(response)) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(error => {
          console.log('[Service Worker] Network fetch for JS failed, trying cache', error);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other static assets, use cache-first strategy
  if (event.request.url.match(/\.(css|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              if (isValidResponse(response)) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return response;
            })
            .catch(error => {
              console.error('[Service Worker] Static asset fetch error:', error);
              // Return a fallback image for image requests if available
              if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
                return caches.match('/pwa-icons/icon-512x512.png');
              }
              return new Response('Resource not available offline');
            });
        })
    );
    return;
  }
  
  // Default strategy for everything else (stale-while-revalidate)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (isValidResponse(networkResponse)) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clonedResponse);
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch error:', error);
            throw error;
          });
          
        // Return the cached response immediately if we have it,
        // and update it in the background
        return cachedResponse || fetchPromise;
      })
  );
});

// Listen for message events from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting message received');
    self.skipWaiting();
  }
}); 