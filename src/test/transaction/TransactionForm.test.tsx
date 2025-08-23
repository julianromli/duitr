import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import TransactionForm from '@/components/transactions/TransactionForm'
import { useFinance } from '@/context/FinanceContext'

// Mock the FinanceContext
vi.mock('@/context/FinanceContext', () => ({
  useFinance: vi.fn(),
}))

const mockFinanceContext = {
  wallets: [
    { id: 'wallet-1', name: 'Cash Wallet', type: 'cash', balance: 1000 },
    { id: 'wallet-2', name: 'Bank Account', type: 'bank', balance: 5000 },
  ],
  addTransaction: vi.fn(),
}

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFinance).mockReturnValue(mockFinanceContext as any)
  })

  describe('Form Rendering', () => {
    it('should render transaction form with all required fields', () => {
      renderWithProviders(<TransactionForm />)

      expect(screen.getByText(/transactions\.type/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.amount/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.description/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.wallet/)).toBeInTheDocument()
    })

    it('should show correct title based on transaction type', () => {
      renderWithProviders(<TransactionForm />)

      // Default should be expense
      expect(screen.getByText(/transactions\.addExpense/)).toBeInTheDocument()

      // Change to income
      const incomeRadio = screen.getByLabelText(/transactions\.income/)
      fireEvent.click(incomeRadio)
      expect(screen.getByText(/transactions\.addIncome/)).toBeInTheDocument()

      // Change to transfer
      const transferRadio = screen.getByLabelText(/transactions\.transfer/)
      fireEvent.click(transferRadio)
      expect(screen.getByText(/transactions\.addTransfer/)).toBeInTheDocument()
    })

    it('should show category selector for income and expense types', () => {
      renderWithProviders(<TransactionForm />)

      // Should show category for expense (default)
      expect(screen.getByText(/transactions\.category/)).toBeInTheDocument()

      // Should show category for income
      const incomeRadio = screen.getByLabelText(/transactions\.income/)
      fireEvent.click(incomeRadio)
      expect(screen.getByText(/transactions\.category/)).toBeInTheDocument()

      // Should not show category for transfer
      const transferRadio = screen.getByLabelText(/transactions\.transfer/)
      fireEvent.click(transferRadio)
      expect(screen.queryByText(/transactions\.category/)).not.toBeInTheDocument()
    })

    it('should show destination wallet and fee fields for transfer type', () => {
      renderWithProviders(<TransactionForm />)

      // Switch to transfer
      const transferRadio = screen.getByLabelText(/transactions\.transfer/)
      fireEvent.click(transferRadio)

      expect(screen.getByText(/transactions\.destinationWallet/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.fee/)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields for expense transaction', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const submitButton = screen.getByRole('button', { name: /transactions\.addExpense/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transactions\.validation\.requiredFields/)).toBeInTheDocument()
      })

      expect(mockFinanceContext.addTransaction).not.toHaveBeenCalled()
    })

    it('should validate amount field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      const submitButton = screen.getByRole('button', { name: /transactions\.addExpense/ })

      // Enter invalid amount
      await user.type(amountInput, '0')
      await user.selectOptions(walletSelect, 'wallet-1')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transactions\.validation\.requiredFields/)).toBeInTheDocument()
      })
    })

    it('should validate category selection for expense/income', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      const submitButton = screen.getByRole('button', { name: /transactions\.addExpense/ })

      await user.type(amountInput, '100')
      await user.selectOptions(walletSelect, 'wallet-1')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transactions\.validation\.categoryRequired/)).toBeInTheDocument()
      })
    })

    it('should validate transfer specific fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      // Switch to transfer
      const transferRadio = screen.getByLabelText(/transactions\.transfer/)
      await user.click(transferRadio)

      const submitButton = screen.getByRole('button', { name: /transactions\.addTransfer/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transactions\.validation\.requiredFields/)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit expense transaction with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      const categorySelect = screen.getByLabelText(/transactions\.category/)
      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      const submitButton = screen.getByRole('button', { name: /transactions\.addExpense/ })

      await user.type(amountInput, '150.50')
      await user.selectOptions(walletSelect, 'wallet-1')
      await user.selectOptions(categorySelect, '1') // Food category
      await user.type(descriptionInput, 'Lunch at restaurant')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith({
          amount: 150.5,
          categoryId: '1',
          description: 'Lunch at restaurant',
          date: expect.any(String),
          type: 'expense',
          walletId: 'wallet-1',
          destinationWalletId: undefined,
          fee: undefined,
        })
      })
    })

    it('should submit income transaction with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      // Switch to income
      const incomeRadio = screen.getByLabelText(/transactions\.income/)
      await user.click(incomeRadio)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      const categorySelect = screen.getByLabelText(/transactions\.category/)
      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      const submitButton = screen.getByRole('button', { name: /transactions\.addIncome/ })

      await user.type(amountInput, '3000')
      await user.selectOptions(walletSelect, 'wallet-2')
      await user.selectOptions(categorySelect, '20') // Salary category
      await user.type(descriptionInput, 'Monthly salary')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith({
          amount: 3000,
          categoryId: '20',
          description: 'Monthly salary',
          date: expect.any(String),
          type: 'income',
          walletId: 'wallet-2',
          destinationWalletId: undefined,
          fee: undefined,
        })
      })
    })

    it('should submit transfer transaction with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      // Switch to transfer
      const transferRadio = screen.getByLabelText(/transactions\.transfer/)
      await user.click(transferRadio)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      const destinationSelect = screen.getByLabelText(/transactions\.destinationWallet/)
      const feeInput = screen.getByLabelText(/transactions\.fee/)
      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      const submitButton = screen.getByRole('button', { name: /transactions\.addTransfer/ })

      await user.type(amountInput, '500')
      await user.selectOptions(walletSelect, 'wallet-1')
      await user.selectOptions(destinationSelect, 'wallet-2')
      await user.type(feeInput, '2.5')
      await user.type(descriptionInput, 'Transfer to savings')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith({
          amount: 500,
          categoryId: expect.any(String), // Transfer category
          description: 'Transfer to savings',
          date: expect.any(String),
          type: 'transfer',
          walletId: 'wallet-1',
          destinationWalletId: 'wallet-2',
          fee: 2.5,
        })
      })
    })

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      const categorySelect = screen.getByLabelText(/transactions\.category/)
      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      const submitButton = screen.getByRole('button', { name: /transactions\.addExpense/ })

      await user.type(amountInput, '100')
      await user.selectOptions(walletSelect, 'wallet-1')
      await user.selectOptions(categorySelect, '1')
      await user.type(descriptionInput, 'Test expense')
      await user.click(submitButton)

      await waitFor(() => {
        expect(amountInput).toHaveValue('')
        expect(walletSelect).toHaveValue('')
        expect(categorySelect).toHaveValue('')
        expect(descriptionInput).toHaveValue('')
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when transaction submission fails', async () => {
      const user = userEvent.setup()
      mockFinanceContext.addTransaction.mockRejectedValue(new Error('Network error'))
      
      renderWithProviders(<TransactionForm />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      const categorySelect = screen.getByLabelText(/transactions\.category/)
      const submitButton = screen.getByRole('button', { name: /transactions\.addExpense/ })

      await user.type(amountInput, '100')
      await user.selectOptions(walletSelect, 'wallet-1')
      await user.selectOptions(categorySelect, '1')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/common\.errorMessage/)).toBeInTheDocument()
      })
    })

    it('should handle missing wallets gracefully', () => {
      vi.mocked(useFinance).mockReturnValue({
        ...mockFinanceContext,
        wallets: [],
      } as any)

      renderWithProviders(<TransactionForm />)

      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      expect(walletSelect).toBeInTheDocument()
      expect(screen.queryByText('Cash Wallet')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      renderWithProviders(<TransactionForm />)

      expect(screen.getByLabelText(/transactions\.amount/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.wallet/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.category/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.description/)).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      
      // Tab navigation should work
      await user.tab()
      expect(amountInput).toHaveFocus()
    })

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const submitButton = screen.getByRole('button', { name: /transactions\.addExpense/ })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/transactions\.validation\.requiredFields/)
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })
  })

  describe('Form State Management', () => {
    it('should preserve form data when switching between transaction types', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const descriptionInput = screen.getByLabelText(/transactions\.description/)

      // Fill some data
      await user.type(amountInput, '200')
      await user.type(descriptionInput, 'Test description')

      // Switch to income
      const incomeRadio = screen.getByLabelText(/transactions\.income/)
      await user.click(incomeRadio)

      // Data should be preserved
      expect(amountInput).toHaveValue('200')
      expect(descriptionInput).toHaveValue('Test description')
    })

    it('should clear category when switching transaction type', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionForm />)

      const categorySelect = screen.getByLabelText(/transactions\.category/)
      await user.selectOptions(categorySelect, '1')

      // Switch to income
      const incomeRadio = screen.getByLabelText(/transactions\.income/)
      await user.click(incomeRadio)

      // Category should be reset
      expect(categorySelect).toHaveValue('')
    })
  })
})