const mongoose = require('mongoose');

const branchGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['default', 'custom'],
        default: 'default',
        required: true
    },
    formation: {
        type: String,
        required: true,
        enum: [
            'Informatique',
            'Gériatrie', 
            'Aide soignant',
            'Agent socio éducatif',
            'Assistante sociale',
            'Restauration',
            'Cuisine',
            'Gestion hôtelière'
        ]
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    icon: {
        type: String,
        default: '🎓'
    },
    color: {
        type: String,
        default: '#667eea'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    createdByName: {
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

// Update timestamp before saving
branchGroupSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to create default branch groups
branchGroupSchema.statics.createDefaults = async function(createdBy, createdByName) {
    const defaultBranches = [
        {
            name: 'IT',
            formation: 'Informatique',
            displayName: 'Information Technology',
            description: 'Computer Science and IT programs',
            icon: '💻',
            color: '#667eea'
        },
        {
            name: 'Nursing',
            formation: 'Gériatrie',
            displayName: 'Nursing & Geriatrics',
            description: 'Healthcare and elderly care programs',
            icon: '🏥',
            color: '#f093fb'
        },
        {
            name: 'Healthcare Assistant',
            formation: 'Aide soignant',
            displayName: 'Healthcare Assistant',
            description: 'Nursing assistant and care programs',
            icon: '⚕️',
            color: '#4facfe'
        },
        {
            name: 'Social Education',
            formation: 'Agent socio éducatif',
            displayName: 'Social Education Agent',
            description: 'Social work and education programs',
            icon: '🤝',
            color: '#43e97b'
        },
        {
            name: 'Social Work',
            formation: 'Assistante sociale',
            displayName: 'Social Work',
            description: 'Social assistance and counseling programs',
            icon: '👥',
            color: '#fa709a'
        },
        {
            name: 'Hospitality',
            formation: 'Restauration',
            displayName: 'Restaurant & Hospitality',
            description: 'Restaurant management and service',
            icon: '🍽️',
            color: '#fee140'
        },
        {
            name: 'Culinary Arts',
            formation: 'Cuisine',
            displayName: 'Culinary Arts',
            description: 'Professional cooking and culinary programs',
            icon: '👨‍🍳',
            color: '#f6d365'
        },
        {
            name: 'Hotel Management',
            formation: 'Gestion hôtelière',
            displayName: 'Hotel Management',
            description: 'Hotel and hospitality management',
            icon: '🏨',
            color: '#fbc2eb'
        }
    ];

    const created = [];
    for (const branch of defaultBranches) {
        try {
            const existing = await this.findOne({ name: branch.name });
            if (!existing) {
                const newBranch = await this.create({
                    ...branch,
                    type: 'default',
                    createdBy,
                    createdByName
                });
                created.push(newBranch);
            }
        } catch (error) {
            console.error(`Error creating branch group ${branch.name}:`, error);
        }
    }

    return created;
};

// Static method to get branch group by formation
branchGroupSchema.statics.getByFormation = async function(formation) {
    return await this.findOne({ formation, status: 'active' });
};

module.exports = mongoose.model('BranchGroup', branchGroupSchema);
