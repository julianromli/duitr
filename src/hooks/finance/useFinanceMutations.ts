import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import budgetService from '@/services/budgetService';
import pinjamanService from '@/services/pinjamanService';
import transactionService, { TransactionValidationError } from '@/services/transactionService';
import walletService from '@/services/walletService';
import wantToBuyService from '@/services/wantToBuyService';
import type { Budget, PinjamanItem, Transaction, Wallet, WantToBuyItem } from '@/types/finance';

type ToastFn = (options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => void;

interface UseFinanceMutationsOptions {
  userId?: string;
  wallets: Wallet[];
  transactions: Transaction[];
  userCurrency: string;
  invalidateFinance: () => void;
  toast: ToastFn;
  t: TFunction;
}

export function useFinanceMutations({
  userId,
  wallets,
  transactions,
  userCurrency,
  invalidateFinance,
  toast,
  t,
}: UseFinanceMutationsOptions) {
  return useMemo(() => {
    const requireUser = (): string | null => {
      if (!userId) {
        toast({ variant: 'destructive', title: 'Authentication required' });
        return null;
      }
      return userId;
    };

    const handleValidationError = (error: unknown, fallbackTitle: string) => {
      if (error instanceof TransactionValidationError) {
        toast({ variant: 'destructive', title: fallbackTitle, description: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({ variant: 'destructive', title: fallbackTitle, description: message });
    };

    return {
      addTransaction: async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await transactionService.create(uid, transaction, wallets, userCurrency);
          invalidateFinance();
          toast({
            title: 'Success',
            description: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} added.`,
          });
        } catch (error) {
          console.error('Error adding transaction:', error);
          handleValidationError(error, 'Error');
        }
      },

      updateTransaction: async (updatedTransaction: Transaction) => {
        const uid = requireUser();
        if (!uid) return;
        const oldTransaction = transactions.find((item) => item.id === updatedTransaction.id);
        if (!oldTransaction) {
          toast({ variant: 'destructive', title: 'Error', description: 'Original transaction not found.' });
          return;
        }
        try {
          await transactionService.update(updatedTransaction, oldTransaction, wallets, userCurrency);
          invalidateFinance();
          toast({ title: 'Success', description: 'Transaction updated.' });
        } catch (error) {
          console.error('Error updating transaction:', error);
          handleValidationError(error, 'Update Error');
        }
      },

      deleteTransaction: async (id: string) => {
        const uid = requireUser();
        if (!uid) return;
        const transactionToDelete = transactions.find((item) => item.id === id);
        if (!transactionToDelete) {
          toast({ variant: 'destructive', title: 'Error', description: 'Transaction not found.' });
          return;
        }
        try {
          await transactionService.deleteWithBalanceRevert(transactionToDelete, wallets);
          invalidateFinance();
          toast({ title: 'Success', description: 'Transaction deleted.' });
        } catch (error) {
          console.error('Error deleting transaction:', error);
          handleValidationError(error, 'Deletion Error');
        }
      },

      addBudget: async (budget: Omit<Budget, 'id'>) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await budgetService.create(uid, budget);
          invalidateFinance();
          toast({ title: t('common.success'), description: t('budgets.success.created') });
        } catch (error) {
          console.error('Error in addBudget:', error);
          toast({
            title: t('common.error'),
            description: `${t('budgets.errors.add_budget')} ${error instanceof Error ? error.message : ''}`,
            variant: 'destructive',
          });
        }
      },

      updateBudget: async (updatedBudget: Budget) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await budgetService.update(updatedBudget);
          invalidateFinance();
          toast({ title: 'Budget updated', description: 'Your budget has been successfully updated' });
        } catch (error) {
          console.error('Error updating budget:', error);
          handleValidationError(error, 'Failed to update budget');
        }
      },

      deleteBudget: async (id: string) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await budgetService.delete(id);
          invalidateFinance();
          toast({ title: 'Budget deleted', description: 'Your budget has been successfully deleted' });
        } catch (error) {
          console.error('Error deleting budget:', error);
          handleValidationError(error, 'Failed to delete budget');
        }
      },

      addWallet: async (wallet: Omit<Wallet, 'id' | 'userId'>) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await walletService.create(uid, wallet);
          invalidateFinance();
          toast({ title: 'Wallet added', description: `${wallet.name} has been added to your accounts` });
        } catch (error) {
          console.error('Error adding wallet:', error);
          handleValidationError(error, 'Error adding wallet');
        }
      },

      updateWallet: async (updatedWallet: Wallet) => {
        try {
          await walletService.update(updatedWallet);
          invalidateFinance();
          toast({ title: 'Wallet updated', description: `${updatedWallet.name} has been updated` });
        } catch (error) {
          console.error('Error updating wallet:', error);
          handleValidationError(error, 'Error updating wallet');
        }
      },

      deleteWallet: async (id: string) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          const walletTransactions = transactions.filter((item) => item.walletId === id);
          for (const transaction of walletTransactions) {
            await transactionService.delete(transaction.id);
          }
          await walletService.delete(id);
          invalidateFinance();
          toast({ title: 'Wallet deleted', description: 'Your wallet has been successfully deleted' });
        } catch (error) {
          console.error('Error deleting wallet:', error);
          handleValidationError(error, 'Failed to delete wallet');
        }
      },

      addWantToBuyItem: async (
        item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>,
      ) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await wantToBuyService.create(uid, item);
          invalidateFinance();
          toast({ title: 'Success', description: 'Wishlist item added.' });
        } catch (error) {
          console.error('Error adding WantToBuy item:', error);
          handleValidationError(error, 'Error');
        }
      },

      updateWantToBuyItem: async (item: WantToBuyItem) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await wantToBuyService.update(item);
          invalidateFinance();
        } catch (error) {
          console.error('Error updating WantToBuy item:', error);
          handleValidationError(error, 'Error');
        }
      },

      deleteWantToBuyItem: async (id: string) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await wantToBuyService.delete(id);
          invalidateFinance();
          toast({ title: 'Success', description: 'Wishlist item deleted.' });
        } catch (error) {
          console.error('Error deleting WantToBuy item:', error);
          handleValidationError(error, 'Error');
        }
      },

      addPinjamanItem: async (
        item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>,
      ) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await pinjamanService.create(uid, item);
          invalidateFinance();
          toast({ title: 'Success', description: 'Pinjaman item added.' });
        } catch (error) {
          console.error('Error adding Pinjaman item:', error);
          handleValidationError(error, 'Error');
        }
      },

      updatePinjamanItem: async (item: PinjamanItem) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await pinjamanService.update(item);
          invalidateFinance();
        } catch (error) {
          console.error('Error updating Pinjaman item:', error);
          handleValidationError(error, 'Error');
        }
      },

      deletePinjamanItem: async (id: string) => {
        const uid = requireUser();
        if (!uid) return;
        try {
          await pinjamanService.delete(id);
          invalidateFinance();
          toast({ title: 'Success', description: 'Pinjaman item deleted.' });
        } catch (error) {
          console.error('Error deleting Pinjaman item:', error);
          handleValidationError(error, 'Error');
        }
      },
    };
  }, [userId, wallets, transactions, userCurrency, invalidateFinance, toast, t]);
}
