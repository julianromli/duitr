export type Transaction = {
  id: string;
  amount: number;
  category: string;
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
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
};

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  type: 'cash' | 'bank' | 'e-wallet' | 'investment';
  color: string;
};

// Type for items users want to buy
export type WantToBuyItem = {
  id: string;
  userId: string;
  name: string;
  icon?: string | null;
  price: number;
  category: 'Keinginan' | 'Kebutuhan';
  estimated_date: string; // ISO date string
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  is_purchased: boolean;
  created_at: string;
};

// Type for loan/credit items
export type PinjamanItem = {
  id: string;
  userId: string;
  name: string;
  icon?: string | null;
  category: 'Utang' | 'Piutang';
  due_date: string; // ISO date string
  amount: number;
  is_settled: boolean;
  created_at: string;
};

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeTransactions?: boolean;
  includeSummary?: boolean;
  includeBudgets?: boolean;
  includeWallets?: boolean;
} 