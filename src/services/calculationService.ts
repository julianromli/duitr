/**
 * CalculationService
 * 
 * Shared calculation utilities for financial operations.
 * Extracted from FinanceContext to improve testability and reusability.
 * 
 * Features:
 * - Balance calculations for wallets
 * - Transaction totals and aggregations
 * - Budget spent tracking
 * - Period-based calculations
 */

import { Transaction, Wallet, Budget } from '@/types/finance';

/**
 * Calculate total balance across all wallets
 */
export const calculateTotalBalance = (wallets: Wallet[]): number => {
  return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
};

/**
 * Calculate monthly income from transactions
 */
export const calculateMonthlyIncome = (
  transactions: Transaction[],
  month?: number,
  year?: number
): number => {
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return (
        t.type === 'income' &&
        transactionDate.getMonth() === targetMonth &&
        transactionDate.getFullYear() === targetYear
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate monthly expenses from transactions
 */
export const calculateMonthlyExpense = (
  transactions: Transaction[],
  month?: number,
  year?: number
): number => {
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return (
        t.type === 'expense' &&
        transactionDate.getMonth() === targetMonth &&
        transactionDate.getFullYear() === targetYear
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate budget spent amount based on transactions
 */
export const calculateBudgetSpent = (
  budget: Budget,
  transactions: Transaction[]
): number => {
  // Determine the time period for this budget
  const period = budget.period || 'monthly';
  const now = new Date();
  
  let startDate: Date;
  let endDate: Date = now;

  switch (period) {
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
  }

  // Filter transactions by category and date range
  return transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return (
        t.type === 'expense' &&
        t.categoryId === budget.categoryId &&
        transactionDate >= startDate &&
        transactionDate <= endDate
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate wallet statistics (income/expense per wallet)
 */
export const calculateWalletStats = (
  walletId: string,
  transactions: Transaction[],
  month?: number,
  year?: number
): { income: number; expense: number } => {
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  const walletTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      t.walletId === walletId &&
      transactionDate.getMonth() === targetMonth &&
      transactionDate.getFullYear() === targetYear
    );
  });

  const income = walletTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = walletTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense };
};

/**
 * Calculate net flow (income - expenses)
 */
export const calculateNetFlow = (income: number, expense: number): number => {
  return income - expense;
};

/**
 * Calculate budget utilization percentage
 */
export const calculateBudgetUtilization = (spent: number, budget: number): number => {
  if (budget === 0) return 0;
  return (spent / budget) * 100;
};

/**
 * Calculate remaining budget amount
 */
export const calculateRemainingBudget = (spent: number, budget: number): number => {
  return budget - spent;
};

/**
 * Validate balance sufficiency for a transaction
 */
export const validateBalanceSufficiency = (
  wallet: Wallet,
  amount: number,
  fee: number = 0
): boolean => {
  return wallet.balance >= (amount + fee);
};

/**
 * Calculate new wallet balance after transaction
 */
export const calculateNewBalance = (
  currentBalance: number,
  amount: number,
  transactionType: 'income' | 'expense' | 'transfer',
  isSource: boolean = true
): number => {
  switch (transactionType) {
    case 'income':
      return currentBalance + amount;
    case 'expense':
      return currentBalance - amount;
    case 'transfer':
      return isSource ? currentBalance - amount : currentBalance + amount;
    default:
      return currentBalance;
  }
};

/**
 * Calculate transfer impact (source and destination balances)
 */
export interface TransferImpact {
  sourceBalance: number;
  destinationBalance: number;
  totalFee: number;
}

export const calculateTransferImpact = (
  sourceWallet: Wallet,
  destinationWallet: Wallet,
  amount: number,
  fee: number = 0
): TransferImpact => {
  return {
    sourceBalance: sourceWallet.balance - amount - fee,
    destinationBalance: destinationWallet.balance + amount,
    totalFee: fee
  };
};

/**
 * Group transactions by category
 */
export const groupTransactionsByCategory = (
  transactions: Transaction[]
): Record<number, { amount: number; count: number }> => {
  return transactions.reduce((acc, transaction) => {
    const categoryId = transaction.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = { amount: 0, count: 0 };
    }
    acc[categoryId].amount += transaction.amount;
    acc[categoryId].count += 1;
    return acc;
  }, {} as Record<number, { amount: number; count: number }>);
};

/**
 * Filter transactions by date range
 */
export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

/**
 * Calculate daily average spending
 */
export const calculateDailyAverageSpending = (
  transactions: Transaction[],
  days: number = 30
): number => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const recentExpenses = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && transactionDate >= startDate;
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  return recentExpenses / days;
};
