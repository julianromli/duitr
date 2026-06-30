import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseMcpExport } from './parse-export.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exportDir = resolve(__dirname, 'export');

const pinjaman = parseMcpExport(
  'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools/pinjaman-export.txt',
);
const wantToBuy = parseMcpExport(
  'C:/Users/faiz/.cursor/projects/d-Projects-Vibe-Code-duitr-new/agent-tools/wanttobuy-export.txt',
);

writeFileSync(resolve(exportDir, 'pinjaman_items.json'), JSON.stringify(pinjaman));
writeFileSync(resolve(exportDir, 'want_to_buy_items.json'), JSON.stringify(wantToBuy));
console.log('pinjaman', pinjaman.length, 'want_to_buy', wantToBuy.length);
