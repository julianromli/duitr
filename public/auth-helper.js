/**
 * Auth Helper for iOS devices
 * 
 * This script helps to manage authentication tokens and sessions on iOS devices.
 * It addresses some of the common issues with authentication on Safari/iOS.
 */

// Enhanced console logging
function logDebug(message, data = {}) {
  console.log(`[Auth Helper] ${message}`, data);
}

// Function to safely store auth data for iOS
function storeAuthData(key, data) {
  try {
    // Try localStorage first
    localStorage.setItem(key, JSON.stringify(data));
    logDebug('Successfully stored auth data in localStorage');
    return true;
  } catch (e) {
    console.error('[Auth Helper] localStorage error:', e);
    
    // Fallback to sessionStorage if localStorage fails
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      logDebug('Successfully stored auth data in sessionStorage');
      return true;
    } catch (sessionError) {
      console.error('[Auth Helper] sessionStorage error:', sessionError);
      return false;
    }
  }
}

// Function to retrieve auth data
function getAuthData(key) {
  let data = null;
  
  // Try localStorage first
  try {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      data = JSON.parse(storedData);
      logDebug('Retrieved auth data from localStorage');
    }
  } catch (e) {
    console.error('[Auth Helper] Error retrieving from localStorage:', e);
  }
  
  // Try sessionStorage if localStorage failed
  if (!data) {
    try {
      const storedData = sessionStorage.getItem(key);
      if (storedData) {
        data = JSON.parse(storedData);
        logDebug('Retrieved auth data from sessionStorage');
      }
    } catch (e) {
      console.error('[Auth Helper] Error retrieving from sessionStorage:', e);
    }
  }
  
  return data;
}

// Check if we're on a 404 error page
function is404Page() {
  const has404InTitle = document.title.includes('404');
  const has404InHTML = document.documentElement.innerHTML.includes('NOT_FOUND');
  const has404InURL = window.location.href.includes('NOT_FOUND');
  
  logDebug(`404 check: title=${has404InTitle}, html=${has404InHTML}, url=${has404InURL}`);
  
  return has404InTitle || has404InHTML || has404InURL;
}

// Recover from 404 page by redirecting to the correct auth callback
function recoverFrom404() {
  logDebug('Detected 404 page, attempting recovery');
  
  // Store the fact that we detected a 404
  try {
    sessionStorage.setItem('auth_recovery_from_404', 'true');
    
    // Get the original auth code if present
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (code) {
      sessionStorage.setItem('auth_recovery_code', code);
      if (state) {
        sessionStorage.setItem('auth_recovery_state', state);
      }
      logDebug('Stored auth code and state from 404 page', { code: code.substring(0, 5) + '...', hasState: !!state });
    }
  } catch (e) {
    // Ignore storage errors
    console.error('[Auth Helper] Error storing recovery data:', e);
  }
  
  // Redirect to the correct callback URL
  const callbackUrl = window.location.hostname.includes('duitr.my.id')
    ? 'https://www.duitr.my.id/auth/callback'  // Use www subdomain for consistency
    : `${window.location.origin}/auth/callback`;
    
  logDebug('Redirecting to correct callback URL', { callbackUrl });
    
  // Add the code from the current URL if available
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    window.location.href = `${callbackUrl}?code=${encodeURIComponent(code)}`;
  } else {
    window.location.href = callbackUrl;
  }
}

