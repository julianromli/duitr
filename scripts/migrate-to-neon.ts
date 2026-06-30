/**
 * One-time Supabase → Neon migration helper.
 * Usage:
 *   bun scripts/migrate-to-neon.ts auth <json-file>
 *   bun scripts/migrate-to-neon.ts data <table>
 */
import postgres from 'postgres'
import { readFileSync } from 'fs'

// Load .env.local
const envPath = new URL('../.env.local', import.meta.url)
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq > 0) {
    const key = trimmed.slice(0, eq)
    const val = trimmed.slice(eq + 1)
    if (!process.env[key]) process.env[key] = val
  }
}

const DATABASE_URL = process.env.VITE_DATABASE_URL
if (!DATABASE_URL) {
  console.error('VITE_DATABASE_URL not set')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1 })

type SupabaseUser = {
  id: string
  email: string
  email_verified: boolean
  created_at: string
  updated_at: string
  name: string
  image: string | null
  preferred_currency: string
  metadata: Record<string, unknown>
  provider: string | null
  provider_id: string | null
}

function escapeStr(v: string | null | undefined): string {
  if (v == null) return 'NULL'
  return `'${v.replace(/'/g, "''")}'`
}

async function importAuthUsers(filePath: string) {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'))
  const users: SupabaseUser[] = Array.isArray(raw) ? raw : raw.json_agg ?? raw

  await sql.begin(async (tx) => {
    for (const u of users) {
      await tx`
        INSERT INTO neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
        VALUES (
          ${u.id}::uuid,
          ${u.name || u.email.split('@')[0]},
          ${u.email},
          ${u.email_verified},
          ${u.image},
          ${u.created_at}::timestamptz,
          ${u.updated_at}::timestamptz
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          "emailVerified" = EXCLUDED."emailVerified",
          image = EXCLUDED.image,
          "updatedAt" = EXCLUDED."updatedAt"
      `

      await tx`
        INSERT INTO public.user_metadata (user_id, preferred_currency, metadata)
        VALUES (${u.id}::uuid, ${u.preferred_currency || 'IDR'}, ${JSON.stringify(u.metadata || {})}::jsonb)
        ON CONFLICT (user_id) DO UPDATE SET
          preferred_currency = EXCLUDED.preferred_currency,
          metadata = EXCLUDED.metadata
      `

      if (u.provider === 'google' && u.provider_id) {
        await tx`
          INSERT INTO neon_auth.account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
          SELECT gen_random_uuid(), ${u.provider_id}, 'google', ${u.id}::uuid, ${u.created_at}::timestamptz, ${u.updated_at}::timestamptz
          WHERE NOT EXISTS (
            SELECT 1 FROM neon_auth.account
            WHERE "providerId" = 'google' AND "accountId" = ${u.provider_id}
          )
        `
      } else if (u.provider === 'email') {
        await tx`
          INSERT INTO neon_auth.account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
          SELECT gen_random_uuid(), ${u.id}, 'credential', ${u.id}::uuid, ${u.created_at}::timestamptz, ${u.updated_at}::timestamptz
          WHERE NOT EXISTS (
            SELECT 1 FROM neon_auth.account
            WHERE "providerId" = 'credential' AND "userId" = ${u.id}::uuid
          )
        `
      }
    }
  })

  console.log(`Imported ${users.length} users from ${filePath}`)
}

const TABLES = [
  'categories',
  'wallets',
  'budgets',
  'transactions',
  'exchange_rates',
  'pinjaman_items',
  'want_to_buy_items',
  'notification_subscriptions',
  'budget_predictions',
] as const

async function importTableData(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    console.log(`No rows for ${table}`)
    return
  }

  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50)
    await sql.begin(async (tx) => {
      for (const row of chunk) {
        await tx`INSERT INTO ${sql(`public.${table}`)} ${sql(row as never)} ON CONFLICT DO NOTHING`
      }
    })
  }

  if (table === 'categories') {
    await sql`SELECT setval('categories_category_id_seq', COALESCE((SELECT MAX(category_id) FROM public.categories), 1))`
  }

  console.log(`Imported ${rows.length} rows into ${table}`)
}

async function main() {
  const [, , mode, arg] = process.argv

  if (mode === 'auth' && arg) {
    await importAuthUsers(arg)
  } else if (mode === 'data' && arg) {
    const rows = JSON.parse(readFileSync(arg, 'utf8'))
    const match = arg.replace(/\\/g, '/').match(/data-([a-z_]+)(?:-batch-\d+)?\.json$/)
    const table = match?.[1]
    if (!table || !TABLES.includes(table as (typeof TABLES)[number])) {
      throw new Error(`Could not determine table from filename: ${arg}`)
    }
    await importTableData(table, rows)
  } else {
    console.error('Usage: bun scripts/migrate-to-neon.ts auth|data <file>')
    process.exit(1)
  }

  await sql.end()
}

main().catch(async (err) => {
  console.error(err)
  await sql.end()
  process.exit(1)
})
