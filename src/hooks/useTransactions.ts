
import { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';

type TransactionType = 'income' | 'expense' | 'all';
type CategoryTotals = Record<string, number>;
type MonthlyData = {
  month: string;
  income: number;
  expense: number;
};

export const useTransactions = () => {
  const { transactions } = useFinance();
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
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredTransactions(result);
  }, [transactions, typeFilter, searchQuery]);

  // Calculate category totals
  useEffect(() => {
    const totals: CategoryTotals = {};
    
    filteredTransactions.forEach(transaction => {
      const { category, amount, type } = transaction;
      
      if (!totals[category]) {
        totals[category] = 0;
      }
      
      if (type === 'income') {
        totals[category] += amount;
      } else {
        totals[category] += amount;
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
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
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
