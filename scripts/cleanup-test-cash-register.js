/**
 * Cleanup Test Cash Register Data
 * Removes all test transactions and overlapping services created by generate-test-cash-register.js
 * 
 * Identifies test data by the [TEST-DATA] marker in remarks/description
 * 
 * Run: node scripts/cleanup-test-cash-register.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CashTransaction = require('../models/CashTransaction');
const UnpaidService = require('../models/UnpaidService');

// Test data marker - matches what was used in generation (escaped for regex)
const TEST_MARKER = '\\[TEST-DATA\\]';

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 CASH REGISTER TEST DATA CLEANUP');
    console.log('='.repeat(60) + '\n');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        process.exit(1);
    }
    
    try {
        await mongoose.connect(mongoUri);
        console.log('📦 Connected to MongoDB\n');
        
        // Count test data before deletion
        const transactionCount = await CashTransaction.countDocuments({
            remarks: { $regex: TEST_MARKER, $options: 'i' }
        });
        
        const overlappingCount = await UnpaidService.countDocuments({
            description: { $regex: TEST_MARKER, $options: 'i' }
        });
        
        console.log('📊 Found test data:');
        console.log(`   - Transactions: ${transactionCount}`);
        console.log(`   - Overlapping services: ${overlappingCount}`);
        console.log(`   - Total: ${transactionCount + overlappingCount}\n`);
        
        if (transactionCount === 0 && overlappingCount === 0) {
            console.log('ℹ️  No test data found to delete.\n');
            return;
        }
        
        // Confirm deletion
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('⚠️  Are you sure you want to delete all test data? (yes/no): ', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
            console.log('\n❌ Cleanup cancelled.\n');
            return;
        }
        
        console.log('\n🗑️  Deleting test data...\n');
        
        // Delete transactions
        const transactionResult = await CashTransaction.deleteMany({
            remarks: { $regex: TEST_MARKER, $options: 'i' }
        });
        console.log(`   ✅ Deleted ${transactionResult.deletedCount} transactions`);
        
        // Delete overlapping services
        const overlappingResult = await UnpaidService.deleteMany({
            description: { $regex: TEST_MARKER, $options: 'i' }
        });
        console.log(`   ✅ Deleted ${overlappingResult.deletedCount} overlapping services`);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`   Transactions deleted:    ${transactionResult.deletedCount}`);
        console.log(`   Overlapping deleted:     ${overlappingResult.deletedCount}`);
        console.log(`   TOTAL DELETED:           ${transactionResult.deletedCount + overlappingResult.deletedCount}`);
        console.log('='.repeat(60));
        console.log('\n✅ Test data cleanup complete!\n');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
}

main();
