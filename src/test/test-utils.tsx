import React, { ReactElement } from 'react'
import { render, RenderOptions, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/context/AuthContext'
import { FinanceContext } from '@/context/FinanceContext'
import { ThemeProvider } from 'next-themes'
import { mockUser, mockTransaction, mockWallet, mockBudget } from './setup'

// Mock values for contexts
const mockAuthContextValue = {
  user: mockUser,
  isLoading: false,
  isBalanceHidden: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  updateBalanceVisibility: vi.fn(),
}

const mockFinanceContextValue = {
  transactions: [mockTransaction],
  budgets: [mockBudget],
  wallets: [mockWallet],
  wantToBuyItems: [],
  pinjamanItems: [],
  currency: 'IDR' as const,
  currencySymbol: 'Rp',
  isLoading: false,
  updateCurrency: vi.fn(),
  addTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  addBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
  addWallet: vi.fn(),
  updateWallet: vi.fn(),
  deleteWallet: vi.fn(),
  addWantToBuyItem: vi.fn(),
  updateWantToBuyItem: vi.fn(),
  deleteWantToBuyItem: vi.fn(),
  addPinjamanItem: vi.fn(),
  updatePinjamanItem: vi.fn(),
  deletePinjamanItem: vi.fn(),
  totalBalance: 1000000,
  convertedTotalBalance: 1000000,
  monthlyIncome: 500000,
  monthlyExpense: 200000,
  formatCurrency: vi.fn((amount) => `Rp ${amount.toLocaleString()}`),
  getDisplayCategoryName: vi.fn((transaction) => 'Test Category'),
  getCategoryKey: vi.fn(() => 'test-category'),
}

// Custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: typeof mockUser | null
  authLoading?: boolean
  financeData?: Partial<typeof mockFinanceContextValue>
}

export function renderWithProviders(
  ui: ReactElement<any>,
  options: CustomRenderOptions = {}
) {
  const {
    user = mockUser,
    authLoading = false,
    financeData = {},
    ...renderOptions
  } = options

  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const authValue = {
    ...mockAuthContextValue,
    user,
    isLoading: authLoading,
  }

  const financeValue = {
    ...mockFinanceContextValue,
    ...financeData,
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthContext.Provider value={authValue}>
              <FinanceContext.Provider value={financeValue}>
                {children}
              </FinanceContext.Provider>
            </AuthContext.Provider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Custom query helpers
export const getByTestId = (id: string) => screen.getByTestId(id)
export const queryByTestId = (id: string) => screen.queryByTestId(id)
export const findByTestId = (id: string) => screen.findByTestId(id)

// Helper functions for common test scenarios
export const waitForLoadingToFinish = async () => {
  await screen.findByRole('button', { name: /loading/i }, { timeout: 5000 })
}

export const mockSupabaseResponse = {
  success: (data: any) => Promise.resolve({ data, error: null }),
  error: (message: string) => Promise.resolve({ data: null, error: { message } }),
}

// Type definitions for better test typing
export type MockedFunction<T extends (...args: any[]) => any> = ReturnType<typeof vi.fn<T>>

export interface TestUser {
  id: string
  email: string
  user_metadata: {
    name: string
  }
}

export interface TestTransaction {
  id: string
  amount: number
  description: string
  type: 'income' | 'expense' | 'transfer'
  categoryId: string
  walletId: string
  userId: string
  date: string
}

export interface TestWallet {
  id: string
  name: string
  balance: number
  currency: 'IDR' | 'USD'
  userId: string
}

export interface TestBudget {
  id: string
  name: string
  amount: number
  spent: number
  categoryId: string
  userId: string
  period: 'weekly' | 'monthly' | 'yearly'
}