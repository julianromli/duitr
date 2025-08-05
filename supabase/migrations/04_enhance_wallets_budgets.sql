-- Migration: Enhance wallets and budgets with currency support
-- Description: Add currency support to wallets and budgets tables
-- Date: 2024-01-15

-- Add currency to wallets
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) DEFAULT 'IDR';

-- Update existing wallets
UPDATE public.wallets 
SET base_currency = 'IDR' 
WHERE base_currency IS NULL;

-- Make column NOT NULL
ALTER TABLE public.wallets 
ALTER COLUMN base_currency SET NOT NULL;

-- Add currency to budgets
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'IDR';

-- Update existing budgets
UPDATE public.budgets 
SET currency = 'IDR' 
WHERE currency IS NULL;

-- Make column NOT NULL
ALTER TABLE public.budgets 
ALTER COLUMN currency SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON public.wallets(base_currency);
CREATE INDEX IF NOT EXISTS idx_budgets_currency ON public.budgets(currency);
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON public.wallets(user_id, base_currency);
CREATE INDEX IF NOT EXISTS idx_budgets_user_currency ON public.budgets(user_id, currency);

-- Add check constraints for valid currency codes
ALTER TABLE public.wallets 
ADD CONSTRAINT check_wallet_currency 
CHECK (base_currency IN ('IDR', 'USD'));

ALTER TABLE public.budgets 
ADD CONSTRAINT check_budget_currency 
CHECK (currency IN ('IDR', 'USD'));