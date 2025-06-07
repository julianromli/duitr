
// Fixed FinanceContext to resolve type mismatches and function signature errors
// Corrected PinjamanItem type usage with user_id field
// Fixed getLocalizedCategoryName function calls and category handling

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Transaction, Budget, Wallet, WantToBuyItem, PinjamanItem } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';
import { getLocalizedCategoryName, getCategoryStringIdFromUuid } from '@/utils/categoryUtils';
import i18next from 'i18next';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  wallets: Wallet[];
  wantToBuyItems: WantToBuyItem[];
  pinjamanItems: PinjamanItem[];
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'spent'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId'>) => Promise<void>;
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addWantToBuyItem: (item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>) => Promise<void>;
  updateWantToBuyItem: (id: string, item: Partial<WantToBuyItem>) => Promise<void>;
  deleteWantToBuyItem: (id: string) => Promise<void>;
  addPinjamanItem: (item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>) => Promise<void>;
  updatePinjamanItem: (id: string, item: Partial<PinjamanItem>) => Promise<void>;
  deletePinjamanItem: (id: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  refreshData: () => Promise<void>;
  getDisplayCategoryName: (transaction: Transaction) => string;
  getCategoryKey: (categoryId: string | number) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [wantToBuyItems, setWantToBuyItems] = useState<WantToBuyItem[]>([]);
  const [pinjamanItems, setPinjamanItems] = useState<PinjamanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { i18n } = useTranslation();

  // Fetch user data
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
      } else {
        setTransactions(transactionData || []);
      }

      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetError) {
        console.error('Error fetching budgets:', budgetError);
      } else {
        setBudgets(budgetData || []);
      }

      // Fetch wallets
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      if (walletError) {
        console.error('Error fetching wallets:', walletError);
      } else {
        setWallets(walletData || []);
      }

      // Fetch want to buy items
      const { data: wantToBuyData, error: wantToBuyError } = await supabase
        .from('want_to_buy_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (wantToBuyError) {
        console.error('Error fetching want to buy items:', wantToBuyError);
      } else {
        setWantToBuyItems(wantToBuyData || []);
      }

      // Fetch pinjaman items
      const { data: pinjamanData, error: pinjamanError } = await supabase
        .from('pinjaman_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (pinjamanError) {
        console.error('Error fetching pinjaman items:', pinjamanError);
      } else {
        // Map the data to match our type structure
        const mappedPinjamanData = pinjamanData?.map(item => ({
          id: item.id,
          user_id: item.user_id, // Use user_id consistently
          name: item.name,
          icon: item.icon,
          category: item.category as "Utang" | "Piutang",
          due_date: item.due_date,
          amount: item.amount,
          is_settled: item.is_settled,
          created_at: item.created_at,
        })) || [];
        
        setPinjamanItems(mappedPinjamanData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyIncome = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'income' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Transaction operations
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [data, ...prev]);

      // Update wallet balance
      if (transaction.type === 'income') {
        await updateWalletBalance(transaction.walletId, transaction.amount);
      } else if (transaction.type === 'expense') {
        await updateWalletBalance(transaction.walletId, -transaction.amount);
      } else if (transaction.type === 'transfer' && transaction.destinationWalletId) {
        await updateWalletBalance(transaction.walletId, -transaction.amount);
        await updateWalletBalance(transaction.destinationWalletId, transaction.amount);
      }

    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Budget operations
  const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'spent'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id, spent: 0 }])
        .select()
        .single();

      if (error) throw error;

      setBudgets(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(budget)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  // Wallet operations
  const addWallet = async (wallet: Omit<Wallet, 'id' | 'userId'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('wallets')
        .insert([{ ...wallet, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setWallets(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  };

  const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .update(wallet)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWallets(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  };

  const deleteWallet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWallets(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  };

  const updateWalletBalance = async (walletId: string, amount: number) => {
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) throw new Error('Wallet not found');

      const newBalance = wallet.balance + amount;
      await updateWallet(walletId, { balance: newBalance });
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  };

  // Want to buy operations
  const addWantToBuyItem = async (item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('want_to_buy_items')
        .insert([{ ...item, user_id: user.id, is_purchased: false }])
        .select()
        .single();

      if (error) throw error;

      setWantToBuyItems(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding want to buy item:', error);
      throw error;
    }
  };

  const updateWantToBuyItem = async (id: string, item: Partial<WantToBuyItem>) => {
    try {
      const { data, error } = await supabase
        .from('want_to_buy_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWantToBuyItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    } catch (error) {
      console.error('Error updating want to buy item:', error);
      throw error;
    }
  };

  const deleteWantToBuyItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('want_to_buy_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWantToBuyItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting want to buy item:', error);
      throw error;
    }
  };

  // Pinjaman operations
  const addPinjamanItem = async (item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pinjaman_items')
        .insert([{ ...item, user_id: user.id, is_settled: false }])
        .select()
        .single();

      if (error) throw error;

      // Map to match our type structure
      const mappedData = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        icon: data.icon,
        category: data.category as "Utang" | "Piutang",
        due_date: data.due_date,
        amount: data.amount,
        is_settled: data.is_settled,
        created_at: data.created_at,
      };

      setPinjamanItems(prev => [mappedData, ...prev]);
    } catch (error) {
      console.error('Error adding pinjaman item:', error);
      throw error;
    }
  };

  const updatePinjamanItem = async (id: string, item: Partial<PinjamanItem>) => {
    try {
      const { data, error } = await supabase
        .from('pinjaman_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPinjamanItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    } catch (error) {
      console.error('Error updating pinjaman item:', error);
      throw error;
    }
  };

  const deletePinjamanItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPinjamanItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting pinjaman item:', error);
      throw error;
    }
  };

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const refreshData = async () => {
    await fetchData();
  };

  // Get display category name for transactions
  const getDisplayCategoryName = (transaction: Transaction): string => {
    try {
      // Handle system transfers
      if (transaction.type === 'transfer' || transaction.categoryId === 18 || transaction.categoryId === 'system_transfer') {
        return i18n.language === 'id' ? 'Transfer' : 'Transfer';
      }

      // Handle numeric category IDs (from database)
      if (typeof transaction.categoryId === 'number') {
        // Map common category IDs to display names
        const categoryMap: Record<number, { en: string; id: string }> = {
          1: { en: 'Groceries', id: 'Belanjaan' },
          2: { en: 'Dining', id: 'Makanan' },
          3: { en: 'Transportation', id: 'Transportasi' },
          4: { en: 'Subscription', id: 'Langganan' },
          5: { en: 'Housing', id: 'Perumahan' },
          6: { en: 'Entertainment', id: 'Hiburan' },
          7: { en: 'Shopping', id: 'Belanja' },
          8: { en: 'Health', id: 'Kesehatan' },
          9: { en: 'Education', id: 'Pendidikan' },
          10: { en: 'Travel', id: 'Perjalanan' },
          11: { en: 'Personal', id: 'Pribadi' },
          12: { en: 'Other', id: 'Lainnya' },
          13: { en: 'Salary', id: 'Gaji' },
          14: { en: 'Business', id: 'Bisnis' },
          15: { en: 'Investment', id: 'Investasi' },
          16: { en: 'Gift', id: 'Hadiah' },
          17: { en: 'Other', id: 'Lainnya' },
          18: { en: 'Transfer', id: 'Transfer' },
          19: { en: 'Donate', id: 'Sedekah' },
          20: { en: 'Baby Needs', id: 'Kebutuhan Bayi' },
          21: { en: 'Investment', id: 'Investasi' }
        };

        const categoryInfo = categoryMap[transaction.categoryId];
        if (categoryInfo) {
          return i18n.language === 'id' ? categoryInfo.id : categoryInfo.en;
        }
      }

      // Handle string category IDs (like 'expense_groceries')
      if (typeof transaction.categoryId === 'string') {
        // Try to get localized name using the utility function
        return getLocalizedCategoryName(transaction.categoryId, i18next);
      }

      // Fallback to legacy category field
      if (transaction.category) {
        return transaction.category;
      }

      return 'Other';
    } catch (error) {
      console.error('Error getting display category name:', error);
      return 'Other';
    }
  };

  // Get category key for icon mapping
  const getCategoryKey = (categoryId: string | number): string => {
    try {
      if (typeof categoryId === 'number') {
        // Map numeric IDs to category keys for icon purposes
        const keyMap: Record<number, string> = {
          1: 'expense_groceries',
          2: 'expense_dining', 
          3: 'expense_transportation',
          4: 'expense_subscription',
          5: 'expense_housing',
          6: 'expense_entertainment',
          7: 'expense_shopping',
          8: 'expense_health',
          9: 'expense_education',
          10: 'expense_travel',
          11: 'expense_personal',
          12: 'expense_other',
          13: 'income_salary',
          14: 'income_business',
          15: 'income_investment',
          16: 'income_gift',
          17: 'income_other',
          18: 'system_transfer',
          19: 'expense_donation',
          20: 'expense_baby_needs',
          21: 'expense_investment'
        };
        
        return keyMap[categoryId] || 'other';
      }
      
      if (typeof categoryId === 'string') {
        return categoryId;
      }
      
      return 'other';
    } catch (error) {
      console.error('Error getting category key:', error);
      return 'other';
    }
  };

  const value: FinanceContextType = {
    transactions,
    budgets,
    wallets,
    wantToBuyItems,
    pinjamanItems,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    loading,
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
    formatCurrency,
    refreshData,
    getDisplayCategoryName,
    getCategoryKey,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
