-- Migration: Simplify Currency System to Display-Only Preference
-- Description: Remove complex multi-currency exchange logic, keep simple user preference for display formatting
-- Date: 2025-01-16
-- 
-- Rationale: 
-- Currency is just a display preference (USD vs IDR formatting), not a conversion system.
-- User chooses currency at onboarding, all transactions use that currency.
-- No exchange rates, no conversions - just formatting.

-- ============================================================================
-- STEP 1: Remove unnecessary currency columns from transactions
-- ============================================================================

-- Drop indexes first
DROP INDEX IF EXISTS public.idx_transactions_original_currency;
DROP INDEX IF EXISTS public.idx_transactions_converted_currency;
DROP INDEX IF EXISTS public.idx_transactions_user_currency;
DROP INDEX IF EXISTS public.idx_transactions_rate_timestamp;

-- Drop constraints
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS check_original_currency,
DROP CONSTRAINT IF EXISTS check_converted_currency,
DROP CONSTRAINT IF EXISTS check_positive_exchange_rate;

-- Remove currency conversion columns (keep only 'amount')
ALTER TABLE public.transactions 
DROP COLUMN IF EXISTS original_amount,
DROP COLUMN IF EXISTS original_currency,
DROP COLUMN IF EXISTS converted_amount,
DROP COLUMN IF EXISTS converted_currency,
DROP COLUMN IF EXISTS exchange_rate,
DROP COLUMN IF EXISTS rate_timestamp;

-- ============================================================================
-- STEP 2: Remove currency columns from wallets
-- ============================================================================

DROP INDEX IF EXISTS public.idx_wallets_currency;
DROP INDEX IF EXISTS public.idx_wallets_user_currency;

ALTER TABLE public.wallets 
DROP CONSTRAINT IF EXISTS check_wallet_currency;

ALTER TABLE public.wallets 
DROP COLUMN IF EXISTS base_currency,
DROP COLUMN IF EXISTS currency;

-- ============================================================================
-- STEP 3: Remove currency columns from budgets
-- ============================================================================

DROP INDEX IF EXISTS public.idx_budgets_currency;
DROP INDEX IF EXISTS public.idx_budgets_user_currency;

ALTER TABLE public.budgets 
DROP CONSTRAINT IF EXISTS check_budget_currency;

ALTER TABLE public.budgets 
DROP COLUMN IF EXISTS currency;

-- ============================================================================
-- STEP 4: Drop exchange_rates table (no longer needed)
-- ============================================================================

DROP TABLE IF EXISTS public.exchange_rates CASCADE;

-- ============================================================================
-- STEP 5: Add documentation comments
-- ============================================================================

COMMENT ON TABLE public.transactions IS 
'Simplified single-currency system. All amounts use user preferred currency from auth.users.user_metadata.currency. Currency is display preference only, not conversion system.';

COMMENT ON COLUMN public.transactions.amount IS 
'Transaction amount in user''s preferred currency (USD or IDR). No conversion - user records all transactions in their chosen currency.';

COMMENT ON TABLE public.wallets IS 
'Wallet balances in user''s preferred currency. Currency preference set during onboarding.';

COMMENT ON TABLE public.budgets IS 
'Budget amounts in user''s preferred currency. All budgets use same currency as user preference.';

-- ============================================================================
-- STEP 6: Verify get_user_currency function still exists
-- ============================================================================

-- This function is used to retrieve user currency preference from auth.users
-- It should already exist from migration 01_add_user_currency_preferences.sql
-- Just verify it exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_user_currency'
    ) THEN
        RAISE NOTICE 'get_user_currency function not found - may need to run migration 01_add_user_currency_preferences.sql';
    ELSE
        RAISE NOTICE 'get_user_currency function exists - OK';
    END IF;
END $$;
