import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const publicDir = path.join(__dirname, 'public');
const pwaIconsDir = path.join(publicDir, 'pwa-icons');
const manifestPath = path.join(publicDir, 'manifest.json');
const indexHtmlPath = path.join(__dirname, 'index.html');

// Function to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Function to read JSON file
const readJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

// Function to check HTML file for PWA-related tags
const checkHtmlForPwaTags = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for various PWA-related tags
    const checks = {
      manifest: content.includes('<link rel="manifest"'),
      themeColor: content.includes('<meta name="theme-color"'),
      appleMobileWebAppCapable: content.includes('<meta name="apple-mobile-web-app-capable"'),
      appleStatusBarStyle: content.includes('<meta name="apple-mobile-web-app-status-bar-style"'),
      appleTouchIcon: content.includes('<link rel="apple-touch-icon"'),
    };
    
    return checks;
  } catch (error) {
    console.error('Error reading HTML file:', error);
    return {};
  }
};

// Start verification
console.log('📱 PWA Verification Report');
console.log('========================\n');

// Check manifest.json
console.log('📄 Checking manifest.json:');
if (fileExists(manifestPath)) {
  console.log('✅ manifest.json exists');
  
  const manifest = readJsonFile(manifestPath);
  if (manifest) {
    console.log(`✅ manifest.json is valid JSON`);
    console.log(`ℹ️ Name: ${manifest.name}`);
    console.log(`ℹ️ Short name: ${manifest.short_name}`);
    console.log(`ℹ️ Start URL: ${manifest.start_url}`);
    console.log(`ℹ️ Display mode: ${manifest.display}`);
    console.log(`ℹ️ Theme color: ${manifest.theme_color}`);
    console.log(`ℹ️ Background color: ${manifest.background_color}`);
    
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`✅ Icons defined (${manifest.icons.length} icons)`);
      
      // Check if all icon files exist
      let allIconsExist = true;
      for (const icon of manifest.icons) {
        const iconPath = path.join(__dirname, icon.src);
        if (!fileExists(iconPath)) {
          console.log(`❌ Icon file not found: ${icon.src}`);
          allIconsExist = false;
        }
      }
      
      if (allIconsExist) {
        console.log('✅ All icon files exist');
      }
    } else {
      console.log('❌ No icons defined in manifest');
    }
  } else {
    console.log('❌ manifest.json is not valid JSON');
  }
} else {
  console.log('❌ manifest.json not found');
}

console.log('\n');

// Check PWA icons
console.log('🖼️ Checking PWA icons:');
if (fileExists(pwaIconsDir)) {
  console.log('✅ PWA icons directory exists');
  
  const iconFiles = fs.readdirSync(pwaIconsDir);
  console.log(`ℹ️ Found ${iconFiles.length} icon files`);
  
  // Check for essential icon sizes
  const requiredSizes = ['192x192', '512x512'];
  for (const size of requiredSizes) {
    const hasSize = iconFiles.some(file => file.includes(size));
    if (hasSize) {
      console.log(`✅ Found icon with size ${size}`);
    } else {
      console.log(`❌ Missing icon with size ${size}`);
    }
  }
  
  // Check for maskable icon
  const hasMaskableIcon = iconFiles.some(file => file.includes('maskable'));
  if (hasMaskableIcon) {
    console.log('✅ Maskable icon found');
  } else {
    console.log('❌ Maskable icon not found');
  }
  
  // Check for Apple Touch icon
  const hasAppleTouchIcon = iconFiles.some(file => file.includes('apple-touch-icon'));
  if (hasAppleTouchIcon) {
    console.log('✅ Apple Touch icon found');
  } else {
    console.log('❌ Apple Touch icon not found');
  }
} else {
  console.log('❌ PWA icons directory not found');
}

console.log('\n');

// Check HTML file
console.log('🌐 Checking index.html for PWA tags:');
const htmlChecks = checkHtmlForPwaTags(indexHtmlPath);

if (htmlChecks.manifest) {
  console.log('✅ manifest.json is linked');
} else {
  console.log('❌ manifest.json link not found');
}

if (htmlChecks.themeColor) {
  console.log('✅ Theme color meta tag found');
} else {
  console.log('❌ Theme color meta tag not found');
}

if (htmlChecks.appleMobileWebAppCapable) {
  console.log('✅ Apple mobile web app capable meta tag found');
} else {
  console.log('❌ Apple mobile web app capable meta tag not found');
}

if (htmlChecks.appleStatusBarStyle) {
  console.log('✅ Apple status bar style meta tag found');
} else {
  console.log('❌ Apple status bar style meta tag not found');
}

if (htmlChecks.appleTouchIcon) {
  console.log('✅ Apple touch icon link found');
} else {
  console.log('❌ Apple touch icon link not found');
}

console.log('\n');

// Check vite.config.ts for PWA plugin
console.log('🔧 Checking build configuration:');
try {
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  if (viteConfig.includes('vite-plugin-pwa')) {
    console.log('✅ Vite PWA plugin is configured');
  } else {
    console.log('❌ Vite PWA plugin not found in configuration');
  }
} catch (error) {
  console.log('❌ Could not read vite.config.ts');
}

console.log('\n');
console.log('📱 PWA Verification Complete!');
console.log('Ensure that you build your app and test the PWA features on a production build.'); 