/**
 * Quick Setup Script: Initialize Default Branch Groups
 * Run this to create the 8 default branch groups needed for student assignment
 */

const mongoose = require('mongoose');
const BranchGroup = require('../models/BranchGroup');
const Admin = require('../models/Admin');
require('dotenv').config();

async function setupBranchGroups() {
    try {
        console.log('🚀 Starting Branch Groups Setup...\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        console.log('✅ Connected to database\n');
        
        // Find super admin (or use first admin)
        let admin = await Admin.findOne({ role: 'super_admin' });
        if (!admin) {
            admin = await Admin.findOne();
        }
        
        if (!admin) {
            console.error('❌ No admin found. Please create an admin account first.');
            process.exit(1);
        }
        
        console.log(`👤 Using admin: ${admin.username}\n`);
        
        // Create default branch groups
        console.log('🎓 Creating default branch groups...\n');
        const created = await BranchGroup.createDefaults(admin._id, admin.username);
        
        if (created.length > 0) {
            console.log(`✅ Created ${created.length} new branch groups:\n`);
            created.forEach(bg => {
                console.log(`   ${bg.icon} ${bg.displayName} (${bg.formation})`);
            });
        } else {
            console.log('ℹ️  All branch groups already exist');
        }
        
        // Display all branch groups
        console.log('\n📋 All Branch Groups:\n');
        const allBranches = await BranchGroup.find().sort({ formation: 1 });
        allBranches.forEach(bg => {
            console.log(`   ${bg.icon} ${bg.displayName.padEnd(30)} | Formation: ${bg.formation.padEnd(25)} | Status: ${bg.status}`);
        });
        
        console.log('\n✅ Setup complete!\n');
        
    } catch (error) {
        console.error('❌ Error during setup:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run setup
setupBranchGroups();
