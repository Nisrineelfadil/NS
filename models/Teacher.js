const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /@nisrineschool\.com$/.test(v);
            },
            message: 'Email must be a @nisrineschool.com address'
        }
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^0[5-7][0-9]{8}$/.test(v);
            },
            message: 'Phone number must be a valid Moroccan number (format: 06XXXXXXXX)'
        }
    },
    formations: {
        type: [String],
        required: true,
        enum: [
            // Language Formations
            'Allemand', 
            'Anglais', 
            'Français', 
            'Ausbildung',
            // Branch Formations (Filières)
            'Gériatrie',
            'Aide soignant',
            'Agent socio éducatif',
            'Assistante sociale',
            'Restauration',
            'Cuisine',
            'Informatique',
            'Gestion hôtelière'
        ]
    },
    customSubjectLabels: {
        type: Map,
        of: String,
        default: new Map()
    },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
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
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorEmail: { type: String, default: null },
    twoFactorCode: { type: String, default: null },
    twoFactorExpiry: { type: Date, default: null }
});

// Hash password before saving
teacherSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
teacherSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);
