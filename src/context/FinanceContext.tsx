import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { formatIDR } from '@/utils/currency';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Define the types for our financial data
type Transaction = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  walletId: string;
  userId?: string;
};

type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  userId?: string;
};

type Wallet = {
  id: string;
  name: string;
  balance: number;
  type: 'cash' | 'bank' | 'e-wallet' | 'investment';
  color: string;
  userId?: string;
};

type Transfer = {
  amount: number;
  description: string;
  date: string;
  fromWalletId: string;
  toWalletId: string;
  fee: number;
};

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  wallets: Wallet[];
  currency: string;
  currencySymbol: string;
  isLoading: boolean;
  updateCurrency: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addTransfer: (transfer: Transfer) => Promise<void>;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  formatCurrency: (amount: number) => string;
}

// Create the context
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Provider component
export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Always use IDR
  const [currency] = useState('IDR');
  const [currencySymbol] = useState('Rp');

  // Load data from Supabase when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch wallets
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);
          
        if (walletsError) throw walletsError;
        
        // No default wallets for new users
        // Transform DB format to app format and handle 'credit' to 'e-wallet' type conversion
        setWallets(walletsData.map(w => ({
          id: w.id,
          name: w.name,
          balance: w.balance,
          type: w.type === 'credit' ? 'e-wallet' as const : w.type as 'cash' | 'bank' | 'e-wallet' | 'investment',
          color: w.color,
          userId: w.user_id
        })));
        
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id);
          
        if (transactionsError) throw transactionsError;
        
        // Transform DB format to app format
        setTransactions(transactionsData.map(t => ({
          id: t.id,
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date,
          type: t.type as 'income' | 'expense',
          walletId: t.wallet_id,
          userId: t.user_id
        })));
        
        // Fetch budgets
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);
          
        if (budgetsError) throw budgetsError;
        
        // No default budgets for new users
        // Transform DB format to app format
        setBudgets(budgetsData.map(b => ({
          id: b.id,
          category: b.category,
          amount: b.amount,
          spent: b.spent,
          period: b.period as 'monthly' | 'weekly' | 'yearly',
          userId: b.user_id
        })));
      } catch (error: any) {
        console.error('Error loading user data:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading data',
          description: error.message || 'Failed to load your financial data',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user, toast]);

  // Calculate total balance from all wallets
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  // Calculate monthly income and expense (for the current month)
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

  // Format currency function
  const formatCurrency = (amount: number) => {
    return formatIDR(amount);
  };

  // Add new transaction
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to add transactions',
      });
      return;
    }
    
    try {
      // Prepare data for Supabase
      const newTransaction = {
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        wallet_id: transaction.walletId,
        user_id: user.id
      };
      
      // Insert transaction to Supabase
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransaction)
        .select()
        .single();
        
      if (error) throw error;
      
      // Format for application state
      const formattedTransaction = {
        id: data.id,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        type: data.type,
        walletId: data.wallet_id,
        userId: data.user_id
      };
      
      // Update local state
      setTransactions([formattedTransaction, ...transactions]);
      
      // Update wallet balance
      const wallet = wallets.find(w => w.id === transaction.walletId);
      if (wallet) {
        const updatedWallet = {
          ...wallet,
          balance: transaction.type === 'income' 
            ? wallet.balance + transaction.amount 
            : wallet.balance - transaction.amount
        };
        
        // Update wallet in Supabase
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: updatedWallet.balance })
          .eq('id', wallet.id);
          
        if (walletError) throw walletError;
        
        // Update local wallet state
        setWallets(wallets.map(w => w.id === wallet.id ? updatedWallet : w));
      }
      
      toast({
        title: 'Transaction added',
        description: 'Your transaction has been successfully added',
      });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add transaction',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    if (!user) return;
    
    try {
      // Get transaction details before deleting
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) throw new Error('Transaction not found');
      
      // Delete from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update wallet balance
      const wallet = wallets.find(w => w.id === transaction.walletId);
      if (wallet) {
        const updatedWallet = {
          ...wallet,
          balance: transaction.type === 'income' 
            ? wallet.balance - transaction.amount 
            : wallet.balance + transaction.amount
        };
        
        // Update wallet in Supabase
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: updatedWallet.balance })
          .eq('id', wallet.id);
          
        if (walletError) throw walletError;
        
        // Update local wallet state
        setWallets(wallets.map(w => w.id === wallet.id ? updatedWallet : w));
      }
      
      // Update local state
      setTransactions(transactions.filter(t => t.id !== id));
      
      toast({
        title: 'Transaction deleted',
        description: 'Your transaction has been successfully deleted',
      });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete transaction',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  // Add new transfer
  const addTransfer = async (transfer: Transfer) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to make transfers',
      });
      return;
    }
    
    try {
      // 1. Outgoing transaction (from source wallet)
      const outgoingTransaction = {
        amount: transfer.amount + transfer.fee,
        category: 'Transfer',
        description: `Transfer to ${wallets.find(w => w.id === transfer.toWalletId)?.name} - ${transfer.description}`,
        date: transfer.date,
        type: 'expense',
        wallet_id: transfer.fromWalletId,
        user_id: user.id
      };
      
      // 2. Incoming transaction (to destination wallet)
      const incomingTransaction = {
        amount: transfer.amount,
        category: 'Transfer',
        description: `Transfer from ${wallets.find(w => w.id === transfer.fromWalletId)?.name} - ${transfer.description}`,
        date: transfer.date,
        type: 'income',
        wallet_id: transfer.toWalletId,
        user_id: user.id
      };
      
      // Insert both transactions
      const { data: outgoingData, error: outgoingError } = await supabase
        .from('transactions')
        .insert(outgoingTransaction)
        .select()
        .single();
        
      if (outgoingError) throw outgoingError;
      
      const { data: incomingData, error: incomingError } = await supabase
        .from('transactions')
        .insert(incomingTransaction)
        .select()
        .single();
        
      if (incomingError) throw incomingError;
      
      // Update wallet balances
      const fromWallet = wallets.find(w => w.id === transfer.fromWalletId);
      const toWallet = wallets.find(w => w.id === transfer.toWalletId);
      
      if (fromWallet && toWallet) {
        const updatedFromWallet = {
          ...fromWallet,
          balance: fromWallet.balance - (transfer.amount + transfer.fee)
        };
        
        const updatedToWallet = {
          ...toWallet,
          balance: toWallet.balance + transfer.amount
        };
        
        // Update wallets in Supabase
        const { error: fromWalletError } = await supabase
          .from('wallets')
          .update({ balance: updatedFromWallet.balance })
          .eq('id', fromWallet.id);
          
        if (fromWalletError) throw fromWalletError;
        
        const { error: toWalletError } = await supabase
          .from('wallets')
          .update({ balance: updatedToWallet.balance })
          .eq('id', toWallet.id);
          
        if (toWalletError) throw toWalletError;
        
        // Update local wallet state
        setWallets(wallets.map(wallet => {
          if (wallet.id === fromWallet.id) return updatedFromWallet;
          if (wallet.id === toWallet.id) return updatedToWallet;
          return wallet;
        }));
      }
      
      // Format and add to local state
      const formattedOutgoing = {
        id: outgoingData.id,
        amount: outgoingData.amount,
        category: outgoingData.category,
        description: outgoingData.description,
        date: outgoingData.date,
        type: outgoingData.type as 'expense',
        walletId: outgoingData.wallet_id,
        userId: outgoingData.user_id
      };
      
      const formattedIncoming = {
        id: incomingData.id,
        amount: incomingData.amount,
        category: incomingData.category,
        description: incomingData.description,
        date: incomingData.date,
        type: incomingData.type as 'income',
        walletId: incomingData.wallet_id,
        userId: incomingData.user_id
      };
      
      setTransactions([formattedIncoming, formattedOutgoing, ...transactions]);
      
      toast({
        title: 'Transfer completed',
        description: 'Your money transfer has been successfully processed',
      });
    } catch (error: any) {
      console.error('Error processing transfer:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer failed',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  // Add new budget
  const addBudget = async (budget: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to add budgets',
      });
      return;
    }
    
    try {
      // Prepare data for Supabase
      const newBudget = {
        category: budget.category,
        amount: budget.amount,
        spent: budget.spent,
        period: budget.period,
        user_id: user.id
      };
      
      // Insert budget to Supabase
      const { data, error } = await supabase
        .from('budgets')
        .insert(newBudget)
        .select()
        .single();
        
      if (error) throw error;
      
      // Format for application state
      const formattedBudget = {
        id: data.id,
        category: data.category,
        amount: data.amount,
        spent: data.spent,
        period: data.period as 'monthly' | 'weekly' | 'yearly',
        userId: data.user_id
      };
      
      // Update local state
      setBudgets([...budgets, formattedBudget]);
      
      toast({
        title: 'Budget added',
        description: 'Your budget has been successfully added',
      });
    } catch (error: any) {
      console.error('Error adding budget:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add budget',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  // Update existing budget
  const updateBudget = async (updatedBudget: Budget) => {
    if (!user) return;
    
    try {
      // Prepare data for Supabase
      const budgetData = {
        category: updatedBudget.category,
        amount: updatedBudget.amount,
        spent: updatedBudget.spent,
        period: updatedBudget.period
      };
      
      // Update in Supabase
      const { error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', updatedBudget.id);
        
      if (error) throw error;
      
      // Update local state
      setBudgets(budgets.map(budget => 
        budget.id === updatedBudget.id ? updatedBudget : budget
      ));
      
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

  // Delete budget
  const deleteBudget = async (id: string) => {
    if (!user) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setBudgets(budgets.filter(budget => budget.id !== id));
      
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

  // Add new wallet
  const addWallet = async (wallet: Omit<Wallet, 'id' | 'userId'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Generate a temporary ID for optimistic update
      const tempId = Math.random().toString(36).substring(2, 9);
      
      // Optimistic update
      const newWallet = {
        id: tempId,
        ...wallet,
        userId: user.id,
      };
      
      setWallets(prev => [...prev, newWallet]);
      
      // Create record in Supabase
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          name: wallet.name,
          balance: wallet.balance,
          type: wallet.type,
          color: wallet.color,
          user_id: user.id,
        })
        .select();
      
      if (error) {
        // Revert optimistic update
        setWallets(prev => prev.filter(w => w.id !== tempId));
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from insert operation');
      }
      
      // Update the temporary wallet with the real DB ID
      setWallets(prev => 
        prev.map(w => 
          w.id === tempId ? {
            id: data[0].id,
            name: data[0].name,
            balance: data[0].balance,
            type: data[0].type === 'credit' ? 'e-wallet' as const : data[0].type as 'cash' | 'bank' | 'e-wallet' | 'investment',
            color: data[0].color,
            userId: data[0].user_id
          } : w
        )
      );
      
      toast({
        title: 'Wallet added',
        description: `${wallet.name} has been added to your accounts`,
      });
    } catch (error: any) {
      // Handle error
      toast({
        variant: 'destructive',
        title: 'Error adding wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  // Update existing wallet
  const updateWallet = async (updatedWallet: Wallet) => {
    try {
      // Optimistic update
      setWallets(prev => prev.map(wallet => 
        wallet.id === updatedWallet.id ? updatedWallet : wallet)
      );
      
      // Update record in Supabase
      const { error } = await supabase
        .from('wallets')
        .update({
          name: updatedWallet.name,
          balance: updatedWallet.balance,
          type: updatedWallet.type,
          color: updatedWallet.color,
        })
        .eq('id', updatedWallet.id);
      
      if (error) {
        // Revert optimistic update if error
        setWallets(prev => {
          // Get the original wallet before the update
          const originalWallet = wallets.find(w => w.id === updatedWallet.id);
          return prev.map(wallet => 
            wallet.id === updatedWallet.id ? (originalWallet || wallet) : wallet
          );
        });
        throw error;
      }
      
      toast({
        title: 'Wallet updated',
        description: `${updatedWallet.name} has been updated`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  // Delete wallet
  const deleteWallet = async (id: string) => {
    if (!user) return;
    
    try {
      // Check if there are transactions associated with this wallet
      const walletTransactions = transactions.filter(t => t.walletId === id);
      
      if (walletTransactions.length > 0) {
        // Delete associated transactions first
        for (const transaction of walletTransactions) {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transaction.id);
            
          if (error) throw error;
        }
      }
      
      // Delete wallet from Supabase
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setTransactions(transactions.filter(t => t.walletId !== id));
      setWallets(wallets.filter(wallet => wallet.id !== id));
      
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

  // Update currency (always IDR)
  const updateCurrency = () => {
    // Currency is always IDR, no need to update
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        wallets,
        currency,
        currencySymbol,
        isLoading,
        updateCurrency,
        addTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        addWallet,
        updateWallet,
        deleteWallet,
        addTransfer,
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        formatCurrency
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook to use the finance context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
