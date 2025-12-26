require('dotenv').config();
const mongoose = require('mongoose');

const models = {
    ManagedStudent: require('./models/ManagedStudent'),
    Grade: require('./models/Grade'),
    AttendanceRecord: require('./models/AttendanceRecord'),
    AttendanceSession: require('./models/AttendanceSession'),
    Group: require('./models/Group'),
    BranchGroup: require('./models/BranchGroup'),
    Teacher: require('./models/Teacher'),
    Admin: require('./models/Admin'),
    Season: require('./models/Season'),
    SeasonBackup: require('./models/SeasonBackup'),
    Notification: require('./models/Notification'),
    PushSubscription: require('./models/PushSubscription'),
    Appointment: require('./models/Appointment'),
    CashTransaction: require('./models/CashTransaction'),
    CreditTransaction: require('./models/CreditTransaction'),
    PaymentHistory: require('./models/PaymentHistory'),
    PaymentReminder: require('./models/PaymentReminder'),
    Student: require('./models/Student'),
    ServiceRequest: require('./models/ServiceRequest'),
    Rating: require('./models/Rating'),
    Message: require('./models/Message'),
    StudentMessage: require('./models/StudentMessage'),
    MonthlyNote: require('./models/MonthlyNote'),
    JobApplication: require('./models/JobApplication'),
    ActivityLog: require('./models/ActivityLog'),
    AdminActivity: require('./models/AdminActivity'),
    LoginSession: require('./models/LoginSession'),
    Settings: require('./models/Settings'),
    UnpaidService: require('./models/UnpaidService')
};

