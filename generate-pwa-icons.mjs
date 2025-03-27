#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to generate PWA icons for Duitr app
 */
async function generatePWAIcons() {
  const sourceIconPath = path.join(__dirname, 'public', 'favicon.ico');
  const outputDir = path.join(__dirname, 'public', 'pwa-icons');
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }
  
  // Define icon sizes
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  // Check if source icon exists
  if (!fs.existsSync(sourceIconPath)) {
    console.log(`⚠️ Source icon not found: ${sourceIconPath}`);
    console.log('ℹ️ Creating a default icon');
    
    // Create a simple icon with text using sharp
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      // Create a green circle with 'D' in the middle
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 198, g: 254, b: 30, alpha: 1 } // #C6FE1E background
        }
      })
        .composite([{
          input: {
            text: {
              text: 'D',
              font: 'Arial',
              fontSize: Math.round(size * 0.6),
              align: 'center',
              rgba: true
            }
          },
          gravity: 'center'
        }])
        .png()
        .toFile(outputPath);
        
      console.log(`✅ Generated ${size}x${size} icon: ${outputPath}`);
    }
    
    // Create Apple touch icon
    const appleTouchIconPath = path.join(outputDir, 'apple-touch-icon.png');
    await sharp({
      create: {
        width: 180,
        height: 180,
        channels: 4,
        background: { r: 198, g: 254, b: 30, alpha: 1 } // #C6FE1E background
      }
    })
      .composite([{
        input: {
          text: {
            text: 'D',
            font: 'Arial',
            fontSize: 108,
            align: 'center',
            rgba: true
          }
        },
        gravity: 'center'
      }])
      .png()
      .toFile(appleTouchIconPath);
    console.log(`✅ Generated Apple touch icon: ${appleTouchIconPath}`);
    
    // Create maskable icon
    const maskableIconPath = path.join(outputDir, 'maskable-icon.png');
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 198, g: 254, b: 30, alpha: 1 } // #C6FE1E background
      }
    })
      .composite([{
        input: {
          text: {
            text: 'D',
            font: 'Arial',
            fontSize: 250,
            align: 'center',
            rgba: true
          }
        },
        gravity: 'center'
      }])
      .png()
      .toFile(maskableIconPath);
    console.log(`✅ Generated maskable icon: ${maskableIconPath}`);
    
  } else {
    console.log(`🔄 Generating PWA icons from ${sourceIconPath}`);
    
    try {
      // Generate icons for each size
      for (const size of sizes) {
        const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
        
        await sharp(sourceIconPath)
          .resize(size, size)
          .png()
          .toFile(outputPath);
          
        console.log(`✅ Generated ${size}x${size} icon: ${outputPath}`);
      }
      
      // Generate maskable icon (with padding for safe area)
      const maskableSize = 512;
      const outputMaskablePath = path.join(outputDir, 'maskable-icon.png');
      
      // Create a maskable icon with 10% safe zone (as per PWA guidelines)
      const safePadding = Math.floor(maskableSize * 0.1);
      const innerSize = maskableSize - (safePadding * 2);
      
      await sharp({
        create: {
          width: maskableSize,
          height: maskableSize,
          channels: 4,
          background: { r: 13, g: 13, b: 13, alpha: 1 } // #0D0D0D background
        }
      })
        .composite([{
          input: await sharp(sourceIconPath)
            .resize(innerSize, innerSize)
            .toBuffer(),
          gravity: 'center'
        }])
        .png()
        .toFile(outputMaskablePath);
        
      console.log(`✅ Generated maskable icon: ${outputMaskablePath}`);
      
      // Generate Apple touch icon
      const appleTouchIconPath = path.join(outputDir, 'apple-touch-icon.png');
      
      await sharp(sourceIconPath)
        .resize(180, 180)
        .png()
        .toFile(appleTouchIconPath);
        
      console.log(`✅ Generated Apple touch icon: ${appleTouchIconPath}`);
    } catch (error) {
      console.error('❌ Error generating icons from source:', error);
      console.log('⚠️ Falling back to creating default icons');
      
      // Fallback to creating default icons
      for (const size of sizes) {
        const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
        
        // Create a green circle with 'D' in the middle
        await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 198, g: 254, b: 30, alpha: 1 } // #C6FE1E background
          }
        })
          .composite([{
            input: {
              text: {
                text: 'D',
                font: 'Arial',
                fontSize: Math.round(size * 0.6),
                align: 'center',
                rgba: true
              }
            },
            gravity: 'center'
          }])
          .png()
          .toFile(outputPath);
          
        console.log(`✅ Generated ${size}x${size} icon: ${outputPath}`);
      }
      
      // Create Apple touch icon
      const appleTouchIconPath = path.join(outputDir, 'apple-touch-icon.png');
      await sharp({
        create: {
          width: 180,
          height: 180,
          channels: 4,
          background: { r: 198, g: 254, b: 30, alpha: 1 } // #C6FE1E background
        }
      })
        .composite([{
          input: {
            text: {
              text: 'D',
              font: 'Arial',
              fontSize: 108,
              align: 'center',
              rgba: true
            }
          },
          gravity: 'center'
        }])
        .png()
        .toFile(appleTouchIconPath);
      console.log(`✅ Generated Apple touch icon: ${appleTouchIconPath}`);
      
      // Create maskable icon
      const maskableIconPath = path.join(outputDir, 'maskable-icon.png');
      await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { r: 198, g: 254, b: 30, alpha: 1 } // #C6FE1E background
        }
      })
        .composite([{
          input: {
            text: {
              text: 'D',
              font: 'Arial',
              fontSize: 250,
              align: 'center',
              rgba: true
            }
          },
          gravity: 'center'
        }])
        .png()
        .toFile(maskableIconPath);
      console.log(`✅ Generated maskable icon: ${maskableIconPath}`);
    }
  }
  
  console.log('🎉 All PWA icons generated successfully!');
}

generatePWAIcons().catch(error => {
  console.error('❌ PWA icon generation failed:', error);
  process.exit(1);
}); 