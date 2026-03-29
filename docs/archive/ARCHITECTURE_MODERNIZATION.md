# 🏗️ ARCHITECTURE MODERNIZATION PLAN - DUITR

**Version:** 1.0  
**Date:** November 2, 2025  
**Target Completion:** Q1 2026 (12 weeks)  
**Current Architecture Score:** 6.5/10  
**Target Architecture Score:** 9.0/10

---

## 📊 EXECUTIVE SUMMARY

Duitr is a personal finance management application built with React 18, TypeScript, and Supabase. While the application demonstrates solid foundational architecture, it faces critical challenges in state management, testing, and scalability. This modernization plan provides a strategic roadmap to transform Duitr from a good MVP into an enterprise-grade, maintainable, and scalable application.

### Key Findings

**Critical Pain Points:**
- **State Management (4/10)**: Monolithic FinanceContext (1,631 lines) creates tight coupling and poor maintainability
- **Test Coverage (2/10)**: All tests broken, no safety net for refactoring
- **Performance (5/10)**: Unnecessary re-renders, no optimization patterns
- **File Organization**: Single files exceeding 1,600 lines (3x recommended maximum)
- **Security (Moderate)**: XSS vulnerabilities fixed, but rate limiting & CSP hardening needed

**Strategic Priorities:**
1. **Decompose State Management** - Break monolithic context into domain-bounded services
2. **Establish Test Coverage** - Build comprehensive test suite (70%+ coverage target)
3. **Optimize Performance** - Implement memoization, code splitting, and lazy loading
4. **Harden Security** - API rate limiting, CSP policy tightening, CSRF protection
5. **Enable Scalability** - Architecture patterns supporting 100k+ users

---

## 🎯 BEFORE/AFTER ARCHITECTURE

### Current Architecture (6.5/10)

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
│  (Mixed concerns, tight coupling to FinanceContext)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MONOLITHIC FinanceContext                      │
│  • 1,631 lines (3x recommended size)                        │
│  • All business logic mixed together                        │
│  • transactions, budgets, wallets, pinjaman, want_to_buy    │
│  • Direct Supabase calls scattered throughout               │
│  • React Query underutilized (only for categories)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Client                          │
│  (PostgreSQL + Row Level Security)                          │
└─────────────────────────────────────────────────────────────┘

PROBLEMS:
❌ Every context change triggers re-render of ALL consumers
❌ Impossible to test business logic in isolation
❌ No caching strategy for server data
❌ Tight coupling between UI and data layer
❌ CategoryService pattern not extended to other domains
```

### Target Architecture (9.0/10)

```
┌─────────────────────────────────────────────────────────────┐
│                 React Components                            │
│  (Presentation only, thin wrappers around hooks)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Domain-Specific Hooks Layer                    │
│  • useTransactions (React Query)                            │
│  • useBudgets (React Query)                                 │
│  • useWallets (React Query)                                 │
│  • usePinjaman (React Query)                                │
│  • useWantToBuy (React Query)                               │
│  • useCategories (React Query) ✅ Already implemented       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Transaction  │  │   Budget     │  │   Wallet     │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Pinjaman    │  │ WantToBuy    │  │  Category    │     │
│  │   Service    │  │   Service    │  │   Service    │✅   │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  • Zod validation                                           │
│  • Error handling                                           │
│  • Mock implementations for testing                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Data Access Layer (Supabase Client)                 │
│  • Typed queries                                            │
│  • Optimistic updates                                       │
│  • Automatic cache invalidation                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         PostgreSQL + Supabase Edge Functions                │
│  • Row Level Security (RLS) ✅                              │
│  • Optimized indexes ✅                                     │
│  • Rate limiting (NEW)                                      │
└─────────────────────────────────────────────────────────────┘

BENEFITS:
✅ Granular caching per domain (React Query)
✅ Isolated business logic (testable in isolation)
✅ Optimistic updates for instant UI feedback
✅ Minimal re-renders (only affected components update)
✅ Service layer can be mocked for testing
✅ Clear separation of concerns
```

---

## 🔧 DETAILED RECOMMENDATIONS

### 1. STATE MANAGEMENT ARCHITECTURE (Priority: CRITICAL)

**Current State (4/10):**
- Monolithic FinanceContext with 1,631 lines
- React Query used only for categories (via useCategories hook)
- All other data managed in Context with manual state updates
- No caching strategy for financial data
- Every state change causes full context re-render

**Recommended Architecture: Services + React Query + Minimal Context**

#### Why This Hybrid Approach?

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Redux Toolkit** | Mature, DevTools, middleware | Boilerplate, learning curve | ❌ Overkill for Duitr's size |
| **Zustand** | Minimal, easy to learn | No built-in async handling | ⚠️ Good, but missing server state |
| **Jotai** | Atomic updates, modern | New paradigm to learn | ⚠️ Good for client state only |
| **React Query + Services** | Best server state caching, optimistic updates, automatic invalidation | Requires service layer setup | ✅ **RECOMMENDED** |

**Recommended Stack:**
```typescript
// Services Layer (Business Logic + Data Access)
// ✅ Already proven with CategoryService

// React Query (Server State Management)
// ✅ Already used for categories with excellent results

// React Context (Client-Only State)
// Theme, language, UI preferences only
```

#### Implementation Strategy

**Phase 1: Extend Service Pattern (Week 1-2)**

Follow the proven CategoryService pattern:

```typescript
// src/services/transactionService.ts
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import type { Transaction } from '@/types/finance';

// Zod validation schemas
const transactionSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.number().int().positive(),
  description: z.string().min(1).max(500),
  date: z.string().datetime(),
  type: z.enum(['income', 'expense', 'transfer']),
  walletId: z.string().uuid(),
  destinationWalletId: z.string().uuid().optional(),
  fee: z.number().nonnegative().optional(),
});

class TransactionService {
  /**
   * Get all transactions for a user
   * Includes wallet balance updates (atomic operation)
   */
  async getAll(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
    return data || [];
  }

