/**
 * Splash Screen Configuration
 * 
 * This file allows you to customize the splash screen that appears
 * when the app is loading.
 */

// Configuration object for the splash screen
window.splashConfig = {
  // Minimum time to display splash screen in milliseconds
  minDisplayTime: 1500,
  
  // Maximum time to display splash screen before hiding it anyway
  maxDisplayTime: 5000,
  
  // Path to the logo image (null uses the default)
  // Example: '/custom-logo.svg' or '/custom-logo.png'
  logoPath: '/splash-logo.svg',
  
  // Background color for the splash screen (CSS color)
  backgroundColor: '#0D0D0D',
  
  // Logo container background color (CSS color)
  logoBackgroundColor: '#C6FE1E',
  
  // Text color for the app name (CSS color)
  textColor: '#FFFFFF',
  
  // App name to display (set to null to hide)
  appName: 'Duitr',
  
  // Custom CSS styles (optional)
  // Format: { 'selector': { property: value, ... }, ... }
  customStyles: null
};

// Apply custom styles if provided
document.addEventListener('DOMContentLoaded', function() {
  const splashScreen = document.getElementById('splash-screen');
  const logoContainer = document.getElementById('splash-logo-container');
  const appTitle = document.getElementById('splash-title');
  
  // Apply custom background colors
  if (window.splashConfig.backgroundColor) {
    splashScreen.style.backgroundColor = window.splashConfig.backgroundColor;
  }
  
  if (window.splashConfig.logoBackgroundColor) {
    logoContainer.style.backgroundColor = window.splashConfig.logoBackgroundColor;
  }
  
  // Apply custom text color and app name
  if (appTitle) {
    if (window.splashConfig.textColor) {
      appTitle.style.color = window.splashConfig.textColor;
    }
    
    if (window.splashConfig.appName === null) {
      appTitle.style.display = 'none';
    } else if (window.splashConfig.appName) {
      appTitle.textContent = window.splashConfig.appName;
    }
  }
  
  // Apply any additional custom styles
  if (window.splashConfig.customStyles) {
    for (const selector in window.splashConfig.customStyles) {
      const elements = document.querySelectorAll(selector);
      const styles = window.splashConfig.customStyles[selector];
      
      elements.forEach(element => {
        for (const property in styles) {
          element.style[property] = styles[property];
        }
      });
    }
  }
}); 