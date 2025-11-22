/**
 * Migration Script: Convert file-based student photos to base64
 * 
 * This script:
 * 1. Finds all students with file-based photo paths
 * 2. Reads the image files from disk
 * 3. Converts them to base64
 * 4. Updates the database with base64 data URIs
 * 
 * Run: node scripts/migrate-photos-to-base64.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const ManagedStudent = require('../models/ManagedStudent');

async function migratePhotosToBase64() {
    try {
        console.log('🔄 Starting photo migration to base64...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Find all students with file-based photo paths (not base64)
        const students = await ManagedStudent.find({
            photoPath: { 
                $exists: true, 
                $ne: null,
                $not: /^data:/ // Not starting with 'data:'
            }
        });
        
        console.log(`📊 Found ${students.length} students with file-based photos\n`);
        
        if (students.length === 0) {
            console.log('✅ No migration needed - all photos are already base64 or missing');
            process.exit(0);
        }
        
        let successCount = 0;
        let errorCount = 0;
        let notFoundCount = 0;
        
        for (const student of students) {
            try {
                console.log(`Processing: ${student.fullName} (${student.schoolEmail})`);
                console.log(`  Current path: ${student.photoPath}`);
                
                // Determine the file path
                let filePath;
                if (student.photoPath.startsWith('/uploads')) {
                    // Full path like /uploads/managed-students/student-*.png
                    filePath = path.join(__dirname, '..', student.photoPath);
                } else if (student.photoPath.includes('student-')) {
                    // Just filename like student-*.png
                    filePath = path.join(__dirname, '../uploads/managed-students', student.photoPath);
                } else {
                    console.log(`  ⚠️  Unknown path format, skipping\n`);
                    errorCount++;
                    continue;
                }
                
                // Check if file exists
                try {
                    await fs.access(filePath);
                } catch (err) {
                    console.log(`  ❌ File not found: ${filePath}`);
                    console.log(`  Clearing photoPath in database\n`);
                    student.photoPath = null;
                    await student.save();
                    notFoundCount++;
                    continue;
                }
                
                // Read the file
                const imageBuffer = await fs.readFile(filePath);
                
                // Determine MIME type from extension
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes = {
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp'
                };
                const mimeType = mimeTypes[ext] || 'image/png';
                
                // Convert to base64
                const base64Image = imageBuffer.toString('base64');
                const dataUri = `data:${mimeType};base64,${base64Image}`;
                
                // Update database
                student.photoPath = dataUri;
                await student.save();
                
                console.log(`  ✅ Converted to base64 (${(base64Image.length / 1024).toFixed(2)} KB)\n`);
                successCount++;
                
            } catch (err) {
                console.error(`  ❌ Error processing ${student.fullName}:`, err.message);
                console.log('');
                errorCount++;
            }
        }
        
        console.log('\n📊 Migration Summary:');
        console.log(`  ✅ Successfully converted: ${successCount}`);
        console.log(`  ❌ Errors: ${errorCount}`);
        console.log(`  📁 Files not found (cleared): ${notFoundCount}`);
        console.log(`  📝 Total processed: ${students.length}`);
        
        console.log('\n✅ Migration complete!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run the migration
migratePhotosToBase64();
