import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { AIAddTransactionDialog } from '@/components/transactions/AIAddTransactionDialog';

const mockToast = vi.fn();
const mockParseTransactionInput = vi.fn();
const mockConvertToTransactionFormat = vi.fn();
const mockResolveCategoryId = vi.fn((category: string, type: 'income' | 'expense') => {
  const normalizedCategory = category.trim().toLowerCase().replace(/\s+/g, '-');
  const lookup: Record<string, number> = {
    'expense-dining': 2,
    'income-salary': 13,
    'expense-other': 12,
    'income-other': 17,
  };

  return lookup[`${type}-${normalizedCategory || 'other'}`] ?? (type === 'income' ? 17 : 12);
});

const mockService = {
  parseTransactionInput: mockParseTransactionInput,
  convertToTransactionFormat: mockConvertToTransactionFormat,
  resolveCategoryId: mockResolveCategoryId,
  recordCorrectionHint: vi.fn(),
};

vi.mock('@/services/aiTransactionService', () => ({
  AITransactionService: {
    getInstance: () => mockService,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('AIAddTransactionDialog', () => {
  const addTransaction = vi.fn(() => Promise.resolve());
  const onClose = vi.fn();
  const wallets = [
    { id: 'wallet-1', name: 'Cash Wallet', balance: 150000, currency: 'IDR' },
    { id: 'wallet-2', name: 'Bank Wallet', balance: 500000, currency: 'IDR' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockConvertToTransactionFormat.mockImplementation((parsedTx, walletId) => ({
      amount: parsedTx.amount,
      categoryId: parsedTx.categoryId,
      description: parsedTx.description,
      date: '2026-04-20',
      type: parsedTx.type,
      walletId,
      created_at: '2026-04-20T10:24:00.000Z',
    }));
  });

  it('renders parsed AI rows as editable fields and keeps them editable inline', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: true,
      message: 'Parsed successfully',
      transactions: [
        {
          description: 'Lunch',
          amount: 25000,
          category: 'Dining',
          categoryId: 2,
          type: 'expense',
          confidence: 0.92,
          reason: 'Lunch keyword matches dining'
        },
      ],
    });

    renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={wallets}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'makan siang 25rb');
    await user.click(screen.getByRole('button', { name: /parse/i }));

    const descriptionInput = await screen.findByLabelText(/Description 1/i);
    const amountInput = screen.getByLabelText(/Amount 1/i);
    const categoryInput = screen.getByLabelText(/Category 1/i);
    const typeSelect = screen.getByLabelText(/Type 1/i);

    expect(screen.getByText(/Why: Lunch keyword matches dining/i)).toBeInTheDocument();
    expect(screen.getByText(/You can edit the AI output before saving/i)).toBeInTheDocument();
    expect(descriptionInput).toHaveValue('Lunch');
    expect(amountInput).toHaveValue(25000);
    expect(categoryInput).toHaveValue('Dining');
    expect(typeSelect).toHaveValue('expense');

    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Dinner with friends');

    expect(descriptionInput).toHaveValue('Dinner with friends');
  });

  it('shows a helpful empty state when parsing returns no transactions', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: true,
      message: 'No transactions were found',
      transactions: [],
    });

    renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={wallets}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'something unclear');
    await user.click(screen.getByRole('button', { name: /parse/i }));

    expect(await screen.findByText(/No transactions were parsed/i)).toBeInTheDocument();
    expect(screen.getByText(/Try a different example/i)).toBeInTheDocument();
    expect(screen.getAllByText(/You can edit the AI output before saving/i)).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Review & confirm/i })).not.toBeInTheDocument();
  });

  it('shows a clearer user-facing error when parsing fails', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: false,
      message: 'We could not parse the input',
      transactions: [],
      error: 'Invalid response format',
    });

    renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={wallets}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'bad input');
    await user.click(screen.getByRole('button', { name: /parse/i }));

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: expect.stringMatching(/parse your input/i),
      variant: 'destructive'
    }));
  });

  it('updates local row state when a field is edited', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: true,
      message: 'Parsed successfully',
      transactions: [
        {
          description: 'Coffee',
          amount: 15000,
          category: 'Dining',
          categoryId: 2,
          type: 'expense',
          confidence: 0.88,
        },
      ],
    });

    renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={wallets}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'kopi 15rb');
    await user.click(screen.getByRole('button', { name: /parse/i }));

    const amountInput = await screen.findByLabelText(/Amount 1/i);
    await user.clear(amountInput);
    await user.type(amountInput, '20000');

    expect(amountInput).toHaveValue(20000);
  });

  it('shows a confidence badge and review hint for low confidence rows', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: true,
      message: 'Parsed successfully',
      transactions: [
        {
          description: 'Misc purchase',
          amount: 42000,
          category: 'Other',
          categoryId: 12,
          type: 'expense',
          confidence: 0.42,
        },
      ],
    });

    renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={wallets}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'belanja random 42rb');
    await user.click(screen.getByRole('button', { name: /parse/i }));

    expect(await screen.findByText(/Low confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Double-check/i)).toBeInTheDocument();
  });

  it('disables confirm when rows are invalid or none remain', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: true,
      message: 'Parsed successfully',
      transactions: [
        {
          description: '',
          amount: 0,
          category: '',
          categoryId: '12',
          type: 'expense',
          confidence: 0.7,
        },
      ],
    });

    renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={wallets}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'invalid tx');
    await user.click(screen.getByRole('button', { name: /parse/i }));

    const confirmButton = await screen.findByRole('button', { name: /Review & confirm/i });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Delete 1/i }));
    expect(screen.queryByLabelText(/Description 1/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Review & confirm/i })).not.toBeInTheDocument();
  });

  it('falls back to an available wallet if the selected wallet disappears', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: true,
      message: 'Parsed successfully',
      transactions: [
        {
          description: 'Lunch',
          amount: 25000,
          category: 'Dining',
          categoryId: 2,
          type: 'expense',
          confidence: 0.92,
        },
      ],
    });

    const { rerender } = renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={[wallets[1]]}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'makan 25rb');
    await user.click(screen.getByRole('button', { name: /parse/i }));
    await screen.findByLabelText(/Description 1/i);

    rerender(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={[wallets[0]]}
        currencySymbol="Rp"
      />
    );

    await user.click(screen.getByRole('button', { name: /Review & confirm/i }));

    expect(addTransaction).toHaveBeenCalledTimes(1);
    expect(mockConvertToTransactionFormat).toHaveBeenCalledWith(expect.objectContaining({ description: 'Lunch' }), 'wallet-1');
  });

  it('deletes a row and updates the remaining preview', async () => {
    const user = userEvent.setup();

    mockParseTransactionInput.mockResolvedValueOnce({
      success: true,
      message: 'Parsed successfully',
      transactions: [
        {
          description: 'Lunch',
          amount: 25000,
          category: 'Dining',
          categoryId: 2,
          type: 'expense',
          confidence: 0.92,
        },
        {
          description: 'Parking',
          amount: 10000,
          category: 'Transportation',
          categoryId: 3,
          type: 'expense',
          confidence: 0.9,
        },
        {
          description: 'Salary',
          amount: 5000000,
          category: 'Salary',
          categoryId: 13,
          type: 'income',
          confidence: 0.97,
        },
      ],
    });

    renderWithProviders(
      <AIAddTransactionDialog
        open
        onClose={onClose}
        addTransaction={addTransaction}
        wallets={wallets}
        currencySymbol="Rp"
      />
    );

    await user.type(screen.getByPlaceholderText(/Contoh:/i), 'makan siang 25k dan parkir 10k lalu gaji 5jt');
    await user.click(screen.getByRole('button', { name: /parse/i }));

    await screen.findByLabelText(/Description 1/i);
    expect(screen.getByLabelText(/Description 2/i)).toHaveValue('Parking');
    expect(screen.getByLabelText(/Description 3/i)).toHaveValue('Salary');

    await user.click(screen.getByRole('button', { name: /Delete 2/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText(/Description 3/i)).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Description 1/i)).toHaveValue('Lunch');
    expect(screen.getByLabelText(/Description 2/i)).toHaveValue('Salary');
    expect(screen.getByRole('button', { name: /Review & confirm/i })).toHaveTextContent('(2)');
  });
});
