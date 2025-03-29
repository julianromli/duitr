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
      
      // Force reload if on public domain
      const isPublicDomain = window.location.hostname === 'duitr.my.id' || 
                             window.location.hostname.endsWith('.duitr.my.id');
      
      if (isPublicDomain && !isIOSDevice) {
        // Force reload to ensure new version is used, but avoid disrupting current user session
        const reloadTimer = setTimeout(() => {
          if (!document.hasFocus()) {
            console.log('Force reloading after service worker update on public domain');
            window.location.reload();
          }
        }, 3000);
        
        // Cancel reload if user is actively using the app
        window.addEventListener('focus', () => {
          clearTimeout(reloadTimer);
        }, { once: true });
      }
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
                  
                  // Don't show update notification immediately after login
                  const justLoggedIn = window.location.pathname.includes('/auth/callback') || 
                                      sessionStorage.getItem('just_authenticated') === 'true';
                  
                  // Check if the update notification has already been shown in this session
                  const hasShownUpdateNotification = sessionStorage.getItem('update_notification_shown') === 'true';
                  
                  // Check if this is an iOS device
                  const isIOSDevice = sessionStorage.getItem('is_ios_device') === 'true';
                  
                  if (!isIOSDevice && !justLoggedIn && !hasShownUpdateNotification && !window.isPageUnloading) {
                    // Only show notification once per session
                    sessionStorage.setItem('update_notification_shown', 'true');
                    
                    try {
                      // Check if dark mode is enabled
                      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                      const userTheme = localStorage.getItem('settings') ? 
                        JSON.parse(localStorage.getItem('settings')).theme : 'system';
                      
                      // Determine if we should use dark mode
                      const useDarkMode = userTheme === 'dark' || 
                        (userTheme === 'system' && isDarkMode);
                      
                      // Create a custom alert instead of using window.confirm
                      const alertContainer = document.createElement('div');
                      alertContainer.style.position = 'fixed';
                      alertContainer.style.top = '0';
                      alertContainer.style.left = '0';
                      alertContainer.style.right = '0';
                      alertContainer.style.bottom = '0';
                      alertContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                      alertContainer.style.zIndex = '9999';
                      alertContainer.style.display = 'flex';
                      alertContainer.style.justifyContent = 'center';
                      alertContainer.style.alignItems = 'center';
                      alertContainer.style.padding = '10px';
                      
                      const alertBox = document.createElement('div');
                      alertBox.style.backgroundColor = useDarkMode ? '#1f1f1f' : 'white';
                      alertBox.style.color = useDarkMode ? '#ffffff' : '#000000';
                      alertBox.style.borderRadius = '8px';
                      alertBox.style.padding = '20px';
                      alertBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                      alertBox.style.maxWidth = '400px';
                      alertBox.style.width = '90%';
                      alertBox.style.textAlign = 'center';
                      
                      const title = document.createElement('h3');
                      title.textContent = 'New version available!';
                      title.style.margin = '0 0 15px 0';
                      
                      const text = document.createElement('p');
                      text.textContent = 'Reload to update?';
                      text.style.margin = '0 0 20px 0';
                      
                      const buttonContainer = document.createElement('div');
                      buttonContainer.style.display = 'flex';
                      buttonContainer.style.justifyContent = 'center';
                      buttonContainer.style.gap = '10px';
                      
                      const okButton = document.createElement('button');
                      okButton.textContent = 'OK';
                      okButton.style.backgroundColor = useDarkMode ? '#C6FE1E' : '#2463EB';
                      okButton.style.border = 'none';
                      okButton.style.borderRadius = '4px';
                      okButton.style.padding = '8px 16px';
                      okButton.style.color = useDarkMode ? '#000000' : 'white';
                      okButton.style.cursor = 'pointer';
                      okButton.style.fontWeight = '500';
                      
                      const cancelButton = document.createElement('button');
                      cancelButton.textContent = 'Cancel';
                      cancelButton.style.backgroundColor = useDarkMode ? '#333333' : '#f5f5f5';
                      cancelButton.style.border = `1px solid ${useDarkMode ? '#444444' : '#ddd'}`;
                      cancelButton.style.borderRadius = '4px';
                      cancelButton.style.padding = '8px 16px';
                      cancelButton.style.cursor = 'pointer';
                      cancelButton.style.color = useDarkMode ? '#cccccc' : '#666666';
                      cancelButton.style.fontWeight = '500';
                      
                      // Add event listeners to buttons
                      okButton.addEventListener('click', () => {
                        document.body.removeChild(alertContainer);
                        window.location.reload();
                      });
                      
                      cancelButton.addEventListener('click', () => {
                        document.body.removeChild(alertContainer);
                      });
                      
                      // Assemble the alert
                      buttonContainer.appendChild(okButton);
                      buttonContainer.appendChild(cancelButton);
                      alertBox.appendChild(title);
                      alertBox.appendChild(text);
                      alertBox.appendChild(buttonContainer);
                      alertContainer.appendChild(alertBox);
                      
                      // Add the alert to the document
                      document.body.appendChild(alertContainer);
                    } catch (error) {
                      console.error('Error showing update notification:', error);
                      // Fallback to basic confirm if custom dialog fails
                      if (window.confirm('Update tersedia. Reload sekarang?')) {
                        window.location.reload();
                      }
                    }
                  } else if (isIOSDevice) {
                    // On iOS, use a setTimeout to ensure app gets updated
                    console.log('iOS device detected, scheduling background update');
                    
                    // On iOS, we'll use a delayed reload to avoid disrupting UX
                    // This gives time for the service worker to activate properly
                    setTimeout(() => {
                      // Only reload if user hasn't interacted with the page
                      if (!document.hasFocus() || confirm('Update tersedia. Reload sekarang?')) {
                        console.log('Performing delayed iOS update reload');
                        window.location.reload();
                      }
                    }, 10000); // 10 second delay for iOS reload
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
