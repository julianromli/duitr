import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and extract parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (!accessToken) {
          setError('No access token found in the URL');
          return;
        }
        
        // Set session using the access token
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        
        // Get user data to confirm successful login
        const { data, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          setError(userError.message);
          return;
        }
        
        if (data?.user) {
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