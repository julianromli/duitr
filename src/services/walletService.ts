import { getFinanceDatabase } from '@/integrations/database';
import type { FinanceDatabase } from '@/integrations/database';
import { mapWalletRow } from '@/services/finance/mappers';
import type { Wallet } from '@/types/finance';

class WalletService {
  private get db(): FinanceDatabase {
    return getFinanceDatabase();
  }

  async getAll(userId: string): Promise<Wallet[]> {
    const rows = await this.db.wallets.getAll(userId);
    return rows.map((row) => mapWalletRow(row as Parameters<typeof mapWalletRow>[0]));
  }

  async getIdNameList(): Promise<{ id: string; name: string }[]> {
    return this.db.wallets.getIdNameList();
  }

  async getNamesByIds(ids: string[]): Promise<Record<string, string>> {
    const rows = await this.db.wallets.getNamesByIds(ids);
    return rows.reduce<Record<string, string>>((acc, wallet) => {
      acc[wallet.id] = wallet.name;
      return acc;
    }, {});
  }

  async create(userId: string, wallet: Omit<Wallet, 'id' | 'userId'>): Promise<Wallet> {
    const walletType = wallet.type || 'cash';
    const insertData: Record<string, unknown> = {
      name: wallet.name,
      balance: wallet.balance,
      type: walletType,
      color: wallet.color,
      user_id: userId,
    };

    if (wallet.icon) {
      insertData.icon = wallet.icon;
    }

    try {
      const row = await this.db.wallets.insert(insertData);
      return mapWalletRow(row as Parameters<typeof mapWalletRow>[0]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('column') && insertData.icon) {
        delete insertData.icon;
        const row = await this.db.wallets.insert(insertData);
        return mapWalletRow(row as Parameters<typeof mapWalletRow>[0]);
      }
      throw error;
    }
  }

  async update(wallet: Wallet): Promise<void> {
    const walletType = wallet.type || 'cash';
    const updateData: Record<string, unknown> = {
      name: wallet.name,
      balance: wallet.balance,
      type: walletType,
      color: wallet.color,
    };

    if (wallet.icon) {
      updateData.icon = wallet.icon;
    }

    try {
      await this.db.wallets.update(wallet.id, updateData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('column') && updateData.icon) {
        delete updateData.icon;
        await this.db.wallets.update(wallet.id, updateData);
        return;
      }
      throw error;
    }
  }

  async updateBalance(walletId: string, balance: number): Promise<void> {
    await this.db.wallets.updateBalance(walletId, balance);
  }

  async delete(walletId: string): Promise<void> {
    await this.db.wallets.delete(walletId);
  }
}

const walletService = new WalletService();
export default walletService;
