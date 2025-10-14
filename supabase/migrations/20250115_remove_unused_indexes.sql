-- Remove unused indexes to reduce database overhead
-- These indexes have not been used and may be candidates for removal
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

-- ============================================================================
-- EXCHANGE_RATES TABLE
-- ============================================================================
-- Remove unused indexes on exchange_rates table
DROP INDEX IF EXISTS public.idx_exchange_rates_source;
DROP INDEX IF EXISTS public.idx_exchange_rates_target;

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
-- Remove unused currency indexes on transactions table
DROP INDEX IF EXISTS public.idx_transactions_original_currency;
DROP INDEX IF EXISTS public.idx_transactions_converted_currency;

-- ============================================================================
-- WALLETS TABLE
-- ============================================================================
-- Remove unused currency index on wallets table
DROP INDEX IF EXISTS public.idx_wallets_currency;

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
-- Remove unused currency index on budgets table
DROP INDEX IF EXISTS public.idx_budgets_currency;

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- Remove unused user_id index on categories table
-- Note: This may be needed in the future if queries frequently filter by user_id
-- Consider monitoring query patterns before applying this change
DROP INDEX IF EXISTS public.idx_categories_user_id;

-- Add note for future reference
COMMENT ON TABLE public.exchange_rates IS 'Removed unused indexes idx_exchange_rates_source and idx_exchange_rates_target';
COMMENT ON TABLE public.transactions IS 'Removed unused indexes idx_transactions_original_currency and idx_transactions_converted_currency';
COMMENT ON TABLE public.wallets IS 'Removed unused index idx_wallets_currency';
COMMENT ON TABLE public.budgets IS 'Removed unused index idx_budgets_currency';
COMMENT ON TABLE public.categories IS 'Removed unused index idx_categories_user_id';
