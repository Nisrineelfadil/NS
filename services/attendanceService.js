const cron = require('node-cron');
const axios = require('axios');

class AttendanceService {
    constructor() {
        this.cronJob = null;
        this.isRunning = false;
    }

    /**
     * Start the attendance service
     * @param {number} intervalMinutes - How often to check for expired sessions (default: 15 minutes)
     */
    start(intervalMinutes = 15) {
        if (this.isRunning) {
            console.log('⚠️  Attendance service is already running');
            return;
        }

        // Create cron expression based on interval
        // For every X minutes: */X * * * *
        const cronExpression = `*/${intervalMinutes} * * * *`;

        console.log(`🎯 Starting Attendance Service...`);
        console.log(`📅 Will check for expired sessions every ${intervalMinutes} minutes`);

        this.cronJob = cron.schedule(cronExpression, async () => {
            await this.markAbsentStudents();
        });

        this.isRunning = true;
        console.log('✅ Attendance Service started successfully');

        // Run immediately on startup
        this.markAbsentStudents();
    }

    /**
     * Stop the attendance service
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('🛑 Attendance Service stopped');
        }
    }

    /**
     * Mark absent students for expired sessions
     */
    async markAbsentStudents() {
        try {
            console.log('🔍 Checking for expired attendance sessions...');

            const AttendanceSession = require('../models/AttendanceSession');
            const AttendanceRecord = require('../models/AttendanceRecord');

            // Find all active sessions that have expired
            const now = new Date();
            const expiredSessions = await AttendanceSession.find({
                status: 'active',
                qrExpiresAt: { $lt: now }
            });

            if (expiredSessions.length === 0) {
                console.log('✅ No expired sessions found');
                return;
            }

            console.log(`📋 Found ${expiredSessions.length} expired session(s)`);

            let totalMarked = 0;

            for (const session of expiredSessions) {
                // Mark all pending/absent (not scanned) students as absent with auto-flag
                // Handle both 'pending' (new) and 'absent' (old) status for backward compatibility
                const result = await AttendanceRecord.updateMany(
                    {
                        sessionId: session.sessionId,
                        status: { $in: ['pending', 'absent'] },
                        scanTime: null  // Only mark if they never scanned
                    },
                    {
                        $set: { 
                            status: 'absent',
                            markedAbsentAutomatically: true 
                        }
                    }
                );

                totalMarked += result.modifiedCount;

                // Update session status
                session.status = 'expired';
                await session.save();

                console.log(`  ✓ Session ${session.sessionId} (${session.groupName} - ${session.formation}): ${result.modifiedCount} students marked absent`);
            }

            console.log(`✅ Total: ${totalMarked} students marked as absent across ${expiredSessions.length} sessions`);

        } catch (error) {
            console.error('❌ Error in attendance service:', error);
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            cronJob: this.cronJob ? 'Active' : 'Inactive'
        };
    }
}

// Export singleton instance
module.exports = new AttendanceService();
