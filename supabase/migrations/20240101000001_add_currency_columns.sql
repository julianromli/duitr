-- Add currency columns to core tables for single-currency system
-- Migration: Add currency support to transactions, wallets, and budgets

-- Add currency column to transactions table
ALTER TABLE transactions 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'IDR';

-- Add currency column to wallets table
ALTER TABLE wallets 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'IDR';

-- Add currency column to budgets table
ALTER TABLE budgets 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'IDR';

-- Create indexes for performance optimization
CREATE INDEX idx_transactions_currency ON transactions(currency);
CREATE INDEX idx_transactions_user_currency ON transactions(user_id, currency);
CREATE INDEX idx_wallets_currency ON wallets(currency);
CREATE INDEX idx_wallets_user_currency ON wallets(user_id, currency);
CREATE INDEX idx_budgets_currency ON budgets(currency);
CREATE INDEX idx_budgets_user_currency ON budgets(user_id, currency);

-- Add comments for documentation
COMMENT ON COLUMN transactions.currency IS 'Currency code (USD or IDR) for the transaction';
COMMENT ON COLUMN wallets.currency IS 'Currency code (USD or IDR) for the wallet';
COMMENT ON COLUMN budgets.currency