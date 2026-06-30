import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const exportDir = join(import.meta.dir, 'export')
mkdirSync(exportDir, { recursive: true })

const sources: Array<{ inFile: string; outFile: string; key?: 'json_agg' | 'data' }> = [
  {
    inFile: 'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools/5e0e1bd6-1e97-42cc-8eef-b53303919ca1.txt',
    outFile: 'users-batch-0.json',
    key: 'json_agg',
  },
  {
    inFile: 'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools/f118a552-d7ed-44da-8dc1-c9574f1ad167.txt',
    outFile: 'users-batch-1.json',
    key: 'data',
  },
  {
    inFile: 'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools/27e9dbf9-262b-4291-9e0f-52d0af56a90e.txt',
    outFile: 'users-batch-2.json',
    key: 'data',
  },
  {
    inFile: 'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools/e5135673-5264-4107-a29a-ab6c964ac215.txt',
    outFile: 'users-batch-3.json',
    key: 'data',
  },
  {
    inFile: 'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools/83098876-5655-4970-8581-39f6b863ce3d.txt',
    outFile: 'users-batch-4.json',
    key: 'data',
  },
]

function extractMcpJson(text: string, key: 'json_agg' | 'data'): unknown {
  const outer = JSON.parse(text) as { result?: string }
  const body = outer.result ?? text
  const startTag = body.indexOf('\n[')
  const endTag = body.lastIndexOf(']\n</untrusted-data')
  if (startTag < 0 || endTag < 0) throw new Error('Boundary markers not found')
  const inner = JSON.parse(body.slice(startTag + 1, endTag + 1)) as Array<Record<string, unknown>>
  const row = inner[0]
  const data = row?.[key]
  if (!data) throw new Error(`Missing key ${key}`)
  return data
}

for (const { inFile, outFile, key = 'data' } of sources) {
  const text = readFileSync(inFile, 'utf8')
  const data = extractMcpJson(text, key)
  writeFileSync(join(exportDir, outFile), JSON.stringify(data, null, 2))
  console.log(`Wrote ${outFile}: ${Array.isArray(data) ? data.length : 0} records`)
}
