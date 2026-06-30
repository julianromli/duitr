import { getFinanceDatabase } from '@/integrations/database';
import type { FinanceDatabase } from '@/integrations/database';
import { mapBudgetRow } from '@/services/finance/mappers';
import type { Category } from '@/types/category';
import type { Budget } from '@/types/finance';

class BudgetService {
  private get db(): FinanceDatabase {
    return getFinanceDatabase();
  }

  async getAll(
    userId: string,
    options: {
      categories: Category[];
      language: string;
      translate: (key: string) => string;
      defaultWalletId?: string;
    },
  ): Promise<Budget[]> {
    const rows = await this.db.budgets.getAll(userId);
    const categoryMap = Object.fromEntries(
      options.categories
        .filter((c) => c.category_id)
        .map((c) => [c.category_id, { en_name: c.en_name, id_name: c.id_name }]),
    );

    return rows.map((row) =>
      mapBudgetRow(row as Parameters<typeof mapBudgetRow>[0], {
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

    let rows: unknown[];
    try {
      rows = await this.db.budgets.insert(budgetData);
    } catch {
      rows = await this.db.budgets.upsert(budgetData);
    }

    if (!rows[0]) throw new Error('No data returned from budget insert');
    const row = rows[0] as {
      id: string;
      category_id: number;
      amount: number;
      period?: string;
      spent?: number;
    };

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
    await this.db.budgets.update(budget.id, {
      category_id: budget.categoryId,
      amount: budget.amount,
      period: budget.period || 'monthly',
      spent: budget.spent ?? 0,
    });
    return budget;
  }

  async delete(budgetId: string): Promise<void> {
    await this.db.budgets.delete(budgetId);
  }
}

const budgetService = new BudgetService();
export default budgetService;
