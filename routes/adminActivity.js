const express = require('express');
const router = express.Router();
const AdminActivity = require('../models/AdminActivity');
const Admin = require('../models/Admin');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

// Cache dev admin IDs to avoid repeated DB queries (refresh every 5 minutes)
let cachedDevAdminIds = null;
let devAdminCacheTime = 0;
const DEV_ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getDevAdminIds() {
    const now = Date.now();
    if (cachedDevAdminIds && (now - devAdminCacheTime < DEV_ADMIN_CACHE_DURATION)) {
        return cachedDevAdminIds;
    }
    const devAdmins = await Admin.find({ role: 'dev' }).select('_id').lean();
    cachedDevAdminIds = devAdmins.map(a => a._id);
    devAdminCacheTime = now;
    return cachedDevAdminIds;
}

// Get all activity logs (Super Admin only)
router.get('/logs', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { 
            adminId, 
            action, 
            targetType, 
            platform,
            startDate, 
            endDate, 
            limit = 100,
            page = 1
        } = req.query;

        // Get cached dev admin IDs to exclude from results
        const devAdminIds = await getDevAdminIds();

        const filter = { adminId: { $nin: devAdminIds } };
        
        if (adminId) filter.adminId = adminId;
        if (action) filter.action = action;
        if (targetType) filter.targetType = targetType;
        if (platform) filter.platform = platform;
        
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [activities, total] = await Promise.all([
            AdminActivity.find(filter)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            AdminActivity.countDocuments(filter)
        ]);

        res.json({
            activities,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

// Get activity summary by admin (Super Admin only)
router.get('/summary', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Get cached dev admin IDs to exclude from results
        const devAdminIds = await getDevAdminIds();
        
        const filter = { adminId: { $nin: devAdminIds } };
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const summary = await AdminActivity.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$adminId',
                    adminUsername: { $first: '$adminUsername' },
                    totalActions: { $sum: 1 },
                    actions: { $push: '$action' },
                    lastActivity: { $max: '$timestamp' }
                }
            },
            {
                $project: {
                    adminId: '$_id',
                    adminUsername: 1,
                    totalActions: 1,
                    lastActivity: 1,
                    actionBreakdown: {
                        $arrayToObject: {
                            $map: {
                                input: { $setUnion: '$actions' },
                                as: 'action',
                                in: {
                                    k: '$$action',
                                    v: {
                                        $size: {
                                            $filter: {
                                                input: '$actions',
                                                cond: { $eq: ['$$this', '$$action'] }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            { $sort: { totalActions: -1 } }
        ]);

        res.json(summary);
    } catch (error) {
        console.error('Error fetching activity summary:', error);
        res.status(500).json({ error: 'Failed to fetch activity summary' });
    }
});

// Get recent activities for dashboard (Super Admin only)
router.get('/recent', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get cached dev admin IDs to exclude from results
        const devAdminIds = await getDevAdminIds();

        const activities = await AdminActivity.find({ adminId: { $nin: devAdminIds } })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();

        res.json(activities);
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
});

// Get login sessions with platform detection (Super Admin only)
router.get('/sessions', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get cached dev admin IDs to exclude from results
        const devAdminIds = await getDevAdminIds();
        const filter = { action: 'login', adminId: { $nin: devAdminIds } };

        // Run both queries in parallel for better performance
        const [sessions, total] = await Promise.all([
            AdminActivity.find(filter)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            AdminActivity.countDocuments(filter)
        ]);

        res.json({
            sessions,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching login sessions:', error);
        res.status(500).json({ error: 'Failed to fetch login sessions' });
    }
});

// Clear old activity logs (Super Admin only)
router.delete('/clear', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { olderThan } = req.body; // Days
        
        if (!olderThan) {
            return res.status(400).json({ error: 'olderThan parameter required' });
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));

        const result = await AdminActivity.deleteMany({
            timestamp: { $lt: cutoffDate }
        });

        res.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `Deleted ${result.deletedCount} activity logs older than ${olderThan} days`
        });
    } catch (error) {
        console.error('Error clearing activity logs:', error);
        res.status(500).json({ error: 'Failed to clear activity logs' });
    }
});

module.exports = router;
