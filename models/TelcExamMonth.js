const mongoose = require('mongoose');

const telcExamMonthSchema = new mongoose.Schema({
    // Month identification
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    label: {
        type: String,
        required: true // e.g., "January 2025"
    },

    // Exam date (actual exam day)
    examDate: {
        type: Date,
        required: false
    },

    // Capacity Management
    maxCapacity: {
        type: Number,
        required: true,
        default: 150
    },
    emergencyReserve: {
        type: Number,
        required: true,
        default: 50
    },
    currentCount: {
        type: Number,
        default: 0
    },

    // Status
    isOpen: {
        type: Boolean,
        default: true
    },
    isLocked: {
        type: Boolean,
        default: false // When exam is done, lock the month
    },

    // Super Admin Reserve Unlock
    reserveUnlocked: {
        type: Boolean,
        default: false
    },
    reserveUnlockedAt: {
        type: Date,
        default: null
    },
    reserveUnlockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    reserveUnlockedByName: {
        type: String,
        default: null
    },

    // Auto-overflow settings
    autoOverflowEnabled: {
        type: Boolean,
        default: true
    },
    overflowToMonth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TelcExamMonth',
        default: null
    },

    // Capacity alert sent
    capacityAlertSent: {
        type: Boolean,
        default: false
    },
    capacityAlertSentAt: {
        type: Date,
        default: null
    },

    // Results distribution status
    resultsReceived: {
        type: Boolean,
        default: false
    },
    resultsReceivedAt: {
        type: Date,
        default: null
    },
    resultsDistributed: {
        type: Boolean,
        default: false
    },
    resultsDistributedAt: {
        type: Date,
        default: null
    },

    // Statistics (cached for performance)
    stats: {
        registered: { type: Number, default: 0 },
        confirmed: { type: Number, default: 0 },
        cancelled: { type: Number, default: 0 },
        passed: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        partial: { type: Number, default: 0 },
        emailsSent: { type: Number, default: 0 }
    },

    // Lock tracking
    lockedAt: {
        type: Date,
        default: null
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    lockedByName: {
        type: String,
        default: null
    },

    // Cloud backup info
    cloudBackup: {
        backedUp: { type: Boolean, default: false },
        backupDate: { type: Date, default: null },
        folderPath: { type: String, default: null },
        filesUploaded: { type: Number, default: 0 }
    },

    // Notes
    notes: {
        type: String,
        trim: true,
        default: ''
    },

    // Admin tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    createdByName: {
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

// Compound unique index for month/year
telcExamMonthSchema.index({ month: 1, year: 1 }, { unique: true });
telcExamMonthSchema.index({ isOpen: 1 });
telcExamMonthSchema.index({ year: 1, month: 1 });

// Update timestamp on save
telcExamMonthSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for effective capacity (with or without reserve)
telcExamMonthSchema.virtual('effectiveCapacity').get(function() {
    if (this.reserveUnlocked) {
        return this.maxCapacity + this.emergencyReserve;
    }
    return this.maxCapacity;
});

// Virtual for available slots
telcExamMonthSchema.virtual('availableSlots').get(function() {
    return Math.max(0, this.effectiveCapacity - this.currentCount);
});

// Virtual for capacity percentage
telcExamMonthSchema.virtual('capacityPercentage').get(function() {
    if (this.effectiveCapacity === 0) return 0;
    return Math.round((this.currentCount / this.effectiveCapacity) * 100);
});

// Virtual to check if at capacity
telcExamMonthSchema.virtual('isAtCapacity').get(function() {
    return this.currentCount >= this.effectiveCapacity;
});

// Virtual to check if main capacity reached (for alert)
telcExamMonthSchema.virtual('isMainCapacityReached').get(function() {
    return this.currentCount >= this.maxCapacity;
});

// Method to check if can accept more candidates
telcExamMonthSchema.methods.canAcceptCandidate = function() {
    if (this.isLocked || !this.isOpen) return false;
    return this.currentCount < this.effectiveCapacity;
};

// Method to increment count
telcExamMonthSchema.methods.incrementCount = async function() {
    this.currentCount += 1;
    await this.save();
    return this.currentCount;
};

// Method to decrement count
telcExamMonthSchema.methods.decrementCount = async function() {
    if (this.currentCount > 0) {
        this.currentCount -= 1;
        await this.save();
    }
    return this.currentCount;
};

// Static method to get or create month
telcExamMonthSchema.statics.getOrCreateMonth = async function(month, year, adminId, adminName) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let examMonth = await this.findOne({ month, year });
    
    if (!examMonth) {
        examMonth = await this.create({
            month,
            year,
            label: `${monthNames[month - 1]} ${year}`,
            createdBy: adminId,
            createdByName: adminName
        });
    }
    
    return examMonth;
};

// Static method to get next available month
telcExamMonthSchema.statics.getNextAvailableMonth = async function(fromMonth, fromYear) {
    let month = fromMonth;
    let year = fromYear;
    
    // Try next 12 months
    for (let i = 0; i < 12; i++) {
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
        
        const examMonth = await this.findOne({ month, year, isOpen: true, isLocked: false });
        if (examMonth && examMonth.canAcceptCandidate()) {
            return examMonth;
        }
    }
    
    return null;
};

// Static method to update stats for a month
telcExamMonthSchema.statics.updateStats = async function(examMonthId) {
    const TelcCandidate = mongoose.model('TelcCandidate');
    
    const stats = await TelcCandidate.aggregate([
        { $match: { examMonth: new mongoose.Types.ObjectId(examMonthId) } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                registered: {
                    $sum: { $cond: [{ $eq: ['$registrationStatus', 'registered'] }, 1, 0] }
                },
                confirmed: {
                    $sum: { $cond: [{ $eq: ['$registrationStatus', 'confirmed'] }, 1, 0] }
                },
                cancelled: {
                    $sum: { $cond: [{ $eq: ['$registrationStatus', 'cancelled'] }, 1, 0] }
                },
                moved: {
                    $sum: { $cond: [{ $eq: ['$registrationStatus', 'moved'] }, 1, 0] }
                },
                passed: {
                    $sum: { $cond: [{ $eq: ['$resultCategory', 'passed'] }, 1, 0] }
                },
                failed: {
                    $sum: { $cond: [{ $eq: ['$resultCategory', 'failed'] }, 1, 0] }
                },
                partial: {
                    $sum: { $cond: [{ $eq: ['$resultCategory', 'partial'] }, 1, 0] }
                },
                emailsSent: {
                    $sum: { $cond: ['$emailSent', 1, 0] }
                }
            }
        }
    ]);
    
    const monthStats = stats[0] || {
        registered: 0,
        confirmed: 0,
        cancelled: 0,
        moved: 0,
        passed: 0,
        failed: 0,
        partial: 0,
        emailsSent: 0
    };
    
    // Update the month document
    // Count all non-cancelled candidates (registered, confirmed, and moved)
    await this.findByIdAndUpdate(examMonthId, {
        currentCount: (monthStats.registered || 0) + (monthStats.confirmed || 0) + (monthStats.moved || 0),
        stats: {
            registered: monthStats.registered || 0,
            confirmed: monthStats.confirmed || 0,
            cancelled: monthStats.cancelled || 0,
            passed: monthStats.passed || 0,
            failed: monthStats.failed || 0,
            partial: monthStats.partial || 0,
            emailsSent: monthStats.emailsSent || 0
        }
    });
    
    return monthStats;
};

module.exports = mongoose.model('TelcExamMonth', telcExamMonthSchema);
