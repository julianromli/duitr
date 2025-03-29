// PWA Service Worker Registration Script
if ('serviceWorker' in navigator) {
  // Initialize page unloading flag
  window.isPageUnloading = false;
  
  // Better iOS detection - execute immediately, not just on load
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      window.navigator.userAgent.includes('iPhone') ||
      (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') && 
       navigator.maxTouchPoints > 0);
  };
  
  // Set flag immediately if on iOS
  if (isIOS()) {
    console.log('iOS device detected early, will silently update service worker');
    sessionStorage.setItem('is_ios_device', 'true');
  }
  
  // Track page unloading to prevent showing notifications during navigation
  window.addEventListener('beforeunload', () => {
    window.isPageUnloading = true;
  });

  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SERVICE_WORKER_ACTIVATED') {
      console.log(`New service worker (${event.data.version}) has activated`);
      
      // Check if this is an iOS device
      const isIOSDevice = sessionStorage.getItem('is_ios_device') === 'true';
      
      // Automatically reload for any device type
      const reloadTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          console.log('Auto-reloading after service worker update');
          window.location.reload();
        }
      }, 3000);
      
      // Cancel reload if user is actively using the app
      window.addEventListener('focus', () => {
        clearTimeout(reloadTimer);
      }, { once: true });
    }
  });
  
  window.addEventListener('load', () => {
    // More reliable iOS detection
    if (isIOS()) {
      console.log('iOS device detected on load, will silently update service worker');
      sessionStorage.setItem('is_ios_device', 'true');
    }
    
    // Clear the splash screen display first if it exists and has been shown long enough
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen && window.splashScreenShownTime && (Date.now() - window.splashScreenShownTime) > 1500) {
      console.log('Removing splash screen before SW registration');
      splashScreen.classList.add('loaded');
      setTimeout(() => {
        if (splashScreen.parentNode) {
          splashScreen.parentNode.removeChild(splashScreen);
        }
      }, 500);
    }
    
    // Check if we should clear the update notification flag
    // This happens when the app starts, to allow notifications for new updates in a new session
    // but prevents multiple notifications in the same session
    if (sessionStorage.getItem('app_session_started') !== 'true') {
      sessionStorage.setItem('app_session_started', 'true');
      sessionStorage.removeItem('update_notification_shown');
    }
    
    // Delay service worker registration until after page load
    setTimeout(() => {
      const swUrl = '/sw.js';
      
      // Prevent caching of service worker by adding cache-busting query param
      const swUrlNoCaching = `${swUrl}?_=${new Date().getTime()}`;
      
      // Function to register service worker with specific options
      const registerSW = (url, options = {}) => {
        return navigator.serviceWorker.register(url, options)
          .then(registration => {
            console.log('ServiceWorker registration successful with scope:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('Service worker update found!');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker installed');
                  
                  // Don't update immediately after login
                  const justLoggedIn = window.location.pathname.includes('/auth/callback') || 
                                      sessionStorage.getItem('just_authenticated') === 'true';
                  
                  // Check if the update has already been processed in this session
                  const hasProcessedUpdate = sessionStorage.getItem('update_notification_shown') === 'true';
                  
                  // Check if this is an iOS device
                  const isIOSDevice = sessionStorage.getItem('is_ios_device') === 'true';
                  
                  if (!justLoggedIn && !hasProcessedUpdate && !window.isPageUnloading) {
                    // Mark that we've processed this update
                    sessionStorage.setItem('update_notification_shown', 'true');
                    
                    // Schedule a reload when the user is not actively using the app
                    const autoReloadDelay = isIOSDevice ? 10000 : 5000; // 10s for iOS, 5s for others
                    
                    console.log(`Scheduling auto-reload in ${autoReloadDelay/1000}s for new version`);
                    
                    const reloadTimer = setTimeout(() => {
                      // Only reload if the user isn't actively using the app
                      if (!document.hasFocus()) {
                        console.log('Auto-reloading for new version');
                        window.location.reload();
                      } else {
                        console.log('User is active, delaying auto-reload');
                        // Try again in 30 seconds if user is active
                        setTimeout(() => window.location.reload(), 30000);
                      }
                    }, autoReloadDelay);
                    
                    // If user interacts with the page, delay the reload further
                    window.addEventListener('focus', () => {
                      clearTimeout(reloadTimer);
                      console.log('User activity detected, delaying auto-reload');
                    }, { once: true });
                  }
                }
              });
            });
            
            return registration;
          })
          .catch(error => {
            console.error('ServiceWorker registration failed:', error);
            return Promise.reject(error);
          });
      };
      
      // First, try to unregister any existing service workers to avoid conflicts
      // On public domain, force refresh all service workers
      const isPublicDomain = window.location.hostname === 'duitr.my.id' || 
                            window.location.hostname.endsWith('.duitr.my.id');
                            
      if (isPublicDomain) {
        console.log('Running on public domain, forcing service worker refresh');
        // Clear caches to ensure fresh files
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              console.log('Deleting cache:', cacheName);
              caches.delete(cacheName);
            });
          });
        }
      }
      
      navigator.serviceWorker.getRegistrations()
        .then(registrations => {
          const unregisterPromises = registrations.map(registration => {
            console.log('Unregistering existing service worker with scope:', registration.scope);
            return registration.unregister();
          });
          return Promise.all(unregisterPromises);
        })
        .then(() => {
          console.log('Registering new service worker');
          // Use no-cache URL on public domain
          const urlToUse = isPublicDomain ? swUrlNoCaching : swUrl;
          return registerSW(urlToUse, { scope: '/' });
        })
        .catch(firstError => {
          console.error('First registration attempt failed:', firstError);
          
          // Try a different registration strategy if first attempt fails
          if (window.location.hostname !== 'localhost' && window.location.hostname !== 'duitr.my.id') {
            console.log('Trying alternative strategy for service worker registration');
            return registerSW(swUrlNoCaching, { 
              scope: '/',
              updateViaCache: 'none'
            })
            .catch(secondError => {
              console.error('All ServiceWorker registration attempts failed:', secondError);
              // Last resort - try without scope
              return registerSW(swUrlNoCaching);
            });
          }
        });
    }, 2000); // 2 second delay for better page load performance
  });
}
