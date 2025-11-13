const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    isRegistrationOpen: {
        type: Boolean,
        default: true
    },
    contactPhone: {
        type: String,
        default: '+212 6XX XXX XXX'
    },
    closedMessage: {
        type: String,
        default: 'Registration is currently closed. For more information, please contact us.'
    },
    // Service toggles
    isCvServiceOpen: {
        type: Boolean,
        default: true
    },
    isApplyingServiceOpen: {
        type: Boolean,
        default: true
    },
    isTranslationServiceOpen: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
