const mongoose = require('mongoose');

const loginSessionSchema = new mongoose.Schema({
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
        enum: ['dev', 'super_admin', 'employee'],
        required: true
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    logoutTime: {
        type: Date,
        default: null
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    browser: {
        type: String,
        default: null
    },
    os: {
        type: String,
        default: null
    },
    device: {
        type: String,
        default: null
    },
    platform: {
        type: String,
        enum: ['web', 'desktop', 'mobile', 'unknown'],
        default: 'unknown'
    },
    location: {
        country: String,
        city: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    loginMethod: {
        type: String,
        enum: ['password', 'secret_passcode', '2fa_email'],
        default: 'password'
    }
});

// Index for faster queries
loginSessionSchema.index({ adminId: 1, loginTime: -1 });
loginSessionSchema.index({ isActive: 1 });
loginSessionSchema.index({ loginTime: -1 });

module.exports = mongoose.model('LoginSession', loginSessionSchema);
