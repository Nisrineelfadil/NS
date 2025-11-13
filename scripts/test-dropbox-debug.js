require('dotenv').config();
const dropboxService = require('./services/dropboxService');

async function debugDropbox() {
    console.log('=== Dropbox Debug Test ===\n');
    
    // 1. Check environment variable
    console.log('1. Environment Variable Check:');
    const hasToken = !!process.env.DROPBOX_ACCESS_TOKEN;
    console.log(`   DROPBOX_ACCESS_TOKEN exists: ${hasToken}`);
    if (hasToken) {
        const tokenPreview = process.env.DROPBOX_ACCESS_TOKEN.substring(0, 10) + '...';
        console.log(`   Token preview: ${tokenPreview}`);
        console.log(`   Token length: ${process.env.DROPBOX_ACCESS_TOKEN.length} characters`);
    } else {
        console.log('   ❌ ERROR: DROPBOX_ACCESS_TOKEN is not set in .env file!');
        console.log('\n   Please add to your .env file:');
        console.log('   DROPBOX_ACCESS_TOKEN=your_token_here\n');
        return;
    }
    
    // 2. Check service configuration
    console.log('\n2. Service Configuration:');
    console.log(`   Service configured: ${dropboxService.isConfigured()}`);
    console.log(`   Dropbox client exists: ${!!dropboxService.dbx}`);
    
    // 3. Test connection
    console.log('\n3. Testing Dropbox Connection:');
    try {
        const result = await dropboxService.testConnection();
        if (result.success) {
            console.log('   ✅ Connection successful!');
            console.log(`   Account: ${result.accountName}`);
            console.log(`   Email: ${result.accountEmail}`);
        } else {
            console.log('   ❌ Connection failed!');
            console.log(`   Message: ${result.message}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }
    } catch (error) {
        console.log('   ❌ Connection test threw error!');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }
    
    // 4. Test folder listing
    console.log('\n4. Testing Folder Access:');
    try {
        const listResult = await dropboxService.listFiles('/');
        if (listResult.success) {
            console.log('   ✅ Can list root folder');
            console.log(`   Found ${listResult.files.length} items`);
        } else {
            console.log('   ❌ Cannot list folder');
            console.log(`   Message: ${listResult.message}`);
            if (listResult.error) {
                console.log(`   Error: ${listResult.error}`);
            }
        }
    } catch (error) {
        console.log('   ❌ Folder listing threw error!');
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n=== Test Complete ===');
}

debugDropbox().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
