const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Import models
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');

async function migrateAttendanceStatus() {
    try {
        console.log('\n🔄 Starting attendance status migration...\n');

        // Find all active sessions (not expired)
        const activeSessions = await AttendanceSession.find({ 
            status: 'active',
            qrExpiresAt: { $gt: new Date() }
        });

        console.log(`📋 Found ${activeSessions.length} active session(s)\n`);

        let totalUpdated = 0;

        for (const session of activeSessions) {
            // Update all 'absent' records to 'pending' for active sessions
            // These are students who haven't scanned yet but the session is still valid
            const result = await AttendanceRecord.updateMany(
                {
                    sessionId: session.sessionId,
                    status: 'absent',
                    scanTime: null  // Only update if they haven't scanned
                },
                {
                    $set: { 
                        status: 'pending',
                        markedAbsentAutomatically: false
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`  ✓ Session ${session.sessionId} (${session.groupName} - ${session.formation}): ${result.modifiedCount} records updated to 'pending'`);
                totalUpdated += result.modifiedCount;
            }
        }

        console.log(`\n✅ Migration complete! Total records updated: ${totalUpdated}`);
        console.log('\n📊 Summary:');
        console.log(`   - Active sessions processed: ${activeSessions.length}`);
        console.log(`   - Records changed from 'absent' to 'pending': ${totalUpdated}`);
        console.log('\n💡 Students can now scan their attendance codes successfully!\n');

    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run migration
migrateAttendanceStatus();
