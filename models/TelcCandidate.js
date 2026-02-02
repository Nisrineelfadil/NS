const mongoose = require('mongoose');

const telcCandidateSchema = new mongoose.Schema({
    // Personal Information
    fullName: {
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
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    cin: {
        type: String,
        required: false,
        trim: true
    },
    address: {
        type: String,
        required: false,
        trim: true
    },
    city: {
        type: String,
        required: false,
        trim: true
    },

    // Exam Information
    examLevel: {
        type: String,
        required: true,
        enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    },
    examMonth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TelcExamMonth',
        required: true
    },
    examMonthLabel: {
        type: String,
        required: true // e.g., "January 2025"
    },

    // Registration Status
    registrationStatus: {
        type: String,
        enum: ['registered', 'confirmed', 'cancelled', 'moved'],
        default: 'registered'
    },
    registrationSource: {
        type: String,
        enum: ['manual', 'online'],
        default: 'manual'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },

    // Result Information (after exam)
    resultCategory: {
        type: String,
        enum: [null, 'passed', 'failed', 'partial'],
        default: null
    },
    // Detailed results for partial pass
    resultDetails: {
        schriftlich: {
            type: String,
            enum: [null, 'passed', 'failed'],
            default: null
        },
        muendlich: {
            type: String,
            enum: [null, 'passed', 'failed'],
            default: null
        }
    },
    resultDate: {
        type: Date,
        default: null
    },
    resultNotes: {
        type: String,
        trim: true,
        default: ''
    },

    // Certificate (for passed and partial)
    certificate: {
        data: {
            type: String, // Base64 encoded PDF
            default: null
        },
        filename: {
            type: String,
            default: null
        },
        uploadedAt: {
            type: Date,
            default: null
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null
        },
        uploadedByName: {
            type: String,
            default: null
        }
    },

    // Email Status
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date,
        default: null
    },
    emailSentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },

    // Movement History (when moved between months)
    movementHistory: [{
        fromMonth: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TelcExamMonth'
        },
        fromMonthLabel: String,
        toMonth: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TelcExamMonth'
        },
        toMonthLabel: String,
        movedAt: {
            type: Date,
            default: Date.now
        },
        movedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        movedByName: String,
        reason: String
    }],

    // Payment tracking (optional)
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentAmount: {
        type: Number,
        default: 0
    },
    paymentDate: {
        type: Date,
        default: null
    },

    // Notes
    notes: {
        type: String,
        trim: true,
        default: ''
    },

    // Admin tracking
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    addedByName: {
        type: String,
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    lastModifiedByName: {
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
telcCandidateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for efficient queries
telcCandidateSchema.index({ examMonth: 1 });
telcCandidateSchema.index({ examLevel: 1 });
telcCandidateSchema.index({ resultCategory: 1 });
telcCandidateSchema.index({ emailSent: 1 });
telcCandidateSchema.index({ registrationStatus: 1 });
telcCandidateSchema.index({ examMonth: 1, resultCategory: 1 });
telcCandidateSchema.index({ email: 1 });
telcCandidateSchema.index({ phoneNumber: 1 });
telcCandidateSchema.index({ fullName: 'text' }); // Text search

// Virtual for display name with level
telcCandidateSchema.virtual('displayName').get(function() {
    return `${this.fullName} (${this.examLevel})`;
});

// Method to check if certificate is required
telcCandidateSchema.methods.requiresCertificate = function() {
    return this.resultCategory === 'passed' || this.resultCategory === 'partial';
};

// Method to check if ready for email
telcCandidateSchema.methods.isReadyForEmail = function() {
    if (!this.resultCategory) return false;
    if (this.emailSent) return false;
    
    // Passed and partial need certificate uploaded
    if (this.requiresCertificate() && !this.certificate.data) {
        return false;
    }
    
    return true;
};

// Static method to get candidates by category for a month
telcCandidateSchema.statics.getByCategoryForMonth = async function(examMonthId, category) {
    return this.find({
        examMonth: examMonthId,
        resultCategory: category
    }).sort({ fullName: 1 });
};

// Static method to get candidates ready for email
telcCandidateSchema.statics.getReadyForEmail = async function(examMonthId, category) {
    const query = {
        examMonth: examMonthId,
        resultCategory: category,
        emailSent: false
    };
    
    // For passed and partial, also check certificate exists
    if (category === 'passed' || category === 'partial') {
        query['certificate.data'] = { $ne: null };
    }
    
    return this.find(query).sort({ fullName: 1 });
};

module.exports = mongoose.model('TelcCandidate', telcCandidateSchema);
