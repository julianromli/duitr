import { supabase } from '@/lib/supabase';
import { mapTransactionRow } from '@/services/finance/mappers';
import type { Transaction } from '@/types/finance';

const CATEGORY_KEY_TO_ID: Record<string, number> = {
  expense_groceries: 1,
  expense_food: 2,
  expense_dining: 2,
  expense_transportation: 3,
  expense_subscription: 4,
  expense_housing: 5,
  expense_entertainment: 6,
  expense_shopping: 7,
  expense_health: 8,
  expense_education: 9,
  expense_travel: 10,
  expense_personal: 11,
  expense_other: 12,
  income_salary: 13,
  income_business: 14,
  income_investment: 15,
  income_gift: 16,
  income_other: 17,
  system_transfer: 18,
  expense_donation: 19,
};

export async function formatTransactionForDB(
  data: Record<string, unknown>,
  userCurrency: string,
): Promise<Record<string, unknown>> {
  const { category, ...dbData } = data as Record<string, unknown> & { category?: unknown };

  if (dbData.amount !== undefined && !dbData.original_amount) {
    dbData.original_amount = dbData.amount;
    dbData.original_currency = userCurrency;
    dbData.converted_amount = dbData.amount;
    dbData.converted_currency = userCurrency;
    dbData.exchange_rate = 1.0;
  }

  if (dbData.category_id) {
    if (typeof dbData.category_id === 'string' && dbData.category_id.includes('_')) {
      const key = dbData.category_id as string;
      const categoryId = CATEGORY_KEY_TO_ID[key];
      if (categoryId) {
        dbData.category_id = categoryId;
      } else if (key.startsWith('expense_')) {
        dbData.category_id = 12;
      } else if (key.startsWith('income_')) {
        dbData.category_id = 17;
      } else {
        dbData.category_id = 18;
      }
    } else if (typeof dbData.category_id === 'number' || !Number.isNaN(Number(dbData.category_id))) {
      dbData.category_id = Number(dbData.category_id);
    } else if (typeof dbData.category_id === 'string') {
      dbData.category_id = Number(dbData.category_id) || (data.type === 'income' ? 17 : data.type === 'transfer' ? 18 : 12);
    }
  } else if (data.type === 'income') {
    dbData.category_id = 17;
  } else if (data.type === 'transfer') {
    dbData.category_id = 18;
  } else {
    dbData.category_id = 12;
  }

  return dbData;
}

class TransactionService {
  async getAll(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
    return (data ?? []).map(mapTransactionRow);
  }

  async delete(transactionId: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error?.message.includes('column') || error?.message.includes('schema') || error?.message.includes('destination_wallet_id')) {
      await supabase
        .from('transactions')
        .update({ destination_wallet_id: null, fee: null })
        .eq('id', transactionId);
      const retry = await supabase.from('transactions').delete().eq('id', transactionId);
      if (retry.error) throw new Error(retry.error.message);
      return;
    }
    if (error) throw new Error(error.message);
  }

  async deleteByWallet(walletId: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('wallet_id', walletId);
    if (error) throw new Error(error.message);
  }
}

const transactionService = new TransactionService();
export default transactionService;
