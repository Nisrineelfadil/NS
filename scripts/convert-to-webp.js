const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '..', 'Img');

const targets = [
  'about.png',
  'logo.png',
  'Door.png',
  'Leaf.png',
  'gold-zelij.png',
  'red-zelij.png',
  'corner-gold-zelij.png',
  'corner-red-zelij.png',
  'single-gold-zelij.png',
  'single-red-zelij.png',
  'service-culture.jpg',
  'service-education.jpg',
  'service-hotel.jpg',
  'service-language.jpg',
  'service-nursing.jpg',
  'service-visa.jpg',
  'service-social.jpg',
  path.join('Vintage', '1.jpg'),
  path.join('Vintage', '2.jpg'),
  path.join('Vintage', '3.jpg'),
  '1.png','2.png','3.png','4.png','5.png','6.png','7.png','8.png',
  '9.png','10.png','11.png','12.png','13.png','14.png','15.png',
  path.join('Video', 'Altenheim_P.png'),
  path.join('Video', 'Anas_P.png'),
  path.join('Video', 'Bestschool_P.png'),
  path.join('Video', 'Hotel_P.png'),
  path.join('Video', 'Intro_P.png'),
  path.join('Video', 'Job_P.png'),
  path.join('Video', 'Nusring_P.png'),
  path.join('Video', 'Omar_P.png'),
  path.join('Video', 'Trio_P.png'),
];

let converted = 0, failed = 0;

async function convertAll() {
  for (const rel of targets) {
    const src = path.join(imgDir, rel);
    if (!fs.existsSync(src)) { console.log(`⚠ SKIP (not found): ${rel}`); continue; }
    const dest = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    try {
      await sharp(src).webp({ quality: 82 }).toFile(dest);
      const srcSize = (fs.statSync(src).size / 1024).toFixed(1);
      const destSize = (fs.statSync(dest).size / 1024).toFixed(1);
      const saved = (((srcSize - destSize) / srcSize) * 100).toFixed(0);
      console.log(`✅ ${path.basename(rel).padEnd(30)} ${srcSize}KB → ${destSize}KB  (${saved}% smaller)`);
      converted++;
    } catch (e) {
      console.error(`❌ FAILED: ${rel} — ${e.message}`);
      failed++;
    }
  }
  console.log(`\nDone: ${converted} converted, ${failed} failed.`);
}

convertAll();
