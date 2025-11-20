const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const videoDir = path.join(__dirname, 'Img', 'Video');

// Get all PNG poster files
const files = fs.readdirSync(videoDir)
  .filter(file => file.endsWith('_P.png'));

console.log(`Found ${files.length} video poster images to optimize...`);

async function optimizePosters() {
  for (const file of files) {
    const inputPath = path.join(videoDir, file);
    const outputPath = path.join(videoDir, file);
    
    try {
      const stats = fs.statSync(inputPath);
      const originalSize = (stats.size / 1024 / 1024).toFixed(2);
      
      await sharp(inputPath)
        .resize(1280, 720, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: 75,
          compressionLevel: 9,
          effort: 10
        })
        .toFile(outputPath + '.tmp');
      
      fs.renameSync(outputPath + '.tmp', outputPath);
      
      const newStats = fs.statSync(outputPath);
      const newSize = (newStats.size / 1024 / 1024).toFixed(2);
      const savings = ((1 - newStats.size / stats.size) * 100).toFixed(1);
      
      console.log(`✅ ${file}: ${originalSize}MB → ${newSize}MB (${savings}% smaller)`);
    } catch (error) {
      console.error(`❌ Error optimizing ${file}:`, error.message);
    }
  }
  
  console.log('\n✅ Video poster optimization complete!');
}

optimizePosters().catch(console.error);
