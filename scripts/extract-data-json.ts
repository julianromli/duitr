import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const exportDir = join(import.meta.dir, 'export')
mkdirSync(exportDir, { recursive: true })

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: bun scripts/extract-data-json.ts <mcp-file> <output.json>')
  process.exit(1)
}

const [inFile, outFile] = args

function extractMcpJson(text: string): unknown {
  const outer = JSON.parse(text) as { result?: string }
  const body = outer.result ?? text
  const startTag = body.indexOf('\n[')
  const endTag = body.lastIndexOf(']\n</untrusted-data')
  if (startTag < 0 || endTag < 0) throw new Error('Boundary markers not found')
  const inner = JSON.parse(body.slice(startTag + 1, endTag + 1)) as Array<Record<string, unknown>>
  const row = inner[0]
  return row?.data ?? row?.json_agg ?? inner
}

const text = readFileSync(inFile, 'utf8')
const data = extractMcpJson(text)
writeFileSync(join(exportDir, outFile), JSON.stringify(data, null, 2))
console.log(`Wrote ${outFile}: ${Array.isArray(data) ? data.length : 0} records`)
