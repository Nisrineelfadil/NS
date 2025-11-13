const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceSession',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedStudent',
        required: true,
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    groupName: {
        type: String,
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    formation: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'present', 'late', 'absent'],
        required: true,
        default: 'pending'
    },
    scanTime: {
        type: Date,
        default: null
    },
    qrGeneratedAt: {
        type: Date,
        required: true
    },
    qrExpiresAt: {
        type: Date,
        required: true
    },
    deviceInfo: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    markedAbsentAutomatically: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries
attendanceRecordSchema.index({ studentId: 1, date: -1 });
attendanceRecordSchema.index({ groupId: 1, date: -1 });
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
attendanceRecordSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
