// PWA Service Worker Registration Script
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Delay service worker registration until after page load
    setTimeout(() => {
      const swUrl = '/sw.js';
      
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
                  
                  // Don't show update notification if we detect we're on iOS
                  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                  
                  // Don't show update notification immediately after login
                  const justLoggedIn = window.location.pathname.includes('/auth/callback') || 
                                      sessionStorage.getItem('just_authenticated') === 'true';
                  
                  if (!isIOS && !justLoggedIn) {
                    // Only show notification on non-iOS devices and not right after login
                    if (window.confirm('New version available! Reload to update?')) {
                      window.location.reload();
                    }
                  } else if (isIOS) {
                    // On iOS, silently update without prompting
                    console.log('iOS device detected, silently updating service worker');
                    // Mark this so we don't show the popup on the next page navigation
                    sessionStorage.setItem('sw_updated', 'true');
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
          return registerSW(swUrl, { scope: '/' });
        })
        .catch(firstError => {
          console.error('First registration attempt failed:', firstError);
          
          // Try a different registration strategy if first attempt fails
          if (window.location.hostname !== 'localhost' && window.location.hostname !== 'duitr.my.id') {
            console.log('Trying alternative strategy for service worker registration');
            return registerSW(swUrl, { 
              scope: '/',
              updateViaCache: 'none'
            })
            .catch(secondError => {
              console.error('All ServiceWorker registration attempts failed:', secondError);
              // Last resort - try without scope
              return registerSW(swUrl);
            });
          }
        });
    }, 2000); // 2 second delay for better page load performance
  });
}
