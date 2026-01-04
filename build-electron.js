const { build } = require('vite');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 确保dist-electron目录存在
const distElectronPath = path.join(__dirname, 'dist-electron');
if (!fs.existsSync(distElectronPath)) {
  fs.mkdirSync(distElectronPath, { recursive: true });
}

// 编译TypeScript文件
const { execSync } = require('child_process');

console.log('Building Electron main process...');
try {
  execSync('tsc --project tsconfig.electron.json', { stdio: 'inherit' });
  console.log('Electron main process built successfully');
} catch (error) {
  console.error('Failed to build Electron main process:', error);
  process.exit(1);
}




