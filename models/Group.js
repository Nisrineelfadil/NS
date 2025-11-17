const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    // Hierarchical structure
    groupType: {
        type: String,
        enum: ['language', 'branch'],
        required: true,
        default: 'language'
    },
    season: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
        required: true  // Now required for both language and branch groups
    },
    seasonName: {
        type: String,
        required: true  // Now required for both language and branch groups
    },
    branchGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BranchGroup',
        required: function() {
            return this.groupType === 'branch';
        }
    },
    branchGroupName: {
        type: String,
        required: function() {
            return this.groupType === 'branch';
        }
    },
    maxStudents: {
        type: Number,
        required: true,
        default: 30,
        min: 1
    },
    currentStudentCount: {
        type: Number,
        default: 0,
        min: 0
    },
    formation: {
        type: String,
        required: true,
        enum: [
            // Language formations
            'Allemand', 'Anglais', 'Français', 'Ausbildung', 'Mixed',
            // Branch formations
            'Gériatrie', 'Aide soignant', 'Agent socio éducatif', 
            'Assistante sociale', 'Restauration', 'Cuisine', 
            'Informatique', 'Gestion hôtelière'
        ]
    },
    // Legacy field - kept for backward compatibility
    branchFormation: {
        type: String,
        enum: [
            'Gériatrie', 'Aide soignant', 'Agent socio éducatif', 
            'Assistante sociale', 'Restauration', 'Cuisine', 
            'Informatique', 'Gestion hôtelière', 'Mixed', 'None'
        ],
        default: 'None'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
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

// Update the updatedAt timestamp before saving
groupSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
groupSchema.index({ season: 1, groupType: 1 });
groupSchema.index({ branchGroup: 1, groupType: 1 });
groupSchema.index({ formation: 1, status: 1 });
groupSchema.index({ name: 1, season: 1 }, { unique: true, sparse: true });

// Static method to get language groups by season
groupSchema.statics.getLanguageGroupsBySeason = async function(seasonId) {
    return await this.find({
        groupType: 'language',
        season: seasonId,
        status: 'active'
    }).populate('season');
};

// Static method to get branch subgroups
groupSchema.statics.getBranchSubgroups = async function(branchGroupId) {
    return await this.find({
        groupType: 'branch',
        branchGroup: branchGroupId,
        status: 'active'
    }).populate('branchGroup');
};

// Static method to get all groups organized hierarchically
groupSchema.statics.getHierarchical = async function() {
    const Season = mongoose.model('Season');
    const BranchGroup = mongoose.model('BranchGroup');
    
    const seasons = await Season.find({ status: { $ne: 'archived' } }).sort({ startDate: -1 });
    const branchGroups = await BranchGroup.find({ status: 'active' }).sort({ name: 1 });
    
    const result = {
        seasons: [],
        branches: []
    };
    
    for (const season of seasons) {
        const groups = await this.find({
            groupType: 'language',
            season: season._id,
            status: 'active'
        }).sort({ name: 1 });
        
        result.seasons.push({
            season,
            groups
        });
    }
    
    for (const branchGroup of branchGroups) {
        const groups = await this.find({
            groupType: 'branch',
            branchGroup: branchGroup._id,
            status: 'active'
        }).sort({ name: 1 });
        
        result.branches.push({
            branchGroup,
            groups
        });
    }
    
    return result;
};

module.exports = mongoose.model('Group', groupSchema);
