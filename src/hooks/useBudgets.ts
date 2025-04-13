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
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Caching key untuk tracking valid transactions
    const cacheKey = `${currentMonth}-${currentYear}`;
    
    // Filter dan cache transaksi untuk bulan ini
    let validTransactions: Transaction[] = [];
    
    // Hanya filter ulang jika transactionRef berubah
    if (!isEqual(transactionsRef.current, currentTransactions)) {
      console.log("Recalculating transactions cache for", cacheKey);
      
      validTransactions = currentTransactions.filter(transaction => {
        if (!transaction.date || !transaction.type) return false;
        
        try {
          const transDate = new Date(transaction.date);
          return (
            transaction.type === 'expense' &&
            transDate.getMonth() === currentMonth &&
            transDate.getFullYear() === currentYear
          );
        } catch (e) {
          return false;
        }
      });
      
      // Update cache
      transactionsRef.current = currentTransactions;
    } else {
      // Gunakan cache jika tersedia
      validTransactions = currentTransactions.filter(transaction => {
        if (!transaction.date || !transaction.type) return false;
        
        try {
          const transDate = new Date(transaction.date);
          return (
            transaction.type === 'expense' &&
            transDate.getMonth() === currentMonth &&
            transDate.getFullYear() === currentYear
          );
        } catch {
          return false;
        }
      });
    }
    
    // Buat map pengeluaran berdasarkan categoryId
    const spendingByCategory: Record<string, number> = {};
    
    // Reset cache jika budgets berubah 
    if (!isEqual(budgetsRef.current, currentBudgets)) {
      console.log("Resetting category cache");
      budgetsRef.current = currentBudgets;
      cacheRef.current = {};
    }
    
    // Proses transaksi
    validTransactions.forEach(transaction => {
      if (!transaction.categoryId) return;
      
      // Konversi ke format yang konsisten
      let catId: string;
      
      if (typeof transaction.categoryId === 'number') {
        catId = String(transaction.categoryId);
      } else {
        catId = transaction.categoryId;
      }
      
      // Akumulasi pengeluaran
      if (!spendingByCategory[catId]) {
        spendingByCategory[catId] = 0;
      }
      spendingByCategory[catId] += transaction.amount;
    });
    
    // Log untuk debugging
    console.log("Category spending:", spendingByCategory);
    
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
      
      // Log to help debug category issues
      if (!budget.category) {
        console.warn(`Budget without category name found:`, budget.id, budget.categoryId);
      }
      
      return {
        ...budget,
        category: budget.category,
        spent: spendingByCategory[catId] || 0
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