  /**
   * Create transaction with atomic wallet balance update
   * Uses Supabase RPC for transaction safety
   */
  async create(
    input: Omit<Transaction, 'id' | 'userId'>, 
    userId: string
  ): Promise<Transaction> {
    // Validate input
    const validated = transactionSchema.parse(input);
    
    // Use Supabase RPC function for atomic operation
    const { data, error } = await supabase
      .rpc('create_transaction_with_wallet_update', {
        p_user_id: userId,
        p_amount: validated.amount,
        p_category_id: validated.categoryId,
        p_description: validated.description,
        p_date: validated.date,
        p_type: validated.type,
        p_wallet_id: validated.walletId,
        p_destination_wallet_id: validated.destinationWalletId,
        p_fee: validated.fee || 0,
      });
    
    if (error) throw new Error(`Failed to create transaction: ${error.message}`);
    return data;
  }

  /**
   * Update transaction with balance adjustments
   */
  async update(
    id: string, 
    input: Partial<Transaction>, 
    userId: string
  ): Promise<Transaction> {
    // Similar RPC implementation
    // ...
  }

  /**
   * Delete transaction with balance restoration
   */
  async delete(id: string, userId: string): Promise<void> {
    // RPC for atomic operation
    // ...
  }
  
  /**
   * Get monthly summary (cached by React Query)
   */
  async getMonthlySummary(userId: string, month: number, year: number) {
    const { data, error } = await supabase
      .rpc('get_monthly_summary', {
        p_user_id: userId,
        p_month: month,
        p_year: year,
      });
    
    if (error) throw error;
    return data;
  }
}

export const transactionService = new TransactionService();
```

**Phase 2: Create React Query Hooks (Week 2-3)**

```typescript
// src/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import transactionService from '@/services/transactionService';

export const useTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch transactions (automatically cached)
  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => transactionService.getAll(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (input: Omit<Transaction, 'id' | 'userId'>) =>
      transactionService.create(input, user!.id),
    
    // Optimistic update for instant UI feedback
    onMutate: async (newTransaction) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transactions', user?.id] });
      
      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData(['transactions', user?.id]);
      
      // Optimistically update cache
      queryClient.setQueryData(['transactions', user?.id], (old: Transaction[]) => [
        { ...newTransaction, id: 'temp-' + Date.now(), userId: user!.id },
        ...old,
      ]);
      
      return { previousTransactions };
    },
    
    // On success, invalidate to get real data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallets', user?.id] }); // Balances changed
      toast({ title: 'Transaction created successfully' });
    },
    
    // On error, rollback optimistic update
    onError: (error, variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions', user?.id], context.previousTransactions);
      }
      toast({ variant: 'destructive', title: 'Failed to create transaction' });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    createTransaction: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};
```

**Phase 3: Supabase Database Functions (Week 3)**

```sql
-- Create atomic transaction creation function
-- Ensures wallet balance and transaction creation are atomic
CREATE OR REPLACE FUNCTION create_transaction_with_wallet_update(
  p_user_id UUID,
  p_amount DECIMAL,
  p_category_id INTEGER,
  p_description TEXT,
  p_date TIMESTAMPTZ,
  p_type TEXT,
  p_wallet_id UUID,
  p_destination_wallet_id UUID DEFAULT NULL,
  p_fee DECIMAL DEFAULT 0
) RETURNS transactions AS $$
DECLARE
  v_transaction transactions;
  v_source_wallet wallets;
  v_dest_wallet wallets;
BEGIN
  -- Validate wallet ownership
  SELECT * INTO v_source_wallet
  FROM wallets
  WHERE id = p_wallet_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source wallet not found or not owned by user';
  END IF;
  
  -- Handle different transaction types
  IF p_type = 'expense' THEN
    -- Check sufficient balance
    IF v_source_wallet.balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance in wallet';
    END IF;
    
    -- Update wallet balance
    UPDATE wallets
    SET balance = balance - p_amount
    WHERE id = p_wallet_id;
    
  ELSIF p_type = 'income' THEN
    -- Add to wallet balance
    UPDATE wallets
    SET balance = balance + p_amount
    WHERE id = p_wallet_id;
    
  ELSIF p_type = 'transfer' THEN
    -- Validate destination wallet
    SELECT * INTO v_dest_wallet
    FROM wallets
    WHERE id = p_destination_wallet_id AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Destination wallet not found or not owned by user';
    END IF;
    
    -- Check sufficient balance (amount + fee)
    IF v_source_wallet.balance < (p_amount + p_fee) THEN
      RAISE EXCEPTION 'Insufficient balance for transfer';
    END IF;
    
    -- Update source wallet (deduct amount + fee)
    UPDATE wallets
    SET balance = balance - (p_amount + p_fee)
    WHERE id = p_wallet_id;
    
    -- Update destination wallet (add amount)
    UPDATE wallets
    SET balance = balance + p_amount
    WHERE id = p_destination_wallet_id;
  END IF;
  
  -- Create transaction record
  INSERT INTO transactions (
    user_id,
    amount,
    category_id,
    description,
    date,
    type,
    wallet_id,
    destination_wallet_id,
    fee
  ) VALUES (
    p_user_id,
    p_amount,
    p_category_id,
    p_description,
    p_date,
    p_type,
    p_wallet_id,
    p_destination_wallet_id,
    p_fee
  ) RETURNING * INTO v_transaction;
  
  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_transaction_with_wallet_update TO authenticated;
