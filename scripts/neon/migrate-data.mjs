/**
 * One-time Supabase -> Neon data migration.
 * Requires: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_DATABASE_URL in .env.local
 * Usage: node scripts/neon/migrate-data.mjs
 */
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

function loadEnv() {
  const envPath = resolve(root, '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const sql = postgres(env.VITE_DATABASE_URL, { ssl: 'require', max: 1 });

const TABLES = [
  'categories',
  'exchange_rates',
  'wallets',
  'budgets',
  'transactions',
  'pinjaman_items',
  'want_to_buy_items',
  'notification_subscriptions',
  'budget_predictions',
];

async function fetchAll(table) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function importUsers() {
  const { data: users, error } = await supabase.auth.admin.listUsers?.();
  // anon key cannot list users - users must be pre-imported via MCP SQL
  if (error || !users) {
    console.log('Skipping auth user import (requires service role or MCP).');
    return;
  }
}

async function importTable(table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows (skip)`);
    return;
  }
  const cols = Object.keys(rows[0]);
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await sql`
      INSERT INTO ${sql(table)} ${sql(chunk, cols)}
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function main() {
  console.log('Starting data migration...');
  for (const table of TABLES) {
    const rows = await fetchAll(table);
    await importTable(table, rows);
  }
  await sql.end();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
