import { readFileSync, writeFileSync } from 'fs'

const [mcpFile, outFile] = process.argv.slice(2)
if (!mcpFile || !outFile) {
  console.error('Usage: bun scripts/save-sql-from-mcp.ts <mcp-output.txt> <out.sql>')
  process.exit(1)
}

function extractSql(text: string): string {
  const trimmed = text.trim()
  let body = trimmed
  if (trimmed.startsWith('{')) {
    const outer = JSON.parse(trimmed) as { result?: string }
    body = outer.result ?? trimmed
  }
  const startTag = body.indexOf('\n[')
  const endTag = body.lastIndexOf(']\n</untrusted-data')
  const inner = JSON.parse(body.slice(startTag + 1, endTag + 1)) as Array<{ sql: string }>
  return inner[0].sql.replace(/\\n/g, '\n')
}

writeFileSync(outFile, extractSql(readFileSync(mcpFile, 'utf8')))
console.log(`Wrote ${outFile}`)
