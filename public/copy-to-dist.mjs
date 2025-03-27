// ES Module for Node.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source and destination directories
const sourceDir = path.join(__dirname);
const destDir = path.join(__dirname, '..', 'dist');

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Create pwa-icons directory in dist if it doesn't exist
const pwaIconsDestDir = path.join(destDir, 'pwa-icons');
if (!fs.existsSync(pwaIconsDestDir)) {
  fs.mkdirSync(pwaIconsDestDir, { recursive: true });
}

// Files to copy from public to dist
const filesToCopy = [
  { source: 'manifest.json', destination: 'manifest.json' },
  { source: 'sw.js', destination: 'sw.js' },
  { source: 'pwa-register.js', destination: 'pwa-register.js' },
  { source: 'duitr-offline.html', destination: 'duitr-offline.html' }
];

// Icon files to copy from public/pwa-icons to dist/pwa-icons
const iconsToCopy = [
  'icon-72x72.png',
  'icon-96x96.png',
  'icon-128x128.png',
  'icon-144x144.png',
  'icon-152x152.png',
  'icon-192x192.png',
  'icon-384x384.png',
  'icon-512x512.png',
  'maskable-icon.png',
  'apple-touch-icon.png'
];

// Copy regular files
console.log('Copying PWA files to dist directory...');
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file.source);
  const destPath = path.join(destDir, file.destination);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file.source} to ${file.destination}`);
    } else {
      console.error(`❌ Source file not found: ${sourcePath}`);
    }
  } catch (error) {
    console.error(`❌ Error copying ${file.source}:`, error.message);
  }
});

// Copy icon files
console.log('\nCopying PWA icons to dist/pwa-icons directory...');
iconsToCopy.forEach(icon => {
  const sourcePath = path.join(sourceDir, 'pwa-icons', icon);
  const destPath = path.join(pwaIconsDestDir, icon);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied pwa-icons/${icon}`);
    } else {
      console.error(`❌ Source icon not found: ${sourcePath}`);
    }
  } catch (error) {
    console.error(`❌ Error copying icon ${icon}:`, error.message);
  }
});

console.log('\n🎉 PWA files copy complete!'); 