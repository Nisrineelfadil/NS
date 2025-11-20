/**
 * Convert Student Photos to Base64
 * 
 * This script converts existing student photos from file paths to base64 encoding.
 * Use this if you have the original photos and want to migrate them to the database.
 * 
 * INSTRUCTIONS:
 * 1. Place all student photos in a folder (e.g., ./student-photos/)
 * 2. Name each photo with the student's school email (e.g., aeaeae@nisrineschool.com.jpg)
 * 3. Run: node scripts/convert-photos-to-base64.js
 */

const mongoose = require('mongoose');
const ManagedStudent = require('../models/ManagedStudent');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const PHOTOS_FOLDER = path.join(__dirname, '../student-photos');

async function convertPhotosToBase64() {
    try {
        console.log('🔧 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        // Check if photos folder exists
        try {
            await fs.access(PHOTOS_FOLDER);
        } catch (error) {
            console.error('❌ Photos folder not found:', PHOTOS_FOLDER);
            console.log('\n📝 Instructions:');
            console.log('1. Create a folder: ./student-photos/');
            console.log('2. Place student photos in the folder');
            console.log('3. Name each photo: studentemail@nisrineschool.com.jpg');
            console.log('   Example: aeaeae@nisrineschool.com.jpg');
            process.exit(1);
        }
        
        // Get all photo files
        const files = await fs.readdir(PHOTOS_FOLDER);
        const photoFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        
        console.log(`📁 Found ${photoFiles.length} photo files\n`);
        
        if (photoFiles.length === 0) {
            console.log('⚠️  No photo files found in the folder');
            process.exit(0);
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process each photo
        for (const filename of photoFiles) {
            try {
                // Extract email from filename (remove extension)
                const email = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
                
                console.log(`\n🔄 Processing: ${filename}`);
                console.log(`   Looking for student: ${email}`);
                
                // Find student by school email
                const student = await ManagedStudent.findOne({ 
                    schoolEmail: email.toLowerCase() 
                });
                
                if (!student) {
                    console.log(`   ⚠️  Student not found: ${email}`);
                    errorCount++;
                    continue;
                }
                
                // Read photo file
                const photoPath = path.join(PHOTOS_FOLDER, filename);
                const photoBuffer = await fs.readFile(photoPath);
                
                // Get file extension for MIME type
                const ext = path.extname(filename).toLowerCase();
                const mimeTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp'
                };
                const mimeType = mimeTypes[ext] || 'image/jpeg';
                
                // Convert to base64
                const base64Image = photoBuffer.toString('base64');
                const dataUri = `data:${mimeType};base64,${base64Image}`;
                
                // Update student
                student.photoPath = dataUri;
                await student.save();
                
                const sizeKB = (photoBuffer.length / 1024).toFixed(2);
                console.log(`   ✅ Updated ${student.fullName}`);
                console.log(`   📊 Size: ${sizeKB} KB`);
                successCount++;
                
            } catch (error) {
                console.error(`   ❌ Error processing ${filename}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Successfully converted: ${successCount} photos`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📁 Total files processed: ${photoFiles.length}`);
        console.log('\n✨ Migration complete!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the migration
convertPhotosToBase64();
