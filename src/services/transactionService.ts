/**
 * TransactionService
 * 
 * Service layer for transaction operations.
 * Handles CRUD operations, validation, and database formatting.
 * 
 * Extracted from FinanceContext to improve:
 * - Testability (can mock Supabase)
 * - Reusability (shared across contexts)
 * - Maintainability (single responsibility)
 */

import { supabase } from '@/lib/supabase';
import { Transaction, Wallet } from '@/types/finance';
import { calculateNewBalance, validateBalanceSufficiency } from './calculationService';

/**
 * Database transaction data (matches Supabase schema)
 */
interface DbTransactionData {
  amount: number;
  category_id: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  wallet_id: string;
  user_id: string;
  destination_wallet_id?: string | null;
  fee?: number | null;
  original_amount?: number;
  original_currency?: string;
  converted_amount?: number;
  converted_currency?: string;
  exchange_rate?: number;
}

/**
 * Format transaction data for database insertion/update
 * Handles schema compatibility and currency fields
 */
export const formatTransactionForDB = async (
  data: Partial<DbTransactionData>,
  userCurrency: string = 'IDR'
): Promise<Partial<DbTransactionData>> => {
  // Remove category field if it exists (legacy)
  const { ...dbData } = data;
  
  // Add currency fields for display-only currency preference
  if (dbData.amount !== undefined && !dbData.original_amount) {
    dbData.original_amount = dbData.amount;
    dbData.original_currency = userCurrency;
    dbData.converted_amount = dbData.amount;
    dbData.converted_currency = userCurrency;
    dbData.exchange_rate = 1.0;
  }
  
  // Ensure category_id is a number
  if (dbData.category_id) {
    if (typeof dbData.category_id === 'string') {
      dbData.category_id = Number(dbData.category_id) || 12; // Default to expense_other
    }
  }
  
  return dbData;
};

/**
 * Validate transaction data before submission
 */
