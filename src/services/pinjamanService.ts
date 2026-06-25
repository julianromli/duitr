import { supabase } from '@/lib/supabase';
import { mapPinjamanRow } from '@/services/finance/mappers';
import type { PinjamanItem } from '@/types/finance';

class PinjamanService {
  async getAll(userId: string): Promise<PinjamanItem[]> {
    const { data, error } = await supabase.from('pinjaman_items').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to fetch pinjaman items: ${error.message}`);
    return (data ?? []).map(mapPinjamanRow);
  }

  async create(
    userId: string,
    item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>,
  ): Promise<PinjamanItem> {
    const { data, error } = await supabase
      .from('pinjaman_items')
      .insert({
        name: item.name,
        amount: item.amount,
        category: item.category,
        due_date: item.due_date,
        icon: item.icon,
        user_id: userId,
        is_settled: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapPinjamanRow(data);
  }

  async update(item: PinjamanItem): Promise<PinjamanItem> {
    const { data, error } = await supabase
      .from('pinjaman_items')
      .update({
        name: item.name,
        amount: item.amount,
        category: item.category,
        due_date: item.due_date,
        icon: item.icon,
        is_settled: item.is_settled,
      })
      .eq('id', item.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapPinjamanRow(data);
  }

  async delete(itemId: string): Promise<void> {
    const { error } = await supabase.from('pinjaman_items').delete().eq('id', itemId);
    if (error) throw new Error(error.message);
  }
}

const pinjamanService = new PinjamanService();
export default pinjamanService;
