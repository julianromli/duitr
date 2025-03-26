
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the types for our financial data
type Transaction = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  walletId: string;
};

type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
};

type Wallet = {
  id: string;
  name: string;
  balance: number;
  type: 'cash' | 'bank' | 'credit' | 'investment';
  color: string;
};

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  wallets: Wallet[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

// Create the context
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Sample data for development
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    category: 'Salary',
    description: 'Monthly salary',
    date: '2023-06-01',
    type: 'income',
    walletId: '1',
  },
  {
    id: '2',
    amount: 45.99,
    category: 'Groceries',
    description: 'Weekly shopping',
    date: '2023-06-04',
    type: 'expense',
    walletId: '1',
  },
  {
    id: '3',
    amount: 120,
    category: 'Dining',
    description: 'Dinner with friends',
    date: '2023-06-08',
    type: 'expense',
    walletId: '1',
  },
  {
    id: '4',
    amount: 500,
    category: 'Freelance',
    description: 'Design project',
    date: '2023-06-15',
    type: 'income',
    walletId: '2',
  },
  {
    id: '5',
    amount: 89.99,
    category: 'Utilities',
    description: 'Electricity bill',
    date: '2023-06-10',
    type: 'expense',
    walletId: '1',
  },
  {
    id: '6',
    amount: 350,
    category: 'Rent',
    description: 'Monthly rent',
    date: '2023-06-01',
    type: 'expense',
    walletId: '1',
  },
];

const sampleBudgets: Budget[] = [
  {
    id: '1',
    category: 'Groceries',
    amount: 400,
    spent: 245.50,
    period: 'monthly',
  },
  {
    id: '2',
    category: 'Dining',
    amount: 300,
    spent: 220,
    period: 'monthly',
  },
  {
    id: '3',
    category: 'Entertainment',
    amount: 200,
    spent: 85.99,
    period: 'monthly',
  },
  {
    id: '4',
    category: 'Transportation',
    amount: 150,
    spent: 78.50,
    period: 'monthly',
  },
];

const sampleWallets: Wallet[] = [
  {
    id: '1',
    name: 'Main Account',
    balance: 3450.20,
    type: 'bank',
    color: '#4263EB',
  },
  {
    id: '2',
    name: 'Savings',
    balance: 8750.65,
    type: 'bank',
    color: '#0CA678',
  },
  {
    id: '3',
    name: 'Cash',
    balance: 250.0,
    type: 'cash',
    color: '#F59F00',
  },
  {
    id: '4',
    name: 'Credit Card',
    balance: -450.80,
    type: 'credit',
    color: '#FA5252',
  },
];

// Provider component
export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(sampleBudgets);
  const [wallets, setWallets] = useState<Wallet[]>(sampleWallets);

  // Calculate totals
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Add new transaction
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Math.random().toString(36).substring(2, 9),
    };
    setTransactions([newTransaction, ...transactions]);
    
    // Update wallet balance
    setWallets(wallets.map(wallet => {
      if (wallet.id === transaction.walletId) {
        return {
          ...wallet,
          balance: transaction.type === 'income' 
            ? wallet.balance + transaction.amount 
            : wallet.balance - transaction.amount
        };
      }
      return wallet;
    }));
  };

  // Add new budget
  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget = {
      ...budget,
      id: Math.random().toString(36).substring(2, 9),
    };
    setBudgets([...budgets, newBudget]);
  };

  // Add new wallet
  const addWallet = (wallet: Omit<Wallet, 'id'>) => {
    const newWallet = {
      ...wallet,
      id: Math.random().toString(36).substring(2, 9),
    };
    setWallets([...wallets, newWallet]);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        wallets,
        addTransaction,
        addBudget,
        addWallet,
        totalBalance,
        monthlyIncome,
        monthlyExpense
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
