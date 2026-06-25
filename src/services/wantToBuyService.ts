import { getFinanceDatabase } from '@/integrations/database';
import { mapWantToBuyRow } from '@/services/finance/mappers';
import type { WantToBuyItem } from '@/types/finance';

class WantToBuyService {
  private db = getFinanceDatabase();

  async getAll(userId: string): Promise<WantToBuyItem[]> {
    const rows = await this.db.wantToBuy.getAll(userId);
    return rows.map((row) => mapWantToBuyRow(row as Parameters<typeof mapWantToBuyRow>[0]));
  }

  async create(
    userId: string,
    item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>,
  ): Promise<WantToBuyItem> {
    const row = await this.db.wantToBuy.insert({
      name: item.name,
      price: item.price,
      category: item.category,
      priority: item.priority,
      estimated_date: item.estimated_date,
      icon: item.icon,
      user_id: userId,
      is_purchased: false,
    });
    return mapWantToBuyRow(row as Parameters<typeof mapWantToBuyRow>[0]);
  }

  async update(item: WantToBuyItem): Promise<WantToBuyItem> {
    const row = await this.db.wantToBuy.update(item.id, {
      name: item.name,
      price: item.price,
      category: item.category,
      priority: item.priority,
      estimated_date: item.estimated_date,
      icon: item.icon,
      is_purchased: item.is_purchased,
    });
    return mapWantToBuyRow(row as Parameters<typeof mapWantToBuyRow>[0]);
  }

  async delete(itemId: string): Promise<void> {
    await this.db.wantToBuy.delete(itemId);
  }
}

const wantToBuyService = new WantToBuyService();
export default wantToBuyService;
