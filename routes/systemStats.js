const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ManagedStudent = require('../models/ManagedStudent');
const Teacher = require('../models/Teacher');
const Grade = require('../models/Grade');
const PaymentReminder = require('../models/PaymentReminder');
const Group = require('../models/Group');
const { authenticateAdmin } = require('../middleware/authMiddleware');

// Get comprehensive system statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        console.log('📊 Fetching system statistics...');

        // Get database stats (fast estimates)
        const db = mongoose.connection.db;
        
        // Use cached stats or quick estimates
        const collectionStats = {};
        
        // Quick count-based estimates (much faster than sampling)
        const avgSizes = {
            managedstudents: 5000,  // ~5KB per student
            teachers: 2000,          // ~2KB per teacher
            grades: 500,             // ~500B per grade
            paymentreminders: 300,   // ~300B per reminder
            groups: 1000,            // ~1KB per group
            sessions: 200,           // ~200B per session
            admins: 1000             // ~1KB per admin
        };

        // Get document counts in parallel (FAST!)
        const [
            studentsCount,
            teachersCount,
            gradesCount,
            remindersCount,
            groupsCount
        ] = await Promise.all([
            ManagedStudent.countDocuments(),
            Teacher.countDocuments(),
            Grade.countDocuments(),
            PaymentReminder.countDocuments(),
            Group.countDocuments()
        ]);
        
        // Quick estimate storage sizes (no sampling needed!)
        collectionStats.managedstudents = {
            size: studentsCount * avgSizes.managedstudents,
            count: studentsCount,
            avgObjSize: avgSizes.managedstudents
        };
        
        collectionStats.teachers = {
            size: teachersCount * avgSizes.teachers,
            count: teachersCount,
            avgObjSize: avgSizes.teachers
        };
        
        collectionStats.grades = {
            size: gradesCount * avgSizes.grades,
            count: gradesCount,
            avgObjSize: avgSizes.grades
        };
        
        collectionStats.paymentreminders = {
            size: remindersCount * avgSizes.paymentreminders,
            count: remindersCount,
            avgObjSize: avgSizes.paymentreminders
        };
        
        collectionStats.groups = {
            size: groupsCount * avgSizes.groups,
            count: groupsCount,
            avgObjSize: avgSizes.groups
        };
        
        // Seasons count (quick check)
        let seasonsCount = 0;
        collectionStats.seasons = { size: 0, count: 0, avgObjSize: 0 };

        // Calculate storage by category
        const studentStorage = collectionStats.managedstudents.size;
        const gradeStorage = collectionStats.grades.size;
        const reminderStorage = collectionStats.paymentreminders.size;
        const teacherStorage = collectionStats.teachers.size;
        const groupStorage = collectionStats.groups.size;
        const seasonStorage = collectionStats.seasons.size;

        // Quick photo storage estimate (FAST!)
        const photosCount = await ManagedStudent.countDocuments({ 
            photoPath: { $exists: true, $ne: null, $ne: '' } 
        });
        
        // Estimate: average photo is ~50KB base64
        const photoStorage = photosCount * 50000;

        // Calculate total used storage (quick estimate)
        const totalSize = studentStorage + gradeStorage + reminderStorage + 
                         teacherStorage + groupStorage + seasonStorage + photoStorage;
        const totalDataSize = totalSize;
        const totalStorageSize = Math.round(totalSize * 1.2); // Add 20% overhead
        const totalIndexSize = Math.round(totalSize * 0.1); // Estimate 10% for indexes

        // Database capacity (MongoDB default is unlimited, but we'll set a soft limit)
        const softLimit = 10 * 1024 * 1024 * 1024; // 10GB soft limit
        const usagePercentage = (totalSize / softLimit) * 100;

        // Get historical data (last 30 days) - simplified
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentStudents = await ManagedStudent.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const recentGrades = await Grade.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Calculate growth trend
        const growthTrend = {
            students: recentStudents,
            grades: recentGrades,
            period: '30 days'
        };

        // Last cleanup timestamp (placeholder - implement actual cleanup tracking)
        const lastCleanup = new Date(); // TODO: Track actual cleanup operations

        // Get Dropbox storage info (FAST estimate)
        const dropboxStorage = {
            used: studentsCount * 200000, // Estimate ~200KB per student PDF
            total: 2 * 1024 * 1024 * 1024, // 2GB in bytes
            percentage: 0,
            fileCount: studentsCount // Assume 1 PDF per student
        };
        
        dropboxStorage.percentage = (dropboxStorage.used / dropboxStorage.total) * 100;

        // Response data
        const response = {
            database: {
                totalSize: totalSize,
                dataSize: totalDataSize,
                storageSize: totalStorageSize,
                indexSize: totalIndexSize,
                softLimit: softLimit,
                usagePercentage: Math.min(usagePercentage, 100),
                collections: Object.keys(collectionStats).length,
                status: usagePercentage < 80 ? 'healthy' : usagePercentage < 90 ? 'warning' : 'critical'
            },
            dropbox: dropboxStorage,
            storage: {
                students: {
                    size: studentStorage + photoStorage,
                    count: studentsCount,
                    percentage: ((studentStorage + photoStorage) / totalSize) * 100
                },
                photos: {
                    size: photoStorage,
                    count: photosCount,
                    percentage: (photoStorage / totalSize) * 100
                },
                grades: {
                    size: gradeStorage,
                    count: gradesCount,
                    percentage: (gradeStorage / totalSize) * 100
                },
                attendance: {
                    size: reminderStorage,
                    count: remindersCount,
                    percentage: (reminderStorage / totalSize) * 100
                },
                teachers: {
                    size: teacherStorage,
                    count: teachersCount,
                    percentage: (teacherStorage / totalSize) * 100
                },
                groups: {
                    size: groupStorage,
                    count: groupsCount,
                    percentage: (groupStorage / totalSize) * 100
                },
                seasons: {
                    size: seasonStorage,
                    count: seasonsCount,
                    percentage: (seasonStorage / totalSize) * 100
                }
            },
            documents: {
                students: studentsCount,
                teachers: teachersCount,
                grades: gradesCount,
                reminders: remindersCount,
                groups: groupsCount,
                seasons: seasonsCount,
                total: studentsCount + teachersCount + gradesCount + remindersCount + groupsCount + seasonsCount
            },
            growth: growthTrend,
            lastCleanup: lastCleanup,
            collectionDetails: collectionStats,
            timestamp: new Date()
        };

        console.log('✅ System statistics retrieved successfully');
        res.json(response);

    } catch (error) {
        console.error('❌ Error fetching system statistics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch system statistics',
            message: error.message 
        });
    }
});

// Get storage history (last 30 days)
router.get('/storage-history', authenticateAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const history = [];

        // Generate sample data points (in production, store actual daily stats)
        const now = new Date();
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Get approximate count for that date
            const studentsUpToDate = await ManagedStudent.countDocuments({
                createdAt: { $lte: date }
            });

            history.push({
                date: date.toISOString().split('T')[0],
                students: studentsUpToDate,
                // Estimate storage based on count
                estimatedSize: studentsUpToDate * 50000 // ~50KB per student
            });
        }

        res.json({ history, days });

    } catch (error) {
        console.error('Error fetching storage history:', error);
        res.status(500).json({ error: 'Failed to fetch storage history' });
    }
});

// Cleanup old data (placeholder for future implementation)
router.post('/cleanup', authenticateAdmin, async (req, res) => {
    try {
        const { type, olderThan } = req.body;

        // TODO: Implement actual cleanup logic
        // - Archive old seasons
        // - Remove old payment reminders
        // - Compress old grades
        // - Clean up orphaned records

        res.json({
            success: true,
            message: 'Cleanup operation queued',
            type,
            olderThan
        });

    } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({ error: 'Cleanup failed' });
    }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;
