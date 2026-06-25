import { supabase } from '@/lib/supabase';
import { mapBudgetRow } from '@/services/finance/mappers';
import type { Category } from '@/types/category';
import type { Budget } from '@/types/finance';

class BudgetService {
  async getAll(
    userId: string,
    options: {
      categories: Category[];
      language: string;
      translate: (key: string) => string;
      defaultWalletId?: string;
    },
  ): Promise<Budget[]> {
    const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to fetch budgets: ${error.message}`);

    const categoryMap = Object.fromEntries(
      options.categories
        .filter((c) => c.category_id)
        .map((c) => [c.category_id, { en_name: c.en_name, id_name: c.id_name }]),
    );

    return (data ?? []).map((row) =>
      mapBudgetRow(row, {
        categoryMap,
        language: options.language,
        translate: options.translate,
        defaultWalletId: options.defaultWalletId,
      }),
    );
  }

  async create(userId: string, budget: Omit<Budget, 'id'>): Promise<Budget> {
    const budgetData = {
      user_id: userId,
      category_id: budget.categoryId || 12,
      amount: budget.amount,
      period: budget.period || 'monthly',
      spent: budget.spent || 0,
    };

    const { data, error } = await supabase.from('budgets').insert(budgetData).select();
    if (error) {
      const upsert = await supabase.from('budgets').upsert(budgetData).select();
      if (upsert.error) throw new Error(upsert.error.message);
      if (!upsert.data?.[0]) throw new Error('No data returned from budget upsert');
      const row = upsert.data[0];
      return {
        id: row.id,
        categoryId: row.category_id,
        amount: row.amount,
        period: row.period || 'monthly',
        spent: row.spent || 0,
        category: budget.category,
      };
    }

    if (!data?.[0]) throw new Error('No data returned from budget insert');
    const row = data[0];
    return {
      id: row.id,
      categoryId: row.category_id,
      amount: row.amount,
      period: row.period || 'monthly',
      spent: row.spent || 0,
      category: budget.category,
    };
  }

  async update(budget: Budget): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update({
        category_id: budget.categoryId,
        amount: budget.amount,
        period: budget.period || 'monthly',
        spent: budget.spent ?? 0,
      })
      .eq('id', budget.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      ...budget,
      categoryId: data.category_id,
      amount: data.amount,
      period: data.period,
      spent: data.spent,
    };
  }

  async delete(budgetId: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
    if (error) throw new Error(error.message);
  }
}

const budgetService = new BudgetService();
export default budgetService;
