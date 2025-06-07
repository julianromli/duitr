// Fixed FinanceContext to handle proper function signatures and missing properties
// Added monthlyExpense property and fixed getDisplayCategoryName function

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  category_id?: number;
  category_key?: string;
  en_name: string;
  id_name: string;
  type?: string;
  icon?: string;
  created_at?: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId?: string | number;
  category?: string;
  category_id?: number;
  user_id: string;
  wallet_id?: string;
  to_wallet_id?: string;
  created_at?: string;
}

interface Budget {
  id: string;
  amount: number;
  spent: number;
  category_id: number;
  period: 'weekly' | 'monthly';
  user_id: string;
  created_at?: string;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  user_id: string;
  created_at?: string;
}

interface WantToBuy {
  id: string;
  name: string;
  price: number;
  priority: 'high' | 'medium' | 'low';
  user_id: string;
  created_at?: string;
}

interface Pinjaman {
  id: string;
  name: string;
  amount: number;
  type: 'debt' | 'credit';
  due_date?: string;
  user_id: string;
  created_at?: string;
}

interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  wallets: Wallet[];
  wantToBuy: WantToBuy[];
  pinjaman: Pinjaman[];
  loading: boolean;
  error: string | null;
}

interface FinanceContextType extends FinanceState {
  formatCurrency: (amount: number) => string;
  getDisplayCategoryName: (transaction: Transaction) => string;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'spent' | 'created_at'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addWantToBuy: (item: Omit<WantToBuy, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateWantToBuy: (id: string, item: Partial<WantToBuy>) => Promise<void>;
  deleteWantToBuy: (id: string) => Promise<void>;
  addPinjaman: (pinjaman: Omit<Pinjaman, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updatePinjaman: (id: string, pinjaman: Partial<Pinjaman>) => Promise<void>;
  deletePinjaman: (id: string) => Promise<void>;
  refetchData: () => Promise<void>;
  monthlyExpense: number;
}

type FinanceAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_WALLETS'; payload: Wallet[] }
  | { type: 'SET_WANT_TO_BUY'; payload: WantToBuy[] }
  | { type: 'SET_PINJAMAN'; payload: Pinjaman[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; transaction: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: { id: string; budget: Partial<Budget> } }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_WALLET'; payload: Wallet }
  | { type: 'UPDATE_WALLET'; payload: { id: string; wallet: Partial<Wallet> } }
  | { type: 'DELETE_WALLET'; payload: string }
  | { type: 'ADD_WANT_TO_BUY'; payload: WantToBuy }
  | { type: 'UPDATE_WANT_TO_BUY'; payload: { id: string; item: Partial<WantToBuy> } }
  | { type: 'DELETE_WANT_TO_BUY'; payload: string }
  | { type: 'ADD_PINJAMAN'; payload: Pinjaman }
  | { type: 'UPDATE_PINJAMAN'; payload: { id: string; pinjaman: Partial<Pinjaman> } }
  | { type: 'DELETE_PINJAMAN'; payload: string };

const initialState: FinanceState = {
  transactions: [],
  budgets: [],
  categories: [],
  wallets: [],
  wantToBuy: [],
  pinjaman: [],
  loading: false,
  error: null,
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_WALLETS':
      return { ...state, wallets: action.payload };
    case 'SET_WANT_TO_BUY':
      return { ...state, wantToBuy: action.payload };
    case 'SET_PINJAMAN':
      return { ...state, pinjaman: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.transaction } : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b =>
          b.id === action.payload.id ? { ...b, ...action.payload.budget } : b
        ),
      };
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload),
      };
    case 'ADD_WALLET':
      return { ...state, wallets: [...state.wallets, action.payload] };
    case 'UPDATE_WALLET':
      return {
        ...state,
        wallets: state.wallets.map(w =>
          w.id === action.payload.id ? { ...w, ...action.payload.wallet } : w
        ),
      };
    case 'DELETE_WALLET':
      return {
        ...state,
        wallets: state.wallets.filter(w => w.id !== action.payload),
      };
    case 'ADD_WANT_TO_BUY':
      return { ...state, wantToBuy: [...state.wantToBuy, action.payload] };
    case 'UPDATE_WANT_TO_BUY':
      return {
        ...state,
        wantToBuy: state.wantToBuy.map(w =>
          w.id === action.payload.id ? { ...w, ...action.payload.item } : w
        ),
      };
    case 'DELETE_WANT_TO_BUY':
      return {
        ...state,
        wantToBuy: state.wantToBuy.filter(w => w.id !== action.payload),
      };
    case 'ADD_PINJAMAN':
      return { ...state, pinjaman: [...state.pinjaman, action.payload] };
    case 'UPDATE_PINJAMAN':
      return {
        ...state,
        pinjaman: state.pinjaman.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.pinjaman } : p
        ),
      };
    case 'DELETE_PINJAMAN':
      return {
        ...state,
        pinjaman: state.pinjaman.filter(p => p.id !== action.payload),
      };
    default:
      return state;
  }
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate monthly expense
  const monthlyExpense = React.useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return state.transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= firstDayOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getDisplayCategoryName = (transaction: Transaction) => {
    // Handle special cases first
    if (transaction.type === 'transfer') {
      return 'Transfer';
    }
    
    if (transaction.category === 'Investasi' || transaction.category === 'Investment') {
      return 'Investment';
    }

    // Try to find category by ID first
    if (transaction.categoryId || transaction.category_id) {
      const categoryId = String(transaction.categoryId || transaction.category_id);
      const category = state.categories.find(cat => 
        String(cat.id) === categoryId || 
        String(cat.category_id) === categoryId
      );
      
      if (category) {
        return category.en_name;
      }
    }

    // Fallback to transaction.category
    if (transaction.category) {
      return transaction.category;
    }

    return 'Other';
  };

  const fetchData = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Fetch all data in parallel
      const [
        transactionsRes,
        budgetsRes,
        categoriesRes,
        walletsRes,
        wantToBuyRes,
        pinjamanRes,
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('categories').select('category_id, category_key, created_at, en_name, icon, id_name, type').order('en_name'),
        supabase.from('wallets').select('*').eq('user_id', user.id),
        supabase.from('want_to_buy').select('*').eq('user_id', user.id),
        supabase.from('pinjaman').select('*').eq('user_id', user.id),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (walletsRes.error) throw walletsRes.error;
      if (wantToBuyRes.error) throw wantToBuyRes.error;
      if (pinjamanRes.error) throw pinjamanRes.error;

      // Map categories to our interface
      const mappedCategories = categoriesRes.data.map(cat => ({
        id: String(cat.category_id),
        category_id: cat.category_id,
        category_key: cat.category_key,
        en_name: cat.en_name,
        id_name: cat.id_name,
        type: cat.type,
        icon: cat.icon,
        created_at: cat.created_at
      }));

      dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsRes.data || [] });
      dispatch({ type: 'SET_BUDGETS', payload: budgetsRes.data || [] });
      dispatch({ type: 'SET_CATEGORIES', payload: mappedCategories });
      dispatch({ type: 'SET_WALLETS', payload: walletsRes.data || [] });
      dispatch({ type: 'SET_WANT_TO_BUY', payload: wantToBuyRes.data || [] });
      dispatch({ type: 'SET_PINJAMAN', payload: pinjamanRes.data || [] });
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch data' });
      toast({
        title: 'Error',
        description: 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_TRANSACTION', payload: data });
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, transaction } });
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'spent' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...budget, user_id: user.id, spent: 0 })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_BUDGET', payload: data });
      toast({
        title: 'Success',
        description: 'Budget added successfully',
      });
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to add budget',
        variant: 'destructive',
      });
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update(budget)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_BUDGET', payload: { id, budget } });
      toast({
        title: 'Success',
        description: 'Budget updated successfully',
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to update budget',
        variant: 'destructive',
      });
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_BUDGET', payload: id });
      toast({
        title: 'Success',
        description: 'Budget deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete budget',
        variant: 'destructive',
      });
    }
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({ ...wallet, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_WALLET', payload: data });
      toast({
        title: 'Success',
        description: 'Wallet added successfully',
      });
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to add wallet',
        variant: 'destructive',
      });
    }
  };

  const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
    try {
      const { error } = await supabase
        .from('wallets')
        .update(wallet)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_WALLET', payload: { id, wallet } });
      toast({
        title: 'Success',
        description: 'Wallet updated successfully',
      });
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wallet',
        variant: 'destructive',
      });
    }
  };

  const deleteWallet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_WALLET', payload: id });
      toast({
        title: 'Success',
        description: 'Wallet deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete wallet',
        variant: 'destructive',
      });
    }
  };

  const addWantToBuy = async (item: Omit<WantToBuy, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('want_to_buy')
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_WANT_TO_BUY', payload: data });
      toast({
        title: 'Success',
        description: 'Item added to want to buy list',
      });
    } catch (error) {
      console.error('Error adding want to buy item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item',
        variant: 'destructive',
      });
    }
  };

  const updateWantToBuy = async (id: string, item: Partial<WantToBuy>) => {
    try {
      const { error } = await supabase
        .from('want_to_buy')
        .update(item)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_WANT_TO_BUY', payload: { id, item } });
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    } catch (error) {
      console.error('Error updating want to buy item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const deleteWantToBuy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('want_to_buy')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_WANT_TO_BUY', payload: id });
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting want to buy item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const addPinjaman = async (pinjaman: Omit<Pinjaman, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pinjaman')
        .insert({ ...pinjaman, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_PINJAMAN', payload: data });
      toast({
        title: 'Success',
        description: 'Loan added successfully',
      });
    } catch (error) {
      console.error('Error adding pinjaman:', error);
      toast({
        title: 'Error',
        description: 'Failed to add loan',
        variant: 'destructive',
      });
    }
  };

  const updatePinjaman = async (id: string, pinjaman: Partial<Pinjaman>) => {
    try {
      const { error } = await supabase
        .from('pinjaman')
        .update(pinjaman)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_PINJAMAN', payload: { id, pinjaman } });
      toast({
        title: 'Success',
        description: 'Loan updated successfully',
      });
    } catch (error) {
      console.error('Error updating pinjaman:', error);
      toast({
        title: 'Error',
        description: 'Failed to update loan',
        variant: 'destructive',
      });
    }
  };

  const deletePinjaman = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pinjaman')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_PINJAMAN', payload: id });
      toast({
        title: 'Success',
        description: 'Loan deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting pinjaman:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete loan',
        variant: 'destructive',
      });
    }
  };

  const refetchData = async () => {
    await fetchData();
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const value: FinanceContextType = {
    ...state,
    formatCurrency,
    getDisplayCategoryName,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addWallet,
    updateWallet,
    deleteWallet,
    addWantToBuy,
    updateWantToBuy,
    deleteWantToBuy,
    addPinjaman,
    updatePinjaman,
    deletePinjaman,
    refetchData,
    monthlyExpense,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