export const validateTransaction = (
  transaction: Omit<Transaction, 'id' | 'userId'>,
  wallets: Wallet[]
): { valid: boolean; error?: string } => {
  // Check required fields
  if (!transaction.amount || transaction.amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (!transaction.walletId) {
    return { valid: false, error: 'Wallet is required' };
  }
  
  // Validate wallet exists
  const wallet = wallets.find(w => w.id === transaction.walletId);
  if (!wallet) {
    return { valid: false, error: 'Wallet not found' };
  }
  
  // Transfer-specific validation
  if (transaction.type === 'transfer') {
    if (!transaction.destinationWalletId) {
      return { valid: false, error: 'Destination wallet is required for transfers' };
    }
    
    if (transaction.walletId === transaction.destinationWalletId) {
      return { valid: false, error: 'Cannot transfer to the same wallet' };
    }
    
    const destinationWallet = wallets.find(w => w.id === transaction.destinationWalletId);
    if (!destinationWallet) {
      return { valid: false, error: 'Destination wallet not found' };
    }
    
    // Check if source wallet has sufficient balance
    const fee = transaction.fee || 0;
    if (!validateBalanceSufficiency(wallet, transaction.amount, fee)) {
      return { valid: false, error: 'Insufficient balance for transfer' };
    }
  } else {
    // For expense transactions, check balance
    if (transaction.type === 'expense' && !validateBalanceSufficiency(wallet, transaction.amount)) {
      return { valid: false, error: 'Insufficient balance for expense' };
    }
  }
  
  // Category validation
  if (transaction.type !== 'transfer' && !transaction.categoryId) {
    return { valid: false, error: 'Category is required' };
  }
  
  return { valid: true };
};

/**
 * Calculate wallet balance updates for a transaction
 */
export interface BalanceUpdate {
  walletId: string;
  newBalance: number;
}

export const calculateBalanceUpdates = (
  transaction: Omit<Transaction, 'id' | 'userId'>,
  wallets: Wallet[]
): BalanceUpdate[] => {
  const updates: BalanceUpdate[] = [];
  
  const sourceWallet = wallets.find(w => w.id === transaction.walletId);
  if (!sourceWallet) return updates;
  
  if (transaction.type === 'transfer' && transaction.destinationWalletId) {
    const destinationWallet = wallets.find(w => w.id === transaction.destinationWalletId);
    if (!destinationWallet) return updates;
    
    const fee = transaction.fee || 0;
    updates.push({
      walletId: sourceWallet.id,
      newBalance: sourceWallet.balance - transaction.amount - fee
    });
    updates.push({
      walletId: destinationWallet.id,
      newBalance: destinationWallet.balance + transaction.amount
    });
  } else {
    const newBalance = calculateNewBalance(
      sourceWallet.balance,
      transaction.amount,
      transaction.type,
      true
    );
    updates.push({
      walletId: sourceWallet.id,
      newBalance
    });
  }
  
  return updates;
};

/**
 * Calculate balance updates when deleting a transaction (reverse operation)
 */
export const calculateBalanceUpdatesForDeletion = (
  transaction: Transaction,
  wallets: Wallet[]
): BalanceUpdate[] => {
  const updates: BalanceUpdate[] = [];
  
  const sourceWallet = wallets.find(w => w.id === transaction.walletId);
  if (!sourceWallet) return updates;
  
  if (transaction.type === 'transfer' && transaction.destinationWalletId) {
    const destinationWallet = wallets.find(w => w.id === transaction.destinationWalletId);
    if (!destinationWallet) return updates;
    
    const fee = transaction.fee || 0;
    // Reverse the transfer
    updates.push({
      walletId: sourceWallet.id,
      newBalance: sourceWallet.balance + transaction.amount + fee
    });
    updates.push({
      walletId: destinationWallet.id,
      newBalance: destinationWallet.balance - transaction.amount
    });
  } else {
    // Reverse income/expense
    const reverseType = transaction.type === 'income' ? 'expense' : 'income';
    const newBalance = calculateNewBalance(
      sourceWallet.balance,
      transaction.amount,
      reverseType,
      true
    );
    updates.push({
      walletId: sourceWallet.id,
      newBalance
    });
  }
  
  return updates;
};

/**
 * Calculate balance updates when updating a transaction
 */
export const calculateBalanceUpdatesForUpdate = (
  oldTransaction: Transaction,
  newTransaction: Transaction,
  wallets: Wallet[]
): BalanceUpdate[] => {
  // First, reverse the old transaction
  const reversals = calculateBalanceUpdatesForDeletion(oldTransaction, wallets);
  
  // Apply the reversals to get intermediate wallet states
  const intermediateWallets = wallets.map(wallet => {
    const reversal = reversals.find(r => r.walletId === wallet.id);
    if (reversal) {
      return { ...wallet, balance: reversal.newBalance };
    }
    return wallet;
  });
  
  // Then, apply the new transaction
  return calculateBalanceUpdates(newTransaction, intermediateWallets);
};

/**
 * Insert a transaction into the database
 */
export const insertTransaction = async (
  transaction: Omit<Transaction, 'id' | 'userId'>,
  userId: string,
  userCurrency: string = 'IDR'
): Promise<Transaction> => {
  const categoryId = transaction.categoryId || (
    transaction.type === 'transfer' ? 18 : 
    transaction.type === 'income' ? 17 : 12
  );
  
  const newTransactionData: DbTransactionData = {
    amount: transaction.amount,
    category_id: categoryId,
    description: transaction.description,
    date: transaction.date,
    type: transaction.type,
    wallet_id: transaction.walletId,
    user_id: userId,
    ...(transaction.type === 'transfer' && transaction.destinationWalletId 
      ? { destination_wallet_id: transaction.destinationWalletId } 
      : {}),
    ...(transaction.type === 'transfer' && transaction.fee != null 
      ? { fee: transaction.fee } 
      : {}),
  };
  
  const formattedData = await formatTransactionForDB(newTransactionData, userCurrency);
  
  const { data, error } = await supabase
    .from('transactions')
    .insert(formattedData)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    amount: data.amount,
    categoryId: data.category_id,
    description: data.description,
    date: data.date,
    type: data.type,
    walletId: data.wallet_id,
    userId: data.user_id,
    destinationWalletId: data.destination_wallet_id,
    fee: data.fee,
  };
};

/**
 * Update a transaction in the database
 */
export const updateTransaction = async (
  transaction: Transaction,
  userCurrency: string = 'IDR'
): Promise<void> => {
  const categoryId = transaction.categoryId || (
    transaction.type === 'transfer' ? 18 : 
    transaction.type === 'income' ? 17 : 12
  );
  
  const updateData: Partial<DbTransactionData> = {
    amount: transaction.amount,
    category_id: categoryId,
    description: transaction.description,
    date: transaction.date,
    type: transaction.type,
    wallet_id: transaction.walletId,
  };
  
  if (transaction.type === 'transfer') {
    updateData.destination_wallet_id = transaction.destinationWalletId || null;
    updateData.fee = transaction.fee ?? 0;
  }
  
  const formattedData = await formatTransactionForDB(updateData, userCurrency);
  
  const { error } = await supabase
    .from('transactions')
    .update(formattedData)
    .eq('id', transaction.id);
  
  if (error) throw error;
};

/**
 * Delete a transaction from the database
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Fetch all transactions for a user
 */
export const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(t => ({
    id: t.id,
    amount: t.amount,
    categoryId: t.category_id || (t.type === 'transfer' ? 18 : t.type === 'income' ? 17 : 12),
    description: t.description,
    date: t.date,
    type: t.type as 'income' | 'expense' | 'transfer',
    walletId: t.wallet_id,
    userId: t.user_id,
    destinationWalletId: t.destination_wallet_id,
    fee: t.fee
  }));
};
