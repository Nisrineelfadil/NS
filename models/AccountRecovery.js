const mongoose = require('mongoose');

// One document per recovery code sent. The code itself is never stored: only an HMAC of it.
const accountRecoverySchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    purpose: { type: String, enum: ['temporary_access', 'factory_reset'], default: 'temporary_access' },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    usedAt: { type: Date, default: null },
    invalidatedAt: { type: Date, default: null },
    ipAddress: { type: String, default: '' },
    // removed automatically one day after creation
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

module.exports = mongoose.model('AccountRecovery', accountRecoverySchema);
