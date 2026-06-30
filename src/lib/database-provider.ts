export type DatabaseProvider = 'supabase' | 'neon';

export function getDatabaseProvider(): DatabaseProvider {
  const provider = import.meta.env.VITE_DATABASE_PROVIDER as DatabaseProvider | undefined;
  return provider === 'neon' ? 'neon' : 'supabase';
}

export function isNeonProvider(): boolean {
  return getDatabaseProvider() === 'neon';
}
