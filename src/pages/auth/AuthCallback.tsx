import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isIOS } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/utils/auth-logger';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const authProcessedRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if we're currently on a 404 page
  const is404Page = useRef(false);

  // Client-side only rendering to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    
    // Set a timeout to force navigate to login if we're stuck for too long
    const timeoutId = setTimeout(() => {
      if (loading && !error) {
        console.error('Auth callback timeout - forcing navigation to login');
        logAuthEvent('auth_callback_timeout');
        navigate('/auth/login');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  useEffect(() => {
    // Only run this effect on the client
    if (!isMounted) return;

    // Check for 404 indicators in the page content
    const is404 = document.title.includes('404') || 
                 document.body.textContent?.includes('NOT_FOUND') ||
                 window.location.href.includes('NOT_FOUND');
    
    is404Page.current = is404;
    
    if (is404) {
      logAuthEvent('detected_404_page', { url: window.location.href });
      // If we detect we're on a 404 page, try to recover by redirecting to the main callback URL
      if (window.location.pathname !== '/auth/callback') {
        window.location.href = import.meta.env.MODE === 'production'
          ? 'https://duitr.my.id/auth/callback'
          : `${window.location.origin}/auth/callback`;
      }
    }
  }, [isMounted]);
  
  // Define the function as a ref to avoid dependency issues
  const handleAuthCallbackRef = useRef<() => Promise<void>>(undefined);
  
  handleAuthCallbackRef.current = async () => {
    // Don't process auth more than once
    if (authProcessedRef.current) return;
    authProcessedRef.current = true;

    try {
      logAuthEvent('auth_callback_started', { 
        url: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
        pathname: window.location.pathname
      });
      
      // Handle auth callback
      const { data, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        logAuthEvent('auth_callback_error', { error: authError.message });
        throw authError;
      }
      
      if (data?.session) {
        // Success! We have a session
        handleSuccessfulLogin(data.session.user);
        return;
      } 
      
      // If we don't have a session, we need to process the URL parameters
      
      // First try the hash fragment (commonly used in implicit flow)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        logAuthEvent('processing_fragment_redirect');
        
        try {
          // Parse the hash fragment
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            logAuthEvent('found_access_token_in_hash', {
              token_length: accessToken.length,
              has_refresh: !!refreshToken
            });
            
            // Try to set the session with the tokens from the hash
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (sessionError) {
              logAuthEvent('set_session_error', { error: sessionError.message });
              throw sessionError;
            }
            
            if (sessionData?.session?.user) {
              handleSuccessfulLogin(sessionData.session.user);
              return;
            }
          }
        } catch (hashError: any) {
          console.error('Error processing hash redirect:', hashError);
          logAuthEvent('hash_redirect_error', { error: String(hashError) });
          
          // Continue to try other methods rather than throwing here
        }
      }
      
      // Next, try to process authorization code (PKCE flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        logAuthEvent('processing_code_redirect', { code_length: code.length });
        
        // Clear any previous PKCE data that might interfere
        try {
          sessionStorage.removeItem('supabase.auth.token.code_verifier');
        } catch (e) {
          // Ignore storage errors
        }
        
        try {
          // Exchange the authorization code for a session
          const { data: sessionData, error: exchangeError } = 
            await supabase.auth.exchangeCodeForSession(code);
            
          if (exchangeError) {
            logAuthEvent('exchange_code_error', { error: exchangeError.message });
            
            // Special handling for common error messages
            if (exchangeError.message.includes('code_verifier')) {
              throw new Error('Authentication failed: Missing or invalid code verifier. This might happen if you closed the browser during sign in. Please try again.');
            }
            
            throw exchangeError;
          }
          
          if (sessionData?.session?.user) {
            handleSuccessfulLogin(sessionData.session.user);
            return;
          } else {
            // This should rarely happen - we got a successful response but no session
            logAuthEvent('no_session_after_exchange', { data: sessionData });
            throw new Error('Authentication completed but no user session was created. Please try again.');
          }
        } catch (exchangeError: any) {
          console.error('Error exchanging code for session:', exchangeError);
          logAuthEvent('exchange_code_error', { error: exchangeError.message });
          
          if (retryCount < 2) {
            // Try one more time after a delay
            setRetryCount(prevCount => prevCount + 1);
            authProcessedRef.current = false;
            setTimeout(() => {
              handleAuthCallbackRef.current?.();
            }, 1000);
            return;
          }
          
          throw exchangeError;
        }
      } else {
        // No code parameter found - check if there's an error message from the OAuth provider
        const errorMsg = params.get('error_description') || params.get('error');
        
        if (errorMsg) {
          logAuthEvent('oauth_provider_error', { error: errorMsg });
          throw new Error(`Authentication error from provider: ${errorMsg}`);
        } else {
          // No code and no error - this is unusual
          logAuthEvent('no_code_parameter');
          throw new Error('No authentication code found in URL. Please try signing in again.');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err?.message || 'An unexpected authentication error occurred');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Only run the authentication logic on the client side
    if (!isMounted) return;
    
    // Start the auth process
    handleAuthCallbackRef.current?.();
    
    // Return a cleanup function
    return () => {
      authProcessedRef.current = true;
    };
  }, [isMounted]);
    
  const handleSuccessfulLogin = (user: any) => {
    logAuthEvent('authentication_success', { userId: user.id });
    
    // Don't show toast notification as we're disabling all toasts
    
    // Redirect to the dashboard
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  const handleManualRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    authProcessedRef.current = false;
    
    // Clear any stored PKCE data before retrying
    try {
      sessionStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token.code_verifier');
      localStorage.removeItem('supabase.auth.token');
    } catch (e) {
      // Ignore errors
    }
    
    // Try auth process again
    setTimeout(() => {
      handleAuthCallbackRef.current?.();
    }, 500);
  };

  const handleLoginRedirect = () => {
    // Clear any stored PKCE data before redirecting
    try {
      sessionStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token.code_verifier');
      localStorage.removeItem('supabase.auth.token');
    } catch (e) {
      // Ignore errors
    }
    
    navigate('/auth/login');
  };

  // If not mounted or waiting for client-side JS, show a simplified loading screen
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-[#7B61FF] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-[#7B61FF] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Completing authentication...</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Retrying... ({retryCount}/2)</p>
            )}
          </div>
        ) : error ? (
          <div className="space-y-4 text-red-500">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold">Authentication Error</h2>
            <p>{error}</p>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={handleManualRetry}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Try Again
              </button>
              <button 
                onClick={handleLoginRedirect}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7B61FF] hover:bg-[#6A4FD1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7B61FF]"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AuthCallback; 