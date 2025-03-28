/**
 * Auth-related logging utilities
 */

import { isIOS } from '@/lib/supabase';

export const logAuthEvent = (eventName: string, data: any = {}, error: any = null) => {
  // Style for better visibility in debug tools
  const styles = {
    group: 'color: #7B61FF; font-weight: bold; font-size: 12px;',
    success: 'color: #10B981; font-weight: bold;',
    error: 'color: #EF4444; font-weight: bold;',
    info: 'color: #3B82F6; font-style: italic;',
    ios: 'background: #FF9500; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;'
  };
  
  // Add iOS tag for iOS-specific debugging
  const iosPrefix = isIOS() ? `%c[iOS] ` : '';
  const iosStyle = isIOS() ? styles.ios : '';
  
  console.group(`%c🔐 Auth Event: ${eventName}`, styles.group);
  
  if (iosPrefix) {
    console.log(iosPrefix + 'Running on iOS device', iosStyle);
  }
  
  if (Object.keys(data).length > 0) {
    console.log('%cData:', styles.info, data);
  }
  
  if (error) {
    console.error('%cError:', styles.error, error);
  }
  
  // Log URL parameters for debugging OAuth flows
  if (eventName.includes('callback') || eventName.includes('redirect')) {
    const url = window.location.href;
    const urlObj = new URL(url);
    
    console.log('%cFull URL:', styles.info, url);
    console.log('%cPath:', styles.info, urlObj.pathname);
    
    // Log query params
    const searchParams = Object.fromEntries(urlObj.searchParams.entries());
    if (Object.keys(searchParams).length > 0) {
      console.log('%cSearch params:', styles.info, searchParams);
      
      // Special attention to auth code
      if (searchParams.code) {
        console.log('%cFound auth code in URL query!', styles.success);
      }
    }
    
    // Log hash params
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      const hashParamsObj = Object.fromEntries(hashParams.entries());
      
      if (Object.keys(hashParamsObj).length > 0) {
        console.log('%cHash params:', styles.info, hashParamsObj);
        
        // Special attention to auth tokens
        if (hashParamsObj.access_token) {
          console.log('%cFound access token in URL hash!', styles.success);
        }
      }
    }
    
    // Log cookies for debugging (but not the actual values for security)
    if (document.cookie) {
      const cookieNames = document.cookie.split(';').map(c => c.trim().split('=')[0]);
      console.log('%cCookies present:', styles.info, cookieNames);
    }
  }
  
  // Store logs to sessionStorage for later retrieval
  try {
    const logKey = `auth_log_${Date.now()}`;
    const logData = { 
      event: eventName, 
      timestamp: new Date().toISOString(),
      data, 
      error: error ? error.message || String(error) : null,
      userAgent: navigator.userAgent
    };
    sessionStorage.setItem(logKey, JSON.stringify(logData));
  } catch (e) {
    // Ignore storage errors
  }
  
  console.groupEnd();
};

export default logAuthEvent; 