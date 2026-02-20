const fs = require('fs');
const path = require('path');

const OLD_DOMAIN = 'nisrine-school.vercel.app';
const NEW_DOMAIN = process.argv[2]; // Pass new domain as argument

if (!NEW_DOMAIN) {
    console.error('Usage: node scripts/update-domain.js <new-domain>');
    console.error('Example: node scripts/update-domain.js nisrineschool.com');
    process.exit(1);
}

console.log(`Updating domain from ${OLD_DOMAIN} to ${NEW_DOMAIN}...\n`);

const filesToUpdate = [
    'index.html',
    'public/sitemap.xml',
    'public/robots.txt',
    'nisrine-student-pwa/public/index.html',
    'nisrine-student-pwa/public/manifest.json',
    'desktop-app/main.js'
];

let updatedCount = 0;

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace all occurrences
    content = content.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${file}`);
        updatedCount++;
    } else {
        console.log(`⏭️  No changes needed in ${file}`);
    }
});

console.log(`\n✨ Domain update complete! Updated ${updatedCount} files.`);
console.log(`\n📋 Next steps:`);
console.log(`1. Review changes: git diff`);
console.log(`2. Commit: git add -A && git commit -m "chore: update domain to ${NEW_DOMAIN}"`);
console.log(`3. Push: git push origin master && git push client master`);
console.log(`4. Rebuild desktop app: npm run build (in desktop-app folder)`);
console.log(`5. Submit sitemap to Google: https://search.google.com/search-console`);
