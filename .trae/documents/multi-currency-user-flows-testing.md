# Multi-Currency User Flows & Testing Strategy

## User Experience Flows

### 1. New User Onboarding Flow

#### 1.1 Currency Selection During Registration

**Flow Steps:**
1. User completes email registration
2. User verifies email and logs in
3. Welcome screen displays with currency selection prompt
4. User sees currency options (IDR and USD) with clear descriptions
5. User selects preferred currency
6. System saves currency preference to user profile
7. User proceeds to dashboard with selected currency active

**UX Considerations:**
- Currency selection should feel natural and not overwhelming
- Clear visual indicators for each currency option
- Brief explanation of why currency selection matters
- Option to change currency later should be mentioned
- Default selection based on user's location (if available)

**Error Handling:**
- Network failure during currency save: Show retry option
- Invalid currency selection: Prevent progression with clear message
- Session timeout: Preserve selection and allow re-authentication

### 1.2 First Transaction Creation

**Flow Steps:**
1. User navigates to "Add Transaction" from dashboard
2. Form displays with currency-aware input fields
3. Amount input shows selected currency symbol
4. Real-time conversion display shows equivalent in alternate currency
5. User completes transaction details
6. Transaction is saved with original currency preserved
7. Dashboard updates showing transaction in user's preferred currency

**UX Enhancements:**
- Smooth animations for conversion updates
- Clear indication of which currency is being used
- Helpful tooltips explaining conversion rates
- Visual feedback when conversion rates update

### 2. Existing User Currency Change Flow

#### 2.1 Accessing Currency Settings

**Flow Steps:**
1. User navigates to Profile page
2. User finds "Currency Settings" section
3. Current currency is clearly displayed with last update time
4. "Change Currency" button is prominently available
5. User clicks to initiate currency change

#### 2.2 Currency Change Process

**Flow Steps:**
1. Currency change modal/page opens
2. Current currency is highlighted
3. Available currency options are displayed
4. User selects new currency
5. System presents conversion options:
   - Convert all existing data to new currency
   - Keep original currencies but display in new preference
6. User makes conversion choice
7. Confirmation dialog shows impact of change
8. User confirms currency change
9. System processes change with loading indicator
10. Success message confirms change
11. User returns to dashboard with new currency active

**Conversion Options Explained:**
- **Convert All Data**: Historical transactions show converted amounts
- **Keep Original**: Transactions maintain original currency, display shows conversions

**UX Considerations:**
- Clear explanation of each conversion option
- Preview of how data will look after change
- Ability to cancel at any point
- Progress indicator for conversion process
- Confirmation of successful change

### 3. Multi-Currency Transaction Management

#### 3.1 Transaction Creation with Currency Awareness

**Enhanced Flow:**
1. User opens transaction form
2. Currency selector shows user's preferred currency by default
3. Option to change currency for this specific transaction
4. Real-time conversion display updates as user types
5. Exchange rate information is visible
6. User can toggle between currencies to see equivalent amounts
7. Transaction saves with both original and converted amounts

#### 3.2 Transaction History with Currency Context

**Flow Features:**
- Transactions display original currency alongside amounts
- Filter options include currency type
- Conversion tooltips show current equivalent values
- Currency change history is tracked
- Export options respect currency preferences

### 4. Currency Calculator & Conversion Tools

#### 4.1 Standalone Currency Calculator

**Flow Steps:**
1. User accesses calculator from main menu or dashboard widget
2. Calculator shows current exchange rates
3. User enters amount in source currency
4. Real-time conversion to target currency
5. Rate information and last update time displayed
6. Option to refresh rates manually
7. Quick conversion between user's currencies

#### 4.2 Dashboard Currency Overview

**Features:**
- Total balance in user's preferred currency
- Individual wallet balances with conversion indicators
- Exchange rate widget showing current rates
- Rate change indicators (up/down arrows)
- Quick access to currency settings

## Testing Strategy

### 1. Unit Testing

#### 1.1 Currency Utilities Testing

```typescript
// Test file: src/utils/__tests__/currency.test.ts

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format IDR correctly', () => {
      expect(formatCurrency(1500000, 'IDR')).toBe('Rp 1.500.000');
    });
    
    it('should format USD correctly', () => {
      expect(formatCurrency(1500.50, 'USD')).toBe('$ 1,500.50');
    });
  });
  
  describe('parseCurrency', () => {
    it('should parse IDR correctly', () => {
      expect(parseCurrency('Rp 1.500.000', 'IDR')).toBe(1500000);
    });
    
    it('should parse USD correctly', () => {
      expect(parseCurrency('$ 1,500.50', 'USD')).toBe(1500.50);
    });
    
    it('should throw error for invalid format', () => {
      expect(() => parseCurrency('invalid', 'IDR')).toThrow();
    });
  });
});
```

