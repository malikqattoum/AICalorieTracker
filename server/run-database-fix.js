
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running database fix script...');

// Run the fix script directly with node
const scriptPath = resolve(__dirname, 'fix-database-issues.js');
const child = spawn('node', [scriptPath], { stdio: 'inherit' });

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Database fix completed successfully!');
    console.log('\nPlease restart your server to apply the changes.');
  } else {
    console.error(`\n❌ Database fix failed with exit code ${code}`);
    console.error('\nPlease check the error messages above and try to resolve any issues.');
  }
});