// Process auth callback parameters from URL
function processAuthCallback() {
  logDebug('Processing auth callback');
  
  // Check if we're on a 404 error page
  if (is404Page()) {
    recoverFrom404();
    return;
  }
  
  // Check if this is a recovery from a previous 404
  let isRecovery = false;
  try {
    isRecovery = sessionStorage.getItem('auth_recovery_from_404') === 'true';
    if (isRecovery) {
      logDebug('This is a recovery from a previous 404');
      // Use the stored code if we don't have one in the URL
      const params = new URLSearchParams(window.location.search);
      if (!params.get('code')) {
        const recoveryCode = sessionStorage.getItem('auth_recovery_code');
        if (recoveryCode) {
          logDebug('Using recovery code from storage');
          // Add code to URL without navigation 
          if (!window.location.search.includes('code=')) {
            const newUrl = `${window.location.pathname}?code=${encodeURIComponent(recoveryCode)}`;
            window.history.replaceState({}, '', newUrl);
          }
        }
      }
    }
  } catch (e) {
    // Ignore storage errors
    console.error('[Auth Helper] Error checking recovery status:', e);
  }
  
  // Check if URL contains auth parameters
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(url.hash.substring(1));
  
  // Look for auth code or tokens
  const accessToken = params.get('access_token') || hashParams.get('access_token');
  const refreshToken = params.get('refresh_token') || hashParams.get('refresh_token');
  const expiresAt = params.get('expires_at') || hashParams.get('expires_at');
  const authCode = params.get('code');
  
  logDebug('URL params:', { 
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasExpiresAt: !!expiresAt,
    hasAuthCode: !!authCode,
    search: url.search,
    hash: url.hash,
    isRecovery,
    currentUrl: window.location.href
  });
  
  // Save any code we found to help with the exchange
  if (authCode) {
    try {
      sessionStorage.setItem('supabase_auth_code', authCode);
      logDebug('Auth code stored');
      
      // Check for state
      const state = params.get('state');
      if (state) {
        sessionStorage.setItem('supabase_auth_state', state);
        logDebug('Auth state stored');
      }
      
      // Signal the main app
      window.dispatchEvent(new CustomEvent('auth_code_detected', {
        detail: { code: authCode, state }
      }));
      
      logDebug('Dispatched auth_code_detected event');
    } catch (e) {
      console.error('[Auth Helper] Error storing auth code:', e);
    }
  }
  
  // Store any token data we found
  if (accessToken) {
    storeAuthData('supabase.auth.token', {
      access_token: accessToken,
      refresh_token: refreshToken || '',
      expires_at: expiresAt ? parseInt(expiresAt) : 0
    });
    
    // Signal the main app that we have stored the token
    window.dispatchEvent(new CustomEvent('auth_tokens_stored', {
      detail: { accessToken }
    }));
    
    logDebug('Stored tokens and dispatched event');
  }
}

// When in an iframe, try to communicate with parent
function setupIframeCommunication() {
  if (window !== window.parent) {
    console.log('[Auth Helper] Running in iframe, setting up communication');
    
    // Listen for messages from parent
    window.addEventListener('message', function(event) {
      const data = event.data;
      
      if (data && data.type === 'AUTH_GET_CODE') {
        const authCode = new URLSearchParams(window.location.search).get('code');
        
        if (authCode) {
          // Send code back to parent
          window.parent.postMessage({
            type: 'AUTH_CODE',
            code: authCode,
            url: window.location.href
          }, '*');
          console.log('[Auth Helper] Sent auth code to parent');
        }
      }
    });
    
    // Notify parent we're ready
    window.parent.postMessage({ type: 'AUTH_HELPER_READY' }, '*');
  }
}

// Initialize helper when the page loads
window.addEventListener('load', function() {
  console.log('[Auth Helper] Initialized');
  
  // Check if we're on a 404 page first - even if not a callback
  if (is404Page() && window.location.search.includes('code=')) {
    recoverFrom404();
    return;
  }
  
  // Check if we're on an auth callback page
  if (window.location.pathname.includes('/auth/callback')) {
    // Mark that we're going through authentication to prevent update notifications
    try {
      sessionStorage.setItem('just_authenticated', 'true');
      console.log('[Auth Helper] Marked user as just authenticated');
      
      // Set a timeout to clear this flag after 30 seconds
      setTimeout(() => {
        sessionStorage.removeItem('just_authenticated');
        console.log('[Auth Helper] Cleared just authenticated flag');
      }, 30000);
    } catch (e) {
      console.error('[Auth Helper] Error setting authentication flag:', e);
    }
    
    processAuthCallback();
    setupIframeCommunication();
  }
});

// Listen for auth events
window.addEventListener('auth_token_required', function() {
  const tokenData = getAuthData('supabase.auth.token');
  if (tokenData) {
    window.dispatchEvent(new CustomEvent('auth_token_provided', {
      detail: tokenData
    }));
    console.log('[Auth Helper] Provided stored token');
  }
});