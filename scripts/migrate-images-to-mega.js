/**
 * Migration Script: Move base64 images from MongoDB to Mega.nz
 * 
 * This script:
 * 1. Finds all ManagedStudents with base64 photos/CIN cards
 * 2. Finds all CashTransactions with base64 receipt images
 * 3. Finds all TelcCandidates with base64 certificates
 * 4. Finds all Students (registrations) with base64 photos
 * 5. Uploads each to Mega.nz
 * 6. Replaces the base64 data with the Mega API URL
 * 
 * Run: node scripts/migrate-images-to-mega.js
 * 
 * Options:
 *   --dry-run    Preview what would be migrated without making changes
 *   --collection <name>  Only migrate a specific collection (managedstudents, cashtransactions, telccandidates, students)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ManagedStudent = require('../models/ManagedStudent');
const CashTransaction = require('../models/CashTransaction');
const TelcCandidate = require('../models/TelcCandidate');
const Student = require('../models/Student');
const imageStorageService = require('../services/imageStorageService');
const megaService = require('../services/megaService');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const collectionFilter = args.includes('--collection') ? args[args.indexOf('--collection') + 1] : null;

// Stats tracking
const stats = {
    managedStudents: { total: 0, photos: 0, cinFront: 0, cinBack: 0, errors: 0 },
    cashTransactions: { total: 0, receipts: 0, errors: 0 },
    telcCandidates: { total: 0, certificates: 0, errors: 0 },
    students: { total: 0, photos: 0, errors: 0 },
    totalSaved: 0
};

function isBase64(val) {
    return val && typeof val === 'string' && val.startsWith('data:');
}

function estimateBase64Size(base64String) {
    if (!base64String) return 0;
    const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
    return Math.ceil(base64Data.length * 0.75);
}

async function migrateManagedStudents() {
    console.log('\n📋 Migrating ManagedStudent images...');
    
    const students = await ManagedStudent.find({
        $or: [
            { photoPath: { $regex: /^data:/ } },
            { 'cinCard.front': { $regex: /^data:/ } },
            { 'cinCard.back': { $regex: /^data:/ } }
        ]
    });
    
    stats.managedStudents.total = students.length;
    console.log(`   Found ${students.length} students with base64 images`);
    
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const studentId = student._id.toString();
        let updated = false;
        
        console.log(`   [${i + 1}/${students.length}] ${student.fullName} (${studentId})`);
        
        // Migrate photo
        if (isBase64(student.photoPath)) {
            const size = estimateBase64Size(student.photoPath);
            stats.totalSaved += size;
            
            if (!DRY_RUN) {
                try {
                    const base64Data = student.photoPath.split(',')[1];
                    const buffer = Buffer.from(base64Data, 'base64');
                    student.photoPath = await imageStorageService.uploadStudentPhoto(buffer, studentId);
                    updated = true;
                    stats.managedStudents.photos++;
                    console.log(`      ✅ Photo migrated (${(size / 1024).toFixed(1)} KB saved)`);
                } catch (err) {
                    stats.managedStudents.errors++;
                    console.error(`      ❌ Photo migration failed: ${err.message}`);
                }
            } else {
                stats.managedStudents.photos++;
                console.log(`      📋 Would migrate photo (${(size / 1024).toFixed(1)} KB)`);
            }
        }
        
        // Migrate CIN front
        if (isBase64(student.cinCard?.front)) {
            const size = estimateBase64Size(student.cinCard.front);
            stats.totalSaved += size;
            
            if (!DRY_RUN) {
                try {
                    const base64Data = student.cinCard.front.split(',')[1];
                    const buffer = Buffer.from(base64Data, 'base64');
                    student.cinCard.front = await imageStorageService.uploadCINImage(buffer, studentId, 'front');
                    updated = true;
                    stats.managedStudents.cinFront++;
                    console.log(`      ✅ CIN front migrated (${(size / 1024).toFixed(1)} KB saved)`);
                } catch (err) {
                    stats.managedStudents.errors++;
                    console.error(`      ❌ CIN front migration failed: ${err.message}`);
                }
            } else {
                stats.managedStudents.cinFront++;
                console.log(`      📋 Would migrate CIN front (${(size / 1024).toFixed(1)} KB)`);
            }
        }
        
        // Migrate CIN back
        if (isBase64(student.cinCard?.back)) {
            const size = estimateBase64Size(student.cinCard.back);
            stats.totalSaved += size;
            
            if (!DRY_RUN) {
                try {
                    const base64Data = student.cinCard.back.split(',')[1];
                    const buffer = Buffer.from(base64Data, 'base64');
                    student.cinCard.back = await imageStorageService.uploadCINImage(buffer, studentId, 'back');
                    updated = true;
                    stats.managedStudents.cinBack++;
                    console.log(`      ✅ CIN back migrated (${(size / 1024).toFixed(1)} KB saved)`);
                } catch (err) {
                    stats.managedStudents.errors++;
                    console.error(`      ❌ CIN back migration failed: ${err.message}`);
                }
            } else {
                stats.managedStudents.cinBack++;
                console.log(`      📋 Would migrate CIN back (${(size / 1024).toFixed(1)} KB)`);
            }
        }
        
        if (updated) {
            await student.save();
        }
    }
}

async function migrateCashTransactions() {
    console.log('\n💰 Migrating CashTransaction receipt images...');
    
    // Find transactions where receiptImage.data exists and looks like base64 (not a URL path)
    const transactions = await CashTransaction.find({
        'receiptImage.data': { $exists: true, $ne: null, $not: { $regex: /^\/api\/media\// } }
    });
    
    // Filter to only base64 ones (can't easily regex for "doesn't start with /api" in mongo for all cases)
    const base64Transactions = transactions.filter(t => 
        t.receiptImage?.data && !t.receiptImage.data.startsWith('/api/media/')
    );
    
    stats.cashTransactions.total = base64Transactions.length;
    console.log(`   Found ${base64Transactions.length} transactions with base64 receipts`);
    
    for (let i = 0; i < base64Transactions.length; i++) {
        const transaction = base64Transactions[i];
        const txId = transaction._id.toString();
        const size = estimateBase64Size(transaction.receiptImage.data);
        stats.totalSaved += size;
        
        console.log(`   [${i + 1}/${base64Transactions.length}] Transaction ${txId}`);
        
        if (!DRY_RUN) {
            try {
                const buffer = Buffer.from(transaction.receiptImage.data, 'base64');
                const ext = transaction.receiptImage.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
                transaction.receiptImage.data = await imageStorageService.uploadReceipt(buffer, txId, ext);
                await transaction.save();
                stats.cashTransactions.receipts++;
                console.log(`      ✅ Receipt migrated (${(size / 1024).toFixed(1)} KB saved)`);
            } catch (err) {
                stats.cashTransactions.errors++;
                console.error(`      ❌ Receipt migration failed: ${err.message}`);
            }
        } else {
            stats.cashTransactions.receipts++;
            console.log(`      📋 Would migrate receipt (${(size / 1024).toFixed(1)} KB)`);
        }
    }
}

async function migrateTelcCandidates() {
    console.log('\n🎓 Migrating TelcCandidate certificates...');
    
    const candidates = await TelcCandidate.find({
        'certificate.data': { $exists: true, $ne: null, $not: { $regex: /^\/api\/media\// } }
    });
    
    const base64Candidates = candidates.filter(c =>
        c.certificate?.data && !c.certificate.data.startsWith('/api/media/')
    );
    
    stats.telcCandidates.total = base64Candidates.length;
    console.log(`   Found ${base64Candidates.length} candidates with base64 certificates`);
    
    for (let i = 0; i < base64Candidates.length; i++) {
        const candidate = base64Candidates[i];
        const candidateId = candidate._id.toString();
        const size = estimateBase64Size(candidate.certificate.data);
        stats.totalSaved += size;
        
        console.log(`   [${i + 1}/${base64Candidates.length}] ${candidate.fullName} (${candidateId})`);
        
        if (!DRY_RUN) {
            try {
                const buffer = Buffer.from(candidate.certificate.data, 'base64');
                candidate.certificate.data = await imageStorageService.uploadCertificate(buffer, candidateId);
                await candidate.save();
                stats.telcCandidates.certificates++;
                console.log(`      ✅ Certificate migrated (${(size / 1024).toFixed(1)} KB saved)`);
            } catch (err) {
                stats.telcCandidates.errors++;
                console.error(`      ❌ Certificate migration failed: ${err.message}`);
            }
        } else {
            stats.telcCandidates.certificates++;
            console.log(`      📋 Would migrate certificate (${(size / 1024).toFixed(1)} KB)`);
        }
    }
}

async function migrateStudentRegistrations() {
    console.log('\n📝 Migrating Student registration photos...');
    
    const students = await Student.find({
        photoPath: { $regex: /^data:/ }
    });
    
    stats.students.total = students.length;
    console.log(`   Found ${students.length} registrations with base64 photos`);
    
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const studentId = student._id.toString();
        const size = estimateBase64Size(student.photoPath);
        stats.totalSaved += size;
        
        console.log(`   [${i + 1}/${students.length}] ${student.fullName} (${studentId})`);
        
        if (!DRY_RUN) {
            try {
                const base64Data = student.photoPath.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                student.photoPath = await imageStorageService.uploadRegistrationPhoto(buffer, studentId);
                await student.save();
                stats.students.photos++;
                console.log(`      ✅ Photo migrated (${(size / 1024).toFixed(1)} KB saved)`);
            } catch (err) {
                stats.students.errors++;
                console.error(`      ❌ Photo migration failed: ${err.message}`);
            }
        } else {
            stats.students.photos++;
            console.log(`      📋 Would migrate photo (${(size / 1024).toFixed(1)} KB)`);
        }
    }
}

function printSummary() {
    const totalMB = (stats.totalSaved / (1024 * 1024)).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log(DRY_RUN ? '📋 DRY RUN SUMMARY (no changes made)' : '✅ MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\nManagedStudents:');
    console.log(`   Total found: ${stats.managedStudents.total}`);
    console.log(`   Photos migrated: ${stats.managedStudents.photos}`);
    console.log(`   CIN fronts migrated: ${stats.managedStudents.cinFront}`);
    console.log(`   CIN backs migrated: ${stats.managedStudents.cinBack}`);
    console.log(`   Errors: ${stats.managedStudents.errors}`);
    
    console.log('\nCashTransactions:');
    console.log(`   Total found: ${stats.cashTransactions.total}`);
    console.log(`   Receipts migrated: ${stats.cashTransactions.receipts}`);
    console.log(`   Errors: ${stats.cashTransactions.errors}`);
    
    console.log('\nTelcCandidates:');
    console.log(`   Total found: ${stats.telcCandidates.total}`);
    console.log(`   Certificates migrated: ${stats.telcCandidates.certificates}`);
    console.log(`   Errors: ${stats.telcCandidates.errors}`);
    
    console.log('\nStudent Registrations:');
    console.log(`   Total found: ${stats.students.total}`);
    console.log(`   Photos migrated: ${stats.students.photos}`);
    console.log(`   Errors: ${stats.students.errors}`);
    
    console.log('\n' + '-'.repeat(60));
    console.log(`📊 Total MongoDB space ${DRY_RUN ? 'that would be' : ''} freed: ~${totalMB} MB`);
    console.log('='.repeat(60));
}

async function main() {
    console.log('🚀 Image Migration: MongoDB base64 → Mega.nz');
    console.log('='.repeat(60));
    
    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be made');
    }
    
    if (collectionFilter) {
        console.log(`📌 Filtering to collection: ${collectionFilter}`);
    }
    
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    // Login to Mega
    if (!DRY_RUN) {
        console.log('\n🔐 Logging into Mega.nz...');
        await megaService.login();
        console.log('✅ Mega.nz connected');
    }
    
    // Run migrations
    if (!collectionFilter || collectionFilter === 'managedstudents') {
        await migrateManagedStudents();
    }
    if (!collectionFilter || collectionFilter === 'cashtransactions') {
        await migrateCashTransactions();
    }
    if (!collectionFilter || collectionFilter === 'telccandidates') {
        await migrateTelcCandidates();
    }
    if (!collectionFilter || collectionFilter === 'students') {
        await migrateStudentRegistrations();
    }
    
    printSummary();
    
    await mongoose.disconnect();
    console.log('\n👋 Done! Database disconnected.');
    process.exit(0);
}

main().catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
});
