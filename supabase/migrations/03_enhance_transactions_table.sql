-- Migration: Enhance transactions table with currency support
-- Description: Add currency fields to transactions table
-- Date: 2024-01-15

-- Add new currency columns
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC(20,2),
ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3) DEFAULT 'IDR',
ADD COLUMN IF NOT EXISTS converted_amount NUMERIC(20,2),
ADD COLUMN IF NOT EXISTS converted_currency VARCHAR(3) DEFAULT 'IDR',
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(20,8) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS rate_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate existing data
UPDATE public.transactions 
SET 
    original_amount = amount,
    original_currency = 'IDR',
    converted_amount = amount,
    converted_currency = 'IDR',
    exchange_rate = 1.0
WHERE original_amount IS NULL;

-- Make columns NOT NULL after migration
ALTER TABLE public.transactions 
ALTER COLUMN original_amount SET NOT NULL,
ALTER COLUMN original_currency SET NOT NULL,
ALTER COLUMN converted_amount SET NOT NULL,
ALTER COLUMN converted_currency SET NOT NULL;

-- Create indexes for currency queries
CREATE INDEX IF NOT EXISTS idx_transactions_original_currency ON public.transactions(original_currency);
CREATE INDEX IF NOT EXISTS idx_transactions_converted_currency ON public.transactions(converted_currency);
CREATE INDEX IF NOT EXISTS idx_transactions_user_currency ON public.transactions(user_id, original_currency);
CREATE INDEX IF NOT EXISTS idx_transactions_rate_timestamp ON public.transactions(rate_timestamp);

-- Add check constraints for valid currency codes
ALTER TABLE public.transactions 
ADD CONSTRAINT check_original_currency 
CHECK (original_currency IN ('IDR', 'USD'));

ALTER TABLE public.transactions 
ADD CONSTRAINT check_converted_currency 
CHECK (converted_currency IN ('IDR', 'USD'));

-- Add check constraint for positive exchange rate
ALTER TABLE public.transactions 
ADD CONSTRAINT check_positive_exchange_rate 
CHECK (exchange_rate > 0);