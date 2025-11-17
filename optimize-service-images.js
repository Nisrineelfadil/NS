/**
 * Image Optimization Script for Service Photos
 * This script compresses the large service images to optimize performance
 * Run: node optimize-service-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, 'Img');
const TARGET_SIZE = 500; // 500x500 pixels
const QUALITY = 80; // JPEG quality (0-100)

const serviceImages = [
    'service-language.jpg',
    'service-visa.jpg',
    'service-culture.jpg',
    'service-nursing.jpg',
    'service-hotel.jpg',
    'service-education.jpg'
];

async function optimizeImage(filename) {
    const inputPath = path.join(IMG_DIR, filename);
    const outputPath = path.join(IMG_DIR, `optimized-${filename}`);
    
    try {
        const stats = fs.statSync(inputPath);
        const originalSize = (stats.size / 1024 / 1024).toFixed(2);
        
        console.log(`\n📸 Optimizing ${filename}...`);
        console.log(`   Original size: ${originalSize} MB`);
        
        await sharp(inputPath)
            .resize(TARGET_SIZE, TARGET_SIZE, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: QUALITY, progressive: true })
            .toFile(outputPath);
        
        const newStats = fs.statSync(outputPath);
        const newSize = (newStats.size / 1024).toFixed(2);
        const reduction = ((1 - newStats.size / stats.size) * 100).toFixed(1);
        
        console.log(`   ✅ Optimized size: ${newSize} KB`);
        console.log(`   💾 Reduced by: ${reduction}%`);
        
        return {
            filename,
            originalSize: stats.size,
            newSize: newStats.size,
            reduction
        };
    } catch (error) {
        console.error(`   ❌ Error optimizing ${filename}:`, error.message);
        return null;
    }
}

async function optimizeAllImages() {
    console.log('🚀 Starting image optimization...\n');
    console.log(`Target size: ${TARGET_SIZE}x${TARGET_SIZE}px`);
    console.log(`JPEG quality: ${QUALITY}%`);
    
    const results = [];
    
    for (const image of serviceImages) {
        const result = await optimizeImage(image);
        if (result) results.push(result);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('='.repeat(50));
    
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);
    const totalReduction = ((1 - totalNew / totalOriginal) * 100).toFixed(1);
    
    console.log(`\nTotal original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total optimized size: ${(totalNew / 1024).toFixed(2)} KB`);
    console.log(`Total reduction: ${totalReduction}%`);
    
    console.log('\n✨ Optimization complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Review the optimized images in the Img folder');
    console.log('2. If satisfied, rename them to replace the originals:');
    console.log('   - Delete original files');
    console.log('   - Rename "optimized-service-*.jpg" to "service-*.jpg"');
    console.log('3. Refresh your browser to see the performance improvement!');
}

// Run optimization
optimizeAllImages().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
