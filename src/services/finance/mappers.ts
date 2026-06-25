import type { Budget, PinjamanItem, Transaction, Wallet, WantToBuyItem } from '@/types/finance';
import type { Category } from '@/types/category';

type CategoryMap = Record<number, { en_name: string; id_name: string }>;

export function buildCategoryMap(categories: Category[]): CategoryMap {
  const map: CategoryMap = {};
  for (const cat of categories) {
    if (cat.category_id) {
      map[cat.category_id] = { en_name: cat.en_name, id_name: cat.id_name };
    }
  }
  return map;
}

export function mapWalletRow(row: {
  id: string;
  name: string;
  balance: number;
  icon?: string | null;
  color: string;
  type?: string | null;
  user_id: string;
}): Wallet {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    icon: row.icon || 'wallet',
    color: row.color,
    type: (row.type || 'cash') as Wallet['type'],
    userId: row.user_id,
  };
}

export function mapTransactionRow(row: {
  id: string;
  amount: number;
  category_id?: number | string | null;
  description: string;
  date: string;
  type: string;
  wallet_id: string;
  user_id: string;
  destination_wallet_id?: string | null;
  fee?: number | null;
}): Transaction {
  let categoryId = row.category_id;
  if (!categoryId) {
    categoryId = row.type === 'transfer' ? 18 : row.type === 'income' ? 17 : 12;
  } else if (typeof categoryId === 'string') {
    categoryId = Number(categoryId);
  }

  return {
    id: row.id,
    amount: row.amount,
    category: '',
    categoryId: Number(categoryId),
    description: row.description,
    date: row.date,
    type: row.type as Transaction['type'],
    walletId: row.wallet_id,
    userId: row.user_id,
    destinationWalletId: row.destination_wallet_id,
    fee: row.fee,
  };
}

const BUDGET_CATEGORY_FALLBACK_KEYS: Record<number, string> = {
  1: 'transactions.categories.groceries',
  2: 'transactions.categories.dining',
  3: 'transactions.categories.transportation',
  4: 'transactions.categories.subscription',
  5: 'transactions.categories.housing',
  6: 'transactions.categories.entertainment',
  7: 'transactions.categories.shopping',
  8: 'transactions.categories.health',
  9: 'transactions.categories.education',
  10: 'transactions.categories.travel',
  11: 'transactions.categories.personal',
  12: 'transactions.categories.other',
  16: 'transactions.categories.gift',
  19: 'transactions.categories.donate',
};

export function mapBudgetRow(
  row: {
    id: string;
    amount: number;
    category_id: number | string;
    month?: string | null;
    year?: string | null;
    wallet_id?: string | null;
    user_id: string;
    spent?: number | null;
    period?: string | null;
  },
  options: {
    categoryMap: CategoryMap;
    language: string;
    translate: (key: string) => string;
    defaultWalletId?: string;
  },
): Budget {
  const categoryId = row.category_id;
  let categoryDisplayName = '';

  if (typeof categoryId === 'number' || (typeof categoryId === 'string' && !Number.isNaN(Number(categoryId)))) {
    const numericId = Number(categoryId);
    if (options.categoryMap[numericId]) {
      categoryDisplayName = options.language === 'id'
        ? options.categoryMap[numericId].id_name
        : options.categoryMap[numericId].en_name;
    } else {
      const translationKey = BUDGET_CATEGORY_FALLBACK_KEYS[numericId];
      categoryDisplayName = translationKey ? options.translate(translationKey) : 'Other';
    }
  }

  return {
    id: row.id,
    amount: row.amount,
    categoryId: row.category_id,
    category: categoryDisplayName,
    month: row.month || new Date().getMonth().toString(),
    year: row.year || new Date().getFullYear().toString(),
    walletId: row.wallet_id || options.defaultWalletId || '',
    userId: row.user_id,
    spent: row.spent ?? undefined,
    period: row.period as Budget['period'],
  };
}

export function mapWantToBuyRow(row: {
  id: string;
  user_id: string;
  name: string;
  icon?: string | null;
  price: number;
  category: string;
  estimated_date: string;
  priority: string;
  is_purchased: boolean;
  created_at: string;
}): WantToBuyItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    price: row.price,
    category: row.category as WantToBuyItem['category'],
    estimated_date: row.estimated_date,
    priority: row.priority as WantToBuyItem['priority'],
    is_purchased: row.is_purchased,
    created_at: row.created_at,
  };
}

export function mapPinjamanRow(row: {
  id: string;
  user_id: string;
  name: string;
  icon?: string | null;
  category: string;
  due_date: string;
  amount: number;
  is_settled: boolean;
  created_at: string;
}): PinjamanItem {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    icon: row.icon ?? undefined,
    category: row.category as PinjamanItem['category'],
    due_date: row.due_date,
    amount: row.amount,
    is_settled: row.is_settled,
    created_at: row.created_at,
  };
}
