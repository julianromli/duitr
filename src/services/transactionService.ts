import { getFinanceDatabase } from '@/integrations/database';
import type { TransactionSearchParams } from '@/integrations/database';
import { mapTransactionRow } from '@/services/finance/mappers';
import {
  computeWalletUpdatesForCreate,
  computeWalletUpdatesForDelete,
  computeWalletUpdatesForUpdate,
  resolveCategoryId,
  TransactionValidationError,
} from '@/services/finance/transactionBalance';
import type { Transaction, Wallet } from '@/types/finance';

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
      dbData.category_id =
        Number(dbData.category_id) ||
        (data.type === 'income' ? 17 : data.type === 'transfer' ? 18 : 12);
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

function isSchemaError(message: string): boolean {
  return (
    message.includes('destination_wallet_id') ||
    message.includes('column') ||
    message.includes('schema')
  );
}

class TransactionService {
  private db = getFinanceDatabase();

  async getAll(userId: string): Promise<Transaction[]> {
    const rows = await this.db.transactions.getAll(userId);
    return rows.map((row) => mapTransactionRow(row as Parameters<typeof mapTransactionRow>[0]));
  }

  async search(params: TransactionSearchParams) {
    return this.db.transactions.search(params);
  }

  async create(
    userId: string,
    transaction: Omit<Transaction, 'id' | 'userId'>,
    wallets: Wallet[],
    userCurrency: string,
  ): Promise<Transaction> {
    const walletUpdates = computeWalletUpdatesForCreate(transaction, wallets);
    const dbCategoryId = resolveCategoryId(transaction);

    const newTransactionData: Record<string, unknown> = {
      amount: transaction.amount,
      category_id: dbCategoryId,
      description: transaction.description,
      date: transaction.date,
      type: transaction.type,
      wallet_id: transaction.walletId,
      user_id: userId,
      ...(transaction.type === 'transfer' && transaction.destinationWalletId
        ? { destination_wallet_id: transaction.destinationWalletId }
        : {}),
      ...(transaction.type === 'transfer' && transaction.fee != null ? { fee: transaction.fee } : {}),
    };

    let finalRow: Record<string, unknown>;
    try {
      finalRow = (await this.db.transactions.insert(
        await formatTransactionForDB(newTransactionData, userCurrency),
      )) as Record<string, unknown>;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isSchemaError(message)) throw error;

      const fallbackData = {
        amount: transaction.amount,
        category_id: dbCategoryId,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        wallet_id: transaction.walletId,
        user_id: userId,
      };

      if (transaction.type === 'transfer' && transaction.destinationWalletId) {
        const basicRow = (await this.db.transactions.insert(
          await formatTransactionForDB(fallbackData, userCurrency),
        )) as Record<string, unknown>;
        try {
          await this.db.transactions.patch(String(basicRow.id), {
            destination_wallet_id: transaction.destinationWalletId,
            fee: transaction.fee ?? 0,
          });
          finalRow = {
            ...basicRow,
            destination_wallet_id: transaction.destinationWalletId,
            fee: transaction.fee ?? 0,
          };
        } catch {
          finalRow = basicRow;
        }
      } else {
        finalRow = (await this.db.transactions.insert(fallbackData)) as Record<string, unknown>;
      }
    }

    await Promise.all(
      walletUpdates.map((update) => this.db.wallets.updateBalance(update.id, update.balance)),
    );

    return mapTransactionRow(finalRow as Parameters<typeof mapTransactionRow>[0]);
  }

  async update(
    updatedTransaction: Transaction,
    oldTransaction: Transaction,
    wallets: Wallet[],
    userCurrency: string,
  ): Promise<void> {
    const walletUpdates = computeWalletUpdatesForUpdate(oldTransaction, updatedTransaction, wallets);
    const dbCategoryId = resolveCategoryId(updatedTransaction);

    const updateData: Record<string, unknown> = {
      amount: updatedTransaction.amount,
      category_id: dbCategoryId,
      description: updatedTransaction.description,
      date: updatedTransaction.date,
      type: updatedTransaction.type,
      wallet_id: updatedTransaction.walletId,
    };

    if (updatedTransaction.type === 'transfer' && updatedTransaction.destinationWalletId) {
      try {
        await this.db.transactions.patch(updatedTransaction.id, {
          destination_wallet_id: updatedTransaction.destinationWalletId,
        });
        updateData.destination_wallet_id = updatedTransaction.destinationWalletId;
      } catch {
        // Schema may not support destination_wallet_id
      }
      try {
        await this.db.transactions.patch(updatedTransaction.id, {
          fee: updatedTransaction.fee ?? 0,
        });
        updateData.fee = updatedTransaction.fee ?? 0;
      } catch {
        // Schema may not support fee
      }
    }

    try {
      await this.db.transactions.update(
        updatedTransaction.id,
        await formatTransactionForDB(updateData, userCurrency),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isSchemaError(message)) throw error;
      await this.db.transactions.update(updatedTransaction.id, {
        amount: updatedTransaction.amount,
        category_id: dbCategoryId,
        description: updatedTransaction.description,
        date: updatedTransaction.date,
        type: updatedTransaction.type,
        wallet_id: updatedTransaction.walletId,
      });
    }

    await Promise.all(
      walletUpdates.map((update) => this.db.wallets.updateBalance(update.id, update.balance)),
    );
  }

  async deleteWithBalanceRevert(transaction: Transaction, wallets: Wallet[]): Promise<void> {
    const walletUpdates = computeWalletUpdatesForDelete(transaction, wallets);
    await this.db.transactions.delete(transaction.id);
    await Promise.all(
      walletUpdates.map((update) => this.db.wallets.updateBalance(update.id, update.balance)),
    );
  }

  async delete(transactionId: string): Promise<void> {
    await this.db.transactions.delete(transactionId);
  }

  async deleteByWallet(walletId: string): Promise<void> {
    await this.db.transactions.deleteByWallet(walletId);
  }
}

const transactionService = new TransactionService();
export { TransactionValidationError };
export default transactionService;
