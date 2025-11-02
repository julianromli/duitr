/**
 * BudgetService
 * 
 * Service layer for budget operations.
 * Handles CRUD operations, spent tracking, and period calculations.
 * 
 * Features:
 * - Budget CRUD operations
 * - Automatic spent calculation from transactions
 * - Period-based budget tracking (weekly, monthly, yearly)
 * - Budget utilization monitoring
 */

import { supabase } from '@/lib/supabase';
import { Budget, Transaction } from '@/types/finance';
import { calculateBudgetSpent, calculateBudgetUtilization } from './calculationService';

/**
 * Database budget data (matches Supabase schema)
 */
interface DbBudgetData {
  id?: string;
  amount: number;
  category_id: number;
  month?: string;
  year?: string;
  wallet_id?: string;
  user_id: string;
  spent?: number;
  period?: 'monthly' | 'weekly' | 'yearly';
}

/**
 * Validate budget data before submission
 */
export const validateBudget = (
  budget: Omit<Budget, 'id'>
): { valid: boolean; error?: string } => {
  if (!budget.amount || budget.amount <= 0) {
    return { valid: false, error: 'Budget amount must be greater than 0' };
  }
  
  if (!budget.categoryId) {
    return { valid: false, error: 'Category is required' };
  }
  
  const validPeriods = ['weekly', 'monthly', 'yearly'];
  if (budget.period && !validPeriods.includes(budget.period)) {
    return { valid: false, error: 'Invalid budget period' };
  }
  
  return { valid: true };
};

/**
 * Insert a budget into the database
 */
export const insertBudget = async (
  budget: Omit<Budget, 'id'>,
  userId: string
): Promise<Budget> => {
  const categoryId = budget.categoryId || 12; // Default to "Other"
  
  const budgetData: Partial<DbBudgetData> = {
    user_id: userId,
    category_id: categoryId,
    amount: budget.amount,
    period: budget.period || 'monthly',
    spent: budget.spent || 0
  };
  
  let data;
  try {
    const { data: insertedData, error } = await supabase
      .from('budgets')
      .insert(budgetData)
      .select()
      .single();
    
    if (error) {
      // Try upsert method if insert fails
      const { data: upsertData, error: upsertError } = await supabase
        .from('budgets')
        .upsert(budgetData)
        .select()
        .single();
      
      if (upsertError) throw error; // Throw original error
      data = upsertData;
    } else {
      data = insertedData;
    }
  } catch (error) {
    throw error;
  }
  
  return {
    id: data.id,
    categoryId: data.category_id,
    amount: data.amount,
    period: data.period || 'monthly',
    spent: data.spent || 0
  };
};

/**
 * Update a budget in the database
 */
