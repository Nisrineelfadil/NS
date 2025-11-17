/**
 * Check what files exist in Mega.nz
 * Run with: node check-mega-files.js
 */

require('dotenv').config();
const megaService = require('./services/megaService');

async function listMegaFiles(folder, indent = '') {
    try {
        const storage = await megaService.ensureLoggedIn();
        
        // Navigate to folder
        let current = storage.root;
        if (folder) {
            const parts = folder.split('/').filter(p => p);
            for (const part of parts) {
                const found = current.children.find(c => c.name === part);
                if (!found) {
                    console.log(`❌ Folder not found: ${folder}`);
                    return;
                }
                current = found;
            }
        }
        
        console.log(`\n📁 Contents of: /${folder || 'root'}`);
        console.log('='.repeat(60));
        
        // List folders
        const folders = current.children.filter(c => c.directory);
        if (folders.length > 0) {
            console.log('\n📂 Folders:');
            folders.forEach(f => {
                console.log(`   ${indent}📁 ${f.name}`);
            });
        }
        
        // List files
        const files = current.children.filter(c => !c.directory);
        if (files.length > 0) {
            console.log('\n📄 Files:');
            files.forEach(f => {
                const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
                console.log(`   ${indent}📄 ${f.name} (${sizeMB} MB)`);
            });
        }
        
        if (folders.length === 0 && files.length === 0) {
            console.log('   (empty)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function main() {
    console.log('🔍 Checking Mega.nz files...\n');
    
    // Check root
    await listMegaFiles('');
    
    // Check ServiceRequests folder
    await listMegaFiles('ServiceRequests');
    
    // Check ServiceRequests/applying
    await listMegaFiles('ServiceRequests/applying');
    
    // Check ServiceRequests/cv
    await listMegaFiles('ServiceRequests/cv');
    
    // Check ServiceRequests/translation
    await listMegaFiles('ServiceRequests/translation');
    
    // Check Nisrine School Registrations
    await listMegaFiles('Nisrine School Registrations');
    
    process.exit(0);
}

main();
