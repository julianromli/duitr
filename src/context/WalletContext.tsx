/**
 * WalletContext
 * 
 * Specialized context for wallet management.
 * Handles wallet CRUD operations and balance tracking.
 * 
 * Features:
 * - Wallet state management
 * - Balance calculations
 * - Optimized re-renders with useCallback/useMemo
 * - Multi-wallet support
 * 
 * Performance Optimizations:
 * - Memoized total balance calculation
 * - Stable function references
 * - Independent from transaction re-renders
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Wallet } from '@/types/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  fetchWallets,
  insertWallet,
  updateWallet as updateWalletInDb,
  deleteWallet as deleteWalletFromDb,
  deleteWalletTransactions,
  validateWallet,
  calculateTotalBalance as calcTotalBalance,
  sortWalletsByBalance,
  filterWalletsByType,
} from '@/services/walletService';

interface WalletContextType {
  wallets: Wallet[];
  isLoading: boolean;
  totalBalance: number;
  convertedTotalBalance: number; // Same as totalBalance for display-only currency
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  getWalletById: (id: string) => Wallet | undefined;
  getWalletsByType: (type: 'cash' | 'bank' | 'e-wallet' | 'investment') => Wallet[];
  getSortedWalletsByBalance: () => Wallet[];
  refreshWallets: () => Promise<void>;
  updateWalletBalance: (walletId: string, newBalance: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load wallets from database
   */
  const loadWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await fetchWallets(user.id);
      setWallets(data);
    } catch (error: any) {
      console.error('Error loading wallets:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading wallets',
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
    loadWallets();
  }, [loadWallets]);

  /**
   * Memoized total balance
   */
  const totalBalance = useMemo(() => {
    return calcTotalBalance(wallets);
  }, [wallets]);

  /**
   * Converted total balance (same as total balance for display-only currency)
   */
  const convertedTotalBalance = totalBalance;

  /**
   * Add a new wallet
   */
  const addWallet = useCallback(async (wallet: Omit<Wallet, 'id' | 'userId'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }

    // Validate wallet
    const validation = validateWallet(wallet);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error });
      return;
    }

    try {
      // Create temporary ID for optimistic update
      const tempId = Math.random().toString(36).substring(2, 9);
      const tempWallet = {
        id: tempId,
        ...wallet,
        type: wallet.type || 'cash',
        userId: user.id,
        icon: wallet.icon || 'wallet',
      };
      
      // Optimistic update
      setWallets(prev => [...prev, tempWallet]);

      // Insert wallet
      const newWallet = await insertWallet(wallet, user.id);

      // Replace temp wallet with actual wallet
      setWallets(prev => 
        prev.map(w => w.id === tempId ? newWallet : w)
      );

      toast({
        title: 'Wallet added',
        description: `${wallet.name} has been added to your accounts`,
      });
    } catch (error: any) {
      // Remove optimistic update on error
      setWallets(prev => prev.filter(w => w.userId === user.id && w.id.length > 9));
      
      console.error('Error adding wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Error adding wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  }, [user, toast]);

  /**
   * Update an existing wallet
   */
  const updateWallet = useCallback(async (updatedWallet: Wallet) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }

    // Validate wallet
    const validation = validateWallet(updatedWallet);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error });
      return;
    }

    // Store original for rollback
    const originalWallets = [...wallets];
    
    // Optimistic update
    setWallets(prev => prev.map(wallet => 
      wallet.id === updatedWallet.id ? updatedWallet : wallet
    ));

    try {
      await updateWalletInDb(updatedWallet);

      toast({
        title: 'Wallet updated',
        description: `${updatedWallet.name} has been updated`,
      });
    } catch (error: any) {
      // Rollback on error
      setWallets(originalWallets);
      
      console.error('Error updating wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  }, [user, toast, wallets]);

  /**
   * Delete a wallet
   */
  const deleteWallet = useCallback(async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }

    // Store original for rollback
    const originalWallets = [...wallets];
    
    // Optimistic update
    setWallets(prev => prev.filter(wallet => wallet.id !== id));

    try {
      // Delete associated transactions first
      await deleteWalletTransactions(id);
      
      // Delete wallet
      await deleteWalletFromDb(id);

      toast({
        title: 'Wallet deleted',
        description: 'Your wallet has been successfully deleted',
      });
    } catch (error: any) {
      // Rollback on error
      setWallets(originalWallets);
      
      console.error('Error deleting wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  }, [user, toast, wallets]);

  /**
   * Get wallet by ID
   */
  const getWalletById = useCallback((id: string): Wallet | undefined => {
    return wallets.find(w => w.id === id);
  }, [wallets]);

  /**
   * Get wallets filtered by type
   */
  const getWalletsByType = useCallback((type: 'cash' | 'bank' | 'e-wallet' | 'investment'): Wallet[] => {
    return filterWalletsByType(wallets, type);
  }, [wallets]);

  /**
   * Get wallets sorted by balance (descending)
   */
  const getSortedWalletsByBalance = useCallback((): Wallet[] => {
    return sortWalletsByBalance(wallets);
  }, [wallets]);

  /**
   * Refresh wallets from database
   */
  const refreshWallets = useCallback(async () => {
    await loadWallets();
  }, [loadWallets]);

  /**
   * Update wallet balance (called by TransactionContext)
   */
  const updateWalletBalance = useCallback((walletId: string, newBalance: number) => {
    setWallets(prev => prev.map(wallet => 
      wallet.id === walletId ? { ...wallet, balance: newBalance } : wallet
    ));
  }, []);

  const value = useMemo(() => ({
    wallets,
    isLoading,
    totalBalance,
    convertedTotalBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    getWalletById,
    getWalletsByType,
    getSortedWalletsByBalance,
    refreshWallets,
    updateWalletBalance,
  }), [
    wallets,
    isLoading,
    totalBalance,
    convertedTotalBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    getWalletById,
    getWalletsByType,
    getSortedWalletsByBalance,
    refreshWallets,
    updateWalletBalance,
  ]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Custom hook to use wallet context
 */
export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
