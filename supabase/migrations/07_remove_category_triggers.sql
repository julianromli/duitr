-- Remove triggers and functions that reference the categories table
-- This fixes the "relation 'categories' does not exist" error during transaction operations

-- Drop the triggers first
DROP TRIGGER IF EXISTS verify_transaction_category ON public.transactions;
DROP TRIGGER IF EXISTS verify_budget_category ON public.budgets;

-- Drop the function that references categories table
DROP FUNCTION IF EXISTS verify_category_id();

-- Add comment to document the change
COMMENT ON TABLE transactions IS 'Transactions table with category_id as integer, no triggers or foreign key constraints to allow flexible category management';
COMMENT ON TABLE budgets IS 'Budgets table with category_id as integer, no triggers or foreign key constraints to allow flexible category management';