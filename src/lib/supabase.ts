import { createClient } from '@supabase/supabase-js';
import { logAuthEvent } from '@/utils/auth-logger';

// Use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxqluedeykgqmthzveiw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cWx1ZWRleWtncW10aHp2ZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDQxNjcsImV4cCI6MjA1ODU4MDE2N30.Lh08kodIf9QzggcjUP4mTc2axGFEtW8o9efDXRVNQ_E';

// Log for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10));

// Detect iOS devices
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Test direct API call method
export const testDirectSignup = async (email: string, password: string) => {
  // Create a new client using hardcoded credentials (just for testing)
  const directSupabase = createClient(
    'https://cxqluedeykgqmthzveiw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cWx1ZWRleWtncW10aHp2ZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDQxNjcsImV4cCI6MjA1ODU4MDE2N30.Lh08kodIf9QzggcjUP4mTc2axGFEtW8o9efDXRVNQ_E'
  );
  
  try {
    console.log('Testing direct signup with creds:', { url: 'https://cxqluedeykgqmthzveiw.supabase.co', keyFirstChars: 'eyJhbGciOi'});
    
    // Try first without email confirmation (for development)
    const { data, error } = await directSupabase.auth.signUp({
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
    
    console.log('Direct signup response:', { data, error });
    return { data, error };
  } catch (e) {
    console.error('Exception during direct signup test:', e);
    return { data: null, error: e };
  }
};

// Custom storage implementation to handle iOS Safari issues
const customStorage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      const value = localStorage.getItem(key);
      logAuthEvent('storage_get', { key, success: true });
      return Promise.resolve(value);
    } catch (error: any) {
      logAuthEvent('storage_get_error', { key }, error);
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
      logAuthEvent('storage_set', { key, success: true });
      return Promise.resolve();
    } catch (error: any) {
      logAuthEvent('storage_set_error', { key }, error);
      // Try using session storage as fallback for iOS
      try {
        sessionStorage.setItem(key, value);
      } catch (sessionError) {
        // Ignore if session storage also fails
      }
      return Promise.resolve();
    }
  },
  removeItem: (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
      logAuthEvent('storage_remove', { key, success: true });
      return Promise.resolve();
    } catch (error: any) {
      logAuthEvent('storage_remove_error', { key }, error);
      return Promise.resolve();
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: customStorage,
    storageKey: 'supabase_auth_token',
    debug: isIOS(), // Enable debug mode on iOS devices
  },
  global: {
    headers: {
      'x-client-info': `duitr/${isIOS() ? 'ios' : 'web'}`
    }
  }
});

// Helper functions for authentication
export const signUpWithEmail = async (email: string, password: string) => {
  console.log('Starting signUpWithEmail from helper function');
  const { data, error } = await supabase.auth.signUp({
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
  console.log('signUpWithEmail result:', { data, error });
  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  // Set a clean redirect URL without any parameters that might cause issues
  const redirectTo = import.meta.env.MODE === 'production' 
    ? 'https://duitr.my.id/auth/callback'
    : `${window.location.origin}/auth/callback`;
  
  // Log device info
  const deviceInfo = {
    redirectTo,
    isIOS: isIOS(),
    userAgent: navigator.userAgent,
    platform: navigator.platform
  };
  
  logAuthEvent('google_sign_in_initiated', deviceInfo);
  
  // Clear any existing auth data to prevent conflicts
  try {
    sessionStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token.code_verifier');
    localStorage.removeItem('supabase.auth.token');
  } catch (e) {
    // Ignore storage errors
    logAuthEvent('storage_clear_error', {}, e);
  }
  
  // Configure sign in options
  const options = {
    redirectTo,
    queryParams: {
      // Request refresh token
      access_type: 'offline',
      // Force consent screen
      prompt: 'consent',
      // Include profile info 
      include_profile: 'true',
    } as Record<string, string>
  };
  
  // For iOS, we need special handling
  if (isIOS()) {
    // Make sure these are set exactly as Supabase expects them
    options.queryParams.response_mode = 'query';
    // Don't add extra parameters that might break the flow
  }
  
  // Generate new PKCE verifier to ensure we don't reuse an old one
  try {
    // First try to generate a unique state parameter to help with debugging
    const stateParam = `duitr_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    options.queryParams.state = stateParam;
    
    logAuthEvent('google_sign_in_with_options', { 
      options, 
      state: stateParam,
      storage_available: typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined'
    });
  } catch (e) {
    logAuthEvent('pkce_setup_error', {}, e);
  }
  
  // Initiate sign in
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options
    });
    
    // Log the result
    logAuthEvent('google_sign_in_response', { 
      url: data?.url,
      provider: data?.provider,
      hasError: !!error
    }, error);
    
    return { data, error };
  } catch (error: any) {
    logAuthEvent('google_sign_in_exception', {}, error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}; 