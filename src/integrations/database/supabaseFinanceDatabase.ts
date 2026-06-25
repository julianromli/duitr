import { supabase } from '@/lib/supabase';
import type { FinanceDatabase, TransactionListRow, TransactionSearchParams } from '@/integrations/database/types';

function isSchemaError(message: string): boolean {
  return (
    message.includes('column') ||
    message.includes('schema') ||
    message.includes('destination_wallet_id')
  );
}

export function createSupabaseFinanceDatabase(): FinanceDatabase {
  return {
    wallets: {
      async getAll(userId) {
        const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId);
        if (error) throw new Error(`Failed to fetch wallets: ${error.message}`);
        return data ?? [];
      },
      async getIdNameList() {
        const { data, error } = await supabase.from('wallets').select('id, name').order('name');
        if (error) throw new Error(`Failed to fetch wallet names: ${error.message}`);
        return data ?? [];
      },
      async getNamesByIds(ids) {
        if (ids.length === 0) return [];
        const { data, error } = await supabase.from('wallets').select('id, name').in('id', ids);
        if (error) throw new Error(`Failed to fetch wallet names: ${error.message}`);
        return data ?? [];
      },
      async insert(data) {
        const { data: rows, error } = await supabase.from('wallets').insert(data).select();
        if (error) throw new Error(error.message);
        if (!rows?.[0]) throw new Error('No data returned from wallet insert');
        return rows[0];
      },
      async update(id, data) {
        const { error } = await supabase.from('wallets').update(data).eq('id', id);
        if (error) throw new Error(error.message);
      },
      async updateBalance(id, balance) {
        const { error } = await supabase.from('wallets').update({ balance }).eq('id', id);
        if (error) throw new Error(error.message);
      },
      async delete(id) {
        const { error } = await supabase.from('wallets').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },
    transactions: {
      async getAll(userId) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
        return data ?? [];
      },
      async search(params) {
        const start = params.page * params.pageSize;
        const end = start + params.pageSize - 1;

        let query = supabase
          .from('transactions')
          .select('id, date, type, amount, description, wallet_id, category_id');

        if (params.sortOption === 'amount-highest') {
          query = query.order('amount', { ascending: false });
        } else if (params.sortOption === 'amount-lowest') {
          query = query.order('amount', { ascending: true });
        } else {
          query = query.order('created_at', { ascending: params.sortOption === 'date-latest' });
        }

        if (params.typeFilter !== 'all') {
          query = query.eq('type', params.typeFilter);
        }
        if (params.selectedWallet !== 'all') {
          query = query.eq('wallet_id', params.selectedWallet);
        }
        if (params.categoryId !== null) {
          query = query.eq('category_id', params.categoryId);
        }
        if (params.searchTerm) {
          query = query.ilike('description', `%${params.searchTerm}%`);
        }

        const { data, error } = await query.range(start, end);
        if (error) throw new Error(`Transaction query error: ${error.message}`);
        return (data ?? []) as TransactionListRow[];
      },
      async insert(data) {
        const { data: row, error } = await supabase.from('transactions').insert(data).select().single();
        if (error) throw error;
        return row;
      },
      async update(id, data) {
        const { error } = await supabase.from('transactions').update(data).eq('id', id);
        if (error) throw error;
      },
      async patch(id, data) {
        const { error } = await supabase.from('transactions').update(data).eq('id', id);
        if (error) throw error;
      },
      async delete(id) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error && isSchemaError(error.message)) {
          await supabase.from('transactions').update({ destination_wallet_id: null, fee: null }).eq('id', id);
          const retry = await supabase.from('transactions').delete().eq('id', id);
          if (retry.error) throw new Error(retry.error.message);
          return;
        }
        if (error) throw new Error(error.message);
      },
      async deleteByWallet(walletId) {
        const { error } = await supabase.from('transactions').delete().eq('wallet_id', walletId);
        if (error) throw new Error(error.message);
      },
    },
    budgets: {
      async getAll(userId) {
        const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId);
        if (error) throw new Error(`Failed to fetch budgets: ${error.message}`);
        return data ?? [];
      },
      async insert(data) {
        const { data: rows, error } = await supabase.from('budgets').insert(data).select();
        if (error) throw new Error(error.message);
        return rows ?? [];
      },
      async upsert(data) {
        const { data: rows, error } = await supabase.from('budgets').upsert(data).select();
        if (error) throw new Error(error.message);
        return rows ?? [];
      },
      async update(id, data) {
        const { error } = await supabase.from('budgets').update(data).eq('id', id);
        if (error) throw new Error(error.message);
      },
      async delete(id) {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },
    wantToBuy: {
      async getAll(userId) {
        const { data, error } = await supabase.from('want_to_buy_items').select('*').eq('user_id', userId);
        if (error) throw new Error(`Failed to fetch want-to-buy items: ${error.message}`);
        return data ?? [];
      },
      async insert(data) {
        const { data: row, error } = await supabase.from('want_to_buy_items').insert(data).select().single();
        if (error) throw new Error(error.message);
        return row;
      },
      async update(id, data) {
        const { data: row, error } = await supabase
          .from('want_to_buy_items')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return row;
      },
      async delete(id) {
        const { error } = await supabase.from('want_to_buy_items').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },
    pinjaman: {
      async getAll(userId) {
        const { data, error } = await supabase.from('pinjaman_items').select('*').eq('user_id', userId);
        if (error) throw new Error(`Failed to fetch pinjaman items: ${error.message}`);
        return data ?? [];
      },
      async insert(data) {
        const { data: row, error } = await supabase.from('pinjaman_items').insert(data).select().single();
        if (error) throw new Error(error.message);
        return row;
      },
      async update(id, data) {
        const { data: row, error } = await supabase
          .from('pinjaman_items')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return row;
      },
      async delete(id) {
        const { error } = await supabase.from('pinjaman_items').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },
  };
}
