/**
 * Export small tables from Supabase REST (service-level via anon + RLS may block).
 * Fallback: pass JSON file path as second arg.
 */
import { readFileSync, writeFileSync } from 'fs'
import { $ } from 'bun'

const envPath = new URL('../.env.local', import.meta.url)
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq > 0 && !process.env[trimmed.slice(0, eq)]) {
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
}

const tables = ['pinjaman_items', 'want_to_buy_items'] as const

for (const table of tables) {
  const out = new URL(`./export/data-${table}.json`, import.meta.url).pathname.replace(/^\//, '')
  const mcpFile = process.argv.find((a) => a.includes(table))
  if (mcpFile) {
    const text = readFileSync(mcpFile, 'utf8')
    const start = text.indexOf('\n[')
    const end = text.lastIndexOf(']\n</untrusted-data')
    const inner = JSON.parse(text.slice(start + 1, end + 1)) as Array<{ data: unknown[] }>
    writeFileSync(out.replace(/\\/g, '/'), JSON.stringify(inner[0].data))
    console.log(`Wrote ${out}: ${inner[0].data.length} rows`)
    await $`bun scripts/migrate-to-neon.ts data ${out.replace(/\\/g, '/')}`
  }
}
