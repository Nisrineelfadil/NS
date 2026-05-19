const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Settings = require('../models/Settings');
const { generateRegistrationPDF } = require('../services/pdfGenerator');
const notificationService = require('../services/notificationService');
const imageStorageService = require('../services/imageStorageService');
const { verifyCaptcha } = require('../middleware/captchaMiddleware');

// Configure multer for photo uploads (using memory storage for Vercel compatibility)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/register - Submit registration
router.post('/register', upload.single('photo'), verifyCaptcha, async (req, res) => {
    try {
        console.log('📝 Registration request received');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        
        let { 
            fullName, 
            dateOfBirth, 
            phoneNumber, 
            cin, 
            city, 
            email, 
            parentName, 
            parentPhone, 
            studyLevel,
            formationChoisie, 
            filiere 
        } = req.body;

        // Parse JSON arrays if they're strings
        if (typeof formationChoisie === 'string') {
            try {
                formationChoisie = JSON.parse(formationChoisie);
            } catch (e) {
                // If it's not JSON, treat as single value and convert to array
                formationChoisie = formationChoisie ? [formationChoisie] : [];
            }
        }
        if (!formationChoisie) formationChoisie = [];
        
        if (typeof filiere === 'string') {
            try {
                filiere = JSON.parse(filiere);
            } catch (e) {
                // If it's not JSON, treat as single value and convert to array
                filiere = filiere ? [filiere] : [];
            }
        }
        if (!filiere) filiere = [];

        // Validate required fields (email and parentName removed)
        // Student must select at least one language OR one branch
        const hasFormation = formationChoisie && formationChoisie.length > 0;
        const hasFiliere = filiere && filiere.length > 0;
        
        if (!fullName || !dateOfBirth || !phoneNumber || !city || 
            !studyLevel || (!hasFormation && !hasFiliere)) {
            
            // Log which fields are missing
            const missingFields = [];
            if (!fullName) missingFields.push('fullName');
            if (!dateOfBirth) missingFields.push('dateOfBirth');
            if (!phoneNumber) missingFields.push('phoneNumber');
            if (!city) missingFields.push('city');
            if (!studyLevel) missingFields.push('studyLevel');
            if (!hasFormation && !hasFiliere) missingFields.push('formationChoisie or filiere');
            
            console.log('❌ Missing fields:', missingFields);
            
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Validate phone number format (Moroccan local format: 06XXXXXXXX, 07XXXXXXXX, 05XXXXXXXX)
        const phoneRegex = /^0[5-7][0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number must be a valid Moroccan number (format: 06XXXXXXXX, 07XXXXXXXX, or 05XXXXXXXX)' 
            });
        }

        // Validate parentPhone only if provided
        if (parentPhone && !phoneRegex.test(parentPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Parent phone number must be a valid Moroccan number (format: 06XXXXXXXX, 07XXXXXXXX, or 05XXXXXXXX)' 
            });
        }

        // Check if photo was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Photo is required' 
            });
        }

        // Check if CIN already exists (only if CIN was provided)
        if (cin) {
            const existingStudent = await Student.findOne({ cin });
            if (existingStudent) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'A student with this ID number already exists' 
                });
            }
        }

        // Prepare photo path before saving (photoPath is required)
        let photoPath;
        const tempId = new (require('mongoose').Types.ObjectId)();
        try {
            photoPath = await imageStorageService.uploadRegistrationPhoto(req.file.buffer, tempId.toString());
            console.log('Registration photo uploaded to Mega');
        } catch (megaErr) {
            console.error('⚠️ Mega photo upload failed, falling back to base64:', megaErr.message);
            const photoBase64 = req.file.buffer.toString('base64');
            photoPath = `data:${req.file.mimetype};base64,${photoBase64}`;
        }

        // Create new student record with photo already set
        const student = new Student({
            _id: tempId,
            fullName,
            dateOfBirth,
            phoneNumber,
            cin: cin || null,
            city,
            email: email || '',
            parentName: parentName || '',
            parentPhone: parentPhone || null,
            studyLevel,
            formationChoisie: Array.isArray(formationChoisie) ? formationChoisie : [formationChoisie],
            filiere: Array.isArray(filiere) && filiere.length > 0 ? filiere : [],
            photoPath
        });

        await student.save();

        // Generate PDF (skip on Vercel due to filesystem limitations)
        // PDF will be generated on-demand when admin downloads it
        console.log('✅ Student registered successfully. PDF will be generated on-demand.');

        // Send real-time notification to admins
        notificationService.notifyNewRegistration(student).catch(err => {
            console.error('Failed to send notification:', err);
        });

        res.status(201).json({ 
            success: true, 
            message: 'Registration submitted successfully!',
            studentId: student._id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

// GET /api/registration-status - Check if registration is open
router.get('/registration-status', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ 
            isOpen: settings.isRegistrationOpen,
            contactPhone: settings.contactPhone,
            closedMessage: settings.closedMessage
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
