# Single-Currency System Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the single-currency-per-user system. Follow the phases in order to ensure a smooth transition.

## Prerequisites

* Database backup completed

* Development environment set up

* Supabase CLI installed

* Feature flag system ready (optional but recommended)

## Phase 1: Database Schema Updates

### Step 1.1: Create Migration Files

```sql
-- File: supabase/migrations/20240101000001_add_currency_columns.sql

-- Add currency column to transactions table
ALTER TABLE transactions 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'IDR';

-- Add currency column to wallets table
ALTER TABLE wallets 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'IDR';

-- Add currency column to budgets table
ALTER TABLE budgets 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'IDR';

-- Create indexes for performance
CREATE INDEX idx_transactions_currency ON transactions(currency);
CREATE INDEX idx_transactions_user_currency ON transactions(user_id, currency);
CREATE INDEX idx_wallets_currency ON wallets(currency);
CREATE INDEX idx_wallets_user_currency ON wallets(user_id, currency);
CREATE INDEX idx_budgets_currency ON budgets(currency);
CREATE INDEX idx_budgets_user_currency ON budgets(user_id, currency);
```

### Step 1.2: Data Migration Script

```sql
-- File: supabase/migrations/20240101000002_migrate_currency_data.sql

-- Migrate existing transaction data
-- Detect currency based on amount patterns (IDR typically has larger amounts)
WITH user_currency_detection AS (
  SELECT 
    user_id,
    CASE 
      WHEN AVG(amount) > 100000 THEN 'IDR'
      ELSE 'USD'
    END as detected_currency
  FROM transactions 
  WHERE amount > 0
  GROUP BY user_id
)
UPDATE transactions t
SET currency = ucd.detected_currency
FROM user_currency_detection ucd
WHERE t.user_id = ucd.user_id;

-- Migrate wallet data
WITH wallet_currency_detection AS (
  SELECT 
    w.id,
    COALESCE(ucd.detected_currency, 'IDR') as wallet_currency
  FROM wallets w
  LEFT JOIN (
    SELECT 
      user_id,
      CASE 
        WHEN AVG(amount) > 100000 THEN 'IDR'
        ELSE 'USD'
      END as detected_currency
    FROM transactions 
    WHERE amount > 0
    GROUP BY user_id
  ) ucd ON w.user_id = ucd.user_id
)
UPDATE wallets w
SET currency = wcd.wallet_currency
FROM wallet_currency_detection wcd
WHERE w.id = wcd.id;

-- Migrate budget data
WITH budget_currency_detection AS (
  SELECT 
    b.id,
    COALESCE(ucd.detected_currency, 'IDR') as budget_currency
  FROM budgets b
  LEFT JOIN (
    SELECT 
      user_id,
      CASE 
        WHEN AVG(amount) > 100000 THEN 'IDR'
        ELSE 'USD'
      END as detected_currency
    FROM transactions 
    WHERE amount > 0
    GROUP BY user_id
  ) ucd ON b.user_id = ucd.user_id
)
UPDATE budgets b
SET currency = bcd.budget_currency
FROM budget_currency_detection bcd
WHERE b.id = bcd.id;
```

### Step 1.3: Run Migrations

```bash
# Apply migrations
supabase db push

# Verify migrations
supabase db diff
```

## Phase 2: Create Currency Onboarding Components

### Step 2.1: Create Currency Onboarding Hook

```typescript
// File: src/hooks/useCurrencyOnboarding.ts

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export type Currency = 'USD' | 'IDR'

interface CurrencyOnboardingState {
  isRequired: boolean
  isLoading: boolean
  selectedCurrency: Currency | null
}

export function useCurrencyOnboarding() {
  const { user } = useAuth()
  const [state, setState] = useState<CurrencyOnboardingState>({
    isRequired: false,
    isLoading: true,
    selectedCurrency: null,
  })

  useEffect(() => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    checkCurrencySelection()
  }, [user])

  const checkCurrencySelection = async () => {
    try {
      const currency = user?.user_metadata?.currency
      
      setState({
        isRequired: !currency,
        isLoading: false,
        selectedCurrency: currency || null,
      })
    } catch (error) {
      console.error('Error checking currency selection:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const saveCurrencySelection = async (currency: Currency) => {
    if (!user) return false

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          currency,
          currency_selected_at: new Date().toISOString(),
        }
      })

      if (error) throw error

      setState(prev => ({
        ...prev,
        isRequired: false,
        selectedCurrency: currency,
      }))

      toast({
        title: 'Currency Selected',
        description: `Your currency has been set to ${currency}`,
      })

      return true
    } catch (error) {
      console.error('Error saving currency selection:', error)
      toast({
        title: 'Error',
        description: 'Failed to save currency selection',
        variant: 'destructive',
      })
      return false
    }
  }

  return {
    ...state,
    saveCurrencySelection,
    refreshStatus: checkCurrencySelection,
  }
}
```

### Step 2.2: Create Currency Onboarding Dialog

