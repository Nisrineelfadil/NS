const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'Img');
const outputDir = path.join(__dirname, 'Img', 'optimized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all PNG files in Img directory (not subdirectories)
const files = fs.readdirSync(imgDir)
  .filter(file => file.endsWith('.png') && /^\d+\.png$/.test(file)); // Only numbered files like 1.png, 2.png, etc.

console.log(`Found ${files.length} images to optimize...`);

async function optimizeImages() {
  for (const file of files) {
    const inputPath = path.join(imgDir, file);
    const outputPath = path.join(imgDir, file); // Overwrite original
    
    try {
      const stats = fs.statSync(inputPath);
      const originalSize = (stats.size / 1024).toFixed(2);
      
      // Optimize: resize if too large, compress, convert to WebP if beneficial
      await sharp(inputPath)
        .resize(1920, 1080, { // Max dimensions
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: 80,
          compressionLevel: 9,
          effort: 10
        })
        .toFile(outputPath + '.tmp');
      
      // Replace original with optimized
      fs.renameSync(outputPath + '.tmp', outputPath);
      
      const newStats = fs.statSync(outputPath);
      const newSize = (newStats.size / 1024).toFixed(2);
      const savings = ((1 - newStats.size / stats.size) * 100).toFixed(1);
      
      console.log(`✅ ${file}: ${originalSize}KB → ${newSize}KB (${savings}% smaller)`);
    } catch (error) {
      console.error(`❌ Error optimizing ${file}:`, error.message);
    }
  }
  
  console.log('\n✅ Image optimization complete!');
}

optimizeImages().catch(console.error);
