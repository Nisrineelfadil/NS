const mongoose = require('mongoose');

const seasonBackupSchema = new mongoose.Schema({
    season: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
        required: true,
        index: true
    },
    seasonName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'failed'],
        default: 'in_progress',
        index: true
    },
    stats: {
        totalStudents: {
            type: Number,
            default: 0
        },
        totalGroups: {
            type: Number,
            default: 0
        },
        languageGroups: {
            type: Number,
            default: 0
        },
        branchGroups: {
            type: Number,
            default: 0
        },
        totalFiles: {
            type: Number,
            default: 0
        },
        totalSize: {
            type: Number,
            default: 0
        },
        totalSizeMB: {
            type: Number,
            default: 0
        }
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    megaUpload: {
        success: {
            type: Boolean,
            default: false
        },
        fileName: String,
        filePath: String,
        folder: String,
        shareLink: String,
        size: Number
    },
    localPath: {
        type: String,
        default: null
    },
    error: {
        message: String,
        stack: String
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
        default: Date.now,
        index: true
    },
    completedAt: {
        type: Date,
        default: null
    }
});

// Index for efficient queries
seasonBackupSchema.index({ season: 1, createdAt: -1 });
seasonBackupSchema.index({ status: 1, createdAt: -1 });

// Virtual to check if backup is recent (within 30 days)
seasonBackupSchema.virtual('isRecent').get(function() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt >= thirtyDaysAgo;
});

// Static method to get latest backup for a season
seasonBackupSchema.statics.getLatestForSeason = async function(seasonId) {
    return await this.findOne({
        season: seasonId,
        status: 'completed'
    }).sort({ createdAt: -1 });
};

// Static method to get backup history
seasonBackupSchema.statics.getHistory = async function(limit = 10) {
    return await this.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('season', 'name startDate endDate status')
        .populate('createdBy', 'username email');
};

module.exports = mongoose.model('SeasonBackup', seasonBackupSchema);
