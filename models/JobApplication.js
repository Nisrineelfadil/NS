const mongoose = require('mongoose');

// Job Application Schema for enhanced Bewerbungsservice
const jobApplicationSchema = new mongoose.Schema({
    // Basic applicant info
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
    
    // Application type: Ausbildung (apprenticeship) or Arbeit (work)
    // Can be null initially when pending review
    applicationType: {
        type: String,
        enum: ['ausbildung', 'arbeit', null],
        default: null,
        index: true
    },
    
    // Job field/category - set by admin during review
    jobField: {
        type: String,
        enum: ['pflege', 'verkaufer', 'gastronomie', 'fleischer', 'maurer', 'other', null],
        default: null,
        index: true
    },
    
    // Requested job type from public form (what user selected)
    requestedJobType: {
        type: String,
        trim: true
    },
    
    // Custom field name if jobField is 'other'
    customJobField: {
        type: String,
        trim: true
    },
    
    // Application status pipeline
    status: {
        type: String,
        enum: [
            'pending_review', // Submitted by client, waiting for admin review
            'new',           // Reviewed and accepted, ready to process
            'erstgespraech', // Initial interview / Language skills test
            'vorvertrag',    // Pre-contract signed with school
            'interview',     // Interview with German employer
            'vertrag',       // Contract received from Germany
            'botschaft',     // Documents submitted to embassy
            'visum',         // Visa obtained
            'completed',     // Process completed
            'cancelled'      // Application cancelled
        ],
        default: 'pending_review',
        index: true
    },
    
    // Status history for tracking progress
    statusHistory: [{
        status: String,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        changedByName: String,
        notes: String
    }],
    
    // Diploma information
    hasDiploma: {
        type: Boolean,
        default: null // null = not reviewed yet
    },
    diplomaType: {
        type: String,
        enum: ['diploma', 'certificate', 'none', null],
        default: null
    },
    diplomaDetails: {
        type: String,
        trim: true
    },
    diplomaReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    diplomaReviewedAt: Date,
    
    // Additional applicant details
    experience: {
        type: String,
        trim: true
    },
    qualifications: {
        type: String,
        trim: true
    },
    languageLevel: {
        type: String,
        enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', null],
        default: null
    },
    additionalInfo: {
        type: String,
        trim: true
    },
    
    // Document uploads
    documents: [{
        fileName: String,
        fileSize: Number,
        filePath: String, // Mega.nz path
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        documentType: {
            type: String,
            enum: ['cv', 'diploma', 'certificate', 'passport', 'other']
        }
    }],
    
    // Admin notes
    notes: {
        type: String,
        default: ''
    },
    
    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
}, {
    timestamps: true
});

// Indexes for efficient queries
jobApplicationSchema.index({ applicationType: 1, status: 1 });
jobApplicationSchema.index({ applicationType: 1, jobField: 1 });
jobApplicationSchema.index({ hasDiploma: 1 });
jobApplicationSchema.index({ createdAt: -1 });

// Update timestamp before saving
jobApplicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get statistics
jobApplicationSchema.statics.getStats = async function(applicationType = null) {
    const query = applicationType ? { applicationType } : {};
    
    const [
        total,
        newCount,
        erstgespraechCount,
        vorvertragCount,
        interviewCount,
        vertragCount,
        botschaftCount,
        visumCount,
        completedCount,
        cancelledCount,
        withDiploma,
        withCertificate
    ] = await Promise.all([
        this.countDocuments(query),
        this.countDocuments({ ...query, status: 'new' }),
        this.countDocuments({ ...query, status: 'erstgespraech' }),
        this.countDocuments({ ...query, status: 'vorvertrag' }),
        this.countDocuments({ ...query, status: 'interview' }),
        this.countDocuments({ ...query, status: 'vertrag' }),
        this.countDocuments({ ...query, status: 'botschaft' }),
        this.countDocuments({ ...query, status: 'visum' }),
        this.countDocuments({ ...query, status: 'completed' }),
        this.countDocuments({ ...query, status: 'cancelled' }),
        this.countDocuments({ ...query, hasDiploma: true }),
        this.countDocuments({ ...query, hasDiploma: false, diplomaType: 'certificate' })
    ]);
    
    return {
        total,
        byStatus: {
            new: newCount,
            erstgespraech: erstgespraechCount,
            vorvertrag: vorvertragCount,
            interview: interviewCount,
            vertrag: vertragCount,
            botschaft: botschaftCount,
            visum: visumCount,
            completed: completedCount,
            cancelled: cancelledCount
        },
        byDiploma: {
            diploma: withDiploma,
            certificate: withCertificate,
            notReviewed: total - withDiploma - withCertificate
        }
    };
};

// Static method to get stats by job field
jobApplicationSchema.statics.getStatsByField = async function(applicationType) {
    const fields = ['pflege', 'verkaufer', 'gastronomie', 'fleischer', 'maurer', 'other'];
    const stats = {};
    
    for (const field of fields) {
        stats[field] = await this.countDocuments({ applicationType, jobField: field });
    }
    
    return stats;
};

// Instance method to update status with history
jobApplicationSchema.methods.updateStatus = async function(newStatus, adminId, adminName, notes = '') {
    this.statusHistory.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy: adminId,
        changedByName: adminName,
        notes
    });
    
    this.status = newStatus;
    
    if (newStatus === 'completed' || newStatus === 'visum') {
        this.completedAt = new Date();
    }
    
    return this.save();
};

// Instance method to set diploma status
jobApplicationSchema.methods.setDiplomaStatus = async function(hasDiploma, diplomaType, details, adminId) {
    this.hasDiploma = hasDiploma;
    this.diplomaType = diplomaType;
    this.diplomaDetails = details;
    this.diplomaReviewedBy = adminId;
    this.diplomaReviewedAt = new Date();
    
    return this.save();
};

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;
