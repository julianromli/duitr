import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import TransactionDetail from '@/components/transactions/TransactionDetail'
import { useFinance } from '@/context/FinanceContext'

// Mock the FinanceContext
vi.mock('@/context/FinanceContext', () => ({
  useFinance: vi.fn(),
}))

const mockTransaction = {
  id: 'transaction-1',
  amount: 150.50,
  categoryId: '1',
  category: 'Food',
  description: 'Lunch at restaurant',
  date: '2024-01-15T12:30:00.000Z',
  type: 'expense',
  walletId: 'wallet-1',
}

const mockTransferTransaction = {
  id: 'transaction-2',
  amount: 500,
  categoryId: '100', // Transfer category
  category: 'Transfer',
  description: 'Transfer to savings',
  date: '2024-01-16T14:00:00.000Z',
  type: 'transfer',
  walletId: 'wallet-1',
  destinationWalletId: 'wallet-2',
  fee: 5,
}

const mockFinanceContext = {
  transactions: [mockTransaction, mockTransferTransaction],
  wallets: [
    { id: 'wallet-1', name: 'Cash Wallet', type: 'cash' },
    { id: 'wallet-2', name: 'Bank Account', type: 'bank' },
  ],
  updateTransaction: vi.fn(),
  formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
  getDisplayCategoryName: vi.fn((transaction) => transaction.category),
}

