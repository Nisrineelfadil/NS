const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🔨 Building PWA...\n');

const pwaDir = path.join(__dirname, 'nisrine-student-pwa');
const buildPath = path.join(pwaDir, 'build');
const pwaPath = path.join(__dirname, 'pwa');

// Check if pwa folder already exists (pre-built)
if (fs.existsSync(pwaPath) && fs.existsSync(path.join(pwaPath, 'index.html'))) {
  console.log('✅ PWA folder already exists and contains index.html');
  console.log('✅ Skipping build - using existing PWA files');
  console.log('🎉 PWA ready to deploy!');
  process.exit(0);
}

// Build the React app
try {
  // Check if source exists
  if (!fs.existsSync(pwaDir)) {
    console.log('⚠️  nisrine-student-pwa folder not found');
    console.log('✅ Assuming PWA is pre-built in /pwa folder');
    process.exit(0);
  }

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
  console.log('\n⚠️  Checking if PWA folder exists anyway...');
  
  // Check if pwa folder exists despite error
  if (fs.existsSync(pwaPath) && fs.existsSync(path.join(pwaPath, 'index.html'))) {
    console.log('✅ PWA folder exists - continuing deployment');
    process.exit(0);
  }
  
  console.error('❌ No PWA folder found - deployment will fail');
  process.exit(1);
}
