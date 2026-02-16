const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const managedStudentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: false
    },
    address: {
        type: String,
        required: false,
        trim: true
    },
    cin: {
        type: String,
        required: false,
        trim: true
    },
    city: {
        type: String,
        required: false,
        trim: true
    },
    studyLevel: {
        type: String,
        required: false
        // No enum - allows any value including custom "Autre" text
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
    parentPhone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^0[5-7][0-9]{8}$/.test(v);
            },
            message: 'Parent phone number must be a valid Moroccan number (format: 06XXXXXXXX)'
        }
    },
    schoolEmail: {
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
    emailPassword: {
        type: String,
        required: true
    },
    plainTextPassword: {
        type: String,
        required: false,
        select: false  // Don't include by default in queries for security
    },
    formation: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'At least one formation must be selected'
        },
        enum: ['Allemand', 'Anglais', 'Français', 'Ausbildung']
    },
    filiere: {
        type: [String],
        required: false,
        enum: ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière']
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: false  // Allow null for pending assignment
    },
    groupName: {
        type: String,
        required: false,
        default: 'Pending Assignment'
    },
    branchSubgroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: false
    },
    branchSubgroupName: {
        type: String,
        required: false
    },
    paymentPlan: {
        type: String,
        enum: ['pm', 'trimestrial', 'semestriel', 'annuel'],
        default: 'pm'
    },
    paymentDate: {
        type: Date,
        required: true
    },
    paymentAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'overdue', 'cancelled'],
        default: 'pending'
    },
    paymentReminderSent: {
        type: Boolean,
        default: false
    },
    lastReminderDate: {
        type: Date,
        default: null
    },
    reminderDaysBefore: {
        type: Number,
        default: 7,
        min: 1
    },
    photoPath: {
        type: String,
        default: null
    },
    // CIN Card Management
    cinCard: {
        front: {
            type: String, // Base64 or file path
            default: null
        },
        back: {
            type: String, // Base64 or file path
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
        },
        addLater: {
            type: Boolean,
            default: false
        },
        reminderSent: {
            type: Boolean,
            default: false
        },
        lastReminderDate: {
            type: Date,
            default: null
        }
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending_assignment', 'active', 'inactive', 'graduated', 'dropped'],
        default: 'active'
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    addedByName: {
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
    // FCM tokens for push notifications
    fcmTokens: {
        type: [String],
        default: []
    }
});

// Hash email password before saving
managedStudentSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('emailPassword')) {
        return next();
    }
    
    try {
        // Store plain text password for ID card display
        this.plainTextPassword = this.emailPassword;
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        this.emailPassword = await bcrypt.hash(this.emailPassword, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
managedStudentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.emailPassword);
};

// Virtual to check if payment reminder should be sent
managedStudentSchema.virtual('shouldSendReminder').get(function() {
    if (this.paymentStatus === 'paid' || this.paymentReminderSent) {
        return false;
    }
    
    const now = new Date();
    const reminderDate = new Date(this.paymentDate);
    reminderDate.setDate(reminderDate.getDate() - this.reminderDaysBefore);
    
    return now >= reminderDate && now < this.paymentDate;
});

// Virtual to check if payment is overdue
managedStudentSchema.virtual('isPaymentOverdue').get(function() {
    if (this.paymentStatus === 'paid') {
        return false;
    }
    
    const now = new Date();
    return now > this.paymentDate;
});

module.exports = mongoose.model('ManagedStudent', managedStudentSchema);
