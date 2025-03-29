# Splash Screen Customization Guide

This document provides instructions on how to customize the app's splash screen that appears during loading.

## Overview

The splash screen consists of:
- A logo container with a background color
- A customizable logo (text or image)
- A loading spinner
- App name text

## How to Customize

All customization can be done by modifying the `public/splash-config.js` file.

### Basic Configuration

```javascript
window.splashConfig = {
  // Minimum time to display splash screen in milliseconds
  minDisplayTime: 1500,
  
  // Maximum time to display splash screen before hiding it anyway
  maxDisplayTime: 5000,
  
  // Path to the logo image (null uses the default text "D")
  logoPath: '/splash-logo.svg',
  
  // Background color for the splash screen
  backgroundColor: '#0D0D0D',
  
  // Logo container background color
  logoBackgroundColor: '#C6FE1E',
  
  // Text color for the app name
  textColor: '#FFFFFF',
  
  // App name to display (set to null to hide)
  appName: 'Duitr',
  
  // Custom CSS styles (optional)
  customStyles: null
};
```

### Changing the Logo

1. **Using an SVG logo:**
   - Create your SVG logo file and place it in the `public` folder
   - Update the `logoPath` in `splash-config.js` to point to your SVG file:
   ```javascript
   logoPath: '/your-logo.svg',
   ```

2. **Using a PNG or JPEG logo:**
   - Place your image file in the `public` folder
   - Update the `logoPath` in `splash-config.js`:
   ```javascript
   logoPath: '/your-logo.png',
   ```

### Changing Colors

Modify the respective color properties in `splash-config.js`:

```javascript
backgroundColor: '#0D0D0D',    // Background of the entire splash screen
logoBackgroundColor: '#C6FE1E', // Background of the logo container
textColor: '#FFFFFF',          // Color of the app name text
```

### Advanced Customization

For more advanced styling, you can use the `customStyles` property to apply custom CSS:

```javascript
customStyles: {
  '#splash-logo-container': {
    borderRadius: '50%',       // Make logo container circular
    width: '150px',            // Change logo container size
    height: '150px'
  },
  '#splash-spinner': {
    borderColor: 'rgba(255, 0, 0, 0.3)',  // Change spinner color
    borderTopColor: 'red'
  }
}
```

## Logo Guidelines

For best results:
- Use SVG format for crisp rendering at all screen sizes
- Keep the design simple and recognizable
- Use a transparent background
- Size your logo artwork to fit within an 80x80 pixel area
- Test your splash screen on multiple device sizes

## Example: Creating a Custom Logo

1. Create an SVG file using any vector graphics editor
2. Save it as `public/custom-logo.svg`
3. Update `splash-config.js`:
   ```javascript
   logoPath: '/custom-logo.svg',
   ```

## Troubleshooting

If your logo doesn't appear:
1. Check that the file path is correct and the file exists in the public folder
2. Ensure the SVG has the proper format and viewBox attribute
3. Try using a PNG or JPEG file instead to rule out SVG compatibility issues 