/**
 * Auth Helper for iOS devices
 * 
 * This script helps to manage authentication tokens and sessions on iOS devices.
 * It addresses some of the common issues with authentication on Safari/iOS.
 */

// Function to safely store auth data for iOS
function storeAuthData(key, data) {
  try {
    // Try localStorage first
    localStorage.setItem(key, JSON.stringify(data));
    console.log('[Auth Helper] Successfully stored auth data in localStorage');
    return true;
  } catch (e) {
    console.error('[Auth Helper] localStorage error:', e);
    
    // Fallback to sessionStorage if localStorage fails
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      console.log('[Auth Helper] Successfully stored auth data in sessionStorage');
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
      console.log('[Auth Helper] Retrieved auth data from localStorage');
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
        console.log('[Auth Helper] Retrieved auth data from sessionStorage');
      }
    } catch (e) {
      console.error('[Auth Helper] Error retrieving from sessionStorage:', e);
    }
  }
  
  return data;
}

// Process auth callback parameters from URL
function processAuthCallback() {
  console.log('[Auth Helper] Processing auth callback');
  
  // Check if URL contains auth parameters
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(url.hash.substring(1));
  
  // Look for auth tokens in various places
  const accessToken = params.get('access_token') || hashParams.get('access_token');
  const refreshToken = params.get('refresh_token') || hashParams.get('refresh_token');
  const expiresAt = params.get('expires_at') || hashParams.get('expires_at');
  const authCode = params.get('code');
  
  console.log('[Auth Helper] URL params:', { 
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasExpiresAt: !!expiresAt,
    hasAuthCode: !!authCode,
    search: url.search,
    hash: url.hash
  });
  
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
    
    console.log('[Auth Helper] Stored tokens and dispatched event');
  }
  
  // Store auth code if present
  if (authCode) {
    storeAuthData('supabase.auth.code', { code: authCode });
    console.log('[Auth Helper] Stored auth code');
  }
}

// Initialize helper when the page loads
window.addEventListener('load', function() {
  console.log('[Auth Helper] Initialized');
  
  // Check if we're on an auth callback page
  if (window.location.pathname.includes('/auth/callback')) {
    processAuthCallback();
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