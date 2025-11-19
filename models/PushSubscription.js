const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedStudent',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    deviceInfo: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
pushSubscriptionSchema.index({ student: 1, active: 1 });
pushSubscriptionSchema.index({ endpoint: 1 });

// Auto-expire inactive subscriptions after 90 days
pushSubscriptionSchema.index({ lastUsed: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
