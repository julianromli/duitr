/**
 * BudgetContext
 * 
 * Specialized context for budget management.
 * Handles budget CRUD operations and spent tracking.
 * 
 * Features:
 * - Budget state management
 * - Automatic spent calculation from transactions
 * - Period-based budget tracking
 * - Budget alerts and status monitoring
 * 
 * Performance Optimizations:
 * - Memoized budget calculations
 * - Stable function references
 * - Independent from transaction re-renders (reads via props)
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Budget, Transaction } from '@/types/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  fetchBudgets,
  insertBudget,
  updateBudget as updateBudgetInDb,
  deleteBudget as deleteBudgetFromDb,
  validateBudget,
  recalculateBudgetSpent,
  getBudgetStatus,
  getBudgetAlerts,
  filterBudgetsByStatus,
  filterBudgetsByPeriod,
  calculateTotalBudget,
  calculateTotalSpent,
  calculateOverallUtilization,
  sortBudgetsByUtilization,
  type BudgetStatus,
  type BudgetAlert,
} from '@/services/budgetService';

interface BudgetContextType {
  budgets: Budget[];
  isLoading: boolean;
  totalBudget: number;
  totalSpent: number;
  overallUtilization: number;
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetById: (id: string) => Budget | undefined;
  getBudgetsByStatus: (status: BudgetStatus) => Budget[];
  getBudgetsByPeriod: (period: 'weekly' | 'monthly' | 'yearly') => Budget[];
  getSortedBudgetsByUtilization: () => Budget[];
  getAlerts: () => BudgetAlert[];
  refreshBudgets: () => Promise<void>;
  recalculateSpent: (transactions: Transaction[]) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load budgets from database
   */
  const loadBudgets = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await fetchBudgets(user.id);
      setBudgets(data);
    } catch (error: any) {
      console.error('Error loading budgets:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, t]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  /**
   * Memoized computed values
   */
  const totalBudget = useMemo(() => {
    return calculateTotalBudget(budgets);
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return calculateTotalSpent(budgets);
  }, [budgets]);

  const overallUtilization = useMemo(() => {
    return calculateOverallUtilization(budgets);
  }, [budgets]);

  /**
   * Add a new budget
   */
  const addBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Authentication required' });
      return;
    }

    // Validate budget
    const validation = validateBudget(budget);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: t('common.error'), description: validation.error });
      return;
    }

    try {
      const newBudget = await insertBudget(budget, user.id);
      setBudgets(prev => [...prev, newBudget]);

      toast({
        title: t('common.success'),
        description: t('budgets.success.created'),
      });
    } catch (error: any) {
      console.error('Error adding budget:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('budgets.errors.add_budget') + ' ' + (error.message || ''),
      });
    }
  }, [user, toast, t]);

  /**
   * Update an existing budget
   */
  const updateBudget = useCallback(async (updatedBudget: Budget) => {
    if (!user) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Authentication required' });
      return;
    }

    // Validate budget
    const validation = validateBudget(updatedBudget);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: t('common.error'), description: validation.error });
      return;
    }

    // Store original for rollback
    const originalBudgets = [...budgets];
    
    // Optimistic update
    setBudgets(prev => prev.map(budget => 
      budget.id === updatedBudget.id ? updatedBudget : budget
    ));

    try {
      await updateBudgetInDb(updatedBudget);

      toast({
        title: t('common.success'),
        description: t('budgets.success.updated'),
      });
    } catch (error: any) {
      // Rollback on error
      setBudgets(originalBudgets);
      
      console.error('Error updating budget:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message || 'An unexpected error occurred',
      });
    }
  }, [user, toast, t, budgets]);

  /**
   * Delete a budget
   */
  const deleteBudget = useCallback(async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Authentication required' });
      return;
    }

    // Store original for rollback
    const originalBudgets = [...budgets];
    
    // Optimistic update
    setBudgets(prev => prev.filter(budget => budget.id !== id));

    try {
      await deleteBudgetFromDb(id);

      toast({
        title: t('common.success'),
        description: t('budgets.success.deleted'),
      });
    } catch (error: any) {
      // Rollback on error
      setBudgets(originalBudgets);
      
      console.error('Error deleting budget:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message || 'An unexpected error occurred',
      });
    }
  }, [user, toast, t, budgets]);

  /**
   * Get budget by ID
   */
  const getBudgetById = useCallback((id: string): Budget | undefined => {
    return budgets.find(b => b.id === id);
  }, [budgets]);

  /**
   * Get budgets by status
   */
  const getBudgetsByStatus = useCallback((status: BudgetStatus): Budget[] => {
    return filterBudgetsByStatus(budgets, status);
  }, [budgets]);

  /**
   * Get budgets by period
   */
  const getBudgetsByPeriod = useCallback((period: 'weekly' | 'monthly' | 'yearly'): Budget[] => {
    return filterBudgetsByPeriod(budgets, period);
  }, [budgets]);

  /**
   * Get budgets sorted by utilization
   */
  const getSortedBudgetsByUtilization = useCallback((): Budget[] => {
    return sortBudgetsByUtilization(budgets);
  }, [budgets]);

  /**
   * Get budget alerts
   */
  const getAlerts = useCallback((): BudgetAlert[] => {
    return getBudgetAlerts(budgets);
  }, [budgets]);

  /**
   * Refresh budgets from database
   */
  const refreshBudgets = useCallback(async () => {
    await loadBudgets();
  }, [loadBudgets]);

  /**
   * Recalculate spent amounts for all budgets
   */
  const recalculateSpent = useCallback(async (transactions: Transaction[]) => {
    try {
      const updatedBudgets = await Promise.all(
        budgets.map(async budget => {
          const spent = await recalculateBudgetSpent(budget, transactions);
          return { ...budget, spent };
        })
      );
      
      setBudgets(updatedBudgets);
    } catch (error: any) {
      console.error('Error recalculating budget spent:', error);
    }
  }, [budgets]);

  const value = useMemo(() => ({
    budgets,
    isLoading,
    totalBudget,
    totalSpent,
    overallUtilization,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetById,
    getBudgetsByStatus,
    getBudgetsByPeriod,
    getSortedBudgetsByUtilization,
    getAlerts,
    refreshBudgets,
    recalculateSpent,
  }), [
    budgets,
    isLoading,
    totalBudget,
    totalSpent,
    overallUtilization,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetById,
    getBudgetsByStatus,
    getBudgetsByPeriod,
    getSortedBudgetsByUtilization,
    getAlerts,
    refreshBudgets,
    recalculateSpent,
  ]);

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

/**
 * Custom hook to use budget context
 */
export const useBudgetContext = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgetContext must be used within a BudgetProvider');
  }
  return context;
};