#### 1.2 Exchange Rate Service Testing

```typescript
// Test file: src/services/__tests__/exchangeRateService.test.ts

describe('ExchangeRateService', () => {
  beforeEach(() => {
    // Mock fetch and localStorage
    global.fetch = jest.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      }
    });
  });
  
  it('should return 1 for same currency conversion', async () => {
    const rate = await exchangeRateService.getCurrentRate('USD', 'USD');
    expect(rate).toBe(1);
  });
  
  it('should fetch rate from API when not cached', async () => {
    const mockResponse = {
      success: true,
      rates: { IDR: 15750 }
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });
    
    const rate = await exchangeRateService.getCurrentRate('USD', 'IDR');
    expect(rate).toBe(15750);
  });
});
```

#### 1.3 Custom Hooks Testing

```typescript
// Test file: src/hooks/__tests__/useCurrency.test.ts

import { renderHook, act } from '@testing-library/react';
import { useCurrency } from '../useCurrency';

describe('useCurrency', () => {
  it('should initialize with default currency', () => {
    const { result } = renderHook(() => useCurrency());
    expect(result.current.userCurrency).toBe('IDR');
  });
  
  it('should change currency successfully', async () => {
    const { result } = renderHook(() => useCurrency());
    
    await act(async () => {
      await result.current.changeCurrency('USD');
    });
    
    expect(result.current.userCurrency).toBe('USD');
  });
});
```

### 2. Integration Testing

#### 2.1 Currency Selection Flow

```typescript
// Test file: src/components/__tests__/CurrencySelection.integration.test.tsx

describe('Currency Selection Integration', () => {
  it('should complete currency selection flow', async () => {
    render(<CurrencySelectionFlow />);
    
    // Select USD currency
    fireEvent.click(screen.getByText('US Dollar'));
    
    // Continue to next step
    fireEvent.click(screen.getByText('Continue'));
    
    // Verify currency is saved
    await waitFor(() => {
      expect(screen.getByText('Currency preference saved')).toBeInTheDocument();
    });
  });
});
```

#### 2.2 Transaction Creation with Currency

```typescript
// Test file: src/components/__tests__/TransactionForm.integration.test.tsx

describe('Transaction Form Integration', () => {
  it('should create transaction with currency conversion', async () => {
    render(<TransactionForm />);
    
    // Enter amount
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '100' }
    });
    
    // Verify conversion is displayed
    await waitFor(() => {
      expect(screen.getByText(/≈ Rp/)).toBeInTheDocument();
    });
    
    // Submit transaction
    fireEvent.click(screen.getByText('Save Transaction'));
    
    // Verify transaction is created
    await waitFor(() => {
      expect(screen.getByText('Transaction saved')).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Testing

#### 3.1 Complete User Journey

```typescript
// Test file: e2e/currency-flow.spec.ts

import { test, expect } from '@playwright/test';

test('complete currency selection and usage flow', async ({ page }) => {
  // Register new user
  await page.goto('/register');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="register-button"]');
  
  // Select currency during onboarding
  await expect(page.locator('text=Choose Your Currency')).toBeVisible();
  await page.click('[data-testid="currency-usd"]');
  await page.click('[data-testid="continue-button"]');
  
  // Verify dashboard shows USD
  await expect(page.locator('text=$')).toBeVisible();
  
  // Create transaction
  await page.click('[data-testid="add-transaction"]');
  await page.fill('[data-testid="amount"]', '100');
  await page.fill('[data-testid="description"]', 'Test transaction');
  await page.click('[data-testid="save-transaction"]');
  
  // Verify transaction appears with correct currency
  await expect(page.locator('text=$ 100')).toBeVisible();
  
  // Change currency in profile
  await page.click('[data-testid="profile-menu"]');
  await page.click('[data-testid="currency-settings"]');
  await page.click('[data-testid="change-currency"]');
  await page.click('[data-testid="currency-idr"]');
  await page.click('[data-testid="convert-existing"]');
  await page.click('[data-testid="confirm-change"]');
  
  // Verify currency change is applied
  await expect(page.locator('text=Rp')).toBeVisible();
});
```

### 4. Performance Testing

#### 4.1 Exchange Rate API Performance

```typescript
// Test file: src/services/__tests__/exchangeRateService.performance.test.ts

