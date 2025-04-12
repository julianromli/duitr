import { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '@/types/finance';

type TransactionType = 'income' | 'expense' | 'all';
type CategoryTotals = Record<string | number, number>;
type MonthlyData = {
  month: string;
  income: number;
  expense: number;
};

export const useTransactions = () => {
  const { transactions, getDisplayCategoryName } = useFinance();
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotals>({});
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  // Apply filters
  useEffect(() => {
    let result = transactions;
    
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t: Transaction) => {
        const displayCategory = getDisplayCategoryName(t).toLowerCase();
        return t.description.toLowerCase().includes(query) || 
               displayCategory.includes(query);
      });
    }
    
    setFilteredTransactions(result);
  }, [transactions, typeFilter, searchQuery, getDisplayCategoryName]);

  // Calculate category totals
  useEffect(() => {
    const totals: CategoryTotals = {};
    
    filteredTransactions.forEach((transaction: Transaction) => {
      const { categoryId, amount, type } = transaction;
      
      if (!categoryId) return; // Skip if no categoryId
      
      if (!totals[categoryId]) {
        totals[categoryId] = 0;
      }
      
      if (type === 'income') {
        totals[categoryId] += amount;
      } else {
        totals[categoryId] += amount;
      }
    });
    
    setCategoryTotals(totals);
  }, [filteredTransactions]);

  // Calculate monthly data for charts
  useEffect(() => {
    const now = new Date();
    const monthlyStats: MonthlyData[] = [];
    
    // Get data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === month.getMonth() && 
               transactionDate.getFullYear() === month.getFullYear();
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income' && t.categoryId !== 'system_transfer')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = monthTransactions
        .filter(t => t.type === 'expense' && t.categoryId !== 'system_transfer')
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyStats.push({
        month: monthName,
        income,
        expense
      });
    }
    
    setMonthlyData(monthlyStats);
  }, [transactions]);

  // Return the hook data and functions
  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    setTypeFilter,
    setSearchQuery,
    typeFilter,
    searchQuery,
    categoryTotals,
    monthlyData
  };
};
