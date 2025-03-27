if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Delay service worker registration until after page load
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
          
          // Try again with a different path if first attempt fails
          if (window.location.hostname !== 'localhost') {
            console.log('Trying alternative service worker path...');
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
              .then(registration => {
                console.log('Alternative ServiceWorker registration successful');
              })
              .catch(error => {
                console.error('All ServiceWorker registration attempts failed:', error);
              });
          }
        });
    }, 1000); // 1 second delay
  });
}
