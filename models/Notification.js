const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['registration', 'service_request', 'rating', 'appointment', 'message'],
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    relatedModel: {
        type: String,
        required: true,
        enum: ['Student', 'ServiceRequest', 'Rating', 'Appointment', 'Message']
    },
    metadata: {
        studentName: String,
        serviceType: String,
        rating: Number,
        appointmentDate: Date,
        priority: String
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readBy: [{
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
        expires: 2592000 // Auto-delete after 30 days
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ type: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
    try {
        const notification = new this(data);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, adminId) {
    try {
        const notification = await this.findById(notificationId);
        if (!notification) return null;
        
        // Check if admin already marked as read
        const alreadyRead = notification.readBy.some(
            r => r.adminId.toString() === adminId.toString()
        );
        
        if (!alreadyRead) {
            notification.readBy.push({ adminId, readAt: new Date() });
            notification.read = true;
            await notification.save();
        }
        
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(adminId) {
    try {
        const count = await this.countDocuments({
            $or: [
                { read: false },
                { 'readBy.adminId': { $ne: adminId } }
            ]
        });
        return count;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

module.exports = mongoose.model('Notification', notificationSchema);
