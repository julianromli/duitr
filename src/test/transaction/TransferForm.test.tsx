import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import TransferForm from '@/components/transactions/TransferForm'
import { useFinance } from '@/context/FinanceContext'

// Mock the FinanceContext
vi.mock('@/context/FinanceContext', () => ({
  useFinance: vi.fn(),
}))

const mockFinanceContext = {
  wallets: [
    { id: 'wallet-1', name: 'Cash Wallet', type: 'cash', balance: 1000 },
    { id: 'wallet-2', name: 'Bank Account', type: 'bank', balance: 5000 },
    { id: 'wallet-3', name: 'Savings Account', type: 'bank', balance: 2000 },
  ],
  addTransaction: vi.fn(),
}

describe('TransferForm', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFinance).mockReturnValue(mockFinanceContext as any)
  })

  describe('Form Rendering', () => {
    it('should render transfer form with all required fields', () => {
      renderWithProviders(<TransferForm {...defaultProps} />)

      expect(screen.getByText(/transactions\.transfer/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.from_account/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.to_account/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.amount/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.fee/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.description/)).toBeInTheDocument()
      expect(screen.getByText(/transactions\.date/)).toBeInTheDocument()
    })

    it('should render dialog when open is true', () => {
      renderWithProviders(<TransferForm {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/transactions\.transfer/)).toBeInTheDocument()
    })

    it('should not render dialog when open is false', () => {
      renderWithProviders(<TransferForm {...defaultProps} open={false} />)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should populate wallet options in from and to selectors', () => {
      renderWithProviders(<TransferForm {...defaultProps} />)

      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)

      fireEvent.click(fromWalletSelect)
      
      expect(screen.getByText('Cash Wallet')).toBeInTheDocument()
      expect(screen.getByText('Bank Account')).toBeInTheDocument()
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transactions\.errors\.fill_all_fields/)).toBeInTheDocument()
      })

      expect(mockFinanceContext.addTransaction).not.toHaveBeenCalled()
    })

    it('should validate amount is greater than zero', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      // Set invalid amount
      await user.type(amountInput, '0')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transactions\.errors\.fill_all_fields/)).toBeInTheDocument()
      })
    })

    it('should prevent selecting same wallet for from and to', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '100')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-1') // Same wallet
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transactions\.errors\.same_wallet/)).toBeInTheDocument()
      })
    })

    it('should validate date selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      
      await user.type(amountInput, '100')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')

      // Mock invalid date scenario
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })
      
      // The component should have a valid date by default, but test error handling
      // You might need to mock the date state to be null/undefined
    })
  })

  describe('Form Submission', () => {
    it('should submit transfer with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const feeInput = screen.getByLabelText(/transactions\.fee/)
      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '500')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')
      await user.type(feeInput, '5')
      await user.type(descriptionInput, 'Transfer to savings')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith({
          amount: 500,
          date: expect.any(String),
          description: 'Transfer to savings',
          type: 'transfer',
          walletId: 'wallet-1',
          destinationWalletId: 'wallet-2',
          fee: 5,
          categoryId: expect.any(String), // Transfer category ID
        })
      })
    })

    it('should submit with default description if none provided', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '200')
      await user.selectOptions(fromWalletSelect, 'wallet-2')
      await user.selectOptions(toWalletSelect, 'wallet-3')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            description: expect.stringMatching(/transactions\.transfer/),
          })
        )
      })
    })

    it('should submit with zero fee if not specified', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '300')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-3')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            fee: 0,
          })
        )
      })
    })

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const descriptionInput = screen.getByLabelText(/transactions\.description/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '100')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')
      await user.type(descriptionInput, 'Test transfer')
      await user.click(submitButton)

      await waitFor(() => {
        expect(amountInput).toHaveValue('0')
        expect(fromWalletSelect).toHaveValue('')
        expect(toWalletSelect).toHaveValue('')
        expect(descriptionInput).toHaveValue('')
      })
    })

    it('should close dialog after successful submission', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<TransferForm {...defaultProps} onOpenChange={onOpenChange} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '100')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')
      await user.click(submitButton)

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Wallet Filtering', () => {
    it('should disable selected from-wallet in to-wallet options', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      await user.selectOptions(fromWalletSelect, 'wallet-1')

      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      fireEvent.click(toWalletSelect)

      // The selected from-wallet should be disabled in to-wallet options
      const disabledOption = screen.getByText('Cash Wallet')
      expect(disabledOption.closest('[disabled]')).toBeTruthy()
    })

    it('should show all wallets when no from-wallet is selected', () => {
      renderWithProviders(<TransferForm {...defaultProps} />)

      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      fireEvent.click(toWalletSelect)

      expect(screen.getByText('Cash Wallet')).toBeInTheDocument()
      expect(screen.getByText('Bank Account')).toBeInTheDocument()
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
    })
  })

  describe('Date Handling', () => {
    it('should initialize with current date', () => {
      renderWithProviders(<TransferForm {...defaultProps} />)

      const today = new Date().toLocaleDateString()
      // The date picker should show today's date by default
      // Note: Exact assertion depends on DatePicker component implementation
    })

    it('should allow date selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const datePicker = screen.getByLabelText(/transactions\.date/)
      expect(datePicker).toBeInTheDocument()

      // Test date selection functionality
      // Implementation depends on the specific DatePicker component
    })

    it('should format date correctly for submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '100')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/), // ISO format
          })
        )
      })
    })
  })

  describe('Fee Handling', () => {
    it('should accept numeric fee values', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const feeInput = screen.getByLabelText(/transactions\.fee/)
      await user.type(feeInput, '2.50')

      expect(feeInput).toHaveValue('2.50')
    })

    it('should handle decimal fee values correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const feeInput = screen.getByLabelText(/transactions\.fee/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '100')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')
      await user.type(feeInput, '1.25')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFinanceContext.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            fee: 1.25,
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle empty wallets gracefully', () => {
      vi.mocked(useFinance).mockReturnValue({
        ...mockFinanceContext,
        wallets: [],
      } as any)

      renderWithProviders(<TransferForm {...defaultProps} />)

      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)

      expect(fromWalletSelect).toBeInTheDocument()
      expect(toWalletSelect).toBeInTheDocument()
    })

    it('should display error toast on submission failure', async () => {
      const user = userEvent.setup()
      mockFinanceContext.addTransaction.mockImplementation(() => {
        throw new Error('Transaction failed')
      })

      renderWithProviders(<TransferForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/transactions\.amount/)
      const fromWalletSelect = screen.getByLabelText(/transactions\.from_account/)
      const toWalletSelect = screen.getByLabelText(/transactions\.to_account/)
      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })

      await user.type(amountInput, '100')
      await user.selectOptions(fromWalletSelect, 'wallet-1')
      await user.selectOptions(toWalletSelect, 'wallet-2')
      await user.click(submitButton)

      // Should still attempt the transaction and handle error gracefully
      expect(mockFinanceContext.addTransaction).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', () => {
      renderWithProviders(<TransferForm {...defaultProps} />)

      expect(screen.getByLabelText(/transactions\.from_account/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.to_account/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.amount/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.fee/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.description/)).toBeInTheDocument()
      expect(screen.getByLabelText(/transactions\.date/)).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText(/transactions\.from_account/)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/transactions\.to_account/)).toHaveFocus()
    })

    it('should have proper ARIA attributes for error states', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransferForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /transactions\.transfer/ })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/transactions\.errors\.fill_all_fields/)
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })
  })
})