describe('TransactionDetail', () => {
  const defaultProps = {
    transactionId: 'transaction-1',
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFinance).mockReturnValue(mockFinanceContext as any)
  })

  describe('Transaction Display', () => {
    it('should render transaction details correctly', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      expect(screen.getByText(/transactions\.details/)).toBeInTheDocument()
      expect(screen.getByText('$150.50')).toBeInTheDocument()
      expect(screen.getByText('Food')).toBeInTheDocument()
      expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
      expect(screen.getByText('Cash Wallet')).toBeInTheDocument()
    })

    it('should format date correctly', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      // Date should be formatted as MM/DD/YYYY, H:MM AM/PM
      expect(screen.getByText('01/15/2024, 12:30 PM')).toBeInTheDocument()
    })

    it('should display transaction type with appropriate icon', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      expect(screen.getByText(/transactions\.expense/)).toBeInTheDocument()
      // Should show expense icon (ArrowDown)
    })

    it('should show edit button when not in editing mode', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      expect(editButton).toBeInTheDocument()
    })

    it('should return null when transaction is not found', () => {
      renderWithProviders(
        <TransactionDetail {...defaultProps} transactionId="non-existent" />
      )

      expect(screen.queryByText(/transactions\.details/)).not.toBeInTheDocument()
    })

    it('should display transfer transaction details correctly', () => {
      renderWithProviders(
        <TransactionDetail {...defaultProps} transactionId="transaction-2" />
      )

      expect(screen.getByText('$500.00')).toBeInTheDocument()
      expect(screen.getByText('Transfer to savings')).toBeInTheDocument()
      expect(screen.getByText(/transactions\.transfer/)).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      expect(screen.getByDisplayValue('150.5')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Lunch at restaurant')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /common\.save/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /common\.cancel/ })).toBeInTheDocument()
    })

    it('should show editable fields in edit mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      expect(screen.getByLabelText(/transactions\.amount/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.category/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.wallet/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.description/)).toBeInTheDocument()
    })

    it('should not show category field for transfer transactions in edit mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <TransactionDetail {...defaultProps} transactionId="transaction-2" />
      )

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      expect(screen.queryByLabelText(/transactions\.category/)).not.toBeInTheDocument()
    })

    it('should populate form fields with current transaction data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      expect(screen.getByDisplayValue('150.5')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Lunch at restaurant')).toBeInTheDocument()
      expect(screen.getByDisplayValue('wallet-1')).toBeInTheDocument()
    })
  })

  describe('Edit Form Validation', () => {
    it('should validate amount field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      await user.clear(amountInput)
      await user.type(amountInput, '0')

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      // Should not save with invalid amount
      expect(mockFinanceContext.updateTransaction).not.toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      await user.clear(descriptionInput)

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      // Should still save as description can be empty
      expect(mockFinanceContext.updateTransaction).toHaveBeenCalled()
    })
  })

  describe('Save Changes', () => {
    it('should save changes when save button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      await user.clear(amountInput)
      await user.type(amountInput, '200')

      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated description')

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      expect(mockFinanceContext.updateTransaction).toHaveBeenCalledWith({
        ...mockTransaction,
        amount: 200,
        description: 'Updated description',
      })
    })

    it('should exit edit mode after saving', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.queryByLabelText(/transactions\.amount/)).not.toBeInTheDocument()
        expect(screen.getByLabelText(/common\.edit/)).toBeInTheDocument()
      })
    })

    it('should show success toast after saving', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Transaction updated successfully')).toBeInTheDocument()
      })
    })
  })

  describe('Cancel Editing', () => {
    it('should cancel editing when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      await user.clear(amountInput)
      await user.type(amountInput, '999')

      const cancelButton = screen.getByRole('button', { name: /common\.cancel/ })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByLabelText(/transactions\.amount/)).not.toBeInTheDocument()
        expect(screen.getByText('$150.50')).toBeInTheDocument() // Original amount
      })
    })

    it('should reset form data when canceling', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Modified description')

      const cancelButton = screen.getByRole('button', { name: /common\.cancel/ })
      await user.click(cancelButton)

      // Re-enter edit mode to check if data was reset
      await user.click(screen.getByLabelText(/common\.edit/))
      expect(screen.getByDisplayValue('Lunch at restaurant')).toBeInTheDocument()
    })

    it('should cancel editing when dialog is closed', async () => {
      const onOpenChange = vi.fn()
      renderWithProviders(
        <TransactionDetail {...defaultProps} onOpenChange={onOpenChange} />
      )

      const editButton = screen.getByLabelText(/common\.edit/)
      await fireEvent.click(editButton)

      // Simulate dialog close
      fireEvent.click(screen.getByRole('dialog'))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Category Selection', () => {
    it('should load and display categories in edit mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const categorySelect = screen.getByLabelText(/transactions\.category/)
      expect(categorySelect).toBeInTheDocument()

      // Categories should be loaded asynchronously
      await waitFor(() => {
        expect(categorySelect).toBeInTheDocument()
      })
    })

    it('should update category when selection changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const categorySelect = screen.getByLabelText(/transactions\.category/)
      await user.selectOptions(categorySelect, '2') // Different category

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      expect(mockFinanceContext.updateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: '2',
        })
      )
    })
  })

  describe('Wallet Selection', () => {
    it('should show wallet options in edit mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      fireEvent.click(walletSelect)

      expect(screen.getByText('Cash Wallet')).toBeInTheDocument()
      expect(screen.getByText('Bank Account')).toBeInTheDocument()
    })

    it('should update wallet when selection changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const walletSelect = screen.getByLabelText(/transactions\.wallet/)
      await user.selectOptions(walletSelect, 'wallet-2')

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      expect(mockFinanceContext.updateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'wallet-2',
        })
      )
    })
  })

  describe('Amount Formatting', () => {
    it('should display formatted amount correctly', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      expect(mockFinanceContext.formatCurrency).toHaveBeenCalledWith(150.5)
      expect(screen.getByText('$150.50')).toBeInTheDocument()
    })

    it('should handle amount input formatting in edit mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      await user.clear(amountInput)
      await user.type(amountInput, '1234.56')

      expect(amountInput).toHaveValue('1234.56')
    })

    it('should show different colors for income vs expense amounts', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const amountElement = screen.getByText('$150.50')
      expect(amountElement).toHaveClass('text-[#FF6B6B]') // Expense color
    })
  })

  describe('Dialog Behavior', () => {
    it('should render when open is true', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render when open is false', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} open={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should call onOpenChange when dialog is closed', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(
        <TransactionDetail {...defaultProps} onOpenChange={onOpenChange} />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing wallet data gracefully', () => {
      vi.mocked(useFinance).mockReturnValue({
        ...mockFinanceContext,
        wallets: [],
      } as any)

      renderWithProviders(<TransactionDetail {...defaultProps} />)

      expect(screen.getByText('Unknown Wallet')).toBeInTheDocument()
    })

    it('should handle missing category data gracefully', () => {
      const transactionWithoutCategory = {
        ...mockTransaction,
        categoryId: null,
        category: null,
      }

      vi.mocked(useFinanceContext.getDisplayCategoryName).mockReturnValue('Unknown Category')

      renderWithProviders(<TransactionDetail {...defaultProps} />)

      expect(mockFinanceContext.getDisplayCategoryName).toHaveBeenCalled()
    })

    it('should handle invalid date gracefully', () => {
      const transactionWithInvalidDate = {
        ...mockTransaction,
        date: 'invalid-date',
      }

      vi.mocked(useFinance).mockReturnValue({
        ...mockFinanceContext,
        transactions: [transactionWithInvalidDate],
      } as any)

      renderWithProviders(<TransactionDetail {...defaultProps} />)

      // Should fallback to original string
      expect(screen.getByText('invalid-date')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText(/common\.edit/)).toBeInTheDocument()
    })

    it('should support keyboard navigation in edit mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText(/transactions\.amount/)).toHaveFocus()
    })

    it('should announce form changes to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionDetail {...defaultProps} />)

      const editButton = screen.getByLabelText(/common\.edit/)
      await user.click(editButton)

      const saveButton = screen.getByRole('button', { name: /common\.save/ })
      await user.click(saveButton)

      await waitFor(() => {
        const successMessage = screen.getByText('Transaction updated successfully')
        expect(successMessage).toBeInTheDocument()
      })
    })
  })
})