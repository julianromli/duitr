import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import TransactionList from '@/components/transactions/TransactionList'
import { useFinance } from '@/context/FinanceContext'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

// Mock the FinanceContext
vi.mock('@/context/FinanceContext', () => ({
  useFinance: vi.fn(),
}))

const mockTransactions = [
  {
    id: 'transaction-1',
    amount: 150.50,
    categoryId: '1',
    category: 'Food',
    description: 'Lunch at restaurant',
    date: '2024-01-15T12:30:00.000Z',
    type: 'expense',
    walletId: 'wallet-1',
    wallet_name: 'Cash Wallet',
  },
  {
    id: 'transaction-2',
    amount: 3000,
    categoryId: '20',
    category: 'Salary',
    description: 'Monthly salary',
    date: '2024-01-16T09:00:00.000Z',
    type: 'income',
    walletId: 'wallet-2',
    wallet_name: 'Bank Account',
  },
  {
    id: 'transaction-3',
    amount: 500,
    categoryId: '100',
    category: 'Transfer',
    description: 'Transfer to savings',
    date: '2024-01-17T14:00:00.000Z',
    type: 'transfer',
    walletId: 'wallet-1',
    destinationWalletId: 'wallet-3',
    wallet_name: 'Cash Wallet',
  },
]

const mockWallets = [
  { id: 'wallet-1', name: 'Cash Wallet', type: 'cash' },
  { id: 'wallet-2', name: 'Bank Account', type: 'bank' },
  { id: 'wallet-3', name: 'Savings Account', type: 'bank' },
]

const mockFinanceContext = {
  transactions: mockTransactions,
  wallets: mockWallets,
  deleteTransaction: vi.fn(),
  formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
  getDisplayCategoryName: vi.fn((transaction) => transaction.category),
}