```

**Services to Create:**

1. ✅ **CategoryService** (Already implemented)
2. **TransactionService** - Transaction CRUD + validation
3. **WalletService** - Wallet management + balance calculations
4. **BudgetService** - Budget tracking + spending analysis
5. **PinjamanService** - Loan/debt management
6. **WantToBuyService** - Wishlist management
7. **ExportService** (✅ Already exists, refactor to match pattern)

**Caching Strategy for Financial Data:**

```typescript
// Different staleTime based on data volatility
const CACHE_CONFIG = {
  // High-frequency updates
  transactions: {
    staleTime: 30 * 1000,      // 30 seconds
    gcTime: 5 * 60 * 1000,     // 5 minutes
  },
  
  // Medium-frequency updates
  wallets: {
    staleTime: 60 * 1000,      // 1 minute
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  
  // Low-frequency updates
  categories: {
    staleTime: 5 * 60 * 1000,  // 5 minutes (already implemented)
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  
  budgets: {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  
  // Static data
  exchangeRates: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
};
```

**Context Simplification:**

After migrating to services + React Query, Context should ONLY handle:

```typescript
// Minimal FinanceContext (client state only)
interface FinanceContextType {
  // Display preferences
  currency: string;
  formatCurrency: (amount: number) => string;
  
  // Derived calculations (memoized)
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

// All data fetching happens via hooks:
// - useTransactions()
// - useWallets()
// - useBudgets()
// - etc.
```

---

### 2. SERVICE LAYER MODERNIZATION (Priority: HIGH)

**Benefits of Service Layer:**
- ✅ Single source of truth for business logic
- ✅ Testable in isolation (no React required)
- ✅ Reusable across components
- ✅ Easy to mock for testing
- ✅ Clear error handling strategy
- ✅ Zod validation at the boundary

**Service Template:**

```typescript
// src/services/baseService.ts
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export abstract class BaseService<T> {
  protected abstract tableName: string;
  protected abstract schema: z.ZodSchema<T>;
  
  async getAll(userId: string): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to fetch: ${error.message}`);
    return data || [];
  }
  
  async getById(id: string, userId: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch: ${error.message}`);
    }
    
    return data;
  }
  
  protected validate(input: unknown): T {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.message}`);
    }
    return result.data;
  }
}
```

**Zod Schema Integration:**

```typescript
// src/schemas/transaction.schema.ts
import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(1_000_000_000, 'Amount exceeds maximum'),
  categoryId: z.number().int().positive(),
  description: z.string()
    .min(1, 'Description required')
    .max(500, 'Description too long'),
  date: z.string().datetime(),
  type: z.enum(['income', 'expense', 'transfer']),
  walletId: z.string().uuid(),
  destinationWalletId: z.string().uuid().optional(),
  fee: z.number().nonnegative().optional(),
}).refine(
  (data) => {
    // Transfer requires destination wallet
    if (data.type === 'transfer' && !data.destinationWalletId) {
      return false;
    }
    return true;
  },
  { message: 'Transfer requires destination wallet' }
);

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
```

**Error Handling Strategy:**

```typescript
// src/lib/errors.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class InsufficientBalanceError extends ServiceError {
  constructor() {
    super('Insufficient wallet balance', 'INSUFFICIENT_BALANCE', 400);
  }
}
```

**Mock Service for Testing:**

```typescript
// src/services/__mocks__/transactionService.ts
import { Transaction } from '@/types/finance';

class MockTransactionService {
  private mockTransactions: Transaction[] = [];
  
  async getAll(userId: string): Promise<Transaction[]> {
    return this.mockTransactions.filter(t => t.userId === userId);
  }
  
  async create(input: any, userId: string): Promise<Transaction> {
    const transaction: Transaction = {
      ...input,
      id: `mock-${Date.now()}`,
      userId,
    };
    this.mockTransactions.push(transaction);
    return transaction;
  }
  
  // Test helpers
  resetMocks() {
    this.mockTransactions = [];
  }
  
  setMockData(transactions: Transaction[]) {
    this.mockTransactions = transactions;
  }
}

export const transactionService = new MockTransactionService();
```

---

### 3. TESTING ARCHITECTURE (Priority: CRITICAL)

**Current State (2/10):**
- All tests broken
- No test strategy
- No mock infrastructure
- Zero confidence in refactoring

**Target State (8/10):**
- 70%+ code coverage
- Test pyramid: 70% unit, 20% integration, 10% E2E
- Fast test execution (<5s for unit tests)
- Automated CI/CD testing

#### Test Pyramid Strategy

```
        ╱╲
       ╱  ╲         E2E Tests (10%)
      ╱────╲        - Critical user flows
     ╱      ╲       - Playwright/Cypress
    ╱────────╲      
   ╱          ╲     Integration Tests (20%)
  ╱────────────╲    - Service + Database
 ╱              ╲   - React Query hooks
╱────────────────╲  
                    Unit Tests (70%)
                    - Services
                    - Utilities
                    - Components
```

**Phase 1: Service Layer Tests (Week 4)**

```typescript
// src/services/__tests__/transactionService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { transactionService } from '../transactionService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('TransactionService', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getAll', () => {
    it('should fetch all transactions for user', async () => {
      const mockTransactions = [
        { id: '1', amount: 100, type: 'expense', user_id: mockUserId },
        { id: '2', amount: 200, type: 'income', user_id: mockUserId },
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTransactions,
              error: null,
            }),
          }),
        }),
      } as any);
      
      const result = await transactionService.getAll(mockUserId);
      
      expect(result).toEqual(mockTransactions);
      expect(supabase.from).toHaveBeenCalledWith('transactions');
    });
    
    it('should throw error on database failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);
      
      await expect(transactionService.getAll(mockUserId))
        .rejects
        .toThrow('Failed to fetch transactions: Database error');
    });
  });
  
  describe('create', () => {
    it('should create expense transaction and update wallet', async () => {
      const input = {
        amount: 100,
        categoryId: 1,
        description: 'Coffee',
        date: '2025-11-02T10:00:00Z',
        type: 'expense' as const,
        walletId: 'wallet-1',
      };
      
      const mockTransaction = { ...input, id: 'txn-1', userId: mockUserId };
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockTransaction,
        error: null,
      });
      
      const result = await transactionService.create(input, mockUserId);
      
      expect(result).toEqual(mockTransaction);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'create_transaction_with_wallet_update',
        expect.objectContaining({
          p_user_id: mockUserId,
          p_amount: 100,
          p_type: 'expense',
        })
      );
    });
    
    it('should validate input and reject invalid data', async () => {
      const invalidInput = {
        amount: -100, // Negative amount
        categoryId: 1,
        description: '',
        date: 'invalid-date',
        type: 'expense' as const,
        walletId: 'wallet-1',
      };
      
      await expect(transactionService.create(invalidInput, mockUserId))
        .rejects
        .toThrow('Validation failed');
    });
    
    it('should handle insufficient balance error', async () => {
      const input = {
        amount: 1000,
        categoryId: 1,
        description: 'Expensive item',
        date: '2025-11-02T10:00:00Z',
        type: 'expense' as const,
        walletId: 'wallet-1',
      };
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Insufficient balance in wallet' },
      });
      
      await expect(transactionService.create(input, mockUserId))
        .rejects
        .toThrow('Insufficient balance');
    });
  });
  
  describe('transfer transactions', () => {
    it('should create transfer with fee calculation', async () => {
      const input = {
        amount: 100,
        categoryId: 18, // system_transfer
        description: 'Transfer to savings',
        date: '2025-11-02T10:00:00Z',
        type: 'transfer' as const,
        walletId: 'wallet-1',
        destinationWalletId: 'wallet-2',
        fee: 5,
      };
      
      const mockTransaction = { ...input, id: 'txn-1', userId: mockUserId };
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockTransaction,
        error: null,
      });
      
      const result = await transactionService.create(input, mockUserId);
      
      expect(result).toEqual(mockTransaction);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'create_transaction_with_wallet_update',
        expect.objectContaining({
          p_destination_wallet_id: 'wallet-2',
          p_fee: 5,
        })
      );
    });
  });
});
```

**Phase 2: Hook Tests with React Query (Week 5)**

```typescript
// src/hooks/__tests__/useTransactions.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransactions } from '../useTransactions';
import { transactionService } from '@/services/transactionService';
import { vi } from 'vitest';

// Mock the service
vi.mock('@/services/transactionService');

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

describe('useTransactions', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('should fetch transactions on mount', async () => {
    const mockTransactions = [
      { id: '1', amount: 100, type: 'expense' },
    ];
    
    vi.mocked(transactionService.getAll).mockResolvedValue(mockTransactions);
    
    const { result } = renderHook(() => useTransactions(), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.transactions).toEqual(mockTransactions);
    expect(transactionService.getAll).toHaveBeenCalledWith('user-123');
  });
  
  it('should create transaction with optimistic update', async () => {
    vi.mocked(transactionService.getAll).mockResolvedValue([]);
    vi.mocked(transactionService.create).mockResolvedValue({
      id: 'new-txn',
      amount: 100,
      type: 'expense',
      userId: 'user-123',
    } as any);
    
    const { result } = renderHook(() => useTransactions(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Create transaction
    result.current.createTransaction({
      amount: 100,
      categoryId: 1,
      description: 'Test',
      date: '2025-11-02',
      type: 'expense',
      walletId: 'wallet-1',
    });
    
    // Should show optimistic update immediately
    await waitFor(() => {
      expect(result.current.transactions.length).toBeGreaterThan(0);
    });
  });
});
```

**Phase 3: Component Tests (Week 6)**

```typescript
// src/components/transactions/__tests__/TransactionForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionForm } from '../TransactionForm';
import { useTransactions } from '@/hooks/useTransactions';

vi.mock('@/hooks/useTransactions');
vi.mock('@/hooks/useCategories');
vi.mock('@/hooks/useWallets');

describe('TransactionForm', () => {
  const mockCreateTransaction = vi.fn();
  
  beforeEach(() => {
    vi.mocked(useTransactions).mockReturnValue({
      createTransaction: mockCreateTransaction,
      isCreating: false,
    } as any);
  });
  
  it('should render all form fields', () => {
    render(<TransactionForm type="expense" />);
    
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    render(<TransactionForm type="expense" />);
    
    const submitButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });
    
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });
  
  it('should submit valid expense transaction', async () => {
    const user = userEvent.setup();
    render(<TransactionForm type="expense" />);
    
    // Fill form
    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Groceries');
    await user.type(screen.getByLabelText(/description/i), 'Weekly shopping');
    
    // Submit
    await user.click(screen.getByRole('button', { name: /add/i }));
    
    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith({
        amount: 100,
        categoryId: expect.any(Number),
        description: 'Weekly shopping',
        type: 'expense',
        date: expect.any(String),
        walletId: expect.any(String),
      });
    });
  });
});
```

**Test Infrastructure Setup:**

```typescript
// vitest.config.ts (already exists, enhance it)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'dist/',
      ],
      // Coverage thresholds
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// src/test/setup.ts (enhance existing)
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Supabase client globally
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**Coverage Targets:**

| Component Type | Target Coverage | Priority |
|----------------|-----------------|----------|
| Services | 90%+ | CRITICAL |
| Hooks | 80%+ | HIGH |
| Utilities | 90%+ | HIGH |
| Components | 70%+ | MEDIUM |
| Pages | 60%+ | LOW |

**Testing Strategy:**

1. **Week 4**: Service layer tests (all services 90%+ coverage)
2. **Week 5**: Hook tests (React Query hooks 80%+ coverage)
3. **Week 6**: Component tests (form components, critical UI)
4. **Week 7**: Integration tests (service + database interactions)
5. **Week 8**: E2E tests (3-5 critical user flows with Playwright)

**E2E Test Example:**

```typescript
// tests/e2e/transaction-flow.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('Transaction Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });
  
  test('should create expense and update balance', async ({ page }) => {
    // Get initial balance
    const initialBalance = await page.locator('[data-testid="total-balance"]').textContent();
    
    // Navigate to transactions
    await page.click('a[href="/transactions"]');
    await expect(page).toHaveURL('/transactions');
    
    // Open expense form
    await page.click('button:has-text("Add Expense")');
    
    // Fill form
    await page.fill('[name="amount"]', '50');
    await page.selectOption('[name="category"]', { label: 'Groceries' });
    await page.fill('[name="description"]', 'Weekly shopping');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success toast
    await expect(page.locator('.toast')).toContainText('Transaction created');
    
    // Verify transaction appears in list
    await expect(page.locator('text=Weekly shopping')).toBeVisible();
    
    // Verify balance updated
    await page.goto('/dashboard');
    const newBalance = await page.locator('[data-testid="total-balance"]').textContent();
    expect(newBalance).not.toBe(initialBalance);
  });
});
```

---

### 4. PERFORMANCE ARCHITECTURE (Priority: HIGH)

**Current State (5/10):**
- No code splitting beyond lazy routes
- No component memoization
- Unnecessary re-renders in FinanceContext consumers
- No prefetching strategy
- PWA caching needs optimization

**Target State (9/10):**
- Route-based code splitting ✅ (already implemented)
- Component optimization (memo, useMemo, useCallback)
- React Query prefetching for anticipated navigation
- Optimized PWA caching with background sync
- Virtual scrolling for large lists

#### Performance Optimization Patterns

**1. Component Memoization**

```typescript
// src/components/transactions/TransactionList.tsx
import React, { memo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionItem } from './TransactionItem';

