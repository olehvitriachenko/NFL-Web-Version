import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

dotenv.config();

// Вимкнути підпис повністю
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
process.env.SKIP_NOTARIZATION = 'true';
process.env.SKIP_CODE_SIGNING = 'true';

console.log('Building Electron app (signing disabled)...');

// Clean dist-electron folder before build to avoid file lock issues
const distElectronPath = join(process.cwd(), 'dist-electron');
if (existsSync(distElectronPath)) {
  try {
    console.log('Cleaning dist-electron folder...');
    rmSync(distElectronPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
    console.log('dist-electron folder cleaned successfully');
  } catch (error) {
    console.warn('Warning: Could not fully clean dist-electron folder:', error.message);
    console.warn('Please close all Electron apps and try again');
  }
}

// Run electron-builder
try {
  execSync('electron-builder', { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}