describe('Exchange Rate Performance', () => {
  it('should cache rates to avoid excessive API calls', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    
    // First call should fetch from API
    await exchangeRateService.getCurrentRate('USD', 'IDR');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    
    // Second call should use cache
    await exchangeRateService.getCurrentRate('USD', 'IDR');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
  
  it('should handle multiple concurrent rate requests', async () => {
    const promises = Array(10).fill(null).map(() => 
      exchangeRateService.getCurrentRate('USD', 'IDR')
    );
    
    const rates = await Promise.all(promises);
    
    // All rates should be the same
    expect(rates.every(rate => rate === rates[0])).toBe(true);
  });
});
```

### 5. Accessibility Testing

#### 5.1 Currency Selection Accessibility

```typescript
// Test file: src/components/__tests__/CurrencySelection.a11y.test.tsx

describe('Currency Selection Accessibility', () => {
  it('should be accessible to screen readers', async () => {
    const { container } = render(<CurrencySelection />);
    
    // Check for proper ARIA labels
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    
    // Check for keyboard navigation
    const firstOption = screen.getAllByRole('radio')[0];
    firstOption.focus();
    fireEvent.keyDown(firstOption, { key: 'ArrowDown' });
    
    expect(screen.getAllByRole('radio')[1]).toHaveFocus();
  });
  
  it('should have proper color contrast', async () => {
    const { container } = render(<CurrencySelection />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 6. Error Handling Testing

#### 6.1 Network Failure Scenarios

```typescript
// Test file: src/services/__tests__/exchangeRateService.error.test.ts

describe('Exchange Rate Error Handling', () => {
  it('should handle API failure gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(
      exchangeRateService.getCurrentRate('USD', 'IDR')
    ).rejects.toThrow('Unable to fetch current exchange rate');
  });
  
  it('should fallback to cached rates when API fails', async () => {
    // Setup cache with rate
    localStorage.setItem('duitr_exchange_rates', JSON.stringify({
      'USD_IDR': { rate: 15000, timestamp: Date.now() }
    }));
    
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const rate = await exchangeRateService.getCurrentRate('USD', 'IDR');
    expect(rate).toBe(15000);
  });
});
```

### 7. Data Migration Testing

#### 7.1 Existing User Data Migration

```typescript
// Test file: src/services/__tests__/dataMigration.test.ts

describe('Data Migration', () => {
  it('should migrate existing transactions to multi-currency format', async () => {
    // Setup existing transaction data
    const existingTransactions = [
      { id: '1', amount: 100000, currency: null },
      { id: '2', amount: 250000, currency: null }
    ];
    
    // Run migration
    await migrationService.migrateTransactionsToCurrency(existingTransactions);
    
    // Verify migration results
    const migratedTransactions = await getTransactions();
    
    migratedTransactions.forEach(transaction => {
      expect(transaction.original_currency).toBe('IDR');
      expect(transaction.converted_currency).toBe('IDR');
      expect(transaction.exchange_rate).toBe(1.0);
    });
  });
});
```

## Quality Assurance Checklist

### Functional Testing
- [ ] Currency selection during onboarding works correctly
- [ ] Currency change in profile settings functions properly
- [ ] Transaction creation respects currency preferences
- [ ] Exchange rate conversion displays accurately
- [ ] Historical transaction currency is preserved
- [ ] Currency filtering in transaction history works
- [ ] Export functionality respects currency settings
- [ ] Currency calculator provides accurate conversions

### User Experience Testing
- [ ] Currency selection is intuitive and clear
- [ ] Conversion displays are helpful and not overwhelming
- [ ] Loading states are appropriate for rate fetching
- [ ] Error messages are user-friendly and actionable
- [ ] Currency change process is well-explained
- [ ] Mobile experience is optimized for currency features

### Performance Testing
- [ ] Exchange rate caching reduces API calls
- [ ] Currency conversion calculations are fast
- [ ] Large transaction lists load efficiently
- [ ] Database queries are optimized for currency filtering
- [ ] Memory usage is reasonable with currency data

### Security Testing
- [ ] Currency preference changes require authentication
- [ ] Exchange rate API responses are validated
- [ ] User input for currency amounts is sanitized
- [ ] Currency codes are validated against supported list
- [ ] API keys are securely stored and not exposed

### Accessibility Testing
- [ ] Currency selection is keyboard navigable
- [ ] Screen readers can access currency information
- [ ] Color contrast meets WCAG guidelines
- [ ] Currency symbols are properly announced
- [ ] Form validation messages are accessible

### Browser Compatibility
- [ ] Currency formatting works across browsers
- [ ] Local storage caching functions properly
- [ ] Number input handling is consistent
- [ ] Exchange rate API calls work in all browsers
- [ ] Currency symbols display correctly

### Edge Cases
- [ ] Handles very large currency amounts
- [ ] Manages very small decimal amounts
- [ ] Deals with network connectivity issues
- [ ] Handles API rate limiting
- [ ] Manages concurrent currency changes
- [ ] Handles invalid exchange rate responses

This comprehensive testing strategy ensures the multi-currency feature is robust, user-friendly, and performs well across all scenarios.