export const updateBudget = async (budget: Budget): Promise<void> => {
  const budgetData: Partial<DbBudgetData> = {
    category_id: budget.categoryId,
    amount: budget.amount,
    spent: budget.spent,
    period: budget.period || 'monthly'
  };
  
  try {
    const { error } = await supabase
      .from('budgets')
      .update(budgetData)
      .eq('id', budget.id);
    
    if (error) {
      // Try with type field if standard update fails
      const { error: retryError } = await supabase
        .from('budgets')
        .update({
          ...budgetData,
          type: 'expense'
        })
        .eq('id', budget.id);
      
      if (retryError) {
        // Fallback to minimal update
        const { error: minimalError } = await supabase
          .from('budgets')
          .update({
            amount: budget.amount,
            category_id: budget.categoryId
          })
          .eq('id', budget.id);
        
        if (minimalError) throw error; // Throw original error
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update budget spent amount
 */
export const updateBudgetSpent = async (
  budgetId: string,
  spent: number
): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .update({ spent })
    .eq('id', budgetId);
  
  if (error) throw error;
};

/**
 * Delete a budget from the database
 */
export const deleteBudget = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Fetch all budgets for a user
 */
export const fetchBudgets = async (userId: string): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return data.map(b => ({
    id: b.id,
    amount: b.amount,
    categoryId: b.category_id,
    month: b.month || new Date().getMonth().toString(),
    year: b.year || new Date().getFullYear().toString(),
    walletId: b.wallet_id,
    userId: b.user_id,
    spent: b.spent,
    period: b.period as 'monthly' | 'weekly' | 'yearly' | undefined
  }));
};

/**
 * Calculate and update spent amount for a budget
 */
export const recalculateBudgetSpent = async (
  budget: Budget,
  transactions: Transaction[]
): Promise<number> => {
  const spent = calculateBudgetSpent(budget, transactions);
  
  // Update in database
  await updateBudgetSpent(budget.id, spent);
  
  return spent;
};

/**
 * Recalculate spent amounts for all budgets
 */
export const recalculateAllBudgetSpent = async (
  budgets: Budget[],
  transactions: Transaction[]
): Promise<Budget[]> => {
  const updatedBudgets = await Promise.all(
    budgets.map(async budget => {
      const spent = await recalculateBudgetSpent(budget, transactions);
      return { ...budget, spent };
    })
  );
  
  return updatedBudgets;
};

/**
 * Get budget status (on track, warning, exceeded)
 */
export type BudgetStatus = 'on-track' | 'warning' | 'exceeded';

export const getBudgetStatus = (budget: Budget): BudgetStatus => {
  const utilization = calculateBudgetUtilization(budget.spent || 0, budget.amount);
  
  if (utilization >= 100) return 'exceeded';
  if (utilization >= 75) return 'warning';
  return 'on-track';
};

/**
 * Get budgets by status
 */
export const filterBudgetsByStatus = (
  budgets: Budget[],
  status: BudgetStatus
): Budget[] => {
  return budgets.filter(budget => getBudgetStatus(budget) === status);
};

/**
 * Get budgets by period
 */
export const filterBudgetsByPeriod = (
  budgets: Budget[],
  period: 'weekly' | 'monthly' | 'yearly'
): Budget[] => {
  return budgets.filter(budget => budget.period === period);
};

/**
 * Get budgets by category
 */
export const filterBudgetsByCategory = (
  budgets: Budget[],
  categoryId: number
): Budget[] => {
  return budgets.filter(budget => budget.categoryId === categoryId);
};

/**
 * Check if a budget exists for a category
 */
export const hasBudgetForCategory = (
  budgets: Budget[],
  categoryId: number,
  period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
): boolean => {
  return budgets.some(
    budget => budget.categoryId === categoryId && budget.period === period
  );
};

/**
 * Get total budget amount across all budgets
 */
export const calculateTotalBudget = (budgets: Budget[]): number => {
  return budgets.reduce((sum, budget) => sum + budget.amount, 0);
};

/**
 * Get total spent across all budgets
 */
export const calculateTotalSpent = (budgets: Budget[]): number => {
  return budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
};

/**
 * Get overall budget utilization percentage
 */
export const calculateOverallUtilization = (budgets: Budget[]): number => {
  const totalBudget = calculateTotalBudget(budgets);
  const totalSpent = calculateTotalSpent(budgets);
  return calculateBudgetUtilization(totalSpent, totalBudget);
};

/**
 * Sort budgets by utilization (descending)
 */
export const sortBudgetsByUtilization = (budgets: Budget[]): Budget[] => {
  return [...budgets].sort((a, b) => {
    const utilizationA = calculateBudgetUtilization(a.spent || 0, a.amount);
    const utilizationB = calculateBudgetUtilization(b.spent || 0, b.amount);
    return utilizationB - utilizationA;
  });
};

/**
 * Get budget alerts (budgets that are over or near limit)
 */
export interface BudgetAlert {
  budget: Budget;
  status: BudgetStatus;
  utilization: number;
  message: string;
}

export const getBudgetAlerts = (budgets: Budget[]): BudgetAlert[] => {
  const alerts: BudgetAlert[] = [];
  
  budgets.forEach(budget => {
    const status = getBudgetStatus(budget);
    const utilization = calculateBudgetUtilization(budget.spent || 0, budget.amount);
    
    if (status === 'exceeded') {
      alerts.push({
        budget,
        status,
        utilization,
        message: `Budget exceeded by ${utilization - 100}%`
      });
    } else if (status === 'warning') {
      alerts.push({
        budget,
        status,
        utilization,
        message: `Budget at ${utilization.toFixed(0)}% - approaching limit`
      });
    }
  });
  
  return alerts;
};
