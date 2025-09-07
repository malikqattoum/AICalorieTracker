const fs = require('fs');
const path = require('path');

// Test script to check image serving functionality
console.log('=== Image Serving Test ===');

const uploadsDir = path.join(__dirname, 'uploads');
const subdirs = ['originals', 'optimized', 'thumbnails'];

console.log('Checking uploads directory structure...');

// Check if uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  console.log('❌ Uploads directory does not exist:', uploadsDir);
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check subdirectories
subdirs.forEach(subdir => {
  const subdirPath = path.join(uploadsDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    console.log(`❌ ${subdir} directory does not exist:`, subdirPath);
    console.log(`Creating ${subdir} directory...`);
    fs.mkdirSync(subdirPath, { recursive: true });
  } else {
    console.log(`✅ ${subdir} directory exists:`, subdirPath);
    
    // List files in directory
    const files = fs.readdirSync(subdirPath);
    console.log(`   Files in ${subdir}:`, files.length > 0 ? files.slice(0, 5) : 'No files');
    
    if (files.length > 0) {
      // Check file extensions
      const extensions = files.map(f => path.extname(f).toLowerCase()).filter(Boolean);
      const uniqueExtensions = [...new Set(extensions)];
      console.log(`   File extensions found:`, uniqueExtensions);
    }
  }
});

console.log('\n=== Test Complete ===');