export type DatabaseProvider = 'supabase' | 'neon';

export interface TransactionSearchParams {
  page: number;
  pageSize: number;
  sortOption: 'date-newest' | 'date-latest' | 'amount-highest' | 'amount-lowest';
  typeFilter: 'all' | 'income' | 'expense';
  selectedWallet: string;
  categoryId: number | null;
  searchTerm: string;
}

export interface TransactionListRow {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  wallet_id: string;
  category_id?: number | string | null;
}

export interface FinanceDatabase {
  wallets: {
    getAll(userId: string): Promise<unknown[]>;
    getIdNameList(): Promise<{ id: string; name: string }[]>;
    getNamesByIds(ids: string[]): Promise<{ id: string; name: string }[]>;
    insert(data: Record<string, unknown>): Promise<unknown>;
    update(id: string, data: Record<string, unknown>): Promise<void>;
    updateBalance(id: string, balance: number): Promise<void>;
    delete(id: string): Promise<void>;
  };
  transactions: {
    getAll(userId: string): Promise<unknown[]>;
    search(params: TransactionSearchParams): Promise<TransactionListRow[]>;
    insert(data: Record<string, unknown>): Promise<unknown>;
    update(id: string, data: Record<string, unknown>): Promise<void>;
    patch(id: string, data: Record<string, unknown>): Promise<void>;
    delete(id: string): Promise<void>;
    deleteByWallet(walletId: string): Promise<void>;
  };
  budgets: {
    getAll(userId: string): Promise<unknown[]>;
    insert(data: Record<string, unknown>): Promise<unknown[]>;
    upsert(data: Record<string, unknown>): Promise<unknown[]>;
    update(id: string, data: Record<string, unknown>): Promise<void>;
    delete(id: string): Promise<void>;
  };
  wantToBuy: {
    getAll(userId: string): Promise<unknown[]>;
    insert(data: Record<string, unknown>): Promise<unknown>;
    update(id: string, data: Record<string, unknown>): Promise<unknown>;
    delete(id: string): Promise<void>;
  };
  pinjaman: {
    getAll(userId: string): Promise<unknown[]>;
    insert(data: Record<string, unknown>): Promise<unknown>;
    update(id: string, data: Record<string, unknown>): Promise<unknown>;
    delete(id: string): Promise<void>;
  };
}
