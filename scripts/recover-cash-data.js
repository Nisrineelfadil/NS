/**
 * One-time recovery script to restore deleted cash transactions
 * and monthly notes from the archive JSON on Mega.nz
 * 
 * Usage: node scripts/recover-cash-data.js <seasonName>
 * Example: node scripts/recover-cash-data.js 2025-2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const megaService = require('../services/megaService');
const CashTransaction = require('../models/CashTransaction');
const MonthlyNote = require('../models/MonthlyNote');

const MEGA_ARCHIVE_FOLDER = '/Nisrine Archives';

async function recover(seasonName) {
    if (!seasonName) {
        console.error('❌ Usage: node scripts/recover-cash-data.js <seasonName>');
        console.error('   Example: node scripts/recover-cash-data.js 2025-2026');
        process.exit(1);
    }

    console.log(`\n🔧 Recovering cash data from archive: ${seasonName}\n`);

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ No MONGODB_URI found in .env');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Download archive from Mega
    const megaPath = `${MEGA_ARCHIVE_FOLDER}/${seasonName}.json`;
    console.log(`📥 Downloading archive: ${megaPath}`);

    const result = await megaService.downloadServiceFile(megaPath);
    const archiveData = JSON.parse(result.fileBuffer.toString('utf-8'));

    console.log(`✅ Archive loaded (${(result.fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Cash transactions in archive: ${(archiveData.cashTransactions || []).length}`);
    console.log(`   Monthly notes in archive: ${(archiveData.monthlyNotes || []).length}`);

    // Check current state
    const currentCashCount = await CashTransaction.countDocuments();
    const currentNotesCount = await MonthlyNote.countDocuments();
    console.log(`\n📊 Current state in MongoDB:`);
    console.log(`   Cash transactions: ${currentCashCount}`);
    console.log(`   Monthly notes: ${currentNotesCount}`);

    // Restore cash transactions
    let cashRestored = 0;
    let cashSkipped = 0;
    if (archiveData.cashTransactions && archiveData.cashTransactions.length > 0) {
        console.log(`\n💰 Restoring cash transactions...`);
        for (const tx of archiveData.cashTransactions) {
            try {
                const exists = await CashTransaction.findById(tx._id);
                if (!exists) {
                    await CashTransaction.create(tx);
                    cashRestored++;
                } else {
                    cashSkipped++;
                }
            } catch (err) {
                console.error(`   ⚠️ Error restoring tx ${tx._id}: ${err.message}`);
            }
        }
        console.log(`   ✅ Restored: ${cashRestored}, Skipped (already exists): ${cashSkipped}`);
    }

    // Restore monthly notes
    let notesRestored = 0;
    let notesSkipped = 0;
    if (archiveData.monthlyNotes && archiveData.monthlyNotes.length > 0) {
        console.log(`\n📝 Restoring monthly notes...`);
        for (const note of archiveData.monthlyNotes) {
            try {
                const exists = await MonthlyNote.findById(note._id);
                if (!exists) {
                    await MonthlyNote.create(note);
                    notesRestored++;
                } else {
                    notesSkipped++;
                }
            } catch (err) {
                console.error(`   ⚠️ Error restoring note ${note._id}: ${err.message}`);
            }
        }
        console.log(`   ✅ Restored: ${notesRestored}, Skipped (already exists): ${notesSkipped}`);
    }

    // Final state
    const finalCashCount = await CashTransaction.countDocuments();
    const finalNotesCount = await MonthlyNote.countDocuments();
    console.log(`\n📊 Final state in MongoDB:`);
    console.log(`   Cash transactions: ${finalCashCount}`);
    console.log(`   Monthly notes: ${finalNotesCount}`);
    console.log(`\n✅ Recovery complete!`);

    await mongoose.disconnect();
    process.exit(0);
}

const seasonName = process.argv[2];
recover(seasonName).catch(err => {
    console.error('❌ Recovery failed:', err);
    process.exit(1);
});
