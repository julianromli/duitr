import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { $ } from 'bun'

const exportDir = join(import.meta.dir, 'export')
mkdirSync(exportDir, { recursive: true })

function extractMcpJson(text: string): unknown {
  const trimmed = text.trim()
  let body = trimmed
  if (trimmed.startsWith('{')) {
    const outer = JSON.parse(trimmed) as { result?: string }
    body = outer.result ?? trimmed
  }
  const startTag = body.indexOf('\n[')
  const endTag = body.lastIndexOf(']\n</untrusted-data')
  if (startTag < 0 || endTag < 0) throw new Error('Boundary markers not found')
  const inner = JSON.parse(body.slice(startTag + 1, endTag + 1)) as Array<Record<string, unknown>>
  const row = inner[0]
  return row?.data ?? row?.json_agg ?? inner
}

function saveFromMcp(inFile: string, outName: string) {
  const data = extractMcpJson(readFileSync(inFile, 'utf8'))
  writeFileSync(join(exportDir, outName), JSON.stringify(data))
  console.log(`Extracted ${outName}: ${Array.isArray(data) ? data.length : 0} rows`)
}

const agentTools = 'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools'

const txMap: Record<string, string> = {
  '5694bd38-1030-4241-a9e7-e78cbcb3284a.txt': 'data-transactions-batch-0.json',
  'fd7b8168-c2e9-4c3e-a008-b7a18a85b821.txt': 'data-transactions-batch-1.json',
  'd2e04d82-e113-4761-b6a8-5ce28f16f8d3.txt': 'data-transactions-batch-2.json',
  '16090c6a-8401-4edc-938b-aaaf472046af.txt': 'data-transactions-batch-3.json',
  'b982f07b-07c3-4b93-9ab2-8be63368ae50.txt': 'data-transactions-batch-4.json',
  '4db6e96f-5367-4063-b438-f1624368fcc6.txt': 'data-transactions-batch-5.json',
  'b2c9c882-2e6f-46e6-ab86-fbce8b00861f.txt': 'data-transactions-batch-6.json',
  '38e0239b-66c4-4a48-8e04-70951b9471ae.txt': 'data-transactions-batch-7.json',
}

for (const [src, dest] of Object.entries(txMap)) {
  try {
    saveFromMcp(join(agentTools, src), dest)
  } catch (e) {
    console.warn(`Skip ${src}: ${e}`)
  }
}

// Also try older agent-tools files for transactions
for (const file of readdirSync(agentTools)) {
  if (file.endsWith('.txt') && !Object.keys(txMap).includes(file)) {
    try {
      const data = extractMcpJson(readFileSync(join(agentTools, file), 'utf8'))
      if (Array.isArray(data) && data.length > 0 && 'amount' in data[0] && 'wallet_id' in data[0]) {
        console.log(`Found transaction file ${file} with ${data.length} rows (manual map if needed)`)
      }
    } catch {
      /* ignore */
    }
  }
}

const imports = [
  'data-budgets.json',
  'data-exchange_rates.json',
  ...Object.values(txMap),
  'data-pinjaman_items.json',
  'data-want_to_buy_items.json',
]

for (const file of imports) {
  const path = join(exportDir, file)
  try {
    readFileSync(path)
    console.log(`Importing ${file}...`)
    await $`bun scripts/migrate-to-neon.ts data ${path}`
  } catch {
    console.warn(`Missing ${file}, skipping`)
  }
}

console.log('Done')
