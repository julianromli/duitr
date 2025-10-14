-- Migration: Add function to delete all user data
-- Description: Used when user changes currency preference (requires data reset)
-- Date: 2025-01-16
--
-- Purpose:
-- When user changes currency (USD <-> IDR), all existing data must be deleted
-- to prevent mixing currencies in statistics and reports.

-- ============================================================================
-- Create function to delete all user data
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_all_user_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be NULL';
  END IF;

  -- Verify the caller is the user themselves (RLS check)
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'You can only delete your own data';
  END IF;

  -- Delete in correct order to respect foreign keys
  -- Start with dependent tables first, then parent tables
  
  -- Delete transactions (has foreign keys to wallets)
  DELETE FROM public.transactions 
  WHERE user_id = p_user_id;
  
  -- Delete budgets (has foreign keys to wallets)
  DELETE FROM public.budgets 
  WHERE user_id = p_user_id;
  
  -- Delete wallets
  DELETE FROM public.wallets 
  WHERE user_id = p_user_id;
  
  -- Delete want_to_buy_items
  DELETE FROM public.want_to_buy_items 
  WHERE user_id = p_user_id;
  
  -- Delete pinjaman_items
  DELETE FROM public.pinjaman_items 
  WHERE user_id = p_user_id;
  
  -- Delete custom categories (keep default ones)
  DELETE FROM public.categories 
  WHERE user_id = p_user_id 
    AND is_custom = true;
  
  -- Log the action for audit trail
  RAISE NOTICE 'All data deleted for user: %', p_user_id;
  
  RETURN;
END;
$$;

-- ============================================================================
-- Set permissions
-- ============================================================================

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.delete_all_user_data(UUID) TO authenticated;

-- Revoke from anon (safety measure)
REVOKE EXECUTE ON FUNCTION public.delete_all_user_data(UUID) FROM anon;

-- ============================================================================
-- Add function comment
-- ============================================================================

COMMENT ON FUNCTION public.delete_all_user_data(UUID) IS 
'Deletes all user data (transactions, budgets, wallets, etc.) when changing currency preference. 
Used in Settings > Currency Change. Requires user to be authenticated as the owner of the data.
Called from CurrencySettings component.';

-- ============================================================================
-- Test the function (optional, for development verification)
-- ============================================================================

-- To test in development:
-- SELECT public.delete_all_user_data(auth.uid());
-- This will delete all your data! Only run in dev environment.
