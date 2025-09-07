const fs = require('fs');
const path = require('path');

// Debug script to check image files and their formats
console.log('=== Image Debug Script ===');

const uploadsDir = path.join(__dirname, 'uploads');
const subdirs = ['originals', 'optimized', 'thumbnails'];

function analyzeImageFiles() {
  subdirs.forEach(subdir => {
    const subdirPath = path.join(uploadsDir, subdir);
    
    if (fs.existsSync(subdirPath)) {
      console.log(`\n📁 Analyzing ${subdir} directory:`);
      
      const files = fs.readdirSync(subdirPath);
      
      if (files.length === 0) {
        console.log('   No files found');
        return;
      }
      
      files.forEach(file => {
        const filePath = path.join(subdirPath, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        
        // Read first few bytes to detect file signature
        const buffer = fs.readFileSync(filePath, { start: 0, end: 10 });
        let detectedType = 'unknown';
        
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          detectedType = 'JPEG';
        } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          detectedType = 'PNG';
        } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
          detectedType = 'WebP';
        }
        
        console.log(`   📄 ${file}`);
        console.log(`      Extension: ${ext}`);
        console.log(`      Detected: ${detectedType}`);
        console.log(`      Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`      Modified: ${stats.mtime.toISOString()}`);
      });
    } else {
      console.log(`\n❌ Directory not found: ${subdirPath}`);
    }
  });
}

analyzeImageFiles();

console.log('\n=== Debug Complete ===');