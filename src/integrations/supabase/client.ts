// Re-export lazy client from the app entrypoint (Cloudflare Workers–safe).
export { supabase } from '@/lib/supabase';
export type { Database } from './types';
