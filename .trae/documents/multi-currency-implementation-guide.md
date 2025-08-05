# Multi-Currency Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing multi-currency support in the Duitr finance app. Follow the phases sequentially to ensure proper integration.

## Phase 1: Database Schema & Foundation

### 1.1 Database Migrations

Create the following SQL migration files in your Supabase dashboard:

**Migration 1: User Currency Preferences**
```sql
-- File: 01_add_user_currency_preferences.sql
-- Add currency preference support to user metadata

-- Update existing users with default currency preference
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"preferred_currency": "IDR"}'::jsonb
WHERE raw_user_meta_data->>'preferred_currency' IS NULL;

-- Create function to get user currency preference
CREATE OR REPLACE FUNCTION get_user_currency(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT raw_user_meta_data->>'preferred_currency' 
         FROM auth.users 
         WHERE id = user_uuid),
        'IDR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Migration 2: Exchange Rates Table**
```sql
-- File: 02_create_exchange_rates_table.sql
-- Create exchange rates table for historical rate storage

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

-- Grant permissions
GRANT SELECT ON public.exchange_rates TO anon;
GRANT ALL PRIVILEGES ON public.exchange_rates TO authenticated;

-- Insert initial exchange rates
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, rate_date, source)
VALUES 
    ('USD', 'IDR', 15750.00, CURRENT_DATE, 'initial'),
    ('IDR', 'USD', 0.0000635, CURRENT_DATE, 'initial')
ON CONFLICT (base_currency, target_currency, rate_date) DO NOTHING;
```

**Migration 3: Enhanced Transactions Table**
```sql
-- File: 03_enhance_transactions_table.sql
-- Add currency fields to transactions table

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
```

**Migration 4: Enhanced Wallets and Budgets**
```sql
-- File: 04_enhance_wallets_budgets.sql
-- Add currency support to wallets and budgets

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
```

### 1.2 Enhanced Currency Utilities

Update the currency utilities to support multiple currencies:

**File: `src/utils/currency.ts`**
```typescript
export type SupportedCurrency = 'IDR' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    locale: 'id-ID',
    decimals: 0
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2
  }
};

/**
 * Formats a number as currency for display
 * @param amount - The number to format
 * @param currency - The currency code
 * @returns Formatted currency string with symbol
 */
