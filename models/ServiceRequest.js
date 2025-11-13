const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    serviceType: {
        type: String,
        required: true,
        enum: ['cv', 'applying', 'translation'],
        index: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    // CV Service specific fields
    cvDetails: {
        experience: String,
        education: String,
        skills: String,
        additionalInfo: String,
        fileName: String,
        fileSize: Number,
        dropboxPath: String
    },
    // Applying Service specific fields
    applyingDetails: {
        targetPosition: String,
        targetCompany: String,
        experience: String,
        qualifications: String,
        additionalInfo: String,
        fileName: String,
        fileSize: Number,
        dropboxPath: String
    },
    // Translation Service specific fields
    translationDetails: {
        sourceLanguage: String,
        targetLanguage: String,
        documentType: String,
        pageCount: Number,
        urgency: String,
        additionalInfo: String,
        fileName: String,
        fileSize: Number,
        dropboxPath: String
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    notes: {
        type: String,
        default: ''
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    completedAt: {
        type: Date
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
}, {
    timestamps: true
});

// Index for efficient queries
serviceRequestSchema.index({ serviceType: 1, status: 1 });
serviceRequestSchema.index({ createdAt: -1 });

// Update the updatedAt timestamp before saving
serviceRequestSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
