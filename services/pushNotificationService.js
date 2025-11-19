const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

class PushNotificationService {
    constructor() {
        this.vapidKeys = null;
        this.initialized = false;
    }

    // Initialize with VAPID keys
    initialize(publicKey, privateKey, contactEmail) {
        if (!publicKey || !privateKey) {
            console.error('❌ VAPID keys not provided. Push notifications will not work.');
            return false;
        }

        this.vapidKeys = { publicKey, privateKey };
        
        webPush.setVapidDetails(
            `mailto:${contactEmail || 'admin@nisrineschool.com'}`,
            publicKey,
            privateKey
        );

        this.initialized = true;
        console.log('✅ Push Notification Service initialized');
        return true;
    }

    // Get public VAPID key for client subscription
    getPublicKey() {
        return this.vapidKeys?.publicKey || null;
    }

    // Save push subscription
    async subscribe(studentId, studentName, studentEmail, subscription, deviceInfo) {
        try {
            if (!this.initialized) {
                throw new Error('Push service not initialized');
            }

            // Check if subscription already exists
            const existing = await PushSubscription.findOne({ 
                endpoint: subscription.endpoint 
            });

            if (existing) {
                // Update existing subscription
                existing.student = studentId;
                existing.studentName = studentName;
                existing.studentEmail = studentEmail;
                existing.keys = subscription.keys;
                existing.deviceInfo = deviceInfo;
                existing.active = true;
                existing.lastUsed = new Date();
                await existing.save();
                
                console.log(`🔔 Updated push subscription for ${studentName}`);
                return existing;
            }

            // Create new subscription
            const newSubscription = new PushSubscription({
                student: studentId,
                studentName,
                studentEmail,
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                deviceInfo,
                active: true
            });

            await newSubscription.save();
            console.log(`✅ New push subscription created for ${studentName}`);
            
            return newSubscription;
        } catch (error) {
            console.error('Error saving push subscription:', error);
            throw error;
        }
    }

    // Unsubscribe
    async unsubscribe(endpoint) {
        try {
            const result = await PushSubscription.findOneAndUpdate(
                { endpoint },
                { active: false },
                { new: true }
            );

            if (result) {
                console.log(`🔕 Unsubscribed: ${result.studentName}`);
            }

            return result;
        } catch (error) {
            console.error('Error unsubscribing:', error);
            throw error;
        }
    }

    // Send push notification to specific student
    async sendToStudent(studentId, payload) {
        try {
            if (!this.initialized) {
                console.warn('⚠️ Push service not initialized. Skipping push notification.');
                return { success: false, sent: 0 };
            }

            const subscriptions = await PushSubscription.find({
                student: studentId,
                active: true
            });

            if (subscriptions.length === 0) {
                console.log(`📱 No active push subscriptions for student ${studentId}`);
                return { success: true, sent: 0 };
            }

            const results = await Promise.allSettled(
                subscriptions.map(sub => this.sendPushNotification(sub, payload))
            );

            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failedCount = results.filter(r => r.status === 'rejected').length;

            console.log(`📤 Push sent: ${successCount} success, ${failedCount} failed`);

            return { success: true, sent: successCount, failed: failedCount };
        } catch (error) {
            console.error('Error sending push to student:', error);
            return { success: false, error: error.message };
        }
    }

    // Send push notification to multiple students
    async sendToMultipleStudents(studentIds, payload) {
        try {
            if (!this.initialized) {
                console.warn('⚠️ Push service not initialized. Skipping push notifications.');
                return { success: false, sent: 0 };
            }

            const subscriptions = await PushSubscription.find({
                student: { $in: studentIds },
                active: true
            });

            if (subscriptions.length === 0) {
                console.log(`📱 No active push subscriptions found`);
                return { success: true, sent: 0 };
            }

            const results = await Promise.allSettled(
                subscriptions.map(sub => this.sendPushNotification(sub, payload))
            );

            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failedCount = results.filter(r => r.status === 'rejected').length;

            console.log(`📤 Bulk push sent: ${successCount} success, ${failedCount} failed`);

            return { success: true, sent: successCount, failed: failedCount };
        } catch (error) {
            console.error('Error sending bulk push:', error);
            return { success: false, error: error.message };
        }
    }

    // Send push notification to all active students
    async sendToAll(payload) {
        try {
            if (!this.initialized) {
                console.warn('⚠️ Push service not initialized. Skipping push notifications.');
                return { success: false, sent: 0 };
            }

            const subscriptions = await PushSubscription.find({ active: true });

            if (subscriptions.length === 0) {
                console.log(`📱 No active push subscriptions`);
                return { success: true, sent: 0 };
            }

            const results = await Promise.allSettled(
                subscriptions.map(sub => this.sendPushNotification(sub, payload))
            );

            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failedCount = results.filter(r => r.status === 'rejected').length;

            console.log(`📤 Broadcast push sent: ${successCount} success, ${failedCount} failed`);

            return { success: true, sent: successCount, failed: failedCount };
        } catch (error) {
            console.error('Error broadcasting push:', error);
            return { success: false, error: error.message };
        }
    }

    // Internal method to send push notification
    async sendPushNotification(subscription, payload) {
        try {
            const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            };

            const payloadString = JSON.stringify(payload);

            await webPush.sendNotification(pushSubscription, payloadString);

            // Update last used timestamp
            subscription.lastUsed = new Date();
            await subscription.save();

            return { success: true };
        } catch (error) {
            // Handle expired/invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
                console.log(`🗑️ Removing invalid subscription: ${subscription.endpoint}`);
                subscription.active = false;
                await subscription.save();
            }

            throw error;
        }
    }

    // Get subscription count for a student
    async getSubscriptionCount(studentId) {
        try {
            const count = await PushSubscription.countDocuments({
                student: studentId,
                active: true
            });
            return count;
        } catch (error) {
            console.error('Error getting subscription count:', error);
            return 0;
        }
    }

    // Get all active subscriptions (admin)
    async getAllSubscriptions() {
        try {
            const subscriptions = await PushSubscription.find({ active: true })
                .populate('student', 'fullName schoolEmail')
                .sort({ createdAt: -1 });
            return subscriptions;
        } catch (error) {
            console.error('Error getting all subscriptions:', error);
            return [];
        }
    }

    // Clean up expired subscriptions
    async cleanupExpiredSubscriptions() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await PushSubscription.updateMany(
                { lastUsed: { $lt: thirtyDaysAgo }, active: true },
                { active: false }
            );

            console.log(`🧹 Cleaned up ${result.modifiedCount} expired subscriptions`);
            return result.modifiedCount;
        } catch (error) {
            console.error('Error cleaning up subscriptions:', error);
            return 0;
        }
    }
}

// Export singleton instance
module.exports = new PushNotificationService();