export function formatCurrency(amount: number, currency: SupportedCurrency = 'IDR'): string {
  const config = SUPPORTED_CURRENCIES[currency];
  
  const formatted = new Intl.NumberFormat(config.locale, {
    style: 'decimal',
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
  
  return `${config.symbol} ${formatted}`;
}

/**
 * Parse a currency string back to a number
 * @param value - The formatted string
 * @param currency - The currency code
 * @returns The numeric value
 */
export function parseCurrency(value: string, currency: SupportedCurrency = 'IDR'): number {
  const config = SUPPORTED_CURRENCIES[currency];
  
  // Remove currency symbol and spaces
  let cleanValue = value.replace(config.symbol, '').trim();
  
  // Handle different decimal separators
  if (currency === 'IDR') {
    // Remove dots (thousand separators) for IDR
    cleanValue = cleanValue.replace(/\./g, '');
  } else {
    // Remove commas (thousand separators) for USD
    cleanValue = cleanValue.replace(/,/g, '');
  }
  
  const numericValue = parseFloat(cleanValue);
  
  if (isNaN(numericValue)) {
    throw new Error(`Invalid currency format for ${currency}`);
  }
  
  return numericValue;
}

/**
 * Validate currency format
 * @param value - The string to validate
 * @param currency - The currency code
 * @returns boolean indicating validity
 */
export function isValidCurrency(value: string, currency: SupportedCurrency = 'IDR'): boolean {
  try {
    parseCurrency(value, currency);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get currency symbol
 * @param currency - The currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  return SUPPORTED_CURRENCIES[currency].symbol;
}

/**
 * Get currency name
 * @param currency - The currency code
 * @returns Currency name
 */
export function getCurrencyName(currency: SupportedCurrency): string {
  return SUPPORTED_CURRENCIES[currency].name;
}

/**
 * Get all supported currencies
 * @returns Array of supported currency codes
 */
export function getSupportedCurrencies(): SupportedCurrency[] {
  return Object.keys(SUPPORTED_CURRENCIES) as SupportedCurrency[];
}

// Backward compatibility exports
export const formatIDR = (amount: number) => formatCurrency(amount, 'IDR');
export const parseIDR = (value: string) => parseCurrency(value, 'IDR');
export const isValidIDR = (value: string) => isValidCurrency(value, 'IDR');
```

### 1.3 Exchange Rate Service

Create the exchange rate service:

**File: `src/services/exchangeRateService.ts`**
```typescript
import { supabase } from '@/lib/supabase';
import type { SupportedCurrency } from '@/utils/currency';

export interface ExchangeRate {
  id: string;
  base_currency: SupportedCurrency;
  target_currency: SupportedCurrency;
  rate: number;
  rate_date: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRateResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

class ExchangeRateService {
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest';
  private readonly CACHE_KEY = 'duitr_exchange_rates';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  /**
   * Get current exchange rate between two currencies
   */
  async getCurrentRate(base: SupportedCurrency, target: SupportedCurrency): Promise<number> {
    if (base === target) return 1;

    // Try to get from cache first
    const cachedRate = this.getCachedRate(base, target);
    if (cachedRate !== null) {
      return cachedRate;
    }

    // Try to get from database
    const dbRate = await this.getLatestRateFromDB(base, target);
    if (dbRate) {
      this.cacheRate(base, target, dbRate.rate);
      return dbRate.rate;
    }

    // Fetch from API as last resort
    return this.fetchRateFromAPI(base, target);
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(
    amount: number, 
    fromCurrency: SupportedCurrency, 
    toCurrency: SupportedCurrency
  ): Promise<number> {
    const rate = await this.getCurrentRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Get historical exchange rate for a specific date
   */
  async getHistoricalRate(
    base: SupportedCurrency, 
    target: SupportedCurrency, 
    date: string
  ): Promise<number> {
    if (base === target) return 1;

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', base)
      .eq('target_currency', target)
      .eq('rate_date', date)
      .single();

    if (error || !data) {
      // Fallback to current rate if historical rate not available
      return this.getCurrentRate(base, target);
    }

    return data.rate;
  }

  /**
   * Fetch exchange rates from external API
   */
  private async fetchRateFromAPI(base: SupportedCurrency, target: SupportedCurrency): Promise<number> {
    try {
      const response = await fetch(`${this.API_URL}/${base}`);
      const data: ExchangeRateResponse = await response.json();

      if (!data.success || !data.rates[target]) {
        throw new Error(`Rate not available for ${base} to ${target}`);
      }

      const rate = data.rates[target];

      // Store in database
      await this.storeRateInDB(base, target, rate, data.date);

      // Cache the rate
      this.cacheRate(base, target, rate);

      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      throw new Error('Unable to fetch current exchange rate');
    }
  }

  /**
   * Get latest rate from database
   */
  private async getLatestRateFromDB(
    base: SupportedCurrency, 
    target: SupportedCurrency
  ): Promise<ExchangeRate | null> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', base)
      .eq('target_currency', target)
      .order('rate_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if rate is recent (within 24 hours)
    const rateDate = new Date(data.rate_date);
    const now = new Date();
    const hoursDiff = (now.getTime() - rateDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return null; // Rate is too old
    }

    return data;
  }

  /**
   * Store exchange rate in database
   */
  private async storeRateInDB(
    base: SupportedCurrency, 
    target: SupportedCurrency, 
    rate: number, 
    date: string
  ): Promise<void> {
    const { error } = await supabase
      .from('exchange_rates')
      .upsert({
        base_currency: base,
        target_currency: target,
        rate,
        rate_date: date,
        source: 'exchangerate-api'
      }, {
        onConflict: 'base_currency,target_currency,rate_date'
      });

    if (error) {
      console.error('Failed to store exchange rate:', error);
    }
  }

  /**
   * Cache exchange rate in local storage
   */
  private cacheRate(base: SupportedCurrency, target: SupportedCurrency, rate: number): void {
    try {
      const cache = this.getCache();
      const key = `${base}_${target}`;
      cache[key] = {
        rate,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache exchange rate:', error);
    }
  }

  /**
   * Get cached exchange rate
   */
  private getCachedRate(base: SupportedCurrency, target: SupportedCurrency): number | null {
    try {
      const cache = this.getCache();
      const key = `${base}_${target}`;
      const cached = cache[key];

      if (!cached) return null;

      // Check if cache is still valid
      if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
        delete cache[key];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return cached.rate;
    } catch (error) {
      console.warn('Failed to get cached exchange rate:', error);
      return null;
    }
  }

  /**
   * Get cache object from local storage
   */
  private getCache(): Record<string, { rate: number; timestamp: number }> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear exchange rate cache:', error);
    }
  }
}

export const exchangeRateService = new ExchangeRateService();
```

## Phase 2: Core Hooks and Context

### 2.1 Currency Hook

Create a custom hook for currency management:

**File: `src/hooks/useCurrency.ts`**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { SupportedCurrency } from '@/utils/currency';
import { getSupportedCurrencies } from '@/utils/currency';

export interface UseCurrencyReturn {
  userCurrency: SupportedCurrency;
  supportedCurrencies: SupportedCurrency[];
  changeCurrency: (currency: SupportedCurrency, convertExisting?: boolean) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useCurrency(): UseCurrencyReturn {
  const { user } = useAuth();
  const [userCurrency, setUserCurrency] = useState<SupportedCurrency>('IDR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supportedCurrencies = getSupportedCurrencies();

  // Load user's currency preference
  useEffect(() => {
    if (user) {
      loadUserCurrency();
    }
  }, [user]);

  const loadUserCurrency = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      const preferredCurrency = data.user?.user_metadata?.preferred_currency as SupportedCurrency;
      
      if (preferredCurrency && supportedCurrencies.includes(preferredCurrency)) {
        setUserCurrency(preferredCurrency);
      } else {
        setUserCurrency('IDR'); // Default fallback
      }
    } catch (err) {
      console.error('Failed to load user currency:', err);
      setError('Failed to load currency preference');
    }
  }, [user, supportedCurrencies]);

  const changeCurrency = useCallback(async (
    currency: SupportedCurrency, 
    convertExisting: boolean = false
  ) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { preferred_currency: currency }
      });

      if (updateError) throw updateError;

      // If convertExisting is true, convert existing transactions
      if (convertExisting) {
        await convertExistingTransactions(currency);
      }

      setUserCurrency(currency);
    } catch (err) {
      console.error('Failed to change currency:', err);
      setError('Failed to update currency preference');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const convertExistingTransactions = async (newCurrency: SupportedCurrency) => {
    // This will be implemented in Phase 3
    // For now, just log the intention
    console.log(`Converting existing transactions to ${newCurrency}`);
  };

  return {
    userCurrency,
    supportedCurrencies,
    changeCurrency,
    isLoading,
    error
  };
}
```

### 2.2 Exchange Rate Hook

Create a hook for exchange rate management:

**File: `src/hooks/useExchangeRate.ts`**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { exchangeRateService } from '@/services/exchangeRateService';
import type { SupportedCurrency } from '@/utils/currency';

export interface UseExchangeRateReturn {
  rate: number | null;
  convertAmount: (amount: number) => number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshRate: () => Promise<void>;
}

export function useExchangeRate(
  baseCurrency: SupportedCurrency,
  targetCurrency: SupportedCurrency
): UseExchangeRateReturn {
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRate = useCallback(async () => {
    if (baseCurrency === targetCurrency) {
      setRate(1);
      setLastUpdated(new Date());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentRate = await exchangeRateService.getCurrentRate(baseCurrency, targetCurrency);
      setRate(currentRate);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
      setError('Failed to fetch exchange rate');
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency, targetCurrency]);

  const refreshRate = useCallback(async () => {
    // Clear cache and fetch fresh rate
    exchangeRateService.clearCache();
    await fetchRate();
  }, [fetchRate]);

  const convertAmount = useCallback((amount: number): number => {
    if (rate === null) return amount;
    return amount * rate;
  }, [rate]);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return {
    rate,
    convertAmount,
    isLoading,
    error,
    lastUpdated,
    refreshRate
  };
}
```

## Phase 3: UI Components

### 3.1 Currency Selection Component

Create the currency selection component for onboarding:

**File: `src/components/currency/CurrencySelection.tsx`**
```typescript
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupportedCurrency } from '@/utils/currency';
import { SUPPORTED_CURRENCIES, getSupportedCurrencies } from '@/utils/currency';

interface CurrencySelectionProps {
  selectedCurrency?: SupportedCurrency;
  onCurrencySelect: (currency: SupportedCurrency) => void;
  onContinue: () => void;
  className?: string;
}

export function CurrencySelection({
  selectedCurrency,
  onCurrencySelect,
  onContinue,
  className
}: CurrencySelectionProps) {
  const supportedCurrencies = getSupportedCurrencies();

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Currency</h2>
        <p className="text-muted-foreground">
          Select your preferred currency for managing your finances
        </p>
      </div>

      <div className="grid gap-4">
        {supportedCurrencies.map((currency) => {
          const config = SUPPORTED_CURRENCIES[currency];
          const isSelected = selectedCurrency === currency;

          return (
            <Card
              key={currency}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => onCurrencySelect(currency)}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{config.symbol}</div>
                  <div>
                    <div className="font-semibold">{config.name}</div>
                    <div className="text-sm text-muted-foreground">{config.code}</div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        onClick={onContinue}
        disabled={!selectedCurrency}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
```

### 3.2 Currency Display Component

Create a component for displaying currency amounts:

**File: `src/components/currency/CurrencyDisplay.tsx`**
```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, type SupportedCurrency } from '@/utils/currency';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyDisplayProps {
  amount: number;
  currency: SupportedCurrency;
  showConversion?: boolean;
  targetCurrency?: SupportedCurrency;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencyDisplay({
  amount,
  currency,
  showConversion = false,
  targetCurrency,
  className,
  size = 'md'
}: CurrencyDisplayProps) {
  const { userCurrency } = useCurrency();
  const conversionCurrency = targetCurrency || userCurrency;
  
  const { convertAmount, isLoading } = useExchangeRate(
    currency,
    conversionCurrency
  );

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  const shouldShowConversion = showConversion && 
    currency !== conversionCurrency && 
    !isLoading;

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn(sizeClasses[size])}>
        {formatCurrency(amount, currency)}
      </div>
      
      {shouldShowConversion && (
        <div className="text-xs text-muted-foreground">
          ≈ {formatCurrency(convertAmount(amount), conversionCurrency)}
        </div>
      )}
    </div>
  );
}
```

### 3.3 Currency Input Component

Create a currency-aware input component:

**File: `src/components/currency/CurrencyInput.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  formatCurrency, 
  parseCurrency, 
  isValidCurrency, 
  getCurrencySymbol,
  type SupportedCurrency 
} from '@/utils/currency';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyInputProps {
  value: number;
  currency: SupportedCurrency;
  onChange: (value: number) => void;
  showConversion?: boolean;
  targetCurrency?: SupportedCurrency;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function CurrencyInput({
  value,
  currency,
  onChange,
  showConversion = false,
  targetCurrency,
  label,
  placeholder,
  className,
  error
}: CurrencyInputProps) {
  const { userCurrency } = useCurrency();
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  
  const conversionCurrency = targetCurrency || userCurrency;
  const { convertAmount, isLoading } = useExchangeRate(currency, conversionCurrency);

  // Update input value when value prop changes
  useEffect(() => {
    if (value === 0) {
      setInputValue('');
    } else {
      setInputValue(formatCurrency(value, currency).replace(getCurrencySymbol(currency), '').trim());
    }
  }, [value, currency]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === '') {
      onChange(0);
      setIsValid(true);
      return;
    }

    // Add currency symbol for validation
    const valueWithSymbol = `${getCurrencySymbol(currency)} ${newValue}`;
    
    if (isValidCurrency(valueWithSymbol, currency)) {
      try {
        const numericValue = parseCurrency(valueWithSymbol, currency);
        onChange(numericValue);
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    } else {
      setIsValid(false);
    }
  };

  const shouldShowConversion = showConversion && 
    currency !== conversionCurrency && 
    !isLoading && 
    value > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={`currency-input-${currency}`}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {getCurrencySymbol(currency)}
        </div>
        
        <Input
          id={`currency-input-${currency}`}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder || '0'}
          className={cn(
            'pl-8',
            !isValid && 'border-destructive focus-visible:ring-destructive'
          )}
        />
      </div>

      {shouldShowConversion && (
        <div className="text-xs text-muted-foreground">
          ≈ {formatCurrency(convertAmount(value), conversionCurrency)}
        </div>
      )}

      {error && (
        <div className="text-xs text-destructive">
          {error}
        </div>
      )}
      
      {!isValid && !error && (
        <div className="text-xs text-destructive">
          Please enter a valid amount
        </div>
      )}
    </div>
  );
}
```

This implementation guide provides the foundation for multi-currency support. Continue with the remaining phases to complete the full feature implementation.
