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
        // CFG-01: same rule, now in services/attendanceJobs.js via services/jobRunner.js (lock + run history)
        try {
            const { runDaily } = require('./jobRunner');
            const r = await runDaily({ trigger: 'local-timer', include: ['attendance'] });
            if (r && r.attendance) console.log('Attendance job:', JSON.stringify(r.attendance.applied || r.attendance.planned));
        } catch (error) {
            console.error('❌ Error in attendance service:', error.message);
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
