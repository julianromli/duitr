import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exportDir = resolve(__dirname, 'export');
mkdirSync(exportDir, { recursive: true });

export function parseMcpExport(filePath) {
  const raw = readFileSync(filePath, 'utf8').trim();
  let text = raw;
  if (raw.startsWith('{')) {
    const outer = JSON.parse(raw);
    text = typeof outer.result === 'string' ? outer.result : JSON.stringify(outer.result);
  }
  const start = text.indexOf('[{');
  const end = text.lastIndexOf('}]');
  if (start === -1 || end === -1) {
    throw new Error(`Could not find JSON array in ${filePath}`);
  }
  const parsed = JSON.parse(text.slice(start, end + 2));
  if (parsed.length === 1 && parsed[0]?.data && Array.isArray(parsed[0].data)) {
    return parsed[0].data;
  }
  return parsed;
}

if (process.argv[1]?.endsWith('parse-export.mjs')) {
  const [, , input, output] = process.argv;
  const data = parseMcpExport(input);
  writeFileSync(resolve(exportDir, output), JSON.stringify(data));
  console.log(`Wrote ${output}: ${data.length} rows`);
}
