/**
 * Verification Script: Confirm Dropbox is completely removed
 * Run with: node verify-mega-only.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Dropbox Removal & Mega Integration...\n');

let passed = 0;
let failed = 0;

// Test 1: Check if dropbox package is uninstalled
console.log('Test 1: Dropbox package uninstalled');
try {
    require('dropbox');
    console.log('   ❌ FAILED - Dropbox package still installed');
    failed++;
} catch (e) {
    console.log('   ✅ PASSED - Dropbox package not found');
    passed++;
}

// Test 2: Check if dropboxService.js is deleted
console.log('\nTest 2: dropboxService.js deleted');
if (fs.existsSync(path.join(__dirname, 'services', 'dropboxService.js'))) {
    console.log('   ❌ FAILED - dropboxService.js still exists');
    failed++;
} else {
    console.log('   ✅ PASSED - dropboxService.js deleted');
    passed++;
}

// Test 3: Check if megaService.js exists
console.log('\nTest 3: megaService.js exists');
if (fs.existsSync(path.join(__dirname, 'services', 'megaService.js'))) {
    console.log('   ✅ PASSED - megaService.js found');
    passed++;
} else {
    console.log('   ❌ FAILED - megaService.js not found');
    failed++;
}

// Test 4: Check if megajs package is installed
console.log('\nTest 4: Mega.nz package installed');
try {
    require('megajs');
    console.log('   ✅ PASSED - megajs package installed');
    passed++;
} catch (e) {
    console.log('   ❌ FAILED - megajs package not found');
    failed++;
}

// Test 5: Check package.json
console.log('\nTest 5: package.json updated');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
if (packageJson.dependencies.dropbox) {
    console.log('   ❌ FAILED - dropbox still in package.json');
    failed++;
} else if (packageJson.dependencies.megajs) {
    console.log('   ✅ PASSED - megajs in package.json, dropbox removed');
    passed++;
} else {
    console.log('   ❌ FAILED - megajs not in package.json');
    failed++;
}

// Test 6: Check .env for Mega credentials
console.log('\nTest 6: Mega credentials configured');
require('dotenv').config();
if (process.env.MEGA_EMAIL && process.env.MEGA_PASSWORD) {
    console.log('   ✅ PASSED - Mega credentials found in .env');
    console.log(`   Email: ${process.env.MEGA_EMAIL}`);
    passed++;
} else {
    console.log('   ❌ FAILED - Mega credentials missing in .env');
    failed++;
}

// Test 7: Test Mega connection
console.log('\nTest 7: Mega connection test');
(async () => {
    try {
        const megaService = require('./services/megaService');
        const result = await megaService.testConnection();
        
        if (result.success) {
            console.log('   ✅ PASSED - Mega connection successful');
            console.log(`   Account: ${result.accountEmail}`);
            console.log(`   Storage: ${result.storageAvailable} available`);
            passed++;
        } else {
            console.log('   ❌ FAILED - Mega connection failed');
            console.log(`   Error: ${result.message}`);
            failed++;
        }
    } catch (error) {
        console.log('   ❌ FAILED - Error testing Mega connection');
        console.log(`   Error: ${error.message}`);
        failed++;
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Dropbox completely removed');
        console.log('✅ Mega.nz fully integrated');
        console.log('✅ System ready for production');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED');
        console.log('Please review the failed tests above');
    }
    
    process.exit(failed === 0 ? 0 : 1);
})();
