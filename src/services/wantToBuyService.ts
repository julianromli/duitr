import { supabase } from '@/lib/supabase';
import { mapWantToBuyRow } from '@/services/finance/mappers';
import type { WantToBuyItem } from '@/types/finance';

class WantToBuyService {
  async getAll(userId: string): Promise<WantToBuyItem[]> {
    const { data, error } = await supabase.from('want_to_buy_items').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to fetch want-to-buy items: ${error.message}`);
    return (data ?? []).map(mapWantToBuyRow);
  }

  async create(
    userId: string,
    item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>,
  ): Promise<WantToBuyItem> {
    const { data, error } = await supabase
      .from('want_to_buy_items')
      .insert({
        name: item.name,
        price: item.price,
        category: item.category,
        priority: item.priority,
        estimated_date: item.estimated_date,
        icon: item.icon,
        user_id: userId,
        is_purchased: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapWantToBuyRow(data);
  }

  async update(item: WantToBuyItem): Promise<WantToBuyItem> {
    const { data, error } = await supabase
      .from('want_to_buy_items')
      .update({
        name: item.name,
        price: item.price,
        category: item.category,
        priority: item.priority,
        estimated_date: item.estimated_date,
        icon: item.icon,
        is_purchased: item.is_purchased,
      })
      .eq('id', item.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapWantToBuyRow(data);
  }

  async delete(itemId: string): Promise<void> {
    const { error } = await supabase.from('want_to_buy_items').delete().eq('id', itemId);
    if (error) throw new Error(error.message);
  }
}

const wantToBuyService = new WantToBuyService();
export default wantToBuyService;