// Memoized list component
export const TransactionList = memo(() => {
  const { transactions, isLoading } = useTransactions();
  
  if (isLoading) return <LoadingSkeleton />;
  
  return (
    <div className="space-y-2">
      {transactions.map(transaction => (
        <TransactionItem 
          key={transaction.id} 
          transaction={transaction} 
        />
      ))}
    </div>
  );
});

TransactionList.displayName = 'TransactionList';

// Memoized item component with stable props
export const TransactionItem = memo<{ transaction: Transaction }>(
  ({ transaction }) => {
    // Component never re-renders unless transaction changes
    return (
      <div className="p-4 border rounded">
        {/* ... */}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for deep equality
    return prevProps.transaction.id === nextProps.transaction.id &&
           prevProps.transaction.amount === nextProps.transaction.amount;
  }
);

TransactionItem.displayName = 'TransactionItem';
```

**2. Expensive Calculations with useMemo**

```typescript
// src/hooks/useFinancialSummary.ts
import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useWallets } from './useWallets';

export const useFinancialSummary = (month: number, year: number) => {
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  
  // Memoize expensive calculations
  const summary = useMemo(() => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
    
    const income = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = wallets.reduce((sum, w) => sum + w.balance, 0);
    
    return { income, expenses, balance, net: income - expenses };
  }, [transactions, wallets, month, year]); // Only recalculate when dependencies change
  
  return summary;
};
```

**3. Stable Callbacks with useCallback**

```typescript
// src/components/budget/BudgetList.tsx
import React, { useCallback } from 'react';
import { useBudgets } from '@/hooks/useBudgets';

