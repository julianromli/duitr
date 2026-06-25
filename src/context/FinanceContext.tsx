/**
 * FinanceContext
 * 
 * Main context for financial data management.
 * Simplified - no category logic (handled by CategoryService/useCategories).
 */

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency as utilsFormatCurrency } from '@/utils/currency';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Transaction, Budget, Wallet, WantToBuyItem, PinjamanItem } from '@/types/finance';
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding';
import { useTranslation } from 'react-i18next';
import { useFinanceQueries } from '@/hooks/finance/useFinanceQueries';
import { financeQueryKeys } from '@/services/finance/queryKeys';
import budgetService from '@/services/budgetService';
import pinjamanService from '@/services/pinjamanService';
import transactionService, { formatTransactionForDB } from '@/services/transactionService';
import walletService from '@/services/walletService';
import wantToBuyService from '@/services/wantToBuyService';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  wallets: Wallet[];
  wantToBuyItems: WantToBuyItem[];
  pinjamanItems: PinjamanItem[];
  currency: string;
  currencySymbol: string;
  isLoading: boolean;
  updateCurrency: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addWantToBuyItem: (item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>) => Promise<void>;
  updateWantToBuyItem: (item: WantToBuyItem) => Promise<void>;
  deleteWantToBuyItem: (id: string) => Promise<void>;
  addPinjamanItem: (item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>) => Promise<void>;
  updatePinjamanItem: (item: PinjamanItem) => Promise<void>;
  deletePinjamanItem: (id: string) => Promise<void>;
  totalBalance: number;
  convertedTotalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  formatCurrency: (amount: number) => string;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { getUserCurrency } = useCurrencyOnboarding();
  const userCurrency = getUserCurrency();

  const {
    wallets,
    transactions,
    budgets,
    wantToBuyItems,
    pinjamanItems,
    isLoading,
  } = useFinanceQueries(user?.id);

  const [currency] = useState('IDR');
  const [currencySymbol] = useState('Rp');

  const invalidateFinance = useCallback(() => {
    if (user?.id) {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all(user.id) });
    }
  }, [queryClient, user?.id]);

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  // In single-currency system, converted balance is the same as total balance
  const convertedTotalBalance = totalBalance;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return utilsFormatCurrency(amount, userCurrency);
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required', description: 'You must be logged in.' });
      return;
    }

    let fromWallet: Wallet | undefined;
    let toWallet: Wallet | undefined;
    let updatedFromWallet: Wallet | undefined;
    let updatedToWallet: Wallet | undefined;

    if (transaction.type === 'transfer') {
      if (!transaction.destinationWalletId) {
         toast({ variant: 'destructive', title: 'Transfer Error', description: 'Destination wallet is missing.' });
         return;
      }
      fromWallet = wallets.find(w => w.id === transaction.walletId);
      toWallet = wallets.find(w => w.id === transaction.destinationWalletId);
      if (!fromWallet || !toWallet) {
          toast({ variant: 'destructive', title: 'Transfer Error', description: 'One or both wallets not found.' });
          return;
      }
      if (fromWallet.id === toWallet.id) {
          toast({ variant: 'destructive', title: 'Transfer Error', description: 'Cannot transfer to the same wallet.' });
          return;
      }
       const fee = transaction.fee ?? 0;
       updatedFromWallet = { ...fromWallet, balance: fromWallet.balance - (transaction.amount + fee) };
       updatedToWallet = { ...toWallet, balance: toWallet.balance + transaction.amount };

    } else {
      fromWallet = wallets.find(w => w.id === transaction.walletId);
       if (!fromWallet) {
          toast({ variant: 'destructive', title: 'Transaction Error', description: 'Wallet not found.' });
          return;
       }
       const newBalance = transaction.type === 'income'
           ? fromWallet.balance + transaction.amount
           : fromWallet.balance - transaction.amount;
       updatedFromWallet = { ...fromWallet, balance: newBalance };
    }


    try {
      // Determine the categoryId (integer)
      let finalCategoryId: number = transaction.categoryId || 0;
      
      // Handle specific cases
      if (!finalCategoryId || finalCategoryId === 0) {
        if (transaction.type === 'transfer') {
          finalCategoryId = 18; // System transfer category
        } else {
          // Default fallbacks
          finalCategoryId = transaction.type === 'income' ? 17 : 12; // Default to other
        }
      }

      // Use integer category ID directly (no conversion needed)
      const dbCategoryId = finalCategoryId;

      const newTransactionData = {
        amount: transaction.amount,
        category_id: dbCategoryId,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        wallet_id: transaction.walletId,
        user_id: user.id,
        ...(transaction.type === 'transfer' && transaction.destinationWalletId 
          ? { destination_wallet_id: transaction.destinationWalletId } 
          : {}),
        ...(transaction.type === 'transfer' && transaction.fee != null 
          ? { fee: transaction.fee } 
          : {}),
      };
      
      let finalTransactionData;
      
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert(await formatTransactionForDB(newTransactionData, userCurrency))
        .select()
        .single();
        
      if (transactionError) {
        if (transactionError.message.includes('destination_wallet_id') || 
            transactionError.message.includes('column') || 
            transactionError.message.includes('schema')) {
          console.error('Schema error detected:', transactionError);
          
          const fallbackData = {
            amount: transaction.amount,
            category_id: dbCategoryId,
            description: transaction.description,
            date: transaction.date,
            type: transaction.type,
            wallet_id: transaction.walletId,
            user_id: user.id,
          };
          
          if (transaction.type === 'transfer' && transaction.destinationWalletId) {
            try {
              const { data: basicTransData, error: basicTransError } = await supabase
                .from('transactions')
                .insert(await formatTransactionForDB(fallbackData, userCurrency))
                .select()
                .single();
                
              if (basicTransError) throw basicTransError;
              
              const { error: updateError } = await supabase
                .from('transactions')
                .update({
                  destination_wallet_id: transaction.destinationWalletId,
                  fee: transaction.fee ?? 0
                })
                .eq('id', basicTransData.id);
                
              if (updateError) {
                console.warn('Could not update transfer details:', updateError);
                finalTransactionData = basicTransData;
              } else {
                const { data: updatedTrans } = await supabase
                  .from('transactions')
                  .select()
                  .eq('id', basicTransData.id)
                  .single();
                  
                finalTransactionData = updatedTrans;
              }
            } catch (fallbackError: any) {
              console.error('Fallback transaction insert failed:', fallbackError);
              throw fallbackError;
            }
          } else {
            const { data: basicData, error: basicError } = await supabase
              .from('transactions')
              .insert(fallbackData)
              .select()
              .single();
              
            if (basicError) throw basicError;
            finalTransactionData = basicData;
          }
        } else {
          throw transactionError;
        }
      } else {
        finalTransactionData = transactionData;
      }

      if (transaction.type === 'transfer') {
        await walletService.updateBalance(updatedFromWallet!.id, updatedFromWallet!.balance);
        await walletService.updateBalance(updatedToWallet!.id, updatedToWallet!.balance);
      } else {
        await walletService.updateBalance(updatedFromWallet!.id, updatedFromWallet!.balance);
      }

      invalidateFinance();
      toast({ title: 'Success', description: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} added.` });

    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to add transaction' });
    }
  };


  const updateTransaction = async (updatedTransaction: Transaction) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }
    
      const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);
      if (!oldTransaction) {
        toast({ variant: 'destructive', title: 'Error', description: 'Original transaction not found.' });
        return;
     }

     const balanceUpdates: { walletId: string; change: number }[] = [];

     if (oldTransaction.type === 'transfer') {
        const oldFee = oldTransaction.fee ?? 0;
        balanceUpdates.push({ walletId: oldTransaction.walletId, change: oldTransaction.amount + oldFee });
        if (oldTransaction.destinationWalletId) {
           balanceUpdates.push({ walletId: oldTransaction.destinationWalletId, change: -oldTransaction.amount });
        }
     } else if (oldTransaction.type === 'income') {
        balanceUpdates.push({ walletId: oldTransaction.walletId, change: -oldTransaction.amount });
          } else if (oldTransaction.type === 'expense') {
        balanceUpdates.push({ walletId: oldTransaction.walletId, change: oldTransaction.amount });
     }

     if (updatedTransaction.type === 'transfer') {
        const newFee = updatedTransaction.fee ?? 0;
        if (!updatedTransaction.destinationWalletId) {
           toast({ variant: 'destructive', title: 'Update Error', description: 'Destination wallet missing for transfer.' });
           return;
        }
         balanceUpdates.push({ walletId: updatedTransaction.walletId, change: -(updatedTransaction.amount + newFee) });
         balanceUpdates.push({ walletId: updatedTransaction.destinationWalletId, change: updatedTransaction.amount });
     } else if (updatedTransaction.type === 'income') {
        balanceUpdates.push({ walletId: updatedTransaction.walletId, change: updatedTransaction.amount });
            } else if (updatedTransaction.type === 'expense') {
        balanceUpdates.push({ walletId: updatedTransaction.walletId, change: -updatedTransaction.amount });
     }

     const netBalanceChanges = balanceUpdates.reduce((acc, update) => {
        acc[update.walletId] = (acc[update.walletId] || 0) + update.change;
        return acc;
     }, {} as { [walletId: string]: number });

     const walletsToUpdateInDB: { id: string; balance: number }[] = [];

     for (const walletId in netBalanceChanges) {
        const change = netBalanceChanges[walletId];
        if (change === 0) continue;

        const wallet = wallets.find(w => w.id === walletId);
        if (!wallet) {
            console.error(`Wallet ID ${walletId} not found during update for transaction ${updatedTransaction.id}`);
            toast({ variant: 'destructive', title: 'Update Error', description: `Wallet ${walletId} not found.`});
            continue;
        }
        const newBalance = wallet.balance + change;
        walletsToUpdateInDB.push({ id: walletId, balance: newBalance });
     }

     try {
        // Determine the categoryId (integer)
        let categoryId: number = updatedTransaction.categoryId || 0;
        
        if (!categoryId || categoryId === 0) {
          categoryId = updatedTransaction.type === 'transfer' 
            ? 18  // System transfer category
            : (updatedTransaction.type === 'income' ? 17 : 12); // Default to other
        }

        // Use integer category ID directly (no conversion needed)
        const dbCategoryId = categoryId;

        // Create update data with optional fields to handle schema issues
        const updateData: {
          amount: number;
          category_id: number;
          description: string;
          date: string;
          type: 'income' | 'expense' | 'transfer';
          wallet_id: string;
          destination_wallet_id?: string | null;
          fee?: number | null;
        } = {
          amount: updatedTransaction.amount,
          category_id: dbCategoryId,
          description: updatedTransaction.description,
          date: updatedTransaction.date,
          type: updatedTransaction.type,
          wallet_id: updatedTransaction.walletId,
        };

        // Add optional fields only if needed to avoid schema errors
        if (updatedTransaction.type === 'transfer') {
          if (updatedTransaction.destinationWalletId) {
            try {
              const { error: testError } = await supabase
                .from('transactions')
                .update({ destination_wallet_id: updatedTransaction.destinationWalletId })
                .eq('id', updatedTransaction.id);
              
              if (!testError) {
                updateData.destination_wallet_id = updatedTransaction.destinationWalletId;
              }
            } catch (e) {
              console.warn('Cannot update destination_wallet_id due to schema issue');
            }

            try {
              const { error: feeError } = await supabase
                .from('transactions')
                .update({ fee: updatedTransaction.fee ?? 0 })
                .eq('id', updatedTransaction.id);

              if (!feeError) {
                updateData.fee = updatedTransaction.fee ?? 0;
              }
            } catch (e) {
              console.warn('Cannot update fee due to schema issue');
            }
          }
        }

        // Update the transaction in the database
        const { error: updateError } = await supabase
          .from('transactions')
          .update(await formatTransactionForDB(updateData, userCurrency))
          .eq('id', updatedTransaction.id)
          .select()
          .single();

        if (updateError) {
          // If there's a schema error, try a more basic update
          if (updateError.message.includes('column') || 
              updateError.message.includes('schema')) {
            console.error('Schema error on update:', updateError);
            
            // Fallback to basic fields only
            const { error: basicUpdateError } = await supabase
              .from('transactions')
              .update({
                amount: updatedTransaction.amount,
                category_id: dbCategoryId,
                description: updatedTransaction.description,
                date: updatedTransaction.date,
                type: updatedTransaction.type,
                wallet_id: updatedTransaction.walletId,
              })
              .eq('id', updatedTransaction.id);
              
            if (basicUpdateError) throw basicUpdateError;
          } else {
            throw updateError;
          }
        }

        await Promise.all(
          walletsToUpdateInDB.map((walletUpdate) =>
            walletService.updateBalance(walletUpdate.id, walletUpdate.balance),
          ),
        );

        invalidateFinance();
        toast({ title: 'Success', description: 'Transaction updated.' });

    } catch (error: any) {
        console.error('Error updating transaction:', error);
        toast({ variant: 'destructive', title: 'Update Error', description: error.message || 'Failed to update transaction' });
     }
  };


  const deleteTransaction = async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }
    
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      toast({ variant: 'destructive', title: 'Error', description: 'Transaction not found.' });
      return;
    }

    let fromWallet: Wallet | undefined;
    let toWallet: Wallet | undefined;
    let updatedFromWallet: Wallet | undefined;
    let updatedToWallet: Wallet | undefined;

    if (transactionToDelete.type === 'transfer') {
        fromWallet = wallets.find(w => w.id === transactionToDelete.walletId);
        if (transactionToDelete.destinationWalletId) {
            toWallet = wallets.find(w => w.id === transactionToDelete.destinationWalletId);
        }

        if (!fromWallet) {
            toast({ variant: 'destructive', title: 'Deletion Error', description: 'Source wallet not found.' });
            return;
        }
        const fee = transactionToDelete.fee ?? 0;
        updatedFromWallet = { ...fromWallet, balance: fromWallet.balance + (transactionToDelete.amount + fee) };
        if (toWallet) {
            updatedToWallet = { ...toWallet, balance: toWallet.balance - transactionToDelete.amount };
        }

    } else {
        fromWallet = wallets.find(w => w.id === transactionToDelete.walletId);
        if (!fromWallet) {
            toast({ variant: 'destructive', title: 'Deletion Error', description: 'Wallet not found.' });
            return;
        }
        const newBalance = transactionToDelete.type === 'income'
            ? fromWallet.balance - transactionToDelete.amount
            : fromWallet.balance + transactionToDelete.amount;
        updatedFromWallet = { ...fromWallet, balance: newBalance };
    }


    try {
      await transactionService.delete(id);

      if (transactionToDelete.type === 'transfer') {
        await walletService.updateBalance(updatedFromWallet!.id, updatedFromWallet!.balance);
        if (updatedToWallet) {
          await walletService.updateBalance(updatedToWallet.id, updatedToWallet.balance);
        }
      } else {
        await walletService.updateBalance(updatedFromWallet!.id, updatedFromWallet!.balance);
      }

      invalidateFinance();
      toast({ title: 'Success', description: 'Transaction deleted.' });

    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({ variant: 'destructive', title: 'Deletion Error', description: error.message || 'Failed to delete transaction' });
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    if (!user) return;

    try {
      await budgetService.create(user.id, budget);
      invalidateFinance();
      toast({
        title: t('common.success'),
        description: t('budgets.success.created'),
      });
    } catch (error: any) {
      console.error('Error in addBudget:', error);
      toast({
        title: t('common.error'),
        description: t('budgets.errors.add_budget') + ' ' + (error.message || ''),
        variant: 'destructive',
      });
    }
  };

  const updateBudget = async (updatedBudget: Budget) => {
    if (!user) return;

    try {
      await budgetService.update(updatedBudget);
      invalidateFinance();
      toast({
        title: 'Budget updated',
        description: 'Your budget has been successfully updated',
      });
    } catch (error: any) {
      console.error('Error updating budget:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update budget',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;

    try {
      await budgetService.delete(id);
      invalidateFinance();
      toast({
        title: 'Budget deleted',
        description: 'Your budget has been successfully deleted',
      });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete budget',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'userId'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error adding wallet',
        description: 'User not authenticated',
      });
      return;
    }

    try {
      await walletService.create(user.id, wallet);
      invalidateFinance();
      toast({
        title: 'Wallet added',
        description: `${wallet.name} has been added to your accounts`,
      });
    } catch (error: any) {
      console.error('Error adding wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Error adding wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const updateWallet = async (updatedWallet: Wallet) => {
    try {
      await walletService.update(updatedWallet);
      invalidateFinance();
      toast({
        title: 'Wallet updated',
        description: `${updatedWallet.name} has been updated`,
      });
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const deleteWallet = async (id: string) => {
    if (!user) return;

    try {
      const walletTransactions = transactions.filter((t) => t.walletId === id);
      for (const transaction of walletTransactions) {
        await transactionService.delete(transaction.id);
      }

      await walletService.delete(id);
      invalidateFinance();
      toast({
        title: 'Wallet deleted',
        description: 'Your wallet has been successfully deleted',
      });
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const updateCurrency = () => {
    // Currency is always IDR, no need to update
  };

  const addWantToBuyItem = async (item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      await wantToBuyService.create(user.id, item);
      invalidateFinance();
      toast({ title: 'Success', description: 'Wishlist item added.' });
    } catch (error: any) {
      console.error('Error adding WantToBuy item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updateWantToBuyItem = async (item: WantToBuyItem) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      await wantToBuyService.update(item);
      invalidateFinance();
    } catch (error: any) {
      console.error('Error updating WantToBuy item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const deleteWantToBuyItem = async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      await wantToBuyService.delete(id);
      invalidateFinance();
      toast({ title: 'Success', description: 'Wishlist item deleted.' });
    } catch (error: any) {
      console.error('Error deleting WantToBuy item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const addPinjamanItem = async (item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      await pinjamanService.create(user.id, item);
      invalidateFinance();
      toast({ title: 'Success', description: 'Pinjaman item added.' });
    } catch (error: any) {
      console.error('Error adding Pinjaman item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updatePinjamanItem = async (item: PinjamanItem) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      await pinjamanService.update(item);
      invalidateFinance();
    } catch (error: any) {
      console.error('Error updating Pinjaman item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const deletePinjamanItem = async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      await pinjamanService.delete(id);
      invalidateFinance();
      toast({ title: 'Success', description: 'Pinjaman item deleted.' });
    } catch (error: any) {
      console.error('Error deleting Pinjaman item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const value = {
        transactions,
        budgets,
        wallets,
    wantToBuyItems,
    pinjamanItems,
        currency,
        currencySymbol,
        isLoading,
        updateCurrency,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        addWallet,
        updateWallet,
        deleteWallet,
    addWantToBuyItem,
    updateWantToBuyItem,
    deleteWantToBuyItem,
    addPinjamanItem,
    updatePinjamanItem,
    deletePinjamanItem,
        totalBalance,
        convertedTotalBalance,
        monthlyIncome,
        monthlyExpense,
    formatCurrency,
  };

  // Note: Transactions are already sorted by created_at DESC from the database query
  // No need for additional sorting or category ID conversion (integer IDs used consistently)

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
