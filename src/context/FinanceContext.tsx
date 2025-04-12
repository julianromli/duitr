import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext';
import { supabase, Category, fetchCategories } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  color: string;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  category_id: string; // Added category_id field
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  walletId: string;
  destinationWalletId?: string;
  fee?: number;
}

interface Budget {
  id: string;
  category: string;
  category_id: string; // Added category_id field
  amount: number;
  spent: number;
  period: string;
}

interface WantToBuyItem {
  id: string;
  name: string;
  price: number;
  category: string;
  priority: string;
  estimated_date: string;
  icon?: string | null;
  is_purchased?: boolean;
}

interface PinjamanItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  due_date: string;
  icon?: string | null;
  is_settled?: boolean;
}

interface FinanceContextType {
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  wantToBuyItems: WantToBuyItem[];
  addWantToBuyItem: (item: Omit<WantToBuyItem, 'id' | 'is_purchased'>) => Promise<void>;
  updateWantToBuyItem: (item: WantToBuyItem) => Promise<void>;
  deleteWantToBuyItem: (id: string) => Promise<void>;
  
  pinjamanItems: PinjamanItem[];
  addPinjamanItem: (item: Omit<PinjamanItem, 'id' | 'is_settled'>) => Promise<void>;
  updatePinjamanItem: (item: PinjamanItem) => Promise<void>;
  deletePinjamanItem: (id: string) => Promise<void>;
  
