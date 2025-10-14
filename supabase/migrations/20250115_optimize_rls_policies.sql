-- Optimize RLS policies for better performance
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- WALLETS TABLE - Optimize RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can delete their own wallets" ON public.wallets;

CREATE POLICY "Users can view their own wallets" ON public.wallets
    FOR SELECT
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own wallets" ON public.wallets
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own wallets" ON public.wallets
    FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own wallets" ON public.wallets
    FOR DELETE
    USING (user_id = (select auth.uid()));

-- ============================================================================
-- TRANSACTIONS TABLE - Optimize RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own transactions" ON public.transactions
    FOR DELETE
    USING (user_id = (select auth.uid()));

-- ============================================================================
-- BUDGETS TABLE - Optimize RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets" ON public.budgets
    FOR SELECT
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own budgets" ON public.budgets
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own budgets" ON public.budgets
    FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own budgets" ON public.budgets
    FOR DELETE
    USING (user_id = (select auth.uid()));

-- ============================================================================
-- CATEGORIES TABLE - Optimize and consolidate duplicate RLS policies
-- ============================================================================

-- Remove all existing policies
DROP POLICY IF EXISTS "Users can read accessible categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view accessible categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create custom categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

-- Create consolidated and optimized policies
CREATE POLICY "Users can view accessible categories" ON public.categories
    FOR SELECT
    USING (user_id IS NULL OR user_id = (select auth.uid()));

CREATE POLICY "Users can create custom categories" ON public.categories
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE
    USING (user_id = (select auth.uid()));

-- ============================================================================
-- WANT_TO_BUY_ITEMS TABLE - Optimize RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own want to buy items" ON public.want_to_buy_items;
DROP POLICY IF EXISTS "Users can insert their own want to buy items" ON public.want_to_buy_items;
DROP POLICY IF EXISTS "Users can update their own want to buy items" ON public.want_to_buy_items;
DROP POLICY IF EXISTS "Users can delete their own want to buy items" ON public.want_to_buy_items;

CREATE POLICY "Users can view their own want to buy items" ON public.want_to_buy_items
    FOR SELECT
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own want to buy items" ON public.want_to_buy_items
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own want to buy items" ON public.want_to_buy_items
    FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own want to buy items" ON public.want_to_buy_items
    FOR DELETE
    USING (user_id = (select auth.uid()));

-- ============================================================================
-- PINJAMAN_ITEMS TABLE - Optimize RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own pinjaman items" ON public.pinjaman_items;
DROP POLICY IF EXISTS "Users can insert their own pinjaman items" ON public.pinjaman_items;
DROP POLICY IF EXISTS "Users can update their own pinjaman items" ON public.pinjaman_items;
DROP POLICY IF EXISTS "Users can delete their own pinjaman items" ON public.pinjaman_items;

CREATE POLICY "Users can view their own pinjaman items" ON public.pinjaman_items
    FOR SELECT
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own pinjaman items" ON public.pinjaman_items
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own pinjaman items" ON public.pinjaman_items
    FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own pinjaman items" ON public.pinjaman_items
    FOR DELETE
    USING (user_id = (select auth.uid()));

-- ============================================================================
-- EXCHANGE_RATES TABLE - Optimize RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Exchange rates are viewable by everyone" ON public.exchange_rates;
DROP POLICY IF EXISTS "Exchange rates are insertable by authenticated users" ON public.exchange_rates;
DROP POLICY IF EXISTS "Exchange rates are updatable by authenticated users" ON public.exchange_rates;

CREATE POLICY "Exchange rates are viewable by everyone" ON public.exchange_rates
    FOR SELECT
    USING (true);

CREATE POLICY "Exchange rates are insertable by authenticated users" ON public.exchange_rates
    FOR INSERT
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Exchange rates are updatable by authenticated users" ON public.exchange_rates
    FOR UPDATE
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Add comments for documentation
COMMENT ON TABLE public.wallets IS 'Wallets table with optimized RLS policies using (select auth.uid()) pattern';
COMMENT ON TABLE public.transactions IS 'Transactions table with optimized RLS policies using (select auth.uid()) pattern';
COMMENT ON TABLE public.budgets IS 'Budgets table with optimized RLS policies using (select auth.uid()) pattern';
COMMENT ON TABLE public.categories IS 'Categories table with optimized and consolidated RLS policies using (select auth.uid()) pattern';
COMMENT ON TABLE public.want_to_buy_items IS 'Want to buy items table with optimized RLS policies using (select auth.uid()) pattern';
COMMENT ON TABLE public.pinjaman_items IS 'Pinjaman items table with optimized RLS policies using (select auth.uid()) pattern';
COMMENT ON TABLE public.exchange_rates IS 'Exchange rates table with optimized RLS policies using (select auth.uid()) pattern';
