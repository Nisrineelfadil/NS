const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateAdmin } = require('../middleware/authMiddleware');

// GET /api/notifications - Get all notifications for admin
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 50, skip = 0, unreadOnly = false } = req.query;
        
        let query = {};
        if (unreadOnly === 'true') {
            query = {
                $or: [
                    { read: false },
                    { 'readBy.adminId': { $ne: req.admin.id } }
                ]
            };
        }
        
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();
        
        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.getUnreadCount(req.admin.id);
        
        res.json({
            success: true,
            notifications,
            total,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticateAdmin, async (req, res) => {
    try {
        const unreadCount = await Notification.getUnreadCount(req.admin.id);
        
        res.json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateAdmin, async (req, res) => {
    try {
        const notification = await Notification.markAsRead(req.params.id, req.admin.id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', authenticateAdmin, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { read: false },
                { 'readBy.adminId': { $ne: req.admin.id } }
            ]
        });
        
        for (const notification of notifications) {
            await Notification.markAsRead(notification._id, req.admin.id);
        }
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all as read'
        });
    }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

// DELETE /api/notifications/clear-all - Clear all notifications
router.delete('/clear-all', authenticateAdmin, async (req, res) => {
    try {
        await Notification.deleteMany({});
        
        res.json({
            success: true,
            message: 'All notifications cleared'
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear notifications'
        });
    }
});

module.exports = router;
