const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // Format: "2025-2026"
        validate: {
            validator: function(v) {
                return /^\d{4}-\d{4}$/.test(v);
            },
            message: 'Season name must be in format YYYY-YYYY (e.g., 2025-2026)'
        }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                return v > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'upcoming'],
        default: 'upcoming'
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
seasonSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual to check if season is current
seasonSchema.virtual('isCurrent').get(function() {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
});

// Static method to get current active season
seasonSchema.statics.getCurrentSeason = async function() {
    const now = new Date();
    return await this.findOne({
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
    });
};

// Static method to create season from year
seasonSchema.statics.createFromYear = async function(startYear, createdBy, createdByName) {
    const endYear = startYear + 1;
    const name = `${startYear}-${endYear}`;
    
    // September 1st to August 31st
    const startDate = new Date(startYear, 8, 1); // Month 8 = September
    const endDate = new Date(endYear, 7, 31); // Month 7 = August
    
    return await this.create({
        name,
        startDate,
        endDate,
        status: 'upcoming',
        createdBy,
        createdByName
    });
};

module.exports = mongoose.model('Season', seasonSchema);
