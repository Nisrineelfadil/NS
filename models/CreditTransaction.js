const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['registration', 'bonus', 'penalty', 'adjustment'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null
    },
    studentName: {
        type: String,
        default: null
    },
    description: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    performedByName: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
creditTransactionSchema.index({ adminId: 1, createdAt: -1 });
creditTransactionSchema.index({ transactionType: 1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