```typescript
// File: src/components/currency/CurrencyOnboardingDialog.tsx

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrencyOnboarding, Currency } from '@/hooks/useCurrencyOnboarding'
import { formatCurrency } from '@/utils/currency'

interface CurrencyOnboardingDialogProps {
  open: boolean
}

export function CurrencyOnboardingDialog({ open }: CurrencyOnboardingDialogProps) {
  const { saveCurrencySelection } = useCurrencyOnboarding()
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency)
  }

  const handleConfirm = async () => {
    if (!selectedCurrency) return

    setIsLoading(true)
    const success = await saveCurrencySelection(selectedCurrency)
    setIsLoading(false)

    if (!success) {
      setSelectedCurrency(null)
    }
  }

  const currencyOptions = [
    {
      code: 'USD' as Currency,
      name: 'US Dollar',
      symbol: '$',
      example: formatCurrency(1000, 'USD'),
      description: 'Perfect for international transactions',
      color: 'border-blue-500 bg-blue-50',
      selectedColor: 'border-blue-600 bg-blue-100',
    },
    {
      code: 'IDR' as Currency,
      name: 'Indonesian Rupiah',
      symbol: 'Rp',
      example: formatCurrency(1000000, 'IDR'),
      description: 'Ideal for local Indonesian transactions',
      color: 'border-green-500 bg-green-50',
      selectedColor: 'border-green-600 bg-green-100',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Choose Your Currency
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Select your preferred currency. This cannot be changed later.
          </p>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {currencyOptions.map((option) => {
            const isSelected = selectedCurrency === option.code
            const cardClass = isSelected ? option.selectedColor : option.color
            
            return (
              <Card
                key={option.code}
                className={`cursor-pointer transition-all duration-200 ${cardClass} border-2`}
                onClick={() => handleCurrencySelect(option.code)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold">{option.symbol}</span>
                        <span className="font-semibold">{option.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {option.description}
                      </p>
                      <p className="text-lg font-mono">
                        Example: {option.example}
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        isSelected 
                          ? 'bg-current border-current' 
                          : 'border-gray-300'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        <div className="mt-6">
          <Button
            onClick={handleConfirm}
            disabled={!selectedCurrency || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Saving...' : 'Confirm Selection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Phase 3: Update Authentication Context

### Step 3.1: Modify AuthContext

```typescript
// File: src/context/AuthContext.tsx (modifications)

// Add to existing AuthContext
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding'
import { CurrencyOnboardingDialog } from '@/components/currency/CurrencyOnboardingDialog'

// Add to AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... existing code ...
  
  const { isRequired: isCurrencyOnboardingRequired } = useCurrencyOnboarding()
  
  return (
    <AuthContext.Provider value={value}>
      {children}
      <CurrencyOnboardingDialog open={isCurrencyOnboardingRequired} />
    </AuthContext.Provider>
  )
}
```

## Phase 4: Remove Conversion Features

### Step 4.1: Remove Exchange Rate Hook

```bash
# Remove the file
rm src/hooks/useExchangeRate.ts
```

### Step 4.2: Remove Currency Display Component

```bash
# Remove the file
rm src/components/currency/CurrencyDisplay.tsx
```

### Step 4.3: Update Currency Utilities

```typescript
// File: src/utils/currency.ts (simplified version)

export type Currency = 'USD' | 'IDR'

export function formatCurrency(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  })
  
  return formatter.format(amount)
}

export function getCurrencySymbol(currency: Currency): string {
  return currency === 'USD' ? '$' : 'Rp'
}

export function parseCurrencyInput(value: string, currency: Currency): number {
  // Remove currency symbols and formatting
  const cleanValue = value.replace(/[^0-9.-]/g, '')
  return parseFloat(cleanValue) || 0
}
```

## Phase 5: Update Transaction Forms

### Step 5.1: Simplify CurrencyInput Component

```typescript
// File: src/components/currency/CurrencyInput.tsx (simplified)

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, parseCurrencyInput, getCurrencySymbol } from '@/utils/currency'

interface CurrencyInputProps {
  value: number
  onChange: (amount: number) => void
  placeholder?: string
  className?: string
}

export function CurrencyInput({ value, onChange, placeholder, className }: CurrencyInputProps) {
  const { user } = useAuth()
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  
  const userCurrency = user?.user_metadata?.currency || 'IDR'
  const currencySymbol = getCurrencySymbol(userCurrency)
  
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatCurrency(value, userCurrency) : '')
    }
  }, [value, userCurrency, isFocused])
  
  const handleFocus = () => {
    setIsFocused(true)
    setDisplayValue(value > 0 ? value.toString() : '')
  }
  
  const handleBlur = () => {
    setIsFocused(false)
    const numericValue = parseCurrencyInput(displayValue, userCurrency)
    onChange(numericValue)
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    if (isFocused) {
      const numericValue = parseCurrencyInput(inputValue, userCurrency)
      onChange(numericValue)
    }
  }
  
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
        {currencySymbol}
      </span>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || `0${currencySymbol === '$' ? '.00' : ''}`}
        className={`pl-8 ${className}`}
      />
    </div>
  )
}
```

### Step 5.2: Update Transaction Forms

```typescript
// File: src/components/transactions/ExpenseForm.tsx (key changes)

