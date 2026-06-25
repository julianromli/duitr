/**
 * FinanceContext
 *
 * Composes React Query reads, derived finance metrics, and mutation actions.
 */

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding';
import { useTranslation } from 'react-i18next';
import { useFinanceQueries } from '@/hooks/finance/useFinanceQueries';
import { useFinanceDerived } from '@/hooks/finance/useFinanceDerived';
import { useFinanceMutations } from '@/hooks/finance/useFinanceMutations';
import { financeQueryKeys } from '@/services/finance/queryKeys';
import type { Budget, PinjamanItem, Transaction, Wallet, WantToBuyItem } from '@/types/finance';

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

  const {
    totalBalance,
    convertedTotalBalance,
    monthlyIncome,
    monthlyExpense,
    formatCurrency,
  } = useFinanceDerived(wallets, transactions, userCurrency);

  const mutations = useFinanceMutations({
    userId: user?.id,
    wallets,
    transactions,
    userCurrency,
    invalidateFinance,
    toast,
    t,
  });

  const updateCurrency = () => {
    // Currency is display-only; no persistence update needed here.
  };

  const value: FinanceContextType = {
    transactions,
    budgets,
    wallets,
    wantToBuyItems,
    pinjamanItems,
    currency,
    currencySymbol,
    isLoading,
    updateCurrency,
    ...mutations,
    totalBalance,
    convertedTotalBalance,
    monthlyIncome,
    monthlyExpense,
    formatCurrency,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
