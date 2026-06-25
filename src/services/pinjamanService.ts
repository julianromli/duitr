import { getFinanceDatabase } from '@/integrations/database';
import { mapPinjamanRow } from '@/services/finance/mappers';
import type { PinjamanItem } from '@/types/finance';

class PinjamanService {
  private db = getFinanceDatabase();

  async getAll(userId: string): Promise<PinjamanItem[]> {
    const rows = await this.db.pinjaman.getAll(userId);
    return rows.map((row) => mapPinjamanRow(row as Parameters<typeof mapPinjamanRow>[0]));
  }

  async create(
    userId: string,
    item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>,
  ): Promise<PinjamanItem> {
    const row = await this.db.pinjaman.insert({
      name: item.name,
      amount: item.amount,
      category: item.category,
      due_date: item.due_date,
      icon: item.icon,
      user_id: userId,
      is_settled: false,
    });
    return mapPinjamanRow(row as Parameters<typeof mapPinjamanRow>[0]);
  }

  async update(item: PinjamanItem): Promise<PinjamanItem> {
    const row = await this.db.pinjaman.update(item.id, {
      name: item.name,
      amount: item.amount,
      category: item.category,
      due_date: item.due_date,
      icon: item.icon,
      is_settled: item.is_settled,
    });
    return mapPinjamanRow(row as Parameters<typeof mapPinjamanRow>[0]);
  }

  async delete(itemId: string): Promise<void> {
    await this.db.pinjaman.delete(itemId);
  }
}

const pinjamanService = new PinjamanService();
export default pinjamanService;
