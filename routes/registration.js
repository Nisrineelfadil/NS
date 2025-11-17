const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Settings = require('../models/Settings');
const { generateRegistrationPDF } = require('../services/pdfGenerator');
const notificationService = require('../services/notificationService');

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
router.post('/register', upload.single('photo'), async (req, res) => {
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
                formationChoisie = [formationChoisie];
            }
        }
        
        if (typeof filiere === 'string') {
            try {
                filiere = JSON.parse(filiere);
            } catch (e) {
                // If it's not JSON, treat as single value and convert to array
                filiere = filiere ? [filiere] : [];
            }
        }

        // Validate required fields (email and parentName removed)
        if (!fullName || !dateOfBirth || !phoneNumber || !cin || !city || 
            !parentPhone || !studyLevel || !formationChoisie || formationChoisie.length === 0) {
            
            // Log which fields are missing
            const missingFields = [];
            if (!fullName) missingFields.push('fullName');
            if (!dateOfBirth) missingFields.push('dateOfBirth');
            if (!phoneNumber) missingFields.push('phoneNumber');
            if (!cin) missingFields.push('cin');
            if (!city) missingFields.push('city');
            if (!parentPhone) missingFields.push('parentPhone');
            if (!studyLevel) missingFields.push('studyLevel');
            if (!formationChoisie || formationChoisie.length === 0) missingFields.push('formationChoisie');
            
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

        if (!phoneRegex.test(parentPhone)) {
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

        // Check if CIN already exists
        const existingStudent = await Student.findOne({ cin });
        if (existingStudent) {
            return res.status(400).json({ 
                success: false, 
                message: 'A student with this ID number already exists' 
            });
        }

        // Convert photo to base64 for database storage (Vercel compatible)
        const photoBase64 = req.file.buffer.toString('base64');
        const photoData = `data:${req.file.mimetype};base64,${photoBase64}`;

        // Create new student record
        const student = new Student({
            fullName,
            dateOfBirth,
            phoneNumber,
            cin,
            city,
            email: email || '',
            parentName: parentName || '',
            parentPhone,
            studyLevel,
            formationChoisie: Array.isArray(formationChoisie) ? formationChoisie : [formationChoisie],
            filiere: Array.isArray(filiere) && filiere.length > 0 ? filiere : [],
            photoPath: photoData // Store as base64 data URL
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
