const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const attendanceSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4()
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
        required: true
    },
    classStartTime: {
        type: Date,
        required: true
    },
    classEndTime: {
        type: Date,
        required: true
    },
    qrGeneratedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    qrExpiresAt: {
        type: Date,
        required: true
    },
    lateThresholdMinutes: {
        type: Number,
        default: 15,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'completed', 'cancelled'],
        default: 'active'
    },
    totalStudents: {
        type: Number,
        default: 0
    },
    presentCount: {
        type: Number,
        default: 0
    },
    lateCount: {
        type: Number,
        default: 0
    },
    absentCount: {
        type: Number,
        default: 0
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

// Update the updatedAt timestamp before saving
attendanceSessionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if session is still valid (for present status)
attendanceSessionSchema.methods.isValid = function() {
    const now = new Date();
    return this.status === 'active' && now <= this.qrExpiresAt;
};

// Method to check if session is in late period (after QR expires, before late threshold ends)
attendanceSessionSchema.methods.isInLatePeriod = function() {
    const now = new Date();
    const lateDeadline = new Date(this.qrExpiresAt);
    lateDeadline.setMinutes(lateDeadline.getMinutes() + this.lateThresholdMinutes);
    return this.status === 'active' && now > this.qrExpiresAt && now <= lateDeadline;
};

// Method to check if scan is late (after initial QR validity period)
attendanceSessionSchema.methods.isLate = function(scanTime) {
    // Late period starts AFTER qrExpiresAt and lasts for lateThresholdMinutes
    return scanTime > this.qrExpiresAt;
};

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
