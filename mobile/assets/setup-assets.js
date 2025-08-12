#!/usr/bin/env node
/**
 * Asset Setup Script for AI Calorie Tracker Mobile App
 * This script generates placeholder images and downloads required fonts
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Create a simple SVG-based placeholder image
function createPlaceholderSVG(width, height, text, backgroundColor = '#4F46E5', textColor = '#FFFFFF') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <circle cx="${width/2}" cy="${height/2 - 40}" r="60" fill="${textColor}" opacity="0.2"/>
  <text x="${width/2}" y="${height/2 - 40}" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="40" font-weight="bold">🍎</text>
  <text x="${width/2}" y="${height/2 + 20}" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="24" font-weight="600">${text}</text>
  <text x="${width/2}" y="${height/2 + 50}" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="16">AI Calorie Tracker</text>
</svg>`;
}

// Convert SVG to basic format (for development use)
function createPlaceholderImage(width, height, filename, text) {
  const svg = createPlaceholderSVG(width, height, text);
  const outputPath = path.join(__dirname, filename);
  
  // For now, create SVG files as placeholders
  // In production, you'd want to convert these to PNG
  const svgPath = outputPath.replace(/\.png$/, '.svg');
  fs.writeFileSync(svgPath, svg);
  
  console.log(`Created placeholder: ${svgPath}`);
  
  // Create a simple instruction file for PNG conversion
  const instructions = `
# Convert ${filename}
# Use an online SVG to PNG converter or install imagemagick:
# convert "${svgPath}" -background transparent "${outputPath}"
`;
  
  fs.writeFileSync(outputPath.replace('.png', '.convert.txt'), instructions);
}

// Download Inter fonts
function downloadFont(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'fonts', filename);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function setupAssets() {
  console.log('Setting up AI Calorie Tracker assets...\n');
  
  // Create assets directory if it doesn't exist
  const assetsDir = __dirname;
  const fontsDir = path.join(assetsDir, 'fonts');
  
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }
  
  // Create placeholder images
  console.log('Creating placeholder images...');
  createPlaceholderImage(1024, 1024, 'icon.png', 'ICON');
  createPlaceholderImage(1024, 1024, 'adaptive-icon.png', 'ADAPTIVE');
  createPlaceholderImage(1242, 2436, 'splash.png', 'AI CALORIE\nTRACKER');
  createPlaceholderImage(48, 48, 'favicon.png', '🍎');
  createPlaceholderImage(96, 96, 'notification-icon.png', '🔔');
  createPlaceholderImage(500, 300, 'logo.png', 'LOGO');
  
  // Onboarding images
  createPlaceholderImage(400, 300, 'onboarding-1.png', 'TRACK\nMEALS');
  createPlaceholderImage(400, 300, 'onboarding-2.png', 'AI\nANALYSIS');
  createPlaceholderImage(400, 300, 'onboarding-3.png', 'REACH\nGOALS');
  
  console.log('\nPlaceholder images created!');
  console.log('Note: SVG files were created. Convert them to PNG using an image converter.');
  
  // Try to download Inter fonts
  console.log('\nAttempting to download Inter fonts...');
  
  const fontUrls = {
    'Inter-Regular.ttf': 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf',
    'Inter-Medium.ttf': 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.ttf',
    'Inter-SemiBold.ttf': 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.ttf',
    'Inter-Bold.ttf': 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.ttf',
  };
  
  try {
    for (const [filename, url] of Object.entries(fontUrls)) {
      await downloadFont(url, filename);
    }
    console.log('\nFonts downloaded successfully!');
  } catch (error) {
    console.log('\nFont download failed. Creating font installation instructions...');
    
    const fontInstructions = `
# Inter Font Installation Instructions

The Inter font family is required for the AI Calorie Tracker mobile app.

## Option 1: Download manually
Visit: https://github.com/rsms/inter/releases
Download the font files and place them in this fonts/ directory:
- Inter-Regular.ttf
- Inter-Medium.ttf  
- Inter-SemiBold.ttf
- Inter-Bold.ttf

## Option 2: Use Google Fonts
Download from: https://fonts.google.com/specimen/Inter
Extract the TTF files to this directory.

## Option 3: Install via npm (alternative)
npm install --save react-native-vector-icons
# Then use system fonts as fallback

## Files needed:
${Object.keys(fontUrls).map(f => `- ${f}`).join('\n')}
`;
    
    fs.writeFileSync(path.join(fontsDir, 'FONT_SETUP_INSTRUCTIONS.md'), fontInstructions);
    console.log('Created font installation instructions in fonts/FONT_SETUP_INSTRUCTIONS.md');
  }
  
  console.log('\n✅ Asset setup complete!');
  console.log('\nNext steps:');
  console.log('1. Convert SVG placeholders to PNG images');
  console.log('2. Replace placeholders with your actual app assets');
  console.log('3. Ensure fonts are properly installed');
  console.log('4. Test the app with `expo start`');
}

// Run the setup
setupAssets().catch(console.error);