/**
 * TransactionContext
 * 
 * Specialized context for transaction management.
 * Handles transaction CRUD operations and coordinates with WalletContext for balance updates.
 * 
 * Features:
 * - Transaction state management
 * - Optimized re-renders with useCallback/useMemo
 * - Validation and error handling
 * - Coordination with wallet balance updates
 * 
 * Performance Optimizations:
 * - Memoized computed values (monthly income/expense)
 * - Stable function references with useCallback
 * - Selective component subscriptions
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction as updateTransactionInDb,
  deleteTransaction as deleteTransactionFromDb,
  validateTransaction,
  calculateBalanceUpdates,
  calculateBalanceUpdatesForDeletion,
  calculateBalanceUpdatesForUpdate,
} from '@/services/transactionService';
import { batchUpdateWalletBalances } from '@/services/walletService';
import {
  calculateMonthlyIncome,
  calculateMonthlyExpense,
  groupTransactionsByCategory,
  filterTransactionsByDateRange,
} from '@/services/calculationService';
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding';

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByCategory: (categoryId: number) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  getTransactionsByWallet: (walletId: string) => Transaction[];
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
  wallets?: any[]; // Accept wallets from parent for validation
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children, wallets = [] }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getUserCurrency } = useCurrencyOnboarding();
  const userCurrency = getUserCurrency();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load transactions from database
   */
  const loadTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await fetchTransactions(user.id);
      setTransactions(data);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading transactions',
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  /**
   * Memoized computed values
   */
  const monthlyIncome = useMemo(() => {
    return calculateMonthlyIncome(transactions);
  }, [transactions]);

  const monthlyExpense = useMemo(() => {
    return calculateMonthlyExpense(transactions);
  }, [transactions]);

  /**
   * Add a new transaction
   */
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }

    // Validate transaction
    const validation = validateTransaction(transaction, wallets);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error });
      return;
    }

    try {
      // Calculate balance updates
      const balanceUpdates = calculateBalanceUpdates(transaction, wallets);

      // Insert transaction
      const newTransaction = await insertTransaction(transaction, user.id, userCurrency);

      // Update wallet balances
      await batchUpdateWalletBalances(balanceUpdates);

      // Sort transactions in descending order by date
      const sortedTransactions = [newTransaction, ...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(sortedTransactions);

      toast({
        title: 'Success',
        description: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} added.`
      });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add transaction'
      });
    }
  }, [user, toast, wallets, transactions, userCurrency]);

  /**
   * Update an existing transaction
   */
  const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }

    const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);
    if (!oldTransaction) {
      toast({ variant: 'destructive', title: 'Error', description: 'Original transaction not found.' });
      return;
    }

    // Validate updated transaction
    const validation = validateTransaction(updatedTransaction, wallets);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error });
      return;
    }

    try {
      // Calculate balance updates (reverse old, apply new)
      const balanceUpdates = calculateBalanceUpdatesForUpdate(
        oldTransaction,
        updatedTransaction,
        wallets
      );

      // Update transaction in database
      await updateTransactionInDb(updatedTransaction, userCurrency);

      // Update wallet balances
      await batchUpdateWalletBalances(balanceUpdates);

      // Sort transactions in descending order by date
      const updatedTransactions = transactions
        .map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(updatedTransactions);

      toast({ title: 'Success', description: 'Transaction updated.' });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Update Error',
        description: error.message || 'Failed to update transaction'
      });
    }
  }, [user, toast, wallets, transactions, userCurrency]);

  /**
   * Delete a transaction
   */
  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }

    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      toast({ variant: 'destructive', title: 'Error', description: 'Transaction not found.' });
      return;
    }

    try {
      // Calculate balance updates (reverse the transaction)
      const balanceUpdates = calculateBalanceUpdatesForDeletion(transactionToDelete, wallets);

      // Delete transaction from database
      await deleteTransactionFromDb(id);

      // Update wallet balances
      await batchUpdateWalletBalances(balanceUpdates);

      setTransactions(transactions.filter(t => t.id !== id));

      toast({ title: 'Success', description: 'Transaction deleted.' });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Deletion Error',
        description: error.message || 'Failed to delete transaction'
      });
    }
  }, [user, toast, wallets, transactions]);

  /**
   * Get transactions by category
   */
  const getTransactionsByCategory = useCallback((categoryId: number): Transaction[] => {
    return transactions.filter(t => t.categoryId === categoryId);
  }, [transactions]);

  /**
   * Get transactions by date range
   */
  const getTransactionsByDateRange = useCallback((startDate: Date, endDate: Date): Transaction[] => {
    return filterTransactionsByDateRange(transactions, startDate, endDate);
  }, [transactions]);

  /**
   * Get transactions by wallet
   */
  const getTransactionsByWallet = useCallback((walletId: string): Transaction[] => {
    return transactions.filter(t => t.walletId === walletId);
  }, [transactions]);

  /**
   * Refresh transactions from database
   */
  const refreshTransactions = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

  const value = useMemo(() => ({
    transactions,
    isLoading,
    monthlyIncome,
    monthlyExpense,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    getTransactionsByWallet,
    refreshTransactions,
  }), [
    transactions,
    isLoading,
    monthlyIncome,
    monthlyExpense,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    getTransactionsByWallet,
    refreshTransactions,
  ]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

/**
 * Custom hook to use transaction context
 */
export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