  categories: Category[]; // Added categories
  formatCurrency: (amount: number) => string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wantToBuyItems, setWantToBuyItems] = useState<WantToBuyItem[]>([]);
  const [pinjamanItems, setPinjamanItems] = useState<PinjamanItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // Added categories state
  
  // Format currency based on user locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currentLanguage === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch categories from the database
  useEffect(() => {
    const getCategories = async () => {
      if (user) {
        try {
          const allCategories = await fetchCategories();
          setCategories(allCategories);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      }
    };
    
    getCategories();
  }, [user]);
  
  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchTransactions();
      fetchBudgets();
      fetchWantToBuyItems();
      fetchPinjamanItems();
    }
  }, [user]);
  
  // WALLETS
  const fetchWallets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };
  
  const addWallet = async (wallet: Omit<Wallet, 'id'>) => {
    if (!user) return;
    
    try {
      const newWallet = {
        ...wallet,
        id: uuidv4(),
        user_id: user.id,
      };
      
      const { error } = await supabase
        .from('wallets')
        .insert(newWallet);
        
      if (error) throw error;
      
      setWallets([...wallets, newWallet]);
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast({
        title: t('common.error'),
        description: t('wallets.add_error'),
        variant: 'destructive',
      });
    }
  };
  
  const updateWallet = async (wallet: Wallet) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('wallets')
        .update(wallet)
        .eq('id', wallet.id);
        
      if (error) throw error;
      
      setWallets(wallets.map(w => w.id === wallet.id ? wallet : w));
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast({
        title: t('common.error'),
        description: t('wallets.update_error'),
        variant: 'destructive',
      });
    }
  };
  
  const deleteWallet = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setWallets(wallets.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        title: t('common.error'),
        description: t('wallets.delete_error'),
        variant: 'destructive',
      });
    }
  };
  
  // TRANSACTIONS
  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };
  
  const updateTransaction = async (transaction: Transaction) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', transaction.id);
        
      if (error) throw error;
      
      setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: t('common.error'),
        description: t('transactions.update_error'),
        variant: 'destructive',
      });
    }
  };
  
  const deleteTransaction = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: t('common.error'),
        description: t('transactions.delete_error'),
        variant: 'destructive',
      });
    }
  };
  
  // BUDGETS
  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };
  
  const updateBudget = async (budget: Budget) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .update(budget)
        .eq('id', budget.id);
        
      if (error) throw error;
      
      setBudgets(budgets.map(b => b.id === budget.id ? budget : b));
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: t('common.error'),
        description: t('budgets.update_error'),
        variant: 'destructive',
      });
    }
  };
  
  const deleteBudget = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: t('common.error'),
        description: t('budgets.delete_error'),
        variant: 'destructive',
      });
    }
  };
  
  // WANT TO BUY ITEMS
  const fetchWantToBuyItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('want_to_buy_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setWantToBuyItems(data || []);
    } catch (error) {
      console.error('Error fetching want to buy items:', error);
    }
  };
  
  const addWantToBuyItem = async (item: Omit<WantToBuyItem, 'id' | 'is_purchased'>) => {
    if (!user) return;
    
    try {
      const newItem = {
        ...item,
        id: uuidv4(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        is_purchased: false,
      };
      
      const { error } = await supabase
        .from('want_to_buy_items')
        .insert(newItem);
        
      if (error) throw error;
      
      setWantToBuyItems([...wantToBuyItems, newItem]);
    } catch (error) {
      console.error('Error adding want to buy item:', error);
      toast({
        title: t('common.error'),
        description: t('budget.want_to_buy_add_error'),
        variant: 'destructive',
      });
    }
  };
  
  const updateWantToBuyItem = async (item: WantToBuyItem) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('want_to_buy_items')
        .update(item)
        .eq('id', item.id);
        
      if (error) throw error;
      
      setWantToBuyItems(wantToBuyItems.map(i => i.id === item.id ? item : i));
    } catch (error) {
      console.error('Error updating want to buy item:', error);
      toast({
        title: t('common.error'),
        description: t('budget.want_to_buy_update_error'),
        variant: 'destructive',
      });
    }
  };
  
  const deleteWantToBuyItem = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('want_to_buy_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setWantToBuyItems(wantToBuyItems.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting want to buy item:', error);
      toast({
        title: t('common.error'),
        description: t('budget.want_to_buy_delete_error'),
        variant: 'destructive',
      });
    }
  };
  
  // PINJAMAN ITEMS
  const fetchPinjamanItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pinjaman_items')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });
        
      if (error) throw error;
      
      setPinjamanItems(data || []);
    } catch (error) {
      console.error('Error fetching pinjaman items:', error);
    }
  };
  
  const addPinjamanItem = async (item: Omit<PinjamanItem, 'id' | 'is_settled'>) => {
    if (!user) return;
    
    try {
      const newItem = {
        ...item,
        id: uuidv4(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        is_settled: false,
      };
      
      const { error } = await supabase
        .from('pinjaman_items')
        .insert(newItem);
        
      if (error) throw error;
      
      setPinjamanItems([...pinjamanItems, newItem]);
    } catch (error) {
      console.error('Error adding pinjaman item:', error);
      toast({
        title: t('common.error'),
        description: t('budget.pinjaman_add_error'),
        variant: 'destructive',
      });
    }
  };
  
  const updatePinjamanItem = async (item: PinjamanItem) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .update(item)
        .eq('id', item.id);
        
      if (error) throw error;
      
      setPinjamanItems(pinjamanItems.map(i => i.id === item.id ? item : i));
    } catch (error) {
      console.error('Error updating pinjaman item:', error);
      toast({
        title: t('common.error'),
        description: t('budget.pinjaman_update_error'),
        variant: 'destructive',
      });
    }
  };
  
  const deletePinjamanItem = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setPinjamanItems(pinjamanItems.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting pinjaman item:', error);
      toast({
        title: t('common.error'),
        description: t('budget.pinjaman_delete_error'),
        variant: 'destructive',
      });
    }
  };
  
  // Function to get category display name 
  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return '';
    
    return currentLanguage === 'id' ? category.id_name : category.en_name;
  };
  
  // Add transaction with category_id support
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    try {
      const newTransaction = {
        ...transaction,
        id: uuidv4(),
        user_id: user.id,
      };
      
      // Handle wallet balance updates
      const wallet = wallets.find(w => w.id === transaction.walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      if (transaction.type === 'income') {
        // Update wallet balance
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance + transaction.amount })
          .eq('id', wallet.id);
          
        if (walletError) throw walletError;
        
        // Update budget spent amount if there's a matching budget
        const matchingBudget = budgets.find(b => b.category_id === transaction.category_id);
        if (matchingBudget) {
          // For income, we don't typically affect budgets, but you might want to update this logic
        }
      } else if (transaction.type === 'expense') {
        // Update wallet balance
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance - transaction.amount })
          .eq('id', wallet.id);
          
        if (walletError) throw walletError;
        
        // Update budget spent amount if there's a matching budget
        const matchingBudget = budgets.find(b => b.category_id === transaction.category_id);
        if (matchingBudget) {
          const { error: budgetError } = await supabase
            .from('budgets')
            .update({ spent: matchingBudget.spent + transaction.amount })
            .eq('id', matchingBudget.id);
            
          if (budgetError) throw budgetError;
          
          // Update local state
          setBudgets(budgets.map(b => 
            b.id === matchingBudget.id 
              ? { ...b, spent: b.spent + transaction.amount } 
              : b
          ));
        }
      } else if (transaction.type === 'transfer') {
        const fromWallet = wallets.find(w => w.id === transaction.walletId);
        const toWallet = wallets.find(w => w.id === transaction.destinationWalletId);
        
        if (!fromWallet || !toWallet) {
          throw new Error('Source or destination wallet not found');
        }
        
        // Update source wallet balance
        const { error: fromWalletError } = await supabase
          .from('wallets')
          .update({ balance: fromWallet.balance - transaction.amount - (transaction.fee || 0) })
          .eq('id', fromWallet.id);
          
        if (fromWalletError) throw fromWalletError;
        
        // Update destination wallet balance
        const { error: toWalletError } = await supabase
          .from('wallets')
          .update({ balance: toWallet.balance + transaction.amount })
          .eq('id', toWallet.id);
          
        if (toWalletError) throw toWalletError;
      }
      
      // Add transaction to database
      const { error } = await supabase
        .from('transactions')
        .insert(newTransaction);
        
      if (error) throw error;
      
      // Update local state
      setTransactions([...transactions, newTransaction]);
      
      // Update wallets state
      setWallets(wallets.map(w => {
        if (w.id === transaction.walletId) {
          if (transaction.type === 'income') {
            return { ...w, balance: w.balance + transaction.amount };
          } else if (transaction.type === 'expense') {
            return { ...w, balance: w.balance - transaction.amount };
          } else if (transaction.type === 'transfer' && transaction.destinationWalletId) {
            return { ...w, balance: w.balance - transaction.amount - (transaction.fee || 0) };
          }
        } else if (transaction.type === 'transfer' && w.id === transaction.destinationWalletId) {
          return { ...w, balance: w.balance + transaction.amount };
        }
        return w;
      }));
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: t('common.error'),
        description: t('transactions.add_error'),
        variant: 'destructive',
      });
    }
  };

  // Add budget with category_id support
  const addBudget = async (budget: Omit<Budget, 'id' | 'spent'>) => {
    if (!user) return;
    
    try {
      const newBudget = {
        ...budget,
        id: uuidv4(),
        user_id: user.id,
        spent: 0,
      };
      
      // Check if budget for this category already exists
      const existingBudget = budgets.find(b => 
        b.category_id === budget.category_id && b.period === budget.period
      );
      
      if (existingBudget) {
        toast({
          title: t('common.error'),
          description: t('budgets.already_exists'),
          variant: 'destructive',
        });
        return;
      }
      
      // Add budget to database
      const { error } = await supabase
        .from('budgets')
        .insert(newBudget);
        
      if (error) throw error;
      
      // Update local state
      setBudgets([...budgets, newBudget]);
      
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: t('common.error'),
        description: t('budgets.add_error'),
        variant: 'destructive',
      });
    }
  };
  
  
  return (
    <FinanceContext.Provider value={{
      wallets,
      addWallet,
      updateWallet,
      deleteWallet,
      
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      
      budgets,
      addBudget,
      updateBudget,
      deleteBudget,
      
      wantToBuyItems,
      addWantToBuyItem,
      updateWantToBuyItem,
      deleteWantToBuyItem,
      
      pinjamanItems,
      addPinjamanItem,
      updatePinjamanItem,
      deletePinjamanItem,
      
      categories, // Expose categories to components
      formatCurrency,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
