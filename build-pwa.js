const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🔨 Building PWA...\n');

const pwaDir = path.join(__dirname, 'nisrine-student-pwa');

// Build the React app
try {
  // Install dependencies first
  console.log('📦 Installing dependencies in nisrine-student-pwa...');
  execSync('npm install', {
    cwd: pwaDir,
    stdio: 'inherit'
  });
  
  console.log('\n📦 Running npm run build in nisrine-student-pwa...');
  execSync('npm run build', {
    cwd: pwaDir,
    stdio: 'inherit'
  });
  
  console.log('\n✅ Build completed!');
  
  // Copy build folder to pwa folder
  const buildPath = path.join(pwaDir, 'build');
  const pwaPath = path.join(__dirname, 'pwa');
  
  console.log('\n📁 Copying build to /pwa folder...');
  
  // Remove old pwa folder if exists
  if (fs.existsSync(pwaPath)) {
    fs.removeSync(pwaPath);
    console.log('   Removed old /pwa folder');
  }
  
  // Copy build to pwa
  fs.copySync(buildPath, pwaPath);
  console.log('   Copied build to /pwa');
  
  console.log('\n🎉 PWA build complete! Ready to deploy.');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
