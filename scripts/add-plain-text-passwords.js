/**
 * Migration Script: Add Plain Text Passwords to Existing Students
 * 
 * This script adds a plainTextPassword field to existing students.
 * Since we can't decrypt the hashed passwords, we'll generate new passwords
 * and update both the hashed and plain text versions.
 * 
 * IMPORTANT: Run this script ONCE to migrate existing data.
 * New students will automatically have plainTextPassword set.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ManagedStudent = require('../models/ManagedStudent');

// Generate random password
function generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

async function addPlainTextPasswords() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Find all students without plainTextPassword
        console.log('🔍 Finding students without plain text passwords...');
        const students = await ManagedStudent.find({ plainTextPassword: { $exists: false } });
        
        if (students.length === 0) {
            console.log('✅ All students already have plain text passwords!');
            process.exit(0);
        }
        
        console.log(`📊 Found ${students.length} students to update\n`);
        
        let updated = 0;
        let failed = 0;
        
        for (const student of students) {
            try {
                // Generate new password
                const newPassword = generatePassword(12);
                
                // Update student with new password
                // The pre-save hook will automatically:
                // 1. Store plain text in plainTextPassword
                // 2. Hash and store in emailPassword
                student.emailPassword = newPassword;
                await student.save();
                
                console.log(`✅ Updated: ${student.fullName} (${student.schoolEmail})`);
                console.log(`   New password: ${newPassword}\n`);
                
                updated++;
            } catch (error) {
                console.error(`❌ Failed to update ${student.fullName}:`, error.message);
                failed++;
            }
        }
        
        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successfully updated: ${updated}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   📝 Total processed: ${students.length}`);
        
        console.log('\n⚠️  IMPORTANT: New passwords have been generated!');
        console.log('   Please inform students of their new passwords.');
        console.log('   You can view them in the admin panel or ID cards.\n');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run migration
console.log('🚀 Starting Plain Text Password Migration...\n');
addPlainTextPasswords();
