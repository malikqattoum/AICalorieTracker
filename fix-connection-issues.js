import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 设置 __dirname 和 __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Fixing Connection Issues ===');

// Install dependencies for client
console.log('\n1. Installing dependencies for client...');
exec('cd client && npm install', (error, stdout, stderr) => {
  if (error) {
    console.error('Error installing client dependencies:', error);
    return;
  }
  console.log('Client dependencies installed successfully');

  // Install dependencies for server
  console.log('\n2. Installing dependencies for server...');
  exec('cd server && npm install', (error, stdout, stderr) => {
    if (error) {
      console.error('Error installing server dependencies:', error);
      return;
    }
    console.log('Server dependencies installed successfully');

    // Install tsx for server
    console.log('\n3. Installing tsx for server...');
    exec('cd server && npm install tsx --save-dev --legacy-peer-deps', (error, stdout, stderr) => {
      if (error) {
        console.error('Error installing tsx:', error);
        return;
      }
      console.log('tsx installed successfully');

      console.log('\n=== Connection issues fix completed ===');
      console.log('\nPlease restart both the client and server:');
      console.log('1. In one terminal: cd client && npm run dev');
      console.log('2. In another terminal: cd server && npm run dev');
    });
  });
});
