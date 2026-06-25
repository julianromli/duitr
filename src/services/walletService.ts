import { supabase } from '@/lib/supabase';
import { mapWalletRow } from '@/services/finance/mappers';
import type { Wallet } from '@/types/finance';

class WalletService {
  async getAll(userId: string): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch wallets: ${error.message}`);
    }

    return (data ?? []).map(mapWalletRow);
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

    const { data, error } = await supabase.from('wallets').insert(insertData).select();

    if (error?.message.includes('column') && insertData.icon) {
      delete insertData.icon;
      const retry = await supabase.from('wallets').insert(insertData).select();
      if (retry.error) throw new Error(retry.error.message);
      if (!retry.data?.[0]) throw new Error('No data returned from wallet insert');
      return mapWalletRow(retry.data[0]);
    }

    if (error) throw new Error(error.message);
    if (!data?.[0]) throw new Error('No data returned from wallet insert');
    return mapWalletRow(data[0]);
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

    const { error } = await supabase.from('wallets').update(updateData).eq('id', wallet.id);

    if (error?.message.includes('column') && updateData.icon) {
      delete updateData.icon;
      const retry = await supabase.from('wallets').update(updateData).eq('id', wallet.id);
      if (retry.error) throw new Error(retry.error.message);
      return;
    }

    if (error) throw new Error(error.message);
  }

  async updateBalance(walletId: string, balance: number): Promise<void> {
    const { error } = await supabase.from('wallets').update({ balance }).eq('id', walletId);
    if (error) throw new Error(error.message);
  }

  async delete(walletId: string): Promise<void> {
    const { error } = await supabase.from('wallets').delete().eq('id', walletId);
    if (error) throw new Error(error.message);
  }
}

const walletService = new WalletService();
export default walletService;
