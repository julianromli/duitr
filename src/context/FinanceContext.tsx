
// Updated FinanceContext.tsx to fix database field mappings, type issues, and missing dependencies
// Added proper data transformation between database snake_case and TypeScript camelCase conventions
// Fixed PinjamanItem interface consistency and missing properties
// Added missing utility functions for balance calculations and category display names

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Transaction, Budget, Wallet, WantToBuyItem, PinjamanItem } from '@/types/finance';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import i18next from 'i18next';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  wallets: Wallet[];
  wantToBuyItems: WantToBuyItem[];
  pinjamanItems: PinjamanItem[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addWantToBuyItem: (item: Omit<WantToBuyItem, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateWantToBuyItem: (item: WantToBuyItem) => Promise<void>;
  deleteWantToBuyItem: (id: string) => Promise<void>;
  addPinjamanItem: (item: Omit<PinjamanItem, 'id' | 'created_at'>) => Promise<void>;
  updatePinjamanItem: (item: PinjamanItem) => Promise<void>;
  deletePinjamanItem: (id: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatAmount: (amount: number) => string;
  parseCurrency: (value: string) => number;
  getCategoryName: (categoryId: string | number) => string;
  getDisplayCategoryName: (categoryId: string | number | Transaction) => string;
  getCategoryKey: (categoryId: string | number) => string;
  fetchTransactions: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchWallets: () => Promise<void>;
  fetchWantToBuyItems: () => Promise<void>;
  fetchPinjamanItems: () => Promise<void>;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  categories: Array<{
    id: string;
    category_id?: number;
    category_key?: string;
    en_name: string;
    id_name: string;
    type?: string;
    icon?: string;
    created_at?: string;
  }>;
  setCategories: React.Dispatch<React.SetStateAction<Array<{
    id: string;
    category_id?: number;
    category_key?: string;
    en_name: string;
    id_name: string;
    type?: string;
    icon?: string;
    created_at?: string;
  }>>>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [wantToBuyItems, setWantToBuyItems] = useState<WantToBuyItem[]>([]);
  const [pinjamanItems, setPinjamanItems] = useState<PinjamanItem[]>([]);
  const [categories, setCategories] = useState<Array<{
    id: string;
    category_id?: number;
    category_key?: string;
    en_name: string;
    id_name: string;
    type?: string;
    icon?: string;
    created_at?: string;
  }>>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load transactions from Supabase
  const fetchTransactions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Transform data from snake_case to camelCase with proper type casting
      const transformedTransactions: Transaction[] = (data || []).map(item => ({
        id: item.id,
        amount: item.amount,
        categoryId: item.category_id,
        description: item.description,
        date: item.date,
        type: item.type as 'income' | 'expense' | 'transfer',
        walletId: item.wallet_id,
        destinationWalletId: item.destination_wallet_id || null,
        fee: item.fee || null,
        created_at: item.created_at,
      }));

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Load budgets from Supabase
  const fetchBudgets = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Transform data from snake_case to camelCase with proper type casting
      const transformedBudgets: Budget[] = (data || []).map(item => ({
        id: item.id,
        amount: item.amount,
        categoryId: item.category_id,
        period: (item.period || 'monthly') as 'monthly' | 'weekly' | 'yearly',
        spent: item.spent,
        created_at: item.created_at,
      }));

      setBudgets(transformedBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  // Load wallets from Supabase
  const fetchWallets = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Transform data with proper type casting
      const transformedWallets: Wallet[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        balance: item.balance,
        color: item.color,
        type: (item.type || 'cash') as 'cash' | 'bank' | 'e-wallet' | 'investment',
      }));

      setWallets(transformedWallets);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  // Load want to buy items from Supabase
  const fetchWantToBuyItems = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('want_to_buy_items')
        .select('*')
        .eq('user_id', user.id)
        .order('estimated_date');

      if (error) throw error;

      // Transform data with proper type casting
      const transformedItems: WantToBuyItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category as "Keinginan" | "Kebutuhan",
        priority: item.priority as "Tinggi" | "Sedang" | "Rendah",
        estimated_date: item.estimated_date,
        is_purchased: item.is_purchased,
        purchase_date: item.purchase_date,
        icon: item.icon,
        user_id: item.user_id,
        created_at: item.created_at,
      }));

      setWantToBuyItems(transformedItems);
    } catch (error) {
      console.error('Error loading want to buy items:', error);
    }
  };

  // Load pinjaman items from Supabase
  const fetchPinjamanItems = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('pinjaman_items')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date');
      
      if (error) throw error;
      
      // Transform data to match PinjamanItem interface
      const transformedData: PinjamanItem[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        icon: item.icon,
        category: item.category as "Utang" | "Piutang",
        due_date: item.due_date,
        amount: item.amount,
        is_settled: item.is_settled,
        created_at: item.created_at,
      }));
      
      setPinjamanItems(transformedData);
    } catch (error) {
      console.error('Error loading pinjaman items:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchBudgets();
      fetchWallets();
      fetchWantToBuyItems();
      fetchPinjamanItems();
    }
  }, [user]);

  // Add Transaction
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            amount: transaction.amount,
            category_id: Number(transaction.categoryId),
            description: transaction.description,
            date: transaction.date,
            type: transaction.type,
            wallet_id: transaction.walletId,
            destination_wallet_id: transaction.destinationWalletId,
            fee: transaction.fee,
            user_id: user.id,
          }
        ])
        .select();

      if (error) throw error;

      setTransactions(prev => [...prev, { ...transaction, id: uuidv4() }]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  // Update Transaction
  const updateTransaction = async (transaction: Transaction) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: transaction.amount,
          category_id: Number(transaction.categoryId),
          description: transaction.description,
          date: transaction.date,
          type: transaction.type,
          wallet_id: transaction.walletId,
          destination_wallet_id: transaction.destinationWalletId,
          fee: transaction.fee,
        })
        .eq('id', transaction.id);

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t => t.id === transaction.id ? transaction : t)
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Add Budget
  const addBudget = (budget: Omit<Budget, 'id'>) => {
    setBudgets(prev => [...prev, { ...budget, id: uuidv4() }]);
  };

  // Update Budget
  const updateBudget = (budget: Budget) => {
    setBudgets(prev =>
      prev.map(b => b.id === budget.id ? budget : b)
    );
  };

  // Delete Budget
  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  // Add Wallet
  const addWallet = async (wallet: Omit<Wallet, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([
          {
            name: wallet.name,
            balance: wallet.balance,
            color: wallet.color,
            type: wallet.type,
            user_id: user.id,
          }
        ])
        .select();

      if (error) throw error;

      setWallets(prev => [...prev, { ...wallet, id: uuidv4() }]);
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  };

  // Update Wallet
  const updateWallet = async (wallet: Wallet) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          name: wallet.name,
          balance: wallet.balance,
          color: wallet.color,
          type: wallet.type,
        })
        .eq('id', wallet.id);

      if (error) throw error;

      setWallets(prev =>
        prev.map(w => w.id === wallet.id ? wallet : w)
      );
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  };

  // Delete Wallet
  const deleteWallet = async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWallets(prev => prev.filter(wallet => wallet.id !== id));
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  };

  // Add Want to Buy Item
  const addWantToBuyItem = async (item: Omit<WantToBuyItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('want_to_buy_items')
        .insert([
          {
            ...item,
            user_id: user.id,
            is_purchased: false,
          }
        ])
        .select();

      if (error) throw error;

      setWantToBuyItems(prev => [...prev, { ...item, id: uuidv4(), user_id: user.id, is_purchased: false, created_at: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error adding want to buy item:', error);
      throw error;
    }
  };

  // Update Want to Buy Item
  const updateWantToBuyItem = async (item: WantToBuyItem) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('want_to_buy_items')
        .update({
          name: item.name,
          price: item.price,
          category: item.category,
          priority: item.priority,
          estimated_date: item.estimated_date,
          is_purchased: item.is_purchased,
          purchase_date: item.purchase_date,
          icon: item.icon,
        })
        .eq('id', item.id);

      if (error) throw error;

      setWantToBuyItems(prev =>
        prev.map(w => w.id === item.id ? item : w)
      );
    } catch (error) {
      console.error('Error updating want to buy item:', error);
      throw error;
    }
  };

  // Delete Want to Buy Item
  const deleteWantToBuyItem = async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('want_to_buy_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWantToBuyItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting want to buy item:', error);
      throw error;
    }
  };

  // Add Pinjaman Item
  const addPinjamanItem = async (item: Omit<PinjamanItem, 'id' | 'created_at'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('pinjaman_items')
        .insert([
          {
            ...item,
            user_id: user.id,
          }
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const newItem: PinjamanItem = {
          id: data[0].id,
          user_id: data[0].user_id,
          name: data[0].name,
          amount: data[0].amount,
          due_date: data[0].due_date,
          category: data[0].category,
          icon: data[0].icon,
          is_settled: data[0].is_settled || false,
          created_at: data[0].created_at,
        };
        
        setPinjamanItems(prev => [...prev, newItem]);
      }
    } catch (error) {
      console.error('Error adding pinjaman item:', error);
      throw error;
    }
  };

  // Update Pinjaman Item
  const updatePinjamanItem = async (item: PinjamanItem) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .update({
          name: item.name,
          amount: item.amount,
          due_date: item.due_date,
          category: item.category,
          icon: item.icon,
          is_settled: item.is_settled,
        })
        .eq('id', item.id)
        .eq('user_id', item.user_id);

      if (error) throw error;

      setPinjamanItems(prev => 
        prev.map(p => p.id === item.id ? item : p)
      );
    } catch (error) {
      console.error('Error updating pinjaman item:', error);
      throw error;
    }
  };

  // Delete Pinjaman Item
  const deletePinjamanItem = async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPinjamanItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting pinjaman item:', error);
      throw error;
    }
  };

  // Currency formatting functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^\d]/g, '')) || 0;
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string | number): string => {
    const categoryIdStr = String(categoryId);
    if (!categoryIdStr || categoryIdStr.length === 0) {
      return 'Other';
    }
    
    const category = categories.find(cat => 
      String(cat.category_id) === categoryIdStr || cat.id === categoryIdStr
    );
    
    if (!category) {
      return 'Other';
    }
    
    return i18next.language === 'id' ? category.id_name : category.en_name;
  };

  // Get display category name - handles both direct category IDs and Transaction objects
  const getDisplayCategoryName = (categoryId: string | number | Transaction): string => {
    if (typeof categoryId === 'object' && categoryId !== null) {
      // If it's a Transaction object, extract the categoryId
      return getCategoryName(categoryId.categoryId);
    }
    return getCategoryName(categoryId);
  };

  // Get category key by ID
  const getCategoryKey = (categoryId: string | number): string => {
    const categoryIdStr = String(categoryId);
    if (!categoryIdStr || categoryIdStr.length === 0) {
      return 'expense_other';
    }
    
    const category = categories.find(cat => 
      String(cat.category_id) === categoryIdStr || cat.id === categoryIdStr
    );
    
    return category?.category_key || 'expense_other';
  };

  // Calculate total balance
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  // Calculate monthly income
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate monthly expense
  const monthlyExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const value: FinanceContextType = {
    transactions,
    budgets,
    wallets,
    wantToBuyItems,
    pinjamanItems,
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
    formatAmount,
    parseCurrency,
    getCategoryName,
    getDisplayCategoryName,
    getCategoryKey,
    fetchTransactions,
    fetchBudgets,
    fetchWallets,
    fetchWantToBuyItems,
    fetchPinjamanItems,
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    categories,
    setCategories
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