export const BudgetList = () => {
  const { budgets, updateBudget, deleteBudget } = useBudgets();
  
  // Stable callback reference (prevents child re-renders)
  const handleUpdate = useCallback((id: string, amount: number) => {
    updateBudget({ id, amount });
  }, [updateBudget]);
  
  const handleDelete = useCallback((id: string) => {
    deleteBudget(id);
  }, [deleteBudget]);
  
  return (
    <div>
      {budgets.map(budget => (
        <BudgetItem
          key={budget.id}
          budget={budget}
          onUpdate={handleUpdate} // Stable reference
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
```

**4. Virtual Scrolling for Large Lists**

```typescript
// src/components/transactions/VirtualizedTransactionList.tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTransactions } from '@/hooks/useTransactions';

export const VirtualizedTransactionList = () => {
  const { transactions } = useTransactions();
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const transaction = transactions[index];
    return (
      <div style={style}>
        <TransactionItem transaction={transaction} />
      </div>
    );
  };
  
  return (
    <div className="h-screen">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={transactions.length}
            itemSize={80}
            width={width}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};
```

**5. Prefetching with React Query**

```typescript
// src/hooks/useTransactionPrefetch.ts
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { transactionService } from '@/services/transactionService';

export const useTransactionPrefetch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const prefetchMonthly = (month: number, year: number) => {
    // Prefetch data before navigation
    queryClient.prefetchQuery({
      queryKey: ['transactions', 'monthly', user?.id, month, year],
      queryFn: () => transactionService.getMonthly(user!.id, month, year),
      staleTime: 60 * 1000, // 1 minute
    });
  };
  
  return { prefetchMonthly };
};

// Usage in Statistics page navigation
const StatisticsLink = () => {
  const { prefetchMonthly } = useTransactionPrefetch();
  
  return (
    <Link 
      to="/statistics"
      onMouseEnter={() => {
        // Prefetch on hover (desktop)
        const now = new Date();
        prefetchMonthly(now.getMonth(), now.getFullYear());
      }}
    >
      Statistics
    </Link>
  );
};
```

**6. PWA Caching Optimization**

```typescript
// vite.config.ts - Enhanced workbox configuration
export default defineConfig({
  plugins: [
    VitePWA({
      workbox: {
        // Granular caching strategies
        runtimeCaching: [
          // API responses - Network First
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
          
          // Static assets - Cache First
          {
            urlPattern: /\.(?:js|css|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          
          // Images - Stale While Revalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
        ],
        
        // Background sync for offline transactions
        backgroundSync: {
          options: {
            maxRetentionTime: 24 * 60, // 24 hours
          },
        },
      },
    }),
  ],
});
```

**7. Bundle Size Optimization**

```typescript
// Analyze bundle size
// package.json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer"
  }
}

// Dynamic imports for heavy dependencies
const ExportButton = lazy(() => import('@/components/export/ExportButton'));
const AIEvaluator = lazy(() => import('@/features/ai-evaluator/EvaluatePage'));
const Charts = lazy(() => import('@/components/dashboard/SpendingChart'));
```

**Performance Metrics to Monitor:**

| Metric | Current | Target | Tool |
|--------|---------|--------|------|
| First Contentful Paint | ~1.5s | <1.0s | Lighthouse |
| Time to Interactive | ~3.0s | <2.0s | Lighthouse |
| Largest Contentful Paint | ~2.5s | <2.0s | Lighthouse |
| Cumulative Layout Shift | 0.1 | <0.1 | Lighthouse |
| Total Bundle Size | ~800KB | <500KB | Bundle Analyzer |
| React Re-renders | Unknown | Minimal | React DevTools Profiler |

---

### 5. SECURITY ARCHITECTURE (Priority: HIGH)

**Current State (7/10):**
- ✅ XSS vulnerability fixed with DOMPurify
- ✅ Row Level Security (RLS) implemented
- ✅ PKCE OAuth flow
- ❌ No rate limiting
- ❌ Permissive CSP policy
- ❌ No CSRF protection
- ⚠️ High-severity dependency vulnerabilities

**Target State (9/10):**
- ✅ All XSS vectors mitigated
- ✅ Rate limiting at edge function level
- ✅ Strict CSP policy
- ✅ CSRF protection for sensitive actions
- ✅ Zero high-severity vulnerabilities
- ✅ Security headers hardened

#### Security Hardening Measures

**1. Rate Limiting (Supabase Edge Functions)**

```typescript
// supabase/functions/rate-limiter/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/rest/v1/transactions': { maxRequests: 100, windowMs: 60000 }, // 100/min
  '/rest/v1/budgets': { maxRequests: 50, windowMs: 60000 },       // 50/min
  '/rest/v1/wallets': { maxRequests: 50, windowMs: 60000 },       // 50/min
  '/functions/v1/gemini-insight': { maxRequests: 10, windowMs: 60000 }, // 10/min (expensive)
};

function checkRateLimit(userId: string, endpoint: string): boolean {
  const config = RATE_LIMITS[endpoint] || { maxRequests: 100, windowMs: 60000 };
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }
  
  if (record.count >= config.maxRequests) {
    // Rate limit exceeded
    return false;
  }
  
  // Increment count
  record.count++;
  return true;
}

serve(async (req) => {
  const userId = req.headers.get('x-user-id');
  const endpoint = new URL(req.url).pathname;
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  if (!checkRateLimit(userId, endpoint)) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    });
  }
  
  // Forward to actual endpoint
  // ...
});
```

**Alternative: Cloudflare Rate Limiting (Recommended)**

```javascript
// vercel.json - Configure Cloudflare
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-project.supabase.co/:path*"
    }
  ]
}
```

**2. Content Security Policy (CSP) Hardening**

```html
<!-- index.html - Strict CSP -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co https://fonts.googleapis.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
">
```

**3. CSRF Protection for Sensitive Actions**

```typescript
// src/lib/csrf.ts
import { supabase } from './supabase';

