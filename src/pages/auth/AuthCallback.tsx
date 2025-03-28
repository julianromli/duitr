import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/utils/auth-logger';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      logAuthEvent('callback_started');
      
      try {
        // Check if we have a session in the URL
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        logAuthEvent('session_check', sessionData, sessionError);
        
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        
        // If we don't have a session yet, try to exchange the auth code for a session
        if (!sessionData?.session) {
          logAuthEvent('no_session_attempting_code_exchange');
          // This handles the PKCE flow where we get an auth code in the URL
          const url = window.location.href;
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
          logAuthEvent('code_exchange_result', data, exchangeError);
          
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
          
          if (!data.session) {
            setError('No session established after code exchange');
            return;
          }
        }
        
        // Get user data to confirm successful login
        const { data, error: userError } = await supabase.auth.getUser();
        logAuthEvent('user_fetch_result', data, userError);
        
        if (userError) {
          setError(userError.message);
          return;
        }
        
        if (data?.user) {
          logAuthEvent('authentication_success', { userId: data.user.id });
          
          toast({
            title: 'Success!',
            description: 'You have successfully signed in.',
          });
          
          // Redirect to the dashboard
          setTimeout(() => {
            navigate('/');
          }, 500);
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

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-[#7B61FF] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg font-medium text-gray-700">Completing authentication...</p>
          </div>
        ) : error ? (
          <div className="space-y-4 text-red-500">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold">Authentication Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/auth/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7B61FF] hover:bg-[#6A4FD1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7B61FF]"
            >
              Back to Login
            </button>
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