-- Fix function search path security vulnerabilities
-- This migration adds SET search_path = '' to all functions to prevent search path attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Since we need to modify existing functions, we'll use ALTER FUNCTION to add the search_path setting
-- This approach is safer as it doesn't require knowing the exact function signatures

-- Fix log_migration_error function
ALTER FUNCTION public.log_migration_error SET search_path = '';

-- Fix verify_budget_category_id function
ALTER FUNCTION public.verify_budget_category_id SET search_path = '';

-- Fix set_default_category_for_transaction function
ALTER FUNCTION public.set_default_category_for_transaction SET search_path = '';

-- Fix set_default_category_for_budget function
ALTER FUNCTION public.set_default_category_for_budget SET search_path = '';

-- Fix verify_category_id function
ALTER FUNCTION public.verify_category_id SET search_path = '';

-- Fix delete_transfer_transaction function
ALTER FUNCTION public.delete_transfer_transaction SET search_path = '';

-- Add comments for documentation
COMMENT ON FUNCTION public.log_migration_error IS 'Function updated with secure search path to prevent search path vulnerabilities';
COMMENT ON FUNCTION public.verify_budget_category_id IS 'Function updated with secure search path to prevent search path vulnerabilities';
COMMENT ON FUNCTION public.set_default_category_for_transaction IS 'Function updated with secure search path to prevent search path vulnerabilities';
COMMENT ON FUNCTION public.set_default_category_for_budget IS 'Function updated with secure search path to prevent search path vulnerabilities';
COMMENT ON FUNCTION public.verify_category_id IS 'Function updated with secure search path to prevent search path vulnerabilities';
COMMENT ON FUNCTION public.delete_transfer_transaction IS 'Function updated with secure search path to prevent search path vulnerabilities';