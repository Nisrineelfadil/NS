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
seasonSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // If setting this season to active, deactivate all other seasons
    if (this.status === 'active' && this.isModified('status')) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, status: 'active' },
            { $set: { status: 'archived' } }
        );
    }
    
    // Validate no date overlap with other seasons
    if (this.isNew || this.isModified('startDate') || this.isModified('endDate')) {
        const overlapping = await this.constructor.findOne({
            _id: { $ne: this._id },
            $or: [
                // New season starts during existing season
                { startDate: { $lte: this.startDate }, endDate: { $gte: this.startDate } },
                // New season ends during existing season
                { startDate: { $lte: this.endDate }, endDate: { $gte: this.endDate } },
                // New season completely contains existing season
                { startDate: { $gte: this.startDate }, endDate: { $lte: this.endDate } }
            ]
        });
        
        if (overlapping) {
            const error = new Error(`Season dates overlap with existing season: ${overlapping.name}`);
            error.name = 'ValidationError';
            return next(error);
        }
    }
    
    next();
});

// Virtual to check if season is current
seasonSchema.virtual('isCurrent').get(function() {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
});

// Static method to get current active season
seasonSchema.statics.getCurrentSeason = async function() {
    // First try to find active season
    let season = await this.findOne({ status: 'active' });
    
    // If no active season, find by current date
    if (!season) {
        const now = new Date();
        season = await this.findOne({
            startDate: { $lte: now },
            endDate: { $gte: now }
        });
    }
    
    return season;
};

// Static method to activate a season (ensures only one active)
seasonSchema.statics.activateSeason = async function(seasonId) {
    // Deactivate all seasons
    await this.updateMany(
        { status: 'active' },
        { $set: { status: 'archived' } }
    );
    
    // Activate the target season
    const season = await this.findByIdAndUpdate(
        seasonId,
        { $set: { status: 'active' } },
        { new: true }
    );
    
    return season;
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
