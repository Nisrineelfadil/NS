const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
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
    cin: {
        type: String,
        required: false,
        trim: true,
        sparse: true,
        default: null
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true
    },
    parentName: {
        type: String,
        required: false,
        trim: true
    },
    parentPhone: {
        type: String,
        required: false,
        trim: true,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^0[5-7][0-9]{8}$/.test(v);
            },
            message: 'Parent phone number must be a valid Moroccan number (format: 06XXXXXXXX)'
        }
    },
    studyLevel: {
        type: String,
        required: true,
        trim: true
    },
    formationChoisie: {
        type: [String],
        required: false,
        default: [],
        enum: ['Allemand', 'Anglais', 'Français', 'Ausbildung']
    },
    filiere: {
        type: [String],
        required: false,
        enum: ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière']
    },
    photoPath: {
        type: String,
        required: true
    },
    pdfPath: {
        type: String,
        required: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Admin Registration Tracking
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    registeredByName: {
        type: String,
        default: null
    },
    creditEarned: {
        type: Number,
        default: 0
    },
    // Google Drive Backup Information
    driveBackup: {
        fileId: {
            type: String,
            default: null
        },
        fileName: {
            type: String,
            default: null
        },
        webViewLink: {
            type: String,
            default: null
        },
        uploadedAt: {
            type: Date,
            default: null
        },
        isBackedUp: {
            type: Boolean,
            default: false
        }
    },
    // Status change tracking
    statusChangedAt: {
        type: Date,
        default: null
    },
    // Transfer to ManagedStudent tracking
    transferredToManagement: {
        type: Boolean,
        default: false
    },
    managedStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedStudent',
        default: null
    },
    // Firebase Cloud Messaging tokens for push notifications
    fcmTokens: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('Student', studentSchema);
