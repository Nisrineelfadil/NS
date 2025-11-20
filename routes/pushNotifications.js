const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pushService = require('../services/pushNotificationService');
const PushSubscription = require('../models/PushSubscription');
const ManagedStudent = require('../models/ManagedStudent');
const { authenticateAdmin } = require('../middleware/authMiddleware');

// Middleware to verify student token
const verifyStudentToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Students only.' });
        }
        req.student = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// ==================== STUDENT ROUTES ====================

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
    try {
        const publicKey = pushService.getPublicKey();
        
        if (!publicKey) {
            return res.status(503).json({ 
                error: 'Push notifications not configured',
                message: 'VAPID keys not set up'
            });
        }

        res.json({ publicKey });
    } catch (error) {
        console.error('Error getting VAPID key:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Subscribe to push notifications
router.post('/subscribe', verifyStudentToken, async (req, res) => {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ 
                error: 'Invalid subscription data',
                message: 'Subscription must include endpoint and keys'
            });
        }

        // Get student details
        const student = await ManagedStudent.findById(req.student.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Save subscription
        const deviceInfo = req.headers['user-agent'] || 'Unknown device';
        const savedSubscription = await pushService.subscribe(
            student._id,
            student.fullName,
            student.schoolEmail,
            subscription,
            deviceInfo
        );

        res.json({ 
            success: true,
            message: 'Push notifications enabled',
            subscription: {
                id: savedSubscription._id,
                createdAt: savedSubscription.createdAt
            }
        });
    } catch (error) {
        console.error('Error subscribing to push:', error);
        res.status(500).json({ 
            error: 'Failed to subscribe',
            message: error.message
        });
    }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', verifyStudentToken, async (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint is required' });
        }

        await pushService.unsubscribe(endpoint);

        res.json({ 
            success: true,
            message: 'Push notifications disabled'
        });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ 
            error: 'Failed to unsubscribe',
            message: error.message
        });
    }
});

// Check subscription status
router.get('/subscription-status', verifyStudentToken, async (req, res) => {
    try {
        const count = await pushService.getSubscriptionCount(req.student.id);

        res.json({ 
            success: true,
            subscribed: count > 0,
            deviceCount: count
        });
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Test push notification (student can test their own)
router.post('/test', verifyStudentToken, async (req, res) => {
    try {
        const payload = {
            title: '🔔 Test Notification',
            body: 'Push notifications are working! You will receive updates for grades, attendance, messages, and payments.',
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            data: {
                type: 'test',
                timestamp: new Date().toISOString()
            }
        };

        const result = await pushService.sendToStudent(req.student.id, payload);

        if (result.sent > 0) {
            res.json({ 
                success: true,
                message: 'Test notification sent',
                devicesSent: result.sent
            });
        } else {
            res.json({ 
                success: false,
                message: 'No active subscriptions found. Please enable notifications first.'
            });
        }
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// ==================== ADMIN ROUTES ====================

// Get all active subscriptions
router.get('/admin/subscriptions', authenticateAdmin, async (req, res) => {
    try {
        const subscriptions = await pushService.getAllSubscriptions();

        res.json({ 
            success: true,
            total: subscriptions.length,
            subscriptions
        });
    } catch (error) {
        console.error('Error getting subscriptions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send test notification to specific student (admin)
router.post('/admin/test/:studentId', authenticateAdmin, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { title, body } = req.body;

        const student = await ManagedStudent.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const payload = {
            title: title || '🔔 Test from Admin',
            body: body || 'This is a test notification from the admin.',
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            data: {
                type: 'admin_test',
                timestamp: new Date().toISOString()
            }
        };

        const result = await pushService.sendToStudent(studentId, payload);

        res.json({ 
            success: true,
            message: `Notification sent to ${student.fullName}`,
            devicesSent: result.sent
        });
    } catch (error) {
        console.error('Error sending admin test:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Broadcast notification to all students (admin)
router.post('/admin/broadcast', authenticateAdmin, async (req, res) => {
    try {
        const { title, body, type } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const payload = {
            title,
            body,
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            data: {
                type: type || 'broadcast',
                timestamp: new Date().toISOString()
            }
        };

        const result = await pushService.sendToAll(payload);

        res.json({ 
            success: true,
            message: 'Broadcast sent',
            devicesSent: result.sent,
            devicesFailed: result.failed || 0
        });
    } catch (error) {
        console.error('Error broadcasting:', error);
        res.status(500).json({ error: 'Failed to broadcast' });
    }
});

// Clean up expired subscriptions (admin)
router.post('/admin/cleanup', authenticateAdmin, async (req, res) => {
    try {
        const count = await pushService.cleanupExpiredSubscriptions();

        res.json({ 
            success: true,
            message: `Cleaned up ${count} expired subscriptions`,
            cleaned: count
        });
    } catch (error) {
        console.error('Error cleaning up:', error);
        res.status(500).json({ error: 'Failed to cleanup' });
    }
});

// Get push notification statistics (admin)
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalActive = await PushSubscription.countDocuments({ active: true });
        const totalInactive = await PushSubscription.countDocuments({ active: false });
        
        const uniqueStudents = await PushSubscription.distinct('student', { active: true });
        
        const recentSubscriptions = await PushSubscription.find({ active: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('student', 'fullName schoolEmail');

        res.json({ 
            success: true,
            stats: {
                totalActive,
                totalInactive,
                uniqueStudents: uniqueStudents.length,
                recentSubscriptions
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
