-- Migration: Create exchange rates table
-- Description: Create exchange rates table for historical rate storage
-- Date: 2024-01-15

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(20,8) NOT NULL,
    rate_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'exchangerate-api',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for currency pair and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_unique 
ON public.exchange_rates(base_currency, target_currency, rate_date);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON public.exchange_rates(rate_date DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_base ON public.exchange_rates(base_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_target ON public.exchange_rates(target_currency);

-- Enable Row Level Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Exchange rates are viewable by everyone" ON public.exchange_rates
    FOR SELECT USING (true);

CREATE POLICY "Exchange rates are insertable by authenticated users" ON public.exchange_rates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Exchange rates are updatable by authenticated users" ON public.exchange_rates
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON public.exchange_rates TO anon;
GRANT ALL PRIVILEGES ON public.exchange_rates TO authenticated;

-- Insert initial exchange rates
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, rate_date, source)
VALUES 
    ('USD', 'IDR', 15750.00, CURRENT_DATE, 'initial'),
    ('IDR', 'USD', 0.0000635, CURRENT_DATE, 'initial')
ON CONFLICT (base_currency, target_currency, rate_date) DO NOTHING;