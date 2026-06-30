import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { $ } from 'bun'

const exportDir = join(import.meta.dir, 'export')
const files = readdirSync(exportDir)
  .filter((f) => f.startsWith('data-transactions-batch-') && f.endsWith('.json'))
  .sort()

for (const file of files) {
  await $`bun scripts/migrate-to-neon.ts data ${join(exportDir, file)}`
  console.log(`Done ${file}`)
}
