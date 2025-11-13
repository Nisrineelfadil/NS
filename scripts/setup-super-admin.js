/**
 * Setup Script - Create Super Admin Account (Nisrineelfadil)
 * Run this once to create the super admin account
 * Usage: node setup-super-admin.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('./models/Admin');

async function setupSuperAdmin() {
    try {
        console.log('\n🔧 Super Admin Account Setup\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        // Check if super admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
        if (existingSuperAdmin) {
            console.log('⚠️  Super Admin account already exists!');
            console.log(`   Username: ${existingSuperAdmin.username}`);
            console.log(`   Email: ${existingSuperAdmin.email}\n`);
            console.log('❌ Cannot create another super admin. Only one is allowed.');
            process.exit(0);
        }

        // Create super admin with predefined credentials
        const superAdmin = new Admin({
            username: 'Nisrineelfadil',
            email: 'nisrine@nisrineschool.com',
            password: 'Nisrineelfadil_2024',
            role: 'super_admin'
        });

        await superAdmin.save();

        console.log('✅ Super Admin account created successfully!\n');
        console.log('📋 Super Admin Details:');
        console.log(`   Username: Nisrineelfadil`);
        console.log(`   Password: Nisrineelfadil_2024`);
        console.log(`   Email: nisrine@nisrineschool.com`);
        console.log(`   Role: Super Admin\n`);
        console.log('🔗 Login at the /admin page of your deployed site.\n');
        console.log('⚠️  IMPORTANT: Change the password after first login!\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Run setup
setupSuperAdmin();