describe('TransactionList', () => {
  const defaultProps = {
    userId: 'user-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFinance).mockReturnValue(mockFinanceContext as any)
    
    // Mock Supabase select chain
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ 
            data: mockTransactions, 
            error: null 
          })),
        })),
      })),
    }))
    
    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    } as any)
  })

  describe('Transaction Display', () => {
    it('should render list of transactions', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
        expect(screen.getByText('Monthly salary')).toBeInTheDocument()
        expect(screen.getByText('Transfer to savings')).toBeInTheDocument()
      })
    })

    it('should display transaction amounts with correct formatting', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('$150.50')).toBeInTheDocument()
        expect(screen.getByText('$3000.00')).toBeInTheDocument()
        expect(screen.getByText('$500.00')).toBeInTheDocument()
      })
    })

    it('should show category names correctly', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument()
        expect(screen.getByText('Salary')).toBeInTheDocument()
        expect(screen.getByText('Transfer')).toBeInTheDocument()
      })
    })

    it('should display wallet names for each transaction', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getAllByText('Cash Wallet')).toHaveLength(2)
        expect(screen.getByText('Bank Account')).toBeInTheDocument()
      })
    })

    it('should show empty state when no transactions', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      } as any)

      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/no transactions found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Transaction Filtering', () => {
    it('should filter transactions by search term', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search transactions/i)
      await user.type(searchInput, 'lunch')

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
        expect(screen.queryByText('Monthly salary')).not.toBeInTheDocument()
      })
    })

    it('should filter transactions by type', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
      await user.selectOptions(typeFilter, 'expense')

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
        expect(screen.queryByText('Monthly salary')).not.toBeInTheDocument()
        expect(screen.queryByText('Transfer to savings')).not.toBeInTheDocument()
      })
    })

    it('should filter transactions by category', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument()
      })

      const categoryFilter = screen.getByRole('combobox', { name: /filter by category/i })
      await user.selectOptions(categoryFilter, '1') // Food category

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
        expect(screen.queryByText('Monthly salary')).not.toBeInTheDocument()
      })
    })

    it('should filter transactions by wallet', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Cash Wallet')).toBeInTheDocument()
      })

      const walletFilter = screen.getByRole('combobox', { name: /filter by wallet/i })
      await user.selectOptions(walletFilter, 'wallet-2') // Bank Account

      await waitFor(() => {
        expect(screen.getByText('Monthly salary')).toBeInTheDocument()
        expect(screen.queryByText('Lunch at restaurant')).not.toBeInTheDocument()
      })
    })

    it('should clear filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      // Apply filters
      const searchInput = screen.getByPlaceholderText(/search transactions/i)
      await user.type(searchInput, 'lunch')

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
      await user.selectOptions(typeFilter, 'expense')

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearButton)

      await waitFor(() => {
        expect(searchInput).toHaveValue('')
        expect(typeFilter).toHaveValue('all')
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
        expect(screen.getByText('Monthly salary')).toBeInTheDocument()
      })
    })
  })

  describe('Transaction Sorting', () => {
    it('should sort transactions by date (newest first by default)', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        const transactions = screen.getAllByTestId('transaction-item')
        expect(transactions[0]).toHaveTextContent('Transfer to savings') // 2024-01-17
        expect(transactions[1]).toHaveTextContent('Monthly salary') // 2024-01-16
        expect(transactions[2]).toHaveTextContent('Lunch at restaurant') // 2024-01-15
      })
    })

    it('should sort transactions by date (oldest first)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i })
      await user.selectOptions(sortSelect, 'date-latest')

      await waitFor(() => {
        const transactions = screen.getAllByTestId('transaction-item')
        expect(transactions[0]).toHaveTextContent('Lunch at restaurant') // 2024-01-15
        expect(transactions[1]).toHaveTextContent('Monthly salary') // 2024-01-16
        expect(transactions[2]).toHaveTextContent('Transfer to savings') // 2024-01-17
      })
    })

    it('should sort transactions by amount (highest first)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i })
      await user.selectOptions(sortSelect, 'amount-highest')

      await waitFor(() => {
        const transactions = screen.getAllByTestId('transaction-item')
        expect(transactions[0]).toHaveTextContent('Monthly salary') // $3000
        expect(transactions[1]).toHaveTextContent('Transfer to savings') // $500
        expect(transactions[2]).toHaveTextContent('Lunch at restaurant') // $150.50
      })
    })

    it('should sort transactions by amount (lowest first)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i })
      await user.selectOptions(sortSelect, 'amount-lowest')

      await waitFor(() => {
        const transactions = screen.getAllByTestId('transaction-item')
        expect(transactions[0]).toHaveTextContent('Lunch at restaurant') // $150.50
        expect(transactions[1]).toHaveTextContent('Transfer to savings') // $500
        expect(transactions[2]).toHaveTextContent('Monthly salary') // $3000
      })
    })
  })

  describe('Transaction Actions', () => {
    it('should open transaction detail when transaction is clicked', async () => {
      const user = userEvent.setup()
      const onTransactionClick = vi.fn()
      renderWithProviders(
        <TransactionList {...defaultProps} onTransactionClick={onTransactionClick} />
      )

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const transactionItem = screen.getByTestId('transaction-item')
      await user.click(transactionItem)

      expect(onTransactionClick).toHaveBeenCalledWith('transaction-1')
    })

    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete transaction/i)
      await user.click(deleteButton)

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    })

    it('should delete transaction when confirmed', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete transaction/i)
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      expect(mockFinanceContext.deleteTransaction).toHaveBeenCalledWith('transaction-1')
    })

    it('should cancel delete when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete transaction/i)
      await user.click(deleteButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockFinanceContext.deleteTransaction).not.toHaveBeenCalled()
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should show load more button when there are more transactions', async () => {
      // Mock API to return exactly pageSize transactions
      const mockManyTransactions = Array.from({ length: 20 }, (_, i) => ({
        ...mockTransactions[0],
        id: `transaction-${i}`,
        description: `Transaction ${i}`,
      }))

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ 
                data: mockManyTransactions, 
                error: null 
              })),
            })),
          })),
        })),
      } as any)

      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument()
      })
    })

    it('should load more transactions when load more button is clicked', async () => {
      const user = userEvent.setup()
      
      // First call returns 20 transactions, second call returns more
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ 
                data: Array.from({ length: 20 }, (_, i) => ({
                  ...mockTransactions[0],
                  id: `transaction-${i}`,
                  description: `Transaction ${i}`,
                })), 
                error: null 
              })),
            })),
          })),
        })
        .mockReturnValueOnce({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ 
                data: Array.from({ length: 20 }, (_, i) => ({
                  ...mockTransactions[0],
                  id: `transaction-${i + 20}`,
                  description: `Transaction ${i + 20}`,
                })), 
                error: null 
              })),
            })),
          })),
        })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Transaction 0')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByRole('button', { name: /load more/i })
      await user.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByText('Transaction 20')).toBeInTheDocument()
      })
    })

    it('should hide load more button when no more transactions', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Database error' }
              })),
            })),
          })),
        })),
      } as any)

      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/error loading transactions/i)).toBeInTheDocument()
      })
    })

    it('should handle delete transaction error gracefully', async () => {
      const user = userEvent.setup()
      mockFinanceContext.deleteTransaction.mockRejectedValue(new Error('Delete failed'))

      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete transaction/i)
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/error deleting transaction/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching transactions', () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => new Promise(() => {})), // Never resolves
            })),
          })),
        })),
      } as any)

      renderWithProviders(<TransactionList {...defaultProps} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show loading state while deleting transaction', async () => {
      const user = userEvent.setup()
      mockFinanceContext.deleteTransaction.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete transaction/i)
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      expect(screen.getByText(/deleting/i)).toBeInTheDocument()
    })
  })

  describe('Date Grouping', () => {
    it('should group transactions by date when sorted by date', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('January 17, 2024')).toBeInTheDocument()
        expect(screen.getByText('January 16, 2024')).toBeInTheDocument()
        expect(screen.getByText('January 15, 2024')).toBeInTheDocument()
      })
    })

    it('should not group transactions when not sorted by date', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i })
      await user.selectOptions(sortSelect, 'amount-highest')

      await waitFor(() => {
        expect(screen.queryByText('January 17, 2024')).not.toBeInTheDocument()
        expect(screen.queryByText('January 16, 2024')).not.toBeInTheDocument()
        expect(screen.queryByText('January 15, 2024')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('list')).toBeInTheDocument()
        expect(screen.getAllByRole('listitem')).toHaveLength(3)
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      })

      // Tab to first transaction
      await user.tab()
      expect(screen.getAllByTestId('transaction-item')[0]).toHaveFocus()
    })

    it('should announce filter changes to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionList {...defaultProps} />)

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
      await user.selectOptions(typeFilter, 'expense')

      // Should have aria-live region announcing the change
      expect(screen.getByText(/filtered by expense/i)).toHaveAttribute('aria-live')
    })
  })
})