export const generateCSRFToken = async (): Promise<string> => {
  const token = crypto.randomUUID();
  
  // Store token in session
  await supabase.auth.updateUser({
    data: { csrf_token: token },
  });
  
  return token;
};

export const validateCSRFToken = async (token: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.user_metadata.csrf_token) {
    return false;
  }
  
  return user.user_metadata.csrf_token === token;
};

// Usage in sensitive operations
export const useCSRFProtection = () => {
  const [csrfToken, setCSRFToken] = useState<string>('');
  
  useEffect(() => {
    generateCSRFToken().then(setCSRFToken);
  }, []);
  
  const validateAndExecute = async (
    action: () => Promise<void>,
    token: string
  ) => {
    const isValid = await validateCSRFToken(token);
    if (!isValid) {
      throw new Error('CSRF token validation failed');
    }
    await action();
  };
  
  return { csrfToken, validateAndExecute };
};
```

**4. Dependency Vulnerability Fixes**

```bash
# Audit and fix vulnerabilities
bun audit
bun update --latest

# Pin specific secure versions
# package.json
{
  "dependencies": {
    "rollup": "^4.24.0", // Fixed XSS
    "path-to-regexp": "^8.2.0", // Fixed ReDoS
    "cross-spawn": "^7.0.6", // Fixed ReDoS
  },
  "overrides": {
    "vite": "^5.4.10", // Latest secure version
    "esbuild": "^0.24.0"
  }
}
```

**5. Supabase RLS Policy Review**

```sql
-- Review and tighten RLS policies
-- Ensure DELETE policies are restrictive
CREATE POLICY "Users can only delete their own transactions"
ON transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add audit logging for sensitive operations
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for audit logging
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to sensitive tables
CREATE TRIGGER audit_transactions
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();
```

**6. Input Sanitization Everywhere**

```typescript
// Ensure all user inputs are sanitized
import { sanitizeHTML, sanitizePlainText } from '@/utils/sanitize';

// In all form submissions
const handleSubmit = (data: FormData) => {
  const sanitized = {
    ...data,
    description: sanitizePlainText(data.description),
    notes: sanitizePlainText(data.notes),
  };
  
  // Submit sanitized data
  createTransaction(sanitized);
};

// In AI-generated content rendering
const AIInsightDisplay = ({ content }: { content: string }) => {
  const sanitized = sanitizeHTML(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

---

### 6. SCALABILITY CONSIDERATIONS (Priority: MEDIUM)

**Target: 100,000+ Users**

#### Database Optimization

**1. Indexing Strategy**

```sql
-- Already implemented (from migrations)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX idx_wallets_user ON wallets(user_id);

-- Additional composite indexes for common queries
CREATE INDEX idx_transactions_user_type_date 
ON transactions(user_id, type, date DESC);

CREATE INDEX idx_transactions_category_date
ON transactions(category_id, date DESC);

-- Partial index for active budgets
CREATE INDEX idx_budgets_active
ON budgets(user_id, category_id)
WHERE period = 'monthly';
```

**2. Database Partitioning**

```sql
-- Partition transactions by month for better query performance
-- (Future optimization when transaction volume grows)
CREATE TABLE transactions_partitioned (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount DECIMAL NOT NULL,
  date DATE NOT NULL,
  -- ... other columns
) PARTITION BY RANGE (date);

-- Create partitions for each month
CREATE TABLE transactions_2025_11 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE transactions_2025_12 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Automatically create new partitions with a cron job
```

**3. Read Replicas (Supabase Pro)**

```typescript
// Use read replicas for heavy read operations
const supabaseRead = createClient(
  process.env.VITE_SUPABASE_READ_REPLICA_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Use read replica for statistics and reports
export const getMonthlyReport = async (userId: string) => {
  const { data } = await supabaseRead
    .from('transactions')
    .select('*')
    .eq('user_id', userId);
  
  return data;
};
```

**4. Caching Layer (Redis)**

```typescript
// Future: Redis for caching aggregated data
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export const getCachedMonthlySummary = async (
  userId: string,
  month: number,
  year: number
) => {
  const cacheKey = `monthly:${userId}:${year}:${month}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Fetch from database
  const summary = await transactionService.getMonthlySummary(userId, month, year);
  
  // Cache for 5 minutes
  await redis.set(cacheKey, summary, { ex: 300 });
  
  return summary;
};
```

**5. Real-time Subscription Optimization**

```typescript
// Optimize Supabase real-time subscriptions
// Only subscribe to user's own data with filters
const subscription = supabase
  .channel('user-transactions')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'transactions',
      filter: `user_id=eq.${user.id}`, // Server-side filter
    },
    (payload) => {
      // Update React Query cache
      queryClient.invalidateQueries(['transactions', user.id]);
    }
  )
  .subscribe();