async function checkDatabaseSize() {
    try {
        console.log('🔍 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!\n');

        const db = mongoose.connection.db;
        const stats = await db.stats();

        console.log('═══════════════════════════════════════════════════════════');
        console.log('                  📊 DATABASE OVERVIEW');
        console.log('═══════════════════════════════════════════════════════════\n');

        const dataSize = (stats.dataSize / (1024 * 1024)).toFixed(2);
        const storageSize = (stats.storageSize / (1024 * 1024)).toFixed(2);
        const indexSize = (stats.indexSize / (1024 * 1024)).toFixed(2);
        const totalSize = ((stats.dataSize + stats.indexSize) / (1024 * 1024)).toFixed(2);

        console.log(`Database Name:        ${stats.db}`);
        console.log(`Collections:          ${stats.collections}`);
        console.log(`Total Documents:      ${stats.objects.toLocaleString()}`);
        console.log(`Average Doc Size:     ${(stats.avgObjSize / 1024).toFixed(2)} KB\n`);

        console.log(`Data Size:            ${dataSize} MB`);
        console.log(`Storage Size:         ${storageSize} MB`);
        console.log(`Index Size:           ${indexSize} MB`);
        console.log(`Total Size:           ${totalSize} MB\n`);

        console.log('═══════════════════════════════════════════════════════════');
        console.log('              📋 COLLECTION BREAKDOWN');
        console.log('═══════════════════════════════════════════════════════════\n');

        const collections = await db.listCollections().toArray();
        const collectionStats = [];
        let totalDocs = 0;
        let totalDataSizeMB = 0;

        for (const collection of collections) {
            const collName = collection.name;
            try {
                const collStats = await db.command({ collStats: collName });
                
                const count = collStats.count || 0;
                const size = (collStats.size / (1024 * 1024)).toFixed(2);
                const avgDocSize = count > 0 ? (collStats.avgObjSize / 1024).toFixed(2) : 0;
                
                collectionStats.push({
                    name: collName,
                    count: count,
                    size: parseFloat(size),
                    avgDocSize: parseFloat(avgDocSize)
                });

                totalDocs += count;
                totalDataSizeMB += parseFloat(size);
            } catch (err) {
                console.log(`⚠️  Skipping collection ${collName}: ${err.message}`);
            }
        }

        collectionStats.sort((a, b) => b.size - a.size);

        console.log('┌─────────────────────────────┬──────────┬──────────┬────────────┐');
        console.log('│ Collection                  │ Docs     │ Size (MB)│ Avg (KB)   │');
        console.log('├─────────────────────────────┼──────────┼──────────┼────────────┤');

        collectionStats.forEach(stat => {
            const name = stat.name.padEnd(27);
            const count = stat.count.toLocaleString().padStart(8);
            const size = stat.size.toFixed(2).padStart(8);
            const avg = stat.avgDocSize.toFixed(2).padStart(10);
            console.log(`│ ${name} │ ${count} │ ${size} │ ${avg} │`);
        });

        console.log('└─────────────────────────────┴──────────┴──────────┴────────────┘\n');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('           💰 MONGODB ATLAS TIER RECOMMENDATIONS');
        console.log('═══════════════════════════════════════════════════════════\n');

        const totalSizeNum = parseFloat(totalSize);

        console.log('Based on your current usage:\n');

        if (totalSizeNum < 512) {
            console.log('✅ M0 (FREE TIER) - RECOMMENDED');
            console.log('   • Storage: 512 MB');
            console.log('   • Cost: $0/month');
            console.log('   • Your usage: ' + totalSize + ' MB');
            console.log('   • Available: ' + (512 - totalSizeNum).toFixed(2) + ' MB\n');
            console.log('🎉 YOU CAN USE THE FREE TIER! NO MIGRATION NEEDED!\n');
        } else if (totalSizeNum < 2048) {
            console.log('⚠️  M0 FREE TIER EXCEEDED\n');
            console.log('✅ M2 (SHARED) - RECOMMENDED');
            console.log('   • Storage: 2 GB');
            console.log('   • Cost: $9/month');
            console.log('   • Your usage: ' + totalSize + ' MB');
            console.log('   • Available: ' + (2048 - totalSizeNum).toFixed(2) + ' MB\n');
            console.log('💡 Downgrade to M2 to save money ($9 vs $57)\n');
        } else if (totalSizeNum < 5120) {
            console.log('⚠️  M2 TIER EXCEEDED\n');
            console.log('✅ M5 (SHARED) - RECOMMENDED');
            console.log('   • Storage: 5 GB');
            console.log('   • Cost: $25/month');
            console.log('   • Your usage: ' + totalSize + ' MB');
            console.log('   • Available: ' + (5120 - totalSizeNum).toFixed(2) + ' MB\n');
            console.log('💡 Downgrade to M5 to save money ($25 vs $57)\n');
        } else if (totalSizeNum < 10240) {
            console.log('⚠️  M5 TIER EXCEEDED\n');
            console.log('✅ M10 (DEDICATED) - CURRENT TIER');
            console.log('   • Storage: 10 GB');
            console.log('   • Cost: $57/month');
            console.log('   • Your usage: ' + totalSize + ' MB');
            console.log('   • Available: ' + (10240 - totalSizeNum).toFixed(2) + ' MB\n');
            console.log('💡 Consider migration to Supabase ($25/month) or self-hosting ($6/month)\n');
        } else {
            console.log('⚠️  M10 TIER EXCEEDED\n');
            console.log('✅ M20 (DEDICATED) - UPGRADE NEEDED');
            console.log('   • Storage: 20 GB');
            console.log('   • Cost: $120/month');
            console.log('   • Your usage: ' + totalSize + ' MB\n');
            console.log('💡 MIGRATION RECOMMENDED - Supabase or self-hosting will be much cheaper\n');
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('              🧹 CLEANUP OPPORTUNITIES');
        console.log('═══════════════════════════════════════════════════════════\n');

        const testStudents = await models.ManagedStudent.countDocuments({ isTestData: true });
        const oldNotifications = await models.Notification.countDocuments({ 
            createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
        });
        const inactivePushSubs = await models.PushSubscription.countDocuments({ 
            active: false 
        });
        const oldActivityLogs = await models.ActivityLog.countDocuments({ 
            createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } 
        });

        let cleanupPotential = 0;

        if (testStudents > 0) {
            console.log(`📌 Test Students: ${testStudents} documents`);
            console.log('   → Run: node cleanup-test-students.js\n');
            cleanupPotential++;
        }

        if (oldNotifications > 0) {
            console.log(`📌 Old Notifications: ${oldNotifications} documents (>30 days)`);
            console.log('   → Should auto-delete, check TTL index\n');
            cleanupPotential++;
        }

        if (inactivePushSubs > 0) {
            console.log(`📌 Inactive Push Subscriptions: ${inactivePushSubs} documents`);
            console.log('   → Run cleanup via admin panel\n');
            cleanupPotential++;
        }

        if (oldActivityLogs > 0) {
            console.log(`📌 Old Activity Logs: ${oldActivityLogs} documents (>90 days)`);
            console.log('   → Consider archiving or deleting\n');
            cleanupPotential++;
        }

        if (cleanupPotential === 0) {
            console.log('✅ No obvious cleanup opportunities found\n');
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('                 💡 RECOMMENDATIONS');
        console.log('═══════════════════════════════════════════════════════════\n');

        if (totalSizeNum < 512) {
            console.log('1. ✅ Stay on MongoDB Atlas M0 (FREE)');
            console.log('2. ❌ NO migration needed');
            console.log('3. 💰 Savings: Already free!\n');
        } else if (totalSizeNum < 2048) {
            console.log('1. ✅ Downgrade to M2 ($9/month)');
            console.log('2. ❌ NO migration needed');
            console.log('3. 💰 Savings: $48/month ($576/year)\n');
        } else if (totalSizeNum < 5120) {
            console.log('1. ✅ Downgrade to M5 ($25/month)');
            console.log('2. ❌ NO migration needed');
            console.log('3. 💰 Savings: $32/month ($384/year)\n');
        } else {
            console.log('1. 🤔 Consider Supabase migration ($25/month)');
            console.log('2. 🤔 Consider self-hosting MongoDB ($6/month)');
            console.log('3. 💰 Potential savings: $32-51/month\n');
        }

        console.log('═══════════════════════════════════════════════════════════\n');

        await mongoose.connection.close();
        console.log('✅ Analysis complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabaseSize();
