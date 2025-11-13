const mongoose = require('mongoose');

const studentMessageSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedStudent',
        required: true
    },
    type: {
        type: String,
        enum: ['payment', 'reminder', 'info', 'announcement', 'notification', 'alert'],
        default: 'info'
    },
    title: {
        type: String,
        required: true,
        default: 'Message'
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual field for mobile app compatibility
studentMessageSchema.virtual('isRead').get(function() {
    return this.read;
});

// Ensure virtuals are included in JSON
studentMessageSchema.set('toJSON', { virtuals: true });
studentMessageSchema.set('toObject', { virtuals: true });

// Index for faster queries
studentMessageSchema.index({ student: 1, createdAt: -1 });
studentMessageSchema.index({ student: 1, read: 1 });

module.exports = mongoose.model('StudentMessage', studentMessageSchema);