// Unsubscribe when component unmounts
return () => {
  subscription.unsubscribe();
};
```

**6. API Response Pagination**

```typescript
// Implement pagination for large datasets
export const getPaginatedTransactions = async (
  userId: string,
  page: number = 0,
  pageSize: number = 50
) => {
  const { data, error, count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  
  if (error) throw error;
  
  return {
    transactions: data || [],
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

// Infinite scroll with React Query
export const useInfiniteTransactions = () => {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', user?.id],
    queryFn: ({ pageParam = 0 }) => 
      getPaginatedTransactions(user!.id, pageParam, 50),
    getNextPageParam: (lastPage) => 
      lastPage.page < lastPage.totalPages - 1 ? lastPage.page + 1 : undefined,
  });
};
```

**7. Multi-Tenancy Preparation**

```sql
-- If Duitr expands to B2B (organizations)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (organization_id, user_id)
);

-- Add organization_id to all data tables
ALTER TABLE transactions ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE wallets ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ... etc

-- Update RLS policies for multi-tenancy
CREATE POLICY "Organization members can view transactions"
ON transactions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);
```

---

## 📅 IMPLEMENTATION TIMELINE (12 Weeks)

### **Phase 1: Foundation (Weeks 1-4) - CRITICAL**

**Week 1: Service Layer Setup**
- ✅ Review CategoryService pattern
- Create TransactionService with Zod validation
- Create WalletService
- Implement Supabase RPC functions for atomic operations
- **Deliverable:** 3 service classes with unit tests

**Week 2: React Query Migration - Part 1**
- Create useTransactions hook
- Create useWallets hook
- Migrate TransactionForm to use new hooks
- Implement optimistic updates
- **Deliverable:** 2 hooks with 80%+ test coverage

**Week 3: React Query Migration - Part 2**
- Create useBudgets hook
- Create usePinjaman hook
- Create useWantToBuy hook
- Refactor all components to use new hooks
- **Deliverable:** All domain hooks implemented

**Week 4: Testing Infrastructure**
- Set up Vitest with proper mocks
- Write service layer tests (90%+ coverage target)
- Write hook tests with React Query
- Fix all broken tests
- **Deliverable:** 70%+ overall test coverage

### **Phase 2: Optimization (Weeks 5-7) - HIGH**

**Week 5: Performance Optimization**
- Implement React.memo for list components
- Add useMemo for expensive calculations
- Add useCallback for stable callbacks
- Profile with React DevTools
- **Deliverable:** 50% reduction in unnecessary re-renders

**Week 6: Code Splitting & Lazy Loading**
- Audit bundle size
- Implement dynamic imports for heavy components
- Optimize PWA caching strategy
- Add prefetching for anticipated navigation
- **Deliverable:** <500KB bundle size

**Week 7: Component Tests**
- Write tests for form components
- Write tests for dashboard components
- Write tests for transaction list
- Achieve 70%+ component coverage
- **Deliverable:** 70%+ test coverage maintained

### **Phase 3: Security & Scalability (Weeks 8-10) - HIGH**

**Week 8: Security Hardening**
- Implement rate limiting (Cloudflare or edge functions)
- Harden CSP policy
- Add CSRF protection for sensitive actions
- Fix all dependency vulnerabilities
- **Deliverable:** Zero high-severity vulnerabilities

**Week 9: Database Optimization**
- Review and optimize RLS policies
- Add missing indexes for common queries
- Implement audit logging
- Create monthly summary materialized view
- **Deliverable:** 30% query performance improvement

**Week 10: Integration Testing**
- Write integration tests (service + database)
- Write integration tests (React Query + UI)
- Set up CI/CD testing pipeline
- **Deliverable:** 80%+ integration test coverage

### **Phase 4: Validation & Polish (Weeks 11-12) - MEDIUM**

**Week 11: E2E Testing**
- Set up Playwright
- Write 5 critical user flow tests
- Test across browsers (Chrome, Firefox, Safari)
- Mobile device testing
- **Deliverable:** 5 E2E tests passing

**Week 12: Documentation & Rollout**
- Update DEVELOPER_GUIDE.md
- Create architecture diagrams
- Write migration guide
- Gradual rollout with monitoring
- **Deliverable:** Production deployment

---

## 📊 SUCCESS METRICS

### Technical Metrics

| Metric | Baseline | Week 6 Target | Week 12 Target |
|--------|----------|---------------|----------------|
| Test Coverage | 2% | 50% | 70% |
| Bundle Size | 800KB | 600KB | 500KB |
| Time to Interactive | 3.0s | 2.5s | 2.0s |
| React Re-renders | High | Medium | Low |
| Lines per File (avg) | 400 | 300 | 250 |
| Critical Vulnerabilities | 3 | 1 | 0 |
| Architecture Score | 6.5/10 | 7.5/10 | 9.0/10 |

### Developer Experience Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Time to add new feature | 2 days | 1 day |
| Time to fix bug | 3 hours | 1 hour |
| Test execution time | N/A | <10s (unit), <2m (E2E) |
| New developer onboarding | 1 week | 2 days |
| Code review time | 2 hours | 30 minutes |

### User Experience Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| First Contentful Paint | 1.5s | <1.0s |
| Largest Contentful Paint | 2.5s | <2.0s |
| Cumulative Layout Shift | 0.1 | <0.05 |
| Offline functionality | 80% | 95% |
| Error rate | 0.5% | <0.1% |

---

## ⚠️ RISK ASSESSMENT & MITIGATION

### High-Risk Items

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Migration breaks existing features** | HIGH | MEDIUM | • Comprehensive test coverage before migration<br>• Feature flags for gradual rollout<br>• Staging environment testing |
| **React Query learning curve** | MEDIUM | HIGH | • Start with one domain (transactions)<br>• Pair programming sessions<br>• Reference CategoryService pattern |
| **Database migration downtime** | HIGH | LOW | • Use Supabase migrations (zero-downtime)<br>• Test in staging first<br>• Rollback plan ready |
| **Performance regression** | MEDIUM | MEDIUM | • Performance benchmarking before/after<br>• React DevTools Profiler analysis<br>• Lighthouse CI in GitHub Actions |
| **Breaking changes in dependencies** | LOW | MEDIUM | • Pin dependency versions<br>• Comprehensive integration tests<br>• Gradual dependency updates |

### Medium-Risk Items

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Timeline overrun** | MEDIUM | HIGH | • Weekly progress reviews<br>• Prioritize critical items<br>• Buffer time in schedule |
| **Team resistance to changes** | MEDIUM | MEDIUM | • Clear communication of benefits<br>• Incremental changes<br>• Training sessions |
| **Test maintenance overhead** | MEDIUM | MEDIUM | • Use factory patterns for test data<br>• DRY principles in test code<br>• Regular test suite review |

### Low-Risk Items

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Documentation drift** | LOW | HIGH | • Docs updated alongside code<br>• Automated doc generation<br>• PR template includes doc update |
| **Code review bottleneck** | LOW | MEDIUM | • Smaller, focused PRs<br>• Multiple reviewers<br>• Clear review guidelines |

---

## 🎯 DECISION RATIONALE

### Why React Query + Services over Redux?

**Redux Toolkit Considerations:**
- ✅ Mature ecosystem, excellent DevTools
- ✅ Standardized patterns
- ❌ Boilerplate overhead (actions, reducers, selectors)
- ❌ No built-in async data fetching
- ❌ Manual cache invalidation
- ❌ Overkill for Duitr's current scale

**React Query + Services Benefits:**
- ✅ Zero boilerplate for async state
- ✅ Automatic caching, refetching, invalidation
- ✅ Optimistic updates built-in
- ✅ Works perfectly with existing CategoryService pattern
- ✅ Lightweight (~40KB vs ~100KB for Redux)
- ✅ Better TypeScript inference
- ✅ DevTools available

**Verdict:** React Query is a **natural extension** of Duitr's existing architecture, not a rewrite.

### Why Not Zustand or Jotai?

Both are excellent for **client state**, but Duitr's primary challenge is **server state**:
- 80% of state comes from Supabase (transactions, wallets, budgets)
- React Query specializes in server state management
- Zustand/Jotai would still require manual data fetching logic

**Recommendation:** Use React Query for server state, keep minimal Context for client state (theme, language).

### Why Service Layer Pattern?

CategoryService has **proven success** in Duitr:
- ✅ Clean separation of concerns
- ✅ Testable in isolation
- ✅ Reusable across components
- ✅ Single source of truth for business logic

Extending this pattern is **low-risk, high-reward**.

---

## 📚 APPENDIX

### Recommended Reading

- **React Query Documentation**: https://tanstack.com/query/latest
- **Testing Library Best Practices**: https://testing-library.com/docs/guiding-principles/
- **Web Vitals**: https://web.dev/vitals/
- **Supabase Performance Best Practices**: https://supabase.com/docs/guides/performance
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

### Tools & Resources

- **Bundle Analyzer**: `vite-bundle-visualizer`
- **Performance Testing**: Lighthouse CI
- **E2E Testing**: Playwright
- **Profiling**: React DevTools Profiler
- **Database Performance**: Supabase Dashboard Query Performance

### Code Examples Repository

All code examples from this document will be available in:
```
docs/architecture-modernization/
├── services/
│   ├── transactionService.example.ts
│   ├── walletService.example.ts
│   └── baseService.example.ts
├── hooks/
│   ├── useTransactions.example.ts
│   └── useWallets.example.ts
├── tests/
│   ├── service.test.example.ts
│   ├── hook.test.example.tsx
│   └── component.test.example.tsx
└── sql/
    ├── create_transaction_function.sql
    └── optimize_indexes.sql
