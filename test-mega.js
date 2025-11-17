/**
 * Quick test script for Mega.nz connection
 * Run with: node test-mega.js
 */

require('dotenv').config();
const megaService = require('./services/megaService');

async function testMega() {
    console.log('🧪 Testing Mega.nz Connection...\n');
    
    try {
        const result = await megaService.testConnection();
        
        if (result.success) {
            console.log('✅ SUCCESS! Mega.nz connection works!\n');
            console.log('📊 Account Information:');
            console.log(`   Email: ${result.accountEmail}`);
            console.log(`   Storage Used: ${result.storageUsed}`);
            console.log(`   Storage Total: ${result.storageTotal}`);
            console.log(`   Storage Available: ${result.storageAvailable}`);
            console.log('\n🎉 Ready to migrate from Dropbox to Mega!');
        } else {
            console.log('❌ FAILED! Mega.nz connection failed\n');
            console.log(`   Error: ${result.message}`);
            console.log(`   Fix: ${result.fix}`);
            if (result.error) {
                console.log(`   Details: ${result.error}`);
            }
        }
    } catch (error) {
        console.log('❌ EXCEPTION! Unexpected error\n');
        console.error(error);
    }
    
    process.exit(0);
}

testMega();
