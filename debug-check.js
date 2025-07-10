// Debug script to check for common issues
console.log('=== DEBUGGING DUITR APPLICATION ===');

// Check environment variables
console.log('Environment Variables:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));

// Check if Supabase client is working
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  console.log('Supabase client created successfully');
  
  // Test basic connection
  const { data, error } = await supabase.from('categories').select('count').limit(1);
  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('Supabase connection successful');
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
}

// Check React and other dependencies
console.log('React version:', React?.version || 'Not found');
console.log('Current URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);

console.log('=== END DEBUG ===');