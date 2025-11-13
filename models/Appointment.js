const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    purpose: {
        type: String,
        required: true,
        trim: true
    },
    appointmentDate: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    createdByName: {
        type: String,
        required: true
    },
    completedAt: {
        type: Date
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    completedByName: {
        type: String
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
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ phoneNumber: 1, appointmentDate: -1 });
appointmentSchema.index({ fullName: 'text', purpose: 'text' });

// Update the updatedAt timestamp before saving
appointmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
