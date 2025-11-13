/**
 * Payment History Migration Script
 * 
 * This script helps populate payment history for students who were marked as paid
 * BEFORE the payment journal feature was implemented.
 * 
 * IMPORTANT: This is optional and only needed if you want to backfill historical data.
 * The payment journal feature will automatically track all future payments.
 * 
 * Usage:
 *   node scripts/migrate-payment-history.js
 * 
 * What it does:
 * - Finds all students with paymentStatus = 'paid'
 * - Creates a payment history record for each paid student
 * - Uses current payment date and amount
 * - Marks migration date as "markedAsPaidDate"
 * 
 * Note: This creates ONE historical record per currently paid student.
 * It does NOT recreate the full payment history (which is not available).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ManagedStudent = require('../models/ManagedStudent');
const PaymentHistory = require('../models/PaymentHistory');
const Admin = require('../models/Admin');

async function migratePaymentHistory() {
    try {
        console.log('🔄 Starting Payment History Migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get a system admin for the migration
        const systemAdmin = await Admin.findOne({ role: 'super_admin' });
        if (!systemAdmin) {
            console.error('❌ No super admin found. Please create an admin first.');
            process.exit(1);
        }

        console.log(`📋 Using admin: ${systemAdmin.username} for migration\n`);

        // Find all students with paid status
        const paidStudents = await ManagedStudent.find({
            paymentStatus: 'paid'
        }).select('fullName formation branchSubgroupName paymentAmount paymentDate');

        console.log(`📊 Found ${paidStudents.length} students with paid status\n`);

        if (paidStudents.length === 0) {
            console.log('✅ No paid students found. Migration not needed.');
            await mongoose.disconnect();
            return;
        }

        // Ask for confirmation
        console.log('⚠️  This will create payment history records for all currently paid students.');
        console.log('⚠️  This is a ONE-TIME operation and should only be run once.\n');

        // Check if any payment history already exists
        const existingHistoryCount = await PaymentHistory.countDocuments();
        if (existingHistoryCount > 0) {
            console.log(`⚠️  WARNING: ${existingHistoryCount} payment history records already exist!`);
            console.log('⚠️  Running this script may create duplicate records.\n');
        }

        // Process each paid student
        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const student of paidStudents) {
            try {
                // Check if history already exists for this student
                const existingHistory = await PaymentHistory.findOne({
                    student: student._id,
                    paymentDate: student.paymentDate
                });

                if (existingHistory) {
                    console.log(`⏭️  Skipped: ${student.fullName} (history already exists)`);
                    skipped++;
                    continue;
                }

                // Create payment history record
                const paymentHistory = new PaymentHistory({
                    student: student._id,
                    studentName: student.fullName,
                    amount: student.paymentAmount || 0,
                    paymentDate: student.paymentDate || new Date(),
                    markedAsPaidDate: new Date(), // Use current date as marked date
                    markedBy: systemAdmin._id,
                    markedByName: systemAdmin.username,
                    formation: student.formation || [],
                    branch: student.branchSubgroupName || null,
                    notes: 'Historical payment record created by migration script'
                });

                await paymentHistory.save();
                console.log(`✅ Created: ${student.fullName} - ${student.paymentAmount} MAD`);
                created++;

            } catch (error) {
                console.error(`❌ Error processing ${student.fullName}:`, error.message);
                errors++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:');
        console.log('='.repeat(60));
        console.log(`✅ Records Created: ${created}`);
        console.log(`⏭️  Records Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`📋 Total Processed: ${paidStudents.length}`);
        console.log('='.repeat(60) + '\n');

        if (created > 0) {
            console.log('✅ Migration completed successfully!');
            console.log('📄 Payment journals can now be exported for these students.\n');
        } else {
            console.log('ℹ️  No new records created. All students already have payment history.\n');
        }

        // Disconnect
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
if (require.main === module) {
    console.log('\n' + '='.repeat(60));
    console.log('Payment History Migration Script');
    console.log('='.repeat(60) + '\n');
    
    migratePaymentHistory();
}

module.exports = { migratePaymentHistory };
