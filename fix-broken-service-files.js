/**
 * Fix service requests with broken file paths
 * Run with: node fix-broken-service-files.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');

async function fixBrokenFiles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all service requests with file paths
        const services = await ServiceRequest.find({
            $or: [
                { 'cvDetails.dropboxPath': { $exists: true, $ne: null } },
                { 'applyingDetails.dropboxPath': { $exists: true, $ne: null } },
                { 'translationDetails.dropboxPath': { $exists: true, $ne: null } }
            ]
        });

        console.log(`Found ${services.length} service requests with files\n`);

        let fixed = 0;
        for (const service of services) {
            let needsUpdate = false;
            let filePath = null;

            // Check which service type has the file
            if (service.cvDetails?.dropboxPath) {
                filePath = service.cvDetails.dropboxPath;
                console.log(`📋 CV Service: ${service.fullName}`);
                console.log(`   File: ${filePath}`);
                console.log(`   Action: Removing broken file reference`);
                service.cvDetails.dropboxPath = null;
                service.cvDetails.fileName = null;
                service.cvDetails.fileSize = null;
                needsUpdate = true;
            }
            
            if (service.applyingDetails?.dropboxPath) {
                filePath = service.applyingDetails.dropboxPath;
                console.log(`📋 Applying Service: ${service.fullName}`);
                console.log(`   File: ${filePath}`);
                console.log(`   Action: Removing broken file reference`);
                service.applyingDetails.dropboxPath = null;
                service.applyingDetails.fileName = null;
                service.applyingDetails.fileSize = null;
                needsUpdate = true;
            }
            
            if (service.translationDetails?.dropboxPath) {
                filePath = service.translationDetails.dropboxPath;
                console.log(`📋 Translation Service: ${service.fullName}`);
                console.log(`   File: ${filePath}`);
                console.log(`   Action: Removing broken file reference`);
                service.translationDetails.dropboxPath = null;
                service.translationDetails.fileName = null;
                service.translationDetails.fileSize = null;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await service.save();
                fixed++;
                console.log(`   ✅ Fixed\n`);
            }
        }

        console.log(`\n✅ Fixed ${fixed} service requests`);
        console.log(`\n⚠️  Note: The actual files were never uploaded to Mega.`);
        console.log(`   Users will need to re-upload their files if needed.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixBrokenFiles();
