const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    adminUsername: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            // Student Management
            'student_created', 'student_updated', 'student_deleted', 'student_viewed',
            'student_password_changed', 'student_password_viewed', 'student_pdf_generated',
            'student_backup_dropbox', 'student_payment_marked_paid', 'student_message_sent',
            'student_exported',
            
            // Teacher Management
            'teacher_created', 'teacher_updated', 'teacher_deleted', 'teacher_viewed',
            'teacher_password_changed',
            
            // Group Management
            'group_created', 'group_updated', 'group_deleted', 'group_viewed',
            
            // Grade Management
            'grade_created', 'grade_updated', 'grade_deleted', 'grade_viewed',
            
            // Message Management
            'message_viewed', 'message_replied', 'message_deleted',
            
            // Service/CV Management
            'service_viewed', 'service_accepted', 'service_rejected', 'service_deleted',
            
            // Registration Management
            'registration_viewed', 'registration_approved', 'registration_rejected',
            
            // Employee Management (Super Admin)
            'employee_created', 'employee_updated', 'employee_deleted', 'employee_viewed',
            
            // System Actions
            'login', 'logout', 'settings_changed', 'export_data', 'backup_created',
            
            // Payment Reminders
            'payment_reminder_sent', 'payment_reminder_viewed',
            
            // Attendance
            'attendance_marked', 'attendance_viewed', 'attendance_exported',
            
            // Other
            'other'
        ]
    },
    targetType: {
        type: String,
        enum: ['student', 'teacher', 'group', 'grade', 'message', 'service', 'registration', 'employee', 'system', 'payment', 'attendance', 'other'],
        required: false
    },
    targetId: {
        type: String,
        required: false
    },
    targetName: {
        type: String,
        required: false
    },
    details: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    platform: {
        type: String,
        enum: ['web', 'desktop', 'mobile', 'unknown'],
        default: 'unknown'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
adminActivitySchema.index({ adminId: 1, timestamp: -1 });
adminActivitySchema.index({ action: 1, timestamp: -1 });
adminActivitySchema.index({ targetType: 1, targetId: 1 });
adminActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);
