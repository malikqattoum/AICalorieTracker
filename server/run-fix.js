
const { spawn } = require('child_process');
const { resolve, dirname } = require('path');
const { fileURLToPath } = require('url');

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running database fix script...');

// Try to run the fix script using different methods
const scriptPath = resolve(__dirname, 'fix-database-issues.ts');

// Method 1: Try using tsx directly
console.log('Attempting to run with tsx...');
const child = spawn('tsx', [scriptPath], { stdio: 'inherit' });

child.on('error', (error) => {
  console.error('Failed to run with tsx:', error.message);

  // Method 2: Try using ts-node
  console.log('Attempting to run with ts-node...');
  const child2 = spawn('ts-node', [scriptPath], { stdio: 'inherit' });

  child2.on('error', (error2) => {
    console.error('Failed to run with ts-node:', error2.message);

    // Method 3: Try using node with esm
    console.log('Attempting to run with node + esm...');
    const child3 = spawn('node', ['--loader', 'ts-node/esm', scriptPath], { stdio: 'inherit' });

    child3.on('error', (error3) => {
      console.error('Failed to run with node + esm:', error3.message);
      console.error('\n❌ All methods failed. Please install tsx or ts-node:');
      console.error('npm install -g tsx');
      console.error('or');
      console.error('npm install -g ts-node');
    });

    child3.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Database fix completed successfully!');
        console.log('\nPlease restart your server to apply the changes.');
      } else {
        console.error(`\n❌ Database fix failed with exit code ${code}`);
      }
    });
  });

  child2.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Database fix completed successfully!');
      console.log('\nPlease restart your server to apply the changes.');
    }
  });
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Database fix completed successfully!');
    console.log('\nPlease restart your server to apply the changes.');
  }
});
