import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getSession, getCurrentUser } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/utils/auth-logger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getSession();
        
        if (error) {
          logAuthEvent('session_initialization_error', {}, error);
          console.error('Error checking authentication status:', error);
        } else if (data.session?.user) {
          logAuthEvent('session_initialized', { userId: data.session.user.id });
          setUser(data.session.user);
        } else {
          logAuthEvent('no_session_on_init');
        }
      } catch (error) {
        console.error('Exception during authentication status check:', error);
        logAuthEvent('session_init_exception', {}, error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      logAuthEvent('auth_state_change', { 
        event, 
        userId: session?.user?.id,
        hasUser: !!session?.user
      });
      
      console.log('Auth state change event:', event, session?.user?.id);
      
      // Handle specific auth events
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user);
          
          // For new users who just signed in with Google, show a welcome toast
          if (event === 'SIGNED_IN') {
            toast({
              title: 'Welcome to Duitr!',
              description: `You've successfully signed in with Google.`,
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        // Just update the user to make sure we have the latest data
        if (session?.user) {
          setUser(session.user);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting signup process...');
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: import.meta.env.MODE === 'production'
            ? 'https://duitr.my.id/auth/callback'
            : `${window.location.origin}/auth/callback`,
          data: {
            name: email.split('@')[0], // Use part of email as name
          }
        }
      });
      
      console.log('AuthContext: Signup result:', { error });
      
      if (error) {
        console.error('AuthContext: Signup error:', error);
        return { success: false, message: error.message };
      }
      
      return { 
        success: true, 
        message: 'Verification email sent! Please check your inbox.' 
      };
    } catch (error: any) {
      console.error('AuthContext: Exception during signup:', error);
      return { success: false, message: error.message || 'An error occurred during sign up' };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Logged in successfully!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'An error occurred during sign in' };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      logAuthEvent('auth_context_google_signin_start');
      setIsLoading(true);
      
      // This will redirect to Google - just handle UI state and potential errors
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: import.meta.env.MODE === 'production'
            ? 'https://duitr.my.id/auth/callback'
            : `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        logAuthEvent('auth_context_google_signin_error', {}, error);
        return { success: false, message: error.message };
      }
      
      logAuthEvent('auth_context_google_signin_redirect', { 
        url: data?.url,
        provider: data?.provider 
      });
      
      return { success: true, message: 'Redirecting to Google...' };
    } catch (error: any) {
      logAuthEvent('auth_context_google_signin_exception', {}, error);
      return { success: false, message: error.message || 'An error occurred during Google sign in' };
    } finally {
      // We don't set isLoading=false here because we're about to redirect
      // It will be reset when we come back from Google in the auth callback
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: error.message || 'An error occurred during sign out',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 