/**
 * Migration Script: Fix Student Photo Paths
 * 
 * This script fixes students with invalid photoPath values:
 * - Sets photoPath to null if it contains 'undefined'
 * - Allows the UI to display placeholder avatars correctly
 */

const mongoose = require('mongoose');
const ManagedStudent = require('../models/ManagedStudent');
require('dotenv').config();

async function fixStudentPhotos() {
    try {
        console.log('🔧 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Find students with invalid photo paths
        const studentsWithInvalidPhotos = await ManagedStudent.find({
            photoPath: { $regex: /undefined|null/i }
        });
        
        console.log(`\n📊 Found ${studentsWithInvalidPhotos.length} students with invalid photo paths`);
        
        if (studentsWithInvalidPhotos.length === 0) {
            console.log('✅ No students need fixing!');
            process.exit(0);
        }
        
        // Fix each student
        let fixedCount = 0;
        for (const student of studentsWithInvalidPhotos) {
            console.log(`\n🔄 Fixing student: ${student.fullName}`);
            console.log(`   Current photoPath: ${student.photoPath}`);
            
            student.photoPath = null;
            await student.save();
            
            console.log(`   ✅ Updated photoPath to: null`);
            fixedCount++;
        }
        
        console.log(`\n✅ Successfully fixed ${fixedCount} students!`);
        console.log('📝 Students will now display placeholder avatars with their initials');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing student photos:', error);
        process.exit(1);
    }
}

// Run the migration
fixStudentPhotos();
