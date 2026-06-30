/**
 * Import Supabase auth users + public data into Neon via direct Postgres.
 * Run: node scripts/neon/import-all.mjs
 * Requires VITE_DATABASE_URL in .env.local
 */
import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const exportDir = resolve(__dirname, 'export');

function loadEnv() {
  const envPath = resolve(root, '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function readExport(name) {
  const path = resolve(exportDir, `${name}.json`);
  if (!existsSync(path)) {
    console.warn(`Missing export file: ${path}`);
    return [];
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function userName(meta, email) {
  if (!meta || typeof meta !== 'object') return email.split('@')[0];
  return meta.name || meta.full_name || email.split('@')[0];
}

function userImage(meta) {
  if (!meta || typeof meta !== 'object') return null;
  return meta.avatar_url || meta.picture || null;
}

function preferredCurrency(meta) {
  if (!meta || typeof meta !== 'object') return 'IDR';
  return meta.preferred_currency || meta.currency || 'IDR';
}

async function importUsers(sql, users) {
  let imported = 0;
  for (const u of users) {
    const name = userName(u.raw_user_meta_data, u.email);
    const image = userImage(u.raw_user_meta_data);
    const verified = u.email_verified ?? !!u.email_confirmed_at;
    await sql`
      INSERT INTO neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
      VALUES (${u.id}, ${name}, ${u.email}, ${verified}, ${image}, ${u.created_at}, ${u.updated_at})
      ON CONFLICT (id) DO NOTHING
    `;
    if (u.provider === 'google' && u.provider_id) {
      const existing = await sql`
        SELECT id FROM neon_auth.account
        WHERE "providerId" = 'google' AND "accountId" = ${u.provider_id}
        LIMIT 1
      `;
      if (!existing.length) {
        await sql`
          INSERT INTO neon_auth.account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${u.provider_id}, 'google', ${u.id}, ${u.created_at}, ${u.updated_at})
        `;
      }
    }
    const meta = u.raw_user_meta_data || {};
    const currency = preferredCurrency(meta);
    const hidden = meta.is_balance_hidden === true;
    await sql`
      INSERT INTO public.user_profiles (user_id, preferred_currency, is_balance_hidden, raw_metadata)
      VALUES (${u.id}, ${currency}, ${hidden}, ${sql.json(meta)})
      ON CONFLICT (user_id) DO UPDATE SET
        preferred_currency = EXCLUDED.preferred_currency,
        is_balance_hidden = EXCLUDED.is_balance_hidden,
        raw_metadata = EXCLUDED.raw_metadata
    `;
  }
  imported = users.length;
  return imported;
}

async function bulkInsert(sql, table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows`);
    return;
  }
  const cols = Object.keys(rows[0]);
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await sql`INSERT INTO ${sql(table)} ${sql(chunk, cols)} ON CONFLICT DO NOTHING`;
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function resetSequences(sql) {
  await sql`
    SELECT setval('categories_category_id_seq', COALESCE((SELECT MAX(category_id) FROM public.categories), 1))
  `;
}

async function main() {
  const env = loadEnv();
  const dbUrl = env.VITE_DATABASE_URL || env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  if (!dbUrl) throw new Error('VITE_DATABASE_URL required in .env.local');
  const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

  console.log('Importing users...');
  const users = readExport('users');
  if (users.length) {
    const n = await importUsers(sql, users);
    console.log(`  neon_auth.user: ${n} processed`);
  }

  const tables = [
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

  // Merge batched transaction exports if present
  const txParts = [0, 1, 2, 3]
    .map((n) => readExport(`transactions-${n}`))
  if (txParts.some((p) => p.length)) {
    const merged = txParts.flat();
    const txPath = resolve(exportDir, 'transactions.json');
    const { writeFileSync } = await import('fs');
    writeFileSync(txPath, JSON.stringify(merged));
    console.log(`  merged transactions: ${merged.length} rows`);
  }

  console.log('Importing public tables...');
  for (const table of tables) {
    await bulkInsert(sql, table, readExport(table));
  }

  await resetSequences(sql);
  await sql.end();
  console.log('Import complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
