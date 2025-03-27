import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.resolve('public', 'pwa-icons');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icons for each size
async function generateIcons() {
  try {
    for (const size of sizes) {
      // Create a green square with the text "D" for Duitr
      const svgBuffer = Buffer.from(`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="#C6FE1E" />
          <text 
            x="50%" 
            y="50%" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.5}" 
            font-weight="bold" 
            fill="#0D0D0D" 
            text-anchor="middle" 
            dominant-baseline="middle">D</text>
        </svg>
      `);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      
      console.log(`✅ Generated icon-${size}x${size}.png`);
    }
    
    // Generate Apple touch icon
    const appleTouchSvgBuffer = Buffer.from(`
      <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" fill="#C6FE1E" />
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="90" 
          font-weight="bold" 
          fill="#0D0D0D" 
          text-anchor="middle" 
          dominant-baseline="middle">D</text>
      </svg>
    `);
    
    await sharp(appleTouchSvgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    
    console.log('✅ Generated apple-touch-icon.png');
    
    // Generate maskable icon (with padding for safe area)
    const maskableSvgBuffer = Buffer.from(`
      <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#C6FE1E" />
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="230" 
          font-weight="bold" 
          fill="#0D0D0D" 
          text-anchor="middle" 
          dominant-baseline="middle">D</text>
      </svg>
    `);
    
    await sharp(maskableSvgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'maskable-icon.png'));
    
    console.log('✅ Generated maskable-icon.png');
    
    console.log('🎉 All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 