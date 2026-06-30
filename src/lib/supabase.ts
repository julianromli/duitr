import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { bootstrapNeonClientOnClient, ensureNeonClient, getNeonClient } from '@/lib/neon';
import { isNeonProvider } from '@/lib/database-provider';
import { getAuthCallbackUrl } from '@/config/auth-routes';
import { logAuthEvent } from '@/utils/auth-logger';
import { shouldWarnAboutGoogleOAuth, logWebViewDetection } from '@/utils/webview-detection';

// Use environment variables - fail fast if not provided (legacy Supabase only)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect iOS devices
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
      try {
        sessionStorage.setItem(key, value);
      } catch {
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
  },
};

function createLegacySupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
    );
  }

  // Log for debugging (only show first 10 chars for security)
  if (import.meta.env.DEV) {
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10));
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: customStorage,
      storageKey: isNeonProvider() ? 'neon_auth_token' : 'supabase_auth_token',
      debug: isIOS(),
    },
    global: {
      headers: {
        'x-client-info': `duitr/${isIOS() ? 'ios' : 'web'}`,
      },
    },
  });
}

type AppDatabaseClient = SupabaseClient | ReturnType<typeof createLegacySupabaseClient> | ReturnType<typeof getNeonClient>;

let clientInstance: AppDatabaseClient | null = null;
let clientPromise: Promise<AppDatabaseClient> | null = null;

const ssrAuthStub = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
  },
};

async function resolveSupabaseClient(): Promise<AppDatabaseClient> {
  if (clientInstance) return clientInstance;
  if (!clientPromise) {
    clientPromise = (async () => {
      if (isNeonProvider()) {
        clientInstance = await ensureNeonClient();
      } else {
        clientInstance = createLegacySupabaseClient();
      }
      return clientInstance;
    })();
  }
  return clientPromise;
}

function getSupabaseClient(): AppDatabaseClient {
  if (import.meta.env.SSR) {
    return ssrAuthStub as AppDatabaseClient;
  }
  if (!clientInstance) {
    if (isNeonProvider()) {
      return getNeonClient();
    }
    clientInstance = createLegacySupabaseClient();
  }
  return clientInstance;
}

bootstrapNeonClientOnClient();

/** Lazy singleton — avoids Workers global-scope init during module import */
export const supabase = new Proxy({} as AppDatabaseClient, {
  get(_target, prop) {
    if (!import.meta.env.SSR && !clientInstance) {
      void resolveSupabaseClient();
    }
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Re-export Neon client alias for code that imports client directly during migration
export { getNeonClient as client } from '@/lib/neon';

// Helper functions for authentication
export const signUpWithEmail = async (email: string, password: string) => {
  console.log('Starting signUpWithEmail from helper function');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
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
  // Check if we're in a WebView or in-app browser
  const shouldWarn = shouldWarnAboutGoogleOAuth();
  
  if (shouldWarn) {
    // Log the WebView detection
    logWebViewDetection({ 
      action: 'google_oauth_blocked',
      context: 'sign_in_with_google'
    });
    
    // Return error instead of proceeding
    const error = new Error(
      'Google OAuth is not supported in in-app browsers. Please open this page in your default browser (Safari/Chrome).'
    );
    
    logAuthEvent('google_sign_in_blocked_webview', { 
      reason: 'in_app_browser_detected' 
    });
    
    return { 
      data: null, 
      error,
      isWebViewBlocked: true 
    };
  }
  
  // Set a clean redirect URL without any parameters that might cause issues
  const redirectTo = getAuthCallbackUrl();
  
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
    
    return { data, error, isWebViewBlocked: false };
  } catch (error: any) {
    logAuthEvent('google_sign_in_exception', {}, error);
    return { data: null, error, isWebViewBlocked: false };
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
  const client = await resolveSupabaseClient();
  const { data, error } = await client.auth.getSession();
  return { data, error };
}; 