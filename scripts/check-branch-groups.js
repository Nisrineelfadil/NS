/**
 * Diagnostic Script: Check Branch Groups in Database
 * This will show the actual IDs and data in your database
 */

const mongoose = require('mongoose');
const BranchGroup = require('../models/BranchGroup');
require('dotenv').config();

async function checkBranchGroups() {
    try {
        console.log('🔍 Checking Branch Groups in Database...\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        console.log('✅ Connected to database\n');
        
        // Get all branch groups
        const branchGroups = await BranchGroup.find().sort({ formation: 1 });
        
        console.log(`📊 Found ${branchGroups.length} branch groups:\n`);
        console.log('=' .repeat(100));
        
        branchGroups.forEach((bg, index) => {
            console.log(`\n${index + 1}. ${bg.icon} ${bg.displayName}`);
            console.log(`   ID:        ${bg._id}`);
            console.log(`   Formation: ${bg.formation}`);
            console.log(`   Type:      ${bg.type}`);
            console.log(`   Status:    ${bg.status}`);
            console.log(`   Created:   ${bg.createdAt}`);
        });
        
        console.log('\n' + '='.repeat(100));
        
        // Check for the specific ID from the error
        const problematicId = '68fae7db391116ba257283fe';
        console.log(`\n🔍 Checking for ID: ${problematicId}`);
        
        const found = await BranchGroup.findById(problematicId);
        if (found) {
            console.log('✅ Found:', found.displayName);
        } else {
            console.log('❌ NOT FOUND - This ID does not exist in the database!');
            console.log('   This explains the 404 error.');
        }
        
        // Check for Informatique specifically
        console.log('\n🔍 Checking for "Informatique" formation:');
        const itBranch = await BranchGroup.findOne({ formation: 'Informatique' });
        if (itBranch) {
            console.log('✅ Found IT branch:');
            console.log(`   ID:   ${itBranch._id}`);
            console.log(`   Name: ${itBranch.displayName}`);
            console.log('\n⚠️  NOTICE: The ID in database is DIFFERENT from the one in the error!');
            console.log(`   Database ID: ${itBranch._id}`);
            console.log(`   Error ID:    ${problematicId}`);
        } else {
            console.log('❌ No Informatique branch found!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run check
checkBranchGroups();
