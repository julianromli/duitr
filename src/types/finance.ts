export type Transaction = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  walletId: string;
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

export type Transfer = {
  amount: number;
  description: string;
  date: string;
  fromWalletId: string;
  toWalletId: string;
  fee: number;
};

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeTransactions?: boolean;
  includeSummary?: boolean;
  includeBudgets?: boolean;
  includeWallets?: boolean;
} 