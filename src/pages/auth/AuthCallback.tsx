import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isIOS } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/utils/auth-logger';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const authProcessedRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Define the function as a ref to avoid dependency issues
  const handleAuthCallbackRef = useRef<() => Promise<void>>();
  
  // Implement the auth callback logic
  handleAuthCallbackRef.current = async () => {
    if (authProcessedRef.current) return;
    authProcessedRef.current = true;
    
    // Log detailed device information for debugging
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isIOS: isIOS(),
      url: window.location.href,
      hasFragment: window.location.hash.length > 0,
      hasQuery: window.location.search.length > 0
    };
    
    logAuthEvent('callback_started', deviceInfo);
    
    try {
      // For iOS devices, try a slightly different approach
      if (isIOS()) {
        logAuthEvent('ios_specific_flow_started');
        
        // First, try exchanging the code directly
        try {
          const url = window.location.href;
          logAuthEvent('ios_url_before_exchange', { url });
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
          logAuthEvent('ios_code_exchange_result', data, exchangeError);
          
          if (!exchangeError && data?.session) {
            // Successfully got session, proceed with user data
            const { data: userData, error: userError } = await supabase.auth.getUser();
            logAuthEvent('ios_user_fetch_result', userData, userError);
            
            if (!userError && userData?.user) {
              handleSuccessfulLogin(userData.user);
              return;
            }
          }
        } catch (iosExchangeError) {
          logAuthEvent('ios_exchange_exception', {}, iosExchangeError);
          // Continue to normal flow if iOS-specific approach fails
        }
      }

      // Regular flow - first check if we already have a session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      logAuthEvent('session_check', sessionData, sessionError);
      
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      
      // If we have a session, we're already logged in
      if (sessionData?.session) {
        logAuthEvent('existing_session_found', { 
          userId: sessionData.session.user.id,
          expiresAt: sessionData.session.expires_at
        });
        
        // Get user data and proceed
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError && userData?.user) {
          handleSuccessfulLogin(userData.user);
          return;
        }
      }
      
      // No session yet, try to exchange the auth code
      logAuthEvent('no_session_attempting_code_exchange');
      const url = window.location.href;
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
      logAuthEvent('code_exchange_result', data, exchangeError);
      
      if (exchangeError) {
        if (retryCount < 2) {
          // Sometimes the first attempt fails, especially on iOS, so retry
          logAuthEvent('retrying_code_exchange', { retryCount: retryCount + 1 });
          setRetryCount(prev => prev + 1);
          authProcessedRef.current = false;
          
          // Slight delay before retry
          setTimeout(() => {
            handleAuthCallbackRef.current?.();
          }, 1000);
          return;
        }
        
        setError(exchangeError.message);
        return;
      }
      
      if (!data.session) {
        setError('No session established after code exchange');
        return;
      }
      
      // Get user data to confirm successful login
      const { data: userData, error: userError } = await supabase.auth.getUser();
      logAuthEvent('user_fetch_result', userData, userError);
      
      if (userError) {
        setError(userError.message);
        return;
      }
      
      if (userData?.user) {
        handleSuccessfulLogin(userData.user);
      } else {
        setError('Failed to retrieve user information');
      }
    } catch (err: any) {
      logAuthEvent('callback_exception', {}, err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Listen for events from the auth helper
  useEffect(() => {
    const handleTokensStored = (event: any) => {
      logAuthEvent('tokens_stored_by_helper', event.detail);
      if (!authProcessedRef.current) {
        handleAuthCallbackRef.current?.();
      }
    };

    window.addEventListener('auth_tokens_stored', handleTokensStored);
    
    return () => {
      window.removeEventListener('auth_tokens_stored', handleTokensStored);
    };
  }, []);

  useEffect(() => {
    // Start the auth process
    handleAuthCallbackRef.current?.();
  }, [navigate, toast, retryCount]);
    
  const handleSuccessfulLogin = (user: any) => {
    logAuthEvent('authentication_success', { userId: user.id });
    
    toast({
      title: 'Success!',
      description: 'You have successfully signed in.',
    });
    
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
    
    // Try auth process again
    setTimeout(() => {
      handleAuthCallbackRef.current?.();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-[#7B61FF] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg font-medium text-gray-700">Completing authentication...</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500">Retrying... ({retryCount}/2)</p>
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
                onClick={() => navigate('/auth/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7B61FF] hover:bg-[#6A4FD1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7B61FF]"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-green-500">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">Successfully Authenticated</h2>
            <p className="text-gray-600">Redirecting you to the dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 