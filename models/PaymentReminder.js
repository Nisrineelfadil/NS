const mongoose = require('mongoose');

const paymentReminderSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedStudent',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    paymentDate: {
        type: Date,
        required: true
    },
    reminderType: {
        type: String,
        enum: ['upcoming', 'overdue', 'manual'],
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    method: {
        type: String,
        enum: ['email', 'sms', 'phone', 'system'],
        default: 'system'
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'pending'],
        default: 'sent'
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    }
});

module.exports = mongoose.model('PaymentReminder', paymentReminderSchema);
