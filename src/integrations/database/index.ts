import { createSupabaseFinanceDatabase } from '@/integrations/database/supabaseFinanceDatabase';
import { createNeonFinanceDatabase } from '@/integrations/database/neonFinanceDatabase';
import type { DatabaseProvider, FinanceDatabase } from '@/integrations/database/types';

let financeDatabase: FinanceDatabase | null = null;

function resolveProvider(): DatabaseProvider {
  const provider = import.meta.env.VITE_DATABASE_PROVIDER as DatabaseProvider | undefined;
  return provider === 'neon' ? 'neon' : 'supabase';
}

export function getFinanceDatabase(): FinanceDatabase {
  if (financeDatabase) return financeDatabase;

  const provider = resolveProvider();
  financeDatabase =
    provider === 'neon' ? createNeonFinanceDatabase() : createSupabaseFinanceDatabase();
  return financeDatabase;
}

export function setFinanceDatabaseForTests(database: FinanceDatabase | null): void {
  financeDatabase = database;
}

export type { FinanceDatabase, TransactionSearchParams, TransactionListRow } from '@/integrations/database/types';
