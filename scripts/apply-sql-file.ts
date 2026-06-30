import postgres from 'postgres'
import { readFileSync } from 'fs'

const envPath = new URL('../.env.local', import.meta.url)
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq > 0 && !process.env[trimmed.slice(0, eq)]) {
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
}

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: bun scripts/apply-sql-file.ts <file.sql>')
  process.exit(1)
}

const sqlText = readFileSync(filePath, 'utf8')
const statements = sqlText
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)

const sql = postgres(process.env.VITE_DATABASE_URL!, { max: 1 })

await sql.begin(async (tx) => {
  for (const stmt of statements) {
    await tx.unsafe(stmt)
  }
})

console.log(`Applied ${statements.length} statements from ${filePath}`)
await sql.end()
