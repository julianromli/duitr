/**
 * Auth types shared across Neon (SupabaseAuthAdapter) and legacy Supabase clients.
 * The Supabase-compatible adapter returns the same session/user shapes.
 */
export type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
