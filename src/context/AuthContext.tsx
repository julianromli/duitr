import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getSession, getCurrentUser } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/utils/auth-logger';
import i18n from '@/i18n';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isBalanceHidden: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  updateBalanceVisibility: (isHidden: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const { toast } = useToast();

  const loadUserSettings = useCallback((currentUser: User | null) => {
    if (currentUser?.user_metadata?.is_balance_hidden !== undefined) {
      setIsBalanceHidden(currentUser.user_metadata.is_balance_hidden);
      logAuthEvent('user_settings_loaded', { isBalanceHidden: currentUser.user_metadata.is_balance_hidden });
    } else {
      setIsBalanceHidden(false);
      logAuthEvent('user_settings_defaulted', { isBalanceHidden: false });
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getSession();
        
        if (error) {
          logAuthEvent('session_initialization_error', {}, error);
          console.error('Error checking authentication status:', error);
          setUser(null);
        } else if (data.session?.user) {
          logAuthEvent('session_initialized', { userId: data.session.user.id });
          const currentUser = data.session.user;
          setUser(currentUser);
          loadUserSettings(currentUser);

          const preferredLanguage = localStorage.getItem('preferredLanguage');
          if (!preferredLanguage) {
            console.log('No preferred language found, setting default to id');
            logAuthEvent('setting_default_language', { userId: currentUser.id, lang: 'id' });
            i18n.changeLanguage('id');
            localStorage.setItem('preferredLanguage', 'id');
          }
        } else {
          logAuthEvent('no_session_on_init');
          setUser(null);
        }
      } catch (error) {
        console.error('Exception during authentication status check:', error);
        logAuthEvent('session_init_exception', {}, error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      logAuthEvent('auth_state_change', { 
        event, 
        userId: session?.user?.id,
        hasUser: !!session?.user
      });
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadUserSettings(currentUser);
      
      console.log('Auth state change event:', event, session?.user?.id);
      
      if (currentUser && event === 'SIGNED_IN') {
        const preferredLanguage = localStorage.getItem('preferredLanguage');
        if (!preferredLanguage) {
          console.log('No preferred language found after SIGNED_IN, setting default to id');
          logAuthEvent('setting_default_language_post_signin', { userId: currentUser.id, lang: 'id' });
          i18n.changeLanguage('id');
          localStorage.setItem('preferredLanguage', 'id');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsBalanceHidden(false);
      } else if (event === 'USER_UPDATED') {
         if (currentUser) {
            loadUserSettings(currentUser);
         }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast, loadUserSettings]);

  const updateBalanceVisibility = async (isHidden: boolean) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to change settings.' });
      return;
    }

    try {
      logAuthEvent('update_balance_visibility_attempt', { userId: user.id, isHidden });
      setIsBalanceHidden(isHidden);

      const { error } = await supabase.auth.updateUser({
        data: { is_balance_hidden: isHidden }
      });

      if (error) {
        logAuthEvent('update_balance_visibility_error', { userId: user.id }, error);
        setIsBalanceHidden(!isHidden);
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        throw error;
      }
      
      logAuthEvent('update_balance_visibility_success', { userId: user.id, isHidden });

    } catch (error) {
      console.error('Failed to update balance visibility:', error);
    }
  };

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
            name: email.split('@')[0],
          }
        }
      });
      
      console.log('AuthContext: Signup result:', { error });
      
      if (error) {
        console.error('AuthContext: Signup error:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true, message: i18n.t('auth.verification_sent') };
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
      
      return { success: true, message: '' };
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
      
      return { success: true, message: '' };
    } catch (error: any) {
      logAuthEvent('auth_context_google_signin_exception', {}, error);
      return { success: false, message: error.message || 'An error occurred during Google sign in' };
    } finally {
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: i18n.t('auth.signed_out_title'),
        description: i18n.t('auth.signed_out_description'),
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
    isBalanceHidden,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateBalanceVisibility,
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