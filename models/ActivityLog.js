const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    adminRole: {
        type: String,
        enum: ['super_admin', 'employee'],
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login',
            'logout',
            'create_employee',
            'update_employee',
            'delete_employee',
            'activate_employee',
            'deactivate_employee',
            'change_password',
            'change_username',
            'update_settings',
            'approve_student',
            'reject_student',
            'delete_student',
            'download_pdf',
            'delete_message',
            'mark_message_read',
            'view_students',
            'view_messages',
            'view_employees'
        ]
    },
    targetType: {
        type: String,
        enum: ['student', 'employee', 'message', 'settings', 'system'],
        default: 'system'
    },
    targetId: {
        type: String,
        default: null
    },
    targetName: {
        type: String,
        default: null
    },
    details: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
activityLogSchema.index({ adminId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
