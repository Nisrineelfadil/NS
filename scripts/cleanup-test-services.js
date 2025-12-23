/**
 * Cleanup Test Service Requests
 * Deletes all test service data created by generate-test-services.js
 * 
 * Identifies test data by email domain: @testservice.nisrine.local
 * 
 * Run: node scripts/cleanup-test-services.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const ServiceRequest = require('../models/ServiceRequest');

// Test data marker - matches the domain used in generation
const TEST_EMAIL_DOMAIN = '@testservice.nisrine.local';

async function main() {
    try {
        console.log('🧹 Starting Test Service Data Cleanup...\n');
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine';
        await mongoose.connect(mongoUri);
        console.log('📦 Connected to MongoDB\n');
        
        // Count before deletion
        const ausbildungBefore = await JobApplication.countDocuments({
            applicationType: 'ausbildung',
            email: { $regex: TEST_EMAIL_DOMAIN }
        });
        const arbeitBefore = await JobApplication.countDocuments({
            applicationType: 'arbeit',
            email: { $regex: TEST_EMAIL_DOMAIN }
        });
        const cvBefore = await ServiceRequest.countDocuments({
            serviceType: 'cv',
            email: { $regex: TEST_EMAIL_DOMAIN }
        });
        const translationBefore = await ServiceRequest.countDocuments({
            serviceType: 'translation',
            email: { $regex: TEST_EMAIL_DOMAIN }
        });
        
        console.log('📊 Found test data to delete:');
        console.log(`   Ausbildung applications: ${ausbildungBefore}`);
        console.log(`   Arbeit applications:     ${arbeitBefore}`);
        console.log(`   CV requests:             ${cvBefore}`);
        console.log(`   Translation requests:    ${translationBefore}`);
        console.log(`   TOTAL:                   ${ausbildungBefore + arbeitBefore + cvBefore + translationBefore}\n`);
        
        if (ausbildungBefore + arbeitBefore + cvBefore + translationBefore === 0) {
            console.log('ℹ️  No test data found to delete.');
            await mongoose.disconnect();
            return;
        }
        
        // Delete test job applications (Ausbildung + Arbeit)
        console.log('🗑️  Deleting test job applications...');
        const jobResult = await JobApplication.deleteMany({
            email: { $regex: TEST_EMAIL_DOMAIN }
        });
        console.log(`   ✅ Deleted ${jobResult.deletedCount} job applications`);
        
        // Delete test service requests (CV + Translation)
        console.log('🗑️  Deleting test service requests...');
        const serviceResult = await ServiceRequest.deleteMany({
            email: { $regex: TEST_EMAIL_DOMAIN }
        });
        console.log(`   ✅ Deleted ${serviceResult.deletedCount} service requests`);
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 CLEANUP SUMMARY');
        console.log('='.repeat(50));
        console.log(`   Job Applications deleted:     ${jobResult.deletedCount}`);
        console.log(`   Service Requests deleted:     ${serviceResult.deletedCount}`);
        console.log(`   TOTAL DELETED:                ${jobResult.deletedCount + serviceResult.deletedCount}`);
        console.log('='.repeat(50));
        console.log('\n✅ Test data cleanup complete!');
        console.log('💡 All test service data has been removed from the database.\n');
        
    } catch (error) {
        console.error('❌ Error cleaning up test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
}

main();
