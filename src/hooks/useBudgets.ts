import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget, Transaction } from '@/types/finance';

// Helper untuk deep equality check yang lebih efisien daripada JSON.stringify
const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => isEqual(a[key], b[key]));
};

// Helper function to determine if a date is within the current week
const isWithinCurrentWeek = (date: Date): boolean => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate the start of the current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Calculate the end of the current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
};

// Helper function to determine if a date is within the current month
const isWithinCurrentMonth = (date: Date): boolean => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

// Helper function to determine if a date is within the current year
const isWithinCurrentYear = (date: Date): boolean => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear();
};

export const useBudgets = () => {
  const { budgets: originalBudgets, transactions: originalTransactions } = useFinance();
  
  // Hindari re-render dengan memoization
  const budgets = useMemo(() => originalBudgets || [], [originalBudgets]);
  const transactions = useMemo(() => originalTransactions || [], [originalTransactions]);
  
  // State lokal yang lebih stabil
  const [updatedBudgets, setUpdatedBudgets] = useState<Budget[]>([]);
  
  // Indikator apakah data sudah dimuat
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Referensi untuk caching
  const budgetsRef = useRef<Budget[]>([]);
  const transactionsRef = useRef<Transaction[]>([]);
  const cacheRef = useRef<{ [key: string]: number }>({});
  
  // Fungsi stabil untuk menghitung pengeluaran budget
  const calculateBudgetSpending = useCallback((
    currentBudgets: Budget[],
    currentTransactions: Transaction[]
  ) => {
    if (!currentBudgets || !currentBudgets.length) return [];

    // Konsistenkan tanggal
    const currentDate = new Date();
    
    // Reset cache jika budgets berubah 
    if (!isEqual(budgetsRef.current, currentBudgets)) {
      console.log("Resetting category cache");
      budgetsRef.current = currentBudgets;
      cacheRef.current = {};
    }
    
    // Buat map untuk menyimpan pengeluaran berdasarkan categoryId dan period
    const spendingByCategory: Record<string, Record<string, number>> = {};
    
    // Inisialisasi map spending
    currentBudgets.forEach(budget => {
      let catId: string;
      
      if (typeof budget.categoryId === 'number') {
        catId = String(budget.categoryId);
      } else if (budget.categoryId) {
        catId = budget.categoryId;
      } else {
        return;
      }
      
      if (!spendingByCategory[catId]) {
        spendingByCategory[catId] = {
          'weekly': 0,
          'monthly': 0,
          'yearly': 0
        };
      }
    });
    
    // Filter transaksi hanya expense
    const expenseTransactions = currentTransactions.filter(transaction => {
      return transaction.type === 'expense' && transaction.date;
    });
    
    // Proses setiap transaksi
    expenseTransactions.forEach(transaction => {
      if (!transaction.categoryId || !transaction.date) return;
      
      try {
        const transDate = new Date(transaction.date);
        
        // Konversi ke format yang konsisten
        let catId: string;
        
        if (typeof transaction.categoryId === 'number') {
          catId = String(transaction.categoryId);
        } else {
          catId = transaction.categoryId;
        }
        
        // Skip jika kategori tidak ada dalam budget
        if (!spendingByCategory[catId]) return;
        
        // Akumulasi pengeluaran berdasarkan periode
        if (isWithinCurrentWeek(transDate)) {
          spendingByCategory[catId]['weekly'] += transaction.amount;
        }
        
        if (isWithinCurrentMonth(transDate)) {
          spendingByCategory[catId]['monthly'] += transaction.amount;
        }
        
        if (isWithinCurrentYear(transDate)) {
          spendingByCategory[catId]['yearly'] += transaction.amount;
        }
      } catch (e) {
        console.error("Error processing transaction date", e);
      }
    });
    
    // Log untuk debugging
    console.log("Category spending by period:", spendingByCategory);
    
    // Kembalikan budgets dengan spending yang diperbarui
    return currentBudgets.map(budget => {
      let catId: string;
      
      if (typeof budget.categoryId === 'number') {
        catId = String(budget.categoryId);
      } else if (budget.categoryId) {
        catId = budget.categoryId;
      } else {
        // Fallback jika tidak ada categoryId
        return { ...budget, spent: 0 };
      }
      
      // Log untuk debug category issues
      if (!budget.category) {
        console.warn(`Budget without category name found:`, budget.id, budget.categoryId);
      }
      
      // Tetapkan spending berdasarkan periode budget
      const period = budget.period || 'monthly';
      const spent = spendingByCategory[catId] ? spendingByCategory[catId][period] || 0 : 0;
      
      return {
        ...budget,
        category: budget.category,
        spent: spent
      };
    });
  }, []);

  // Effect untuk menginisialisasi updatedBudgets saat pertama kali
  useEffect(() => {
    if (!isInitialized && budgets.length > 0) {
      const updated = calculateBudgetSpending(budgets, transactions);
      setUpdatedBudgets(updated);
      setIsInitialized(true);
    }
  }, [budgets, transactions, calculateBudgetSpending, isInitialized]);

  // Effect terpisah untuk memperbarui updatedBudgets ketika data berubah
  useEffect(() => {
    // Skip jika belum diinisialisasi
    if (!isInitialized) return;
    
    // Cek apakah budgets atau transactions berubah secara signifikan
    const budgetsChanged = !isEqual(budgetsRef.current, budgets);
    const transactionsChanged = !isEqual(transactionsRef.current, transactions);
    
    if (budgetsChanged || transactionsChanged) {
      console.log("Data changed, recalculating budgets", {
        budgetsChanged,
        transactionsChanged,
        budgetCount: budgets.length,
        transactionCount: transactions.length
      });
      
      const updated = calculateBudgetSpending(budgets, transactions);
      setUpdatedBudgets(updated);
    }
  }, [budgets, transactions, calculateBudgetSpending, isInitialized]);

  // Memo-ize data akhir untuk mencegah re-renders pada komponen yang mengkonsumsi
  const result = useMemo(() => {
    // Jika belum terinisialisasi, gunakan data asli
    const effectiveBudgets = (isInitialized && updatedBudgets.length > 0) 
      ? updatedBudgets 
      : budgets;
      
    const totalBudgeted = effectiveBudgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
    const totalSpent = effectiveBudgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    const remainingBudget = totalBudgeted - totalSpent;
    const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    
    return {
      budgets: effectiveBudgets,
      totalBudgeted,
      totalSpent,
      remainingBudget,
      overallProgress
    };
  }, [budgets, updatedBudgets, isInitialized]);

  return result;
};
