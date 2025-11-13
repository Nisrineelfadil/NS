const fs = require('fs');
const path = require('path');

// Source file
const sourceFile = path.join(__dirname, 'src', 'Logo', 'Portal.png');

// Destination files
const destinations = [
  path.join(__dirname, 'public', 'icon-192.png'),
  path.join(__dirname, 'public', 'icon-512.png'),
  path.join(__dirname, 'public', 'favicon.ico')
];

// Copy the file to all destinations
destinations.forEach(dest => {
  fs.copyFileSync(sourceFile, dest);
  console.log(`✅ Copied to: ${path.basename(dest)}`);
});

console.log('\n🎉 All PWA icons created successfully!');
