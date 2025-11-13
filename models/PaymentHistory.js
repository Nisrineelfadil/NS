const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedStudent',
        required: true,
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        required: true,
        index: true
    },
    markedAsPaidDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    markedByName: {
        type: String,
        required: true
    },
    formation: {
        type: [String],
        required: false
    },
    branch: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient queries
paymentHistorySchema.index({ student: 1, createdAt: -1 });
paymentHistorySchema.index({ student: 1, paymentDate: -1 });

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
