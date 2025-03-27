import { createClient } from '@supabase/supabase-js';

// Use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxqluedeykgqmthzveiw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cWx1ZWRleWtncW10aHp2ZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDQxNjcsImV4cCI6MjA1ODU4MDE2N30.Lh08kodIf9QzggcjUP4mTc2axGFEtW8o9efDXRVNQ_E';

// Log for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10));

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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions for authentication
export const signUpWithEmail = async (email: string, password: string) => {
  console.log('Starting signUpWithEmail from helper function');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: import.meta.env.MODE === 'production' 
        ? 'https://duitr.my.id/auth/callback'
        : `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
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