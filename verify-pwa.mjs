console.log('🔍 Verifying PWA configuration...');

// Import required modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check manifest.json
const manifestPath = path.join(__dirname, 'public', 'manifest.json');
let manifest;

try {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(manifestContent);
  console.log('✅ manifest.json found and valid JSON');
} catch (error) {
  console.error('❌ Error reading manifest.json:', error.message);
  process.exit(1);
}

// Check service worker
const swPath = path.join(__dirname, 'public', 'sw.js');
if (!fs.existsSync(swPath)) {
  console.error('❌ Service worker (sw.js) not found');
  process.exit(1);
} else {
  console.log('✅ Service worker (sw.js) found');
}

// Check PWA registration
const registerPath = path.join(__dirname, 'public', 'pwa-register.js');
if (!fs.existsSync(registerPath)) {
  console.error('❌ PWA registration script (pwa-register.js) not found');
  process.exit(1);
} else {
  console.log('✅ PWA registration script (pwa-register.js) found');
}

// Display success message
console.log('✅ PWA verification complete - basic configuration looks good!');
console.log('🚀 Deploy your app and test on a real device.'); 