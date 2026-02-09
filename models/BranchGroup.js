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
            name: 'Informatique',
            formation: 'Informatique',
            displayName: 'Informatique',
            description: 'Programmes d\'informatique et de technologie',
            icon: '💻',
            color: '#667eea'
        },
        {
            name: 'Gériatrie',
            formation: 'Gériatrie',
            displayName: 'Gériatrie',
            description: 'Programmes de soins gériatriques et de santé',
            icon: '🏥',
            color: '#f093fb'
        },
        {
            name: 'Aide Soignant',
            formation: 'Aide soignant',
            displayName: 'Aide Soignant',
            description: 'Programmes d\'aide soignant et de soins',
            icon: '⚕️',
            color: '#4facfe'
        },
        {
            name: 'Agent Socio Éducatif',
            formation: 'Agent socio éducatif',
            displayName: 'Agent Socio Éducatif',
            description: 'Programmes d\'éducation sociale',
            icon: '🤝',
            color: '#43e97b'
        },
        {
            name: 'Assistante Sociale',
            formation: 'Assistante sociale',
            displayName: 'Assistante Sociale',
            description: 'Programmes d\'assistance sociale et de conseil',
            icon: '👥',
            color: '#fa709a'
        },
        {
            name: 'Restauration',
            formation: 'Restauration',
            displayName: 'Restauration',
            description: 'Gestion de restaurant et service hôtelier',
            icon: '🍽️',
            color: '#fee140'
        },
        {
            name: 'Cuisine',
            formation: 'Cuisine',
            displayName: 'Cuisine',
            description: 'Programmes de cuisine professionnelle et arts culinaires',
            icon: '👨‍🍳',
            color: '#f6d365'
        },
        {
            name: 'Gestion Hôtelière',
            formation: 'Gestion hôtelière',
            displayName: 'Gestion Hôtelière',
            description: 'Gestion hôtelière et hébergement',
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