```

---

## ✅ NEXT STEPS

**Immediate Actions (Week 1):**

1. **Team Alignment Meeting** (Day 1)
   - Present this modernization plan
   - Gather feedback and concerns
   - Assign initial responsibilities

2. **Create GitHub Project Board** (Day 1)
   - Set up columns: Backlog, In Progress, Review, Done
   - Create issues for Week 1 tasks
   - Assign story points

3. **Set Up Development Environment** (Day 2)
   - Ensure all team members have latest dependencies
   - Configure Vitest
   - Set up pre-commit hooks for tests

4. **Implement First Service** (Days 3-5)
   - Start with TransactionService
   - Write comprehensive unit tests
   - Code review and iterate

5. **Document Progress** (Day 5)
   - Update DEVELOPER_GUIDE.md
   - Create architecture decision record (ADR)
   - Share progress update

**Weekly Cadence:**
- **Monday**: Planning and task assignment
- **Wednesday**: Mid-week sync and blocker resolution
- **Friday**: Demo, retrospective, and next week planning

---

## 📞 QUESTIONS & SUPPORT

For questions about this modernization plan, contact:
- **Architecture Lead**: [Assign team member]
- **Testing Lead**: [Assign team member]
- **Security Lead**: [Assign team member]

**Documentation Updates**: This document will be updated weekly based on implementation learnings.

---

**Document Version:** 1.0  
**Last Updated:** November 2, 2025  
**Next Review:** November 9, 2025 (End of Week 1)