// Remove currency selection dropdown
// Update form submission to include user's currency

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  const userCurrency = user?.user_metadata?.currency || 'IDR'
  
  const transactionData = {
    amount: formData.amount,
    currency: userCurrency, // Use user's selected currency
    type: 'expense' as const,
    category_id: formData.categoryId,
    wallet_id: formData.walletId,
    description: formData.description,
  }
  
  // ... rest of submission logic
}
```

## Phase 6: Update Finance Context

### Step 6.1: Remove Conversion Logic

```typescript
// File: src/context/FinanceContext.tsx (modifications)

// Remove:
// - useExchangeRate import
// - Currency conversion logic
// - Dual currency balance calculations

// Simplify balance calculations to single currency
const calculateTotalBalance = (wallets: Wallet[]): number => {
  return wallets.reduce((total, wallet) => total + wallet.balance, 0)
}

// Update formatTransactionForDB to use user currency
const formatTransactionForDB = (transaction: any, userCurrency: string) => {
  return {
    ...transaction,
    currency: userCurrency,
    // Remove conversion fields
  }
}
```

## Phase 7: Testing

### Step 7.1: Create Test Cases

```typescript
// File: src/components/currency/__tests__/CurrencyOnboarding.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CurrencyOnboardingDialog } from '../CurrencyOnboardingDialog'
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding'

// Mock the hook
jest.mock('@/hooks/useCurrencyOnboarding')

describe('CurrencyOnboardingDialog', () => {
  const mockSaveCurrencySelection = jest.fn()
  
  beforeEach(() => {
    (useCurrencyOnboarding as jest.Mock).mockReturnValue({
      saveCurrencySelection: mockSaveCurrencySelection,
    })
  })
  
  it('should display currency options', () => {
    render(<CurrencyOnboardingDialog open={true} />)
    
    expect(screen.getByText('US Dollar')).toBeInTheDocument()
    expect(screen.getByText('Indonesian Rupiah')).toBeInTheDocument()
  })
  
  it('should allow currency selection', async () => {
    render(<CurrencyOnboardingDialog open={true} />)
    
    fireEvent.click(screen.getByText('US Dollar'))
    fireEvent.click(screen.getByText('Confirm Selection'))
    
    await waitFor(() => {
      expect(mockSaveCurrencySelection).toHaveBeenCalledWith('USD')
    })
  })
})
```

### Step 7.2: Manual Testing Checklist

* [ ] New user registration shows currency selection dialog

* [ ] Currency selection is saved to user metadata

* [ ] Transaction forms use selected currency

* [ ] Balance displays show correct currency

* [ ] No conversion features are visible

* [ ] Existing users maintain their detected currency

* [ ] Database migrations completed successfully

## Phase 8: Deployment

### Step 8.1: Pre-deployment Checklist

* [ ] Database backup completed

* [ ] Migration scripts tested on staging

* [ ] All tests passing

* [ ] Feature flags configured (if using)

* [ ] Rollback plan documented

### Step 8.2: Deployment Steps

1. Deploy database migrations
2. Deploy application code
3. Monitor error logs
4. Verify user experience
5. Monitor performance metrics

### Step 8.3: Post-deployment Monitoring

* Monitor user onboarding completion rates

* Check for currency-related errors

* Verify transaction creation success rates

* Monitor user feedback

## Rollback Plan

If issues arise:

1. **Immediate**: Use feature flags to disable new currency system
2. **Database**: Currency columns are additive, no data loss
3. **Code**: Revert to previous version with conversion features
4. **Users**: Existing currency selections remain in metadata

## Support and Troubleshooting

### Common Issues

1. **Currency not detected for existing users**

   * Check migration script execution

   * Verify user has transaction history

   * Manually set currency in user metadata

2. **Onboarding dialog not appearing**

   * Check user metadata for currency field

   * Verify AuthContext integration

   * Check console for JavaScript errors

3. **Transaction forms not using correct currency**

   * Verify user metadata is loaded

   * Check CurrencyInput component integration

   * Ensure form submission includes currency

### Monitoring Queries

```sql
-- Check currency distribution
SELECT currency, COUNT(*) 
FROM transactions 
GROUP BY currency;

-- Check users without currency selection
SELECT COUNT(*) 
FROM auth.users 
WHERE raw_user_meta_data->>'currency' IS NULL;

-- Check recent currency selections
SELECT 
  raw_user_meta_data->>'currency' as currency,
  raw_user_meta_data->>'currency_selected_at' as selected_at,
  COUNT(*)
FROM auth.users 
WHERE raw_user_meta_data->>'currency_selected_at' IS NOT NULL
GROUP BY currency, selected_at
ORDER BY selected_at DESC;
```

