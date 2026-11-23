const mongoose = require('mongoose');

// Security history and director alerts (account recovery, temporary access, password changes, factory reset).
// Alerts are kept separate from the shared notification bell so that no employee can clear them.
const securityEventSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'recovery_code_sent',        // a recovery code was emailed
            'recovery_email_mismatch',   // the email typed did not match the account's recovery email
            'recovery_no_email',         // recovery requested for an account without a recovery email
            'recovery_code_failed',      // wrong recovery code entered
            'temporary_access',          // temporary access granted after email verification
            'temporary_access_repeated', // temporary access used repeatedly (threshold reached)
            'password_changed',          // a permanent password was changed
            'factory_reset_backup',      // backup created before a factory reset
            'factory_reset_code_sent',   // identity code sent for a factory reset
            'factory_reset_denied',      // factory reset attempt refused
            'factory_reset_completed'    // factory reset executed
        ],
        index: true
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', index: true },
    adminName: { type: String, default: '' },
    adminRole: { type: String, default: '' },
    accountLogin: { type: String, default: '' }, // username or login email of the account concerned
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    details: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    // Director alert flags
    alertForDirector: { type: Boolean, default: false, index: true },
    seenByDirector: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true }
});

securityEventSchema.index({ adminId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
