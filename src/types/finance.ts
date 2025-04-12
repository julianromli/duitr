export type Transaction = {
  id: string;
  amount: number;
  categoryId: string | number;
  category?: string;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  walletId: string;
  userId?: string;
  destinationWalletId?: string | null;
  fee?: number | null;
};

export type Budget = {
  id: string;
  amount: number;
  categoryId: string | number;
  category?: string;
  month: string;
  year: string;
  walletId: string;
  userId?: string;
  // Legacy fields for compatibility
  spent?: number;
  period?: 'monthly' | 'weekly' | 'yearly';
};

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  type?: 'cash' | 'bank' | 'e-wallet' | 'investment';
  userId?: string;
};

// Type for items users want to buy
export type WantToBuyItem = {
  id: string;
  name: string;
  amount: number;
  reason: string;
  priority: number;
  target_date: string;
  is_purchased: boolean;
  purchase_date?: string | null;
  image_url?: string | null;
  userId?: string;
  created_at?: string;
};

// Type for loan/credit items
export type PinjamanItem = {
  id: string;
  name: string;
  amount: number;
  description: string;
  due_date: string | null;
  is_settled: boolean;
  settlement_date?: string | null;
  lender_name: string;
  userId?: string;
  created_at?: string;
};

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeTransactions?: boolean;
  includeSummary?: boolean;
  includeBudgets?: boolean;
  includeWallets?: boolean;
} 