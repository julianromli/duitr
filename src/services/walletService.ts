/**
 * WalletService
 * 
 * Service layer for wallet operations.
 * Handles CRUD operations, balance updates, and multi-wallet transfers.
 * 
 * Features:
 * - Wallet CRUD operations
 * - Balance management
 * - Multi-currency support (display-only)
 * - Transfer validations
 */

import { supabase } from '@/lib/supabase';
import { Wallet } from '@/types/finance';

/**
 * Database wallet data (matches Supabase schema)
 */
interface DbWalletData {
  id?: string;
  name: string;
  balance: number;
  type: 'cash' | 'bank' | 'e-wallet' | 'investment';
  color: string;
  icon?: string;
  user_id: string;
  base_currency?: string;
}

/**
 * Validate wallet data before submission
 */
export const validateWallet = (
  wallet: Omit<Wallet, 'id' | 'userId'>
): { valid: boolean; error?: string } => {
  if (!wallet.name || wallet.name.trim() === '') {
    return { valid: false, error: 'Wallet name is required' };
  }
  
  if (wallet.balance == null || isNaN(wallet.balance)) {
    return { valid: false, error: 'Valid balance is required' };
  }
  
  if (!wallet.type) {
    return { valid: false, error: 'Wallet type is required' };
  }
  
  const validTypes = ['cash', 'bank', 'e-wallet', 'investment'];
  if (!validTypes.includes(wallet.type)) {
    return { valid: false, error: 'Invalid wallet type' };
  }
  
  if (!wallet.color || wallet.color.trim() === '') {
    return { valid: false, error: 'Wallet color is required' };
  }
  
  return { valid: true };
};

/**
 * Insert a wallet into the database
 */
export const insertWallet = async (
  wallet: Omit<Wallet, 'id' | 'userId'>,
  userId: string
): Promise<Wallet> => {
  const walletType = wallet.type || 'cash';
  
  const insertData: Partial<DbWalletData> = {
    name: wallet.name,
    balance: wallet.balance,
    type: walletType,
    color: wallet.color,
    user_id: userId,
  };
  
  // Try to add icon field
  if (wallet.icon) {
    insertData.icon = wallet.icon || 'wallet';
  }
  
  let data;
  try {
    const { data: insertedData, error } = await supabase
      .from('wallets')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      // Try again without icon field if there was an error
      if (error.message.includes('column') && insertData.icon) {
        delete insertData.icon;
        
        const { data: retryData, error: retryError } = await supabase
          .from('wallets')
          .insert(insertData)
          .select()
          .single();
        
        if (retryError) throw retryError;
        data = retryData;
      } else {
        throw error;
      }
    } else {
      data = insertedData;
    }
  } catch (error) {
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    balance: data.balance,
    type: data.type || 'cash',
    color: data.color,
    icon: data.icon || 'wallet',
    userId: data.user_id
  };
};

/**
 * Update a wallet in the database
 */
export const updateWallet = async (wallet: Wallet): Promise<void> => {
  const walletType = wallet.type || 'cash';
  
  const updateData: Partial<DbWalletData> = {
    name: wallet.name,
    balance: wallet.balance,
    type: walletType,
    color: wallet.color,
  };
  
  // Try to add icon if it exists
  if (wallet.icon) {
    updateData.icon = wallet.icon;
  }
  
  try {
    const { error } = await supabase
      .from('wallets')
      .update(updateData)
      .eq('id', wallet.id);
    
    if (error) {
      // Try again without icon field if there was a column error
      if (error.message.includes('column') && updateData.icon) {
        delete updateData.icon;
        
        const { error: retryError } = await supabase
          .from('wallets')
          .update(updateData)
          .eq('id', wallet.id);
        
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update wallet balance
 */
export const updateWalletBalance = async (
  walletId: string,
  newBalance: number
): Promise<void> => {
  const { error } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', walletId);
  
  if (error) throw error;
};

/**
 * Batch update multiple wallet balances (for transfers)
 */
export const batchUpdateWalletBalances = async (
  updates: Array<{ walletId: string; newBalance: number }>
): Promise<void> => {
  const promises = updates.map(update =>
    updateWalletBalance(update.walletId, update.newBalance)
  );
  
  await Promise.all(promises);
};

/**
 * Delete a wallet from the database
 */
export const deleteWallet = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('wallets')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Delete all transactions for a wallet (cascade delete)
 */
export const deleteWalletTransactions = async (walletId: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('wallet_id', walletId);
  
  if (error) throw error;
};

/**
 * Fetch all wallets for a user
 */
export const fetchWallets = async (userId: string): Promise<Wallet[]> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return data.map(w => ({
    id: w.id,
    name: w.name,
    balance: w.balance,
    icon: w.icon || 'wallet',
    color: w.color,
    type: w.type || 'cash',
    userId: w.user_id
  }));
};

/**
 * Find wallet by ID
 */
export const findWalletById = (
  wallets: Wallet[],
  id: string
): Wallet | undefined => {
  return wallets.find(w => w.id === id);
};

/**
 * Check if wallet has sufficient balance
 */
export const hasUfficientBalance = (
  wallet: Wallet,
  amount: number,
  fee: number = 0
): boolean => {
  return wallet.balance >= (amount + fee);
};

/**
 * Validate transfer between wallets
 */
export const validateTransfer = (
  sourceWallet: Wallet,
  destinationWallet: Wallet,
  amount: number,
  fee: number = 0
): { valid: boolean; error?: string } => {
  if (sourceWallet.id === destinationWallet.id) {
    return { valid: false, error: 'Cannot transfer to the same wallet' };
  }
  
  if (!hasUfficientBalance(sourceWallet, amount, fee)) {
    return { valid: false, error: 'Insufficient balance for transfer' };
  }
  
  if (amount <= 0) {
    return { valid: false, error: 'Transfer amount must be greater than 0' };
  }
  
  if (fee < 0) {
    return { valid: false, error: 'Transfer fee cannot be negative' };
  }
  
  return { valid: true };
};

/**
 * Calculate total balance across wallets
 */
export const calculateTotalBalance = (wallets: Wallet[]): number => {
  return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
};

/**
 * Get wallet type icon name
 */
export const getWalletTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    bank: 'Landmark',
    cash: 'Wallet',
    'e-wallet': 'CreditCard',
    investment: 'TrendingUp'
  };
  
  return iconMap[type] || 'Wallet';
};

/**
 * Sort wallets by name
 */
export const sortWalletsByName = (wallets: Wallet[]): Wallet[] => {
  return [...wallets].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Sort wallets by balance (descending)
 */
export const sortWalletsByBalance = (wallets: Wallet[]): Wallet[] => {
  return [...wallets].sort((a, b) => b.balance - a.balance);
};

/**
 * Filter wallets by type
 */
export const filterWalletsByType = (
  wallets: Wallet[],
  type: 'cash' | 'bank' | 'e-wallet' | 'investment'
): Wallet[] => {
  return wallets.filter(w => w.type === type);
};
