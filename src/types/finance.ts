
// Type definitions for finance-related data structures.
// Updated to use integer categoryId consistently (no more string IDs)
export type Transaction = {
  id: string;
  amount: number;
  categoryId: number;           // INTEGER category ID (references categories.category_id)
  description: string;
  date: string;
  created_at?: string;          // Added for accurate timestamp sorting
  type: 'income' | 'expense' | 'transfer';
  walletId: string;
  userId?: string;
  destinationWalletId?: string | null;
  fee?: number | null;
};

export type Budget = {
  id: string;
  amount: number;
  categoryId: number;           // INTEGER category ID (references categories.category_id)
  month?: string;
  year?: string;
  walletId?: string;
  userId?: string;
  // Legacy fields for compatibility
  spent?: number;
  period?: 'monthly' | 'weekly' | 'yearly';
};

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  icon?: string;
  color: string;
  type?: 'cash' | 'bank' | 'e-wallet' | 'investment';
  userId?: string;
};

// Type for items users want to buy - updated to match database schema
export type WantToBuyItem = {
  id: string;
  name: string;
  price: number; // renamed from amount
  category: "Keinginan" | "Kebutuhan";
  priority: "Tinggi" | "Sedang" | "Rendah";
  estimated_date: string; // renamed from target_date
  is_purchased: boolean;
  purchase_date?: string | null;
  icon?: string | null;
  userId?: string;
  user_id?: string; // For database compatibility
  created_at?: string;
};

// Type for loan/credit items - updated to match database schema with consistent naming
export interface PinjamanItem {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  icon?: string;
  is_settled?: boolean;
  created_at?: string;
  user_id: string; // Keep this as user_id to match database schema - removed userId
  description?: string;
  lender_name?: string;
}

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeTransactions?: boolean;
  includeSummary?: boolean;
  includeBudgets?: boolean;
  includeWallets?: boolean;
}

// AI Evaluation types
export type FinanceSummary = {
  startDate: string;
  endDate: string;
  income: Array<{ category: string; amount: number }>;
  expenses: Array<{ category: string; amount: number }>;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// Budget Prediction types
export type RiskLevel = 'low' | 'medium' | 'high';

export interface BudgetPrediction {
  categoryId: number;
  categoryName: string;
  currentSpend: number;
  budgetLimit: number;
  projectedSpend: number;
  overrunAmount: number;
  riskLevel: RiskLevel;
  confidence: number;
  daysRemaining: number;
  recommendedDailyLimit: number;
  insight: string;
  seasonalNote?: string;
}

export interface PredictBudgetRequest {
  budgets: Array<{
    categoryId: number;
    categoryName?: string;
    limit: number;
    period: 'monthly';
  }>;
  transactions: Transaction[];
  currentDate?: string;
}

export interface PredictBudgetResponse {
  predictions: BudgetPrediction[];
  overallRisk: RiskLevel;
  summary: string;
}

export interface StoredPrediction {
  id: string;
  user_id: string;
  category_id: number | null;
  prediction_date: string;
  period_start: string;
  period_end: string;
  current_spend: number;
  budget_limit: number;
  projected_spend: number;
  overrun_amount: number;
  risk_level: RiskLevel;
  confidence: number | null;
  days_remaining: number | null;
  recommended_daily_limit: number | null;
  insight: string | null;
  seasonal_note: string | null;
  created_at: string;
  updated_at: string;
}
