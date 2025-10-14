// WebView Detection Utility
// Detects if the app is running in an embedded WebView or in-app browser
// Google blocks OAuth in WebViews for security reasons

/**
 * Detects if the current browser is an embedded WebView
 * @returns true if running in a WebView
 */
export const isWebView = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for WebView indicators
  const webViewIndicators = [
    'WebView',
    'wv',
    'Android.*Version/.*Chrome',
    'Linux; U; Android',
  ];
  
  return webViewIndicators.some(indicator => 
    new RegExp(indicator, 'i').test(userAgent)
  );
};

/**
 * Detects if the current browser is an in-app browser
 * @returns object with detection result and browser name
 */
export const isInAppBrowser = (): { isInApp: boolean; browser: string | null; platform: string } => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for common in-app browsers
  const inAppBrowsers = [
    { pattern: /FBAN|FBAV/i, name: 'Facebook' },
    { pattern: /Instagram/i, name: 'Instagram' },
    { pattern: /WhatsApp/i, name: 'WhatsApp' },
    { pattern: /Twitter/i, name: 'Twitter' },
    { pattern: /Line\//i, name: 'Line' },
    { pattern: /Snapchat/i, name: 'Snapchat' },
    { pattern: /LinkedIn/i, name: 'LinkedIn' },
    { pattern: /Telegram/i, name: 'Telegram' },
    { pattern: /FB_IAB/i, name: 'Facebook In-App' },
    { pattern: /KAKAOTALK/i, name: 'KakaoTalk' },
    { pattern: /WeChat/i, name: 'WeChat' },
  ];
  
  for (const browser of inAppBrowsers) {
    if (browser.pattern.test(userAgent)) {
      return {
        isInApp: true,
        browser: browser.name,
        platform: getOperatingSystem(),
      };
    }
  }
  
  return {
    isInApp: false,
    browser: null,
    platform: getOperatingSystem(),
  };
};

/**
 * Detects the operating system
 * @returns OS name
 */
export const getOperatingSystem = (): string => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'iOS';
  }
  
  if (/Win/i.test(userAgent)) {
    return 'Windows';
  }
  
  if (/Mac/i.test(userAgent)) {
    return 'macOS';
  }
  
  if (/Linux/i.test(userAgent)) {
    return 'Linux';
  }
  
  return 'Unknown';
};

/**
 * Checks if we should warn the user about Google OAuth limitations
 * @returns true if we should show a warning
 */
export const shouldWarnAboutGoogleOAuth = (): boolean => {
  const inAppCheck = isInAppBrowser();
  const webViewCheck = isWebView();
  
  // Warn if in in-app browser or WebView
  return inAppCheck.isInApp || webViewCheck;
};

/**
 * Gets browser-specific instructions for the user
 * @returns Instruction string
 */
export const getBrowserInstructions = (): string => {
  const inAppCheck = isInAppBrowser();
  const platform = inAppCheck.platform;
  
  if (inAppCheck.isInApp && inAppCheck.browser) {
    // Specific instructions for each in-app browser
    switch (inAppCheck.browser) {
      case 'Instagram':
        return platform === 'iOS'
          ? 'Tap the three dots (•••) at the top right, then select "Open in Safari"'
          : 'Tap the three dots (⋮) at the top right, then select "Open in browser"';
      
      case 'Facebook':
        return platform === 'iOS'
          ? 'Tap the three dots (•••) at the bottom, then select "Open in Safari"'
          : 'Tap the three dots (⋮) at the top right, then select "Open in browser"';
      
      case 'WhatsApp':
        return platform === 'iOS'
          ? 'Tap the share icon, then select "Open in Safari"'
          : 'Tap the three dots (⋮) at the top right, then select "Open in browser"';
      
      case 'Twitter':
        return 'Tap the share icon, then select "Open in browser"';
      
      default:
        return platform === 'iOS'
          ? 'Look for "Open in Safari" in the menu options'
          : 'Look for "Open in browser" in the menu options';
    }
  }
  
  // Generic WebView instructions
  if (platform === 'iOS') {
    return 'Please open this page in Safari';
  } else if (platform === 'Android') {
    return 'Please open this page in Chrome or your default browser';
  }
  
  return 'Please open this page in your default browser';
};

/**
 * Gets the shareable authentication URL
 * @returns Current page URL
 */
export const getShareableAuthUrl = (): string => {
  return window.location.href;
};

/**
 * Attempts to open the current page in the external browser
 * @returns true if successful
 */
export const openInExternalBrowser = (): boolean => {
  try {
    const url = getShareableAuthUrl();
    
    // Try to open in a new window/tab
    // Using _blank should trigger the external browser on most mobile systems
    const newWindow = window.open(url, '_blank');
    
    // Check if the window was opened successfully
    if (newWindow) {
      return true;
    }
    
    // Fallback: try to change location
    window.location.href = url;
    return true;
  } catch (error) {
    console.error('Failed to open in external browser:', error);
    return false;
  }
};

/**
 * Copies the current URL to clipboard
 * @returns Promise that resolves to true if successful
 */
export const copyAuthUrlToClipboard = async (): Promise<boolean> => {
  try {
    const url = getShareableAuthUrl();
    
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Failed to copy URL to clipboard:', error);
    return false;
  }
};

/**
 * Logs WebView detection event for analytics/debugging
 * @param additionalData Additional context to log
 */
export const logWebViewDetection = (additionalData?: Record<string, any>): void => {
  const inAppCheck = isInAppBrowser();
  const webViewCheck = isWebView();
  
  const logData = {
    isWebView: webViewCheck,
    isInAppBrowser: inAppCheck.isInApp,
    browserName: inAppCheck.browser,
    platform: inAppCheck.platform,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };
  
  console.log('[WebView Detection]', logData);
  
  // You can send this to your analytics service
  // Example: analytics.track('webview_detected', logData);
};
