const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const ManagedStudent = require('../models/ManagedStudent');
const PaymentReminder = require('../models/PaymentReminder');
const PaymentHistory = require('../models/PaymentHistory');
const StudentMessage = require('../models/StudentMessage');
const Admin = require('../models/Admin');
const BranchGroup = require('../models/BranchGroup');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');
const { notifyAdminMessage } = require('../services/notificationService');

// Lazy load Firebase Admin to prevent server crash
let firebaseAdmin = null;
function getFirebaseAdmin() {
    if (firebaseAdmin === null) {
        try {
            firebaseAdmin = require('../config/firebase-admin');
        } catch (error) {
            console.warn('⚠️ Firebase Admin not available:', error.message);
            firebaseAdmin = { sendPushNotification: () => null };
        }
    }
    return firebaseAdmin;
}

// Helper function to send FCM notification to student
async function sendFCMNotification(studentId, title, body, extraData = {}) {
    try {
        const { sendPushNotification } = getFirebaseAdmin();
        if (!sendPushNotification) {
            console.warn('⚠️ Push notifications not available');
            return { sent: 0, failed: 0 };
        }

        // Find the ManagedStudent to get their FCM tokens
        const student = await ManagedStudent.findById(studentId);
        
        if (!student || !student.fcmTokens || student.fcmTokens.length === 0) {
            console.log('⚠️ No FCM tokens found for student:', studentId);
            return { sent: 0, failed: 0 };
        }

        let sent = 0;
        let failed = 0;
        const invalidTokens = [];

        // Send notification to all registered devices
        for (const token of student.fcmTokens) {
            const result = await sendPushNotification(token, title, body, {
                type: extraData.type || 'message',
                url: extraData.url || '/pwa/messages',
                ...extraData
            });

            if (result) {
                if (result.error === 'invalid_token') {
                    // Mark token for removal
                    invalidTokens.push(token);
                    failed++;
                } else {
                    sent++;
                }
            } else {
                failed++;
            }
        }

        // Clean up invalid tokens
        if (invalidTokens.length > 0) {
            student.fcmTokens = student.fcmTokens.filter(t => !invalidTokens.includes(t));
            await student.save();
            console.log(`🗑️ Removed ${invalidTokens.length} invalid FCM token(s) for ${student.fullName}`);
        }

        console.log(`✅ FCM notification: ${sent} sent, ${failed} failed for ${student.fullName}`);
        return { sent, failed };
    } catch (error) {
        console.error('❌ Error sending FCM notification:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

// Multer configuration for student photos
// Use memory storage for Vercel compatibility (serverless doesn't support disk storage)
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const storage = isProduction 
    ? multer.memoryStorage() // Use memory storage on Vercel
    : multer.diskStorage({    // Use disk storage locally
        destination: async (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../uploads/managed-students');
            try {
                await fs.mkdir(uploadDir, { recursive: true });
                cb(null, uploadDir);
            } catch (error) {
                cb(error);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Multer configuration for CIN card uploads (supports multiple files)
const cinUpload = multer({
    storage: multer.memoryStorage(), // Always use memory storage for CIN
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit to accommodate both photo and CIN
    fileFilter: (req, file, cb) => {
        // Allow both image files (for photo and CIN) and PDFs (for CIN)
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || 
                         file.mimetype === 'image/png' || file.mimetype === 'application/pdf';
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
        }
    }
});

// Import CIN validation middleware
const { validateCINUpload, validateCINFormat } = require('../middleware/cinValidationMiddleware');
const imageOptimizer = require('../utils/imageOptimizer');
const imageStorageService = require('../services/imageStorageService');
const { generatePaymentJournalPDF } = require('../services/paymentJournalGenerator');

// Use imported authentication middleware from authMiddleware.js

// ==================== GROUP MANAGEMENT ROUTES ====================

// Get all groups
router.get('/groups', authenticateAdmin, async (req, res) => {
    try {
        const { status, formation, season, groupType } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (formation) filter.formation = formation;
        if (season) filter.season = season;
        if (groupType) filter.groupType = groupType;
        
        const groups = await Group.find(filter)
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// Get single group
router.get('/groups/:id', authenticateAdmin, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('createdBy', 'username email');
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // Get students in this group
        const students = await ManagedStudent.find({ group: group._id })
            .select('-emailPassword')
            .sort({ fullName: 1 });
        
        res.json({ success: true, group, students });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
});

// Create new group (All admins)
router.post('/groups', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, maxStudents, formation, branchFormation, groupType, season, seasonName } = req.body;
        
        // Validate required fields
        if (!name || !maxStudents) {
            return res.status(400).json({ error: 'Name and max students are required' });
        }
        
        // Determine season to use first (needed for uniqueness check)
        const Season = require('../models/Season');
        let targetSeason;
        let targetSeasonName;
        
        if (season && seasonName) {
            // Use season provided from frontend (Phase 2 UI)
            targetSeason = season;
            targetSeasonName = seasonName;
            
            // Verify season exists
            const seasonDoc = await Season.findById(season);
            if (!seasonDoc) {
                return res.status(400).json({ error: 'Invalid season ID' });
            }
        } else {
            // Auto-detect or create season (legacy compatibility)
            let currentSeason = await Season.getCurrentSeason();
            
            if (!currentSeason) {
                const currentYear = new Date().getFullYear();
                const nextYear = currentYear + 1;
                currentSeason = new Season({
                    name: `${currentYear}-${nextYear}`,
                    startDate: new Date(currentYear, 8, 1), // September 1st
                    endDate: new Date(nextYear, 6, 31), // July 31st
                    status: 'active',
                    createdBy: req.adminId,
                    createdByName: req.admin.username
                });
                await currentSeason.save();
            }
            
            targetSeason = currentSeason._id;
            targetSeasonName = currentSeason.name;
        }
        
        // Check if group name already exists in this season (season-scoped uniqueness)
        const existingGroup = await Group.findOne({ 
            name, 
            season: targetSeason 
        });
        if (existingGroup) {
            return res.status(400).json({ 
                error: `Group name "${name}" already exists in season ${targetSeasonName}` 
            });
        }
        
        const group = new Group({
            name,
            description: description || '',
            maxStudents,
            formation: formation || 'Mixed',
            branchFormation: branchFormation || 'Mixed',
            // Phase 2 fields
            groupType: groupType || 'language',
            season: targetSeason,
            seasonName: targetSeasonName,
            createdBy: req.adminId,
            createdByName: req.admin.username
        });
        
        await group.save();
        
        res.json({ 
            success: true, 
            message: 'Group created successfully',
            group 
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Update group (All admins)
router.put('/groups/:id', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, maxStudents, formation, status } = req.body;
        
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // Check if new name conflicts with existing group in same season
        if (name && name !== group.name) {
            const existingGroup = await Group.findOne({ 
                name, 
                season: group.season,  // Check within same season only
                _id: { $ne: group._id } 
            });
            if (existingGroup) {
                return res.status(400).json({ 
                    error: `Group name "${name}" already exists in season ${group.seasonName}` 
                });
            }
            group.name = name;
        }
        
        if (description !== undefined) group.description = description;
        if (maxStudents) group.maxStudents = maxStudents;
        if (formation) group.formation = formation;
        if (status) group.status = status;
        
        await group.save();
        
        // Update group name in all students if name changed
        if (name && name !== group.name) {
            await ManagedStudent.updateMany(
                { group: group._id },
                { groupName: name }
            );
        }
        
        res.json({ 
            success: true, 
            message: 'Group updated successfully',
            group 
        });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

// Delete group (All admins)
router.delete('/groups/:id', authenticateAdmin, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // Check if group has students
        const studentCount = await ManagedStudent.countDocuments({ group: group._id });
        if (studentCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete group with ${studentCount} students. Please move or remove students first.` 
            });
        }
        
        await Group.findByIdAndDelete(req.params.id);
        
        res.json({ 
            success: true, 
            message: 'Group deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

// ==================== STUDENT MANAGEMENT ROUTES ====================

// Get all students with filters
router.get('/students', authenticateAdmin, async (req, res) => {
    try {
        const { 
            group, 
            formation, 
            filiere, 
            status, 
            paymentStatus,
            branchSubgroup,
            search,
            season,  // Add season parameter
            page = 1,
            limit = 50
        } = req.query;
        
        const filter = {};
        
        // Filter by season (default to active season if not specified)
        let seasonGroupIds = [];
        if (season) {
            // Get groups from specified season
            const seasonGroups = await Group.find({ season: season }).select('_id');
            seasonGroupIds = seasonGroups.map(g => g._id);
        } else {
            // Default: filter by active season
            const Season = require('../models/Season');
            const activeSeason = await Season.findOne({ status: 'active' });
            if (activeSeason) {
                const activeSeasonGroups = await Group.find({ season: activeSeason._id }).select('_id');
                seasonGroupIds = activeSeasonGroups.map(g => g._id);
            }
        }
        
        // Apply group filter
        const andConditions = [];
        
        if (group) {
            // Specific group requested - use it directly
            andConditions.push({ group: group });
        } else if (seasonGroupIds.length > 0) {
            // No specific group - show season students AND unassigned carry-over students
            andConditions.push({
                $or: [
                    { group: { $in: seasonGroupIds } },
                    { group: null, status: 'active' }
                ]
            });
        }
        
        // Apply other filters
        if (formation) andConditions.push({ formation: { $in: [formation] } });
        if (filiere) andConditions.push({ filiere: { $in: [filiere] } });
        if (status) andConditions.push({ status: status });
        if (paymentStatus) andConditions.push({ paymentStatus: paymentStatus });
        if (branchSubgroup) andConditions.push({ branchSubgroup: branchSubgroup });
        
        if (search) {
            andConditions.push({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { schoolEmail: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ]
            });
        }
        
        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // PERFORMANCE OPTIMIZATION: Exclude photos from initial load for faster response
        const students = await ManagedStudent.find(filter)
            .select('-emailPassword -photoPath') // Exclude photos for speed
            .populate('group', 'name season seasonName')
            .populate('addedBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // Convert to plain objects for faster processing
        
        // Add hasPhoto flag without loading the actual photo
        const optimizedStudents = students.map(student => {
            return {
                ...student,
                hasPhoto: false // Photos will be loaded lazily via /students/:id/photo endpoint
            };
        });
        
        const total = await ManagedStudent.countDocuments(filter);
        
        res.json({ 
            success: true, 
            students: optimizedStudents,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get student photo only (lightweight endpoint for lazy loading)
router.get('/students/:id/photo', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id)
            .select('photoPath')
            .lean();
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json({ 
            success: true, 
            photoPath: student.photoPath || null,
            hasPhoto: !!student.photoPath
        });
    } catch (error) {
        console.error('Error fetching student photo:', error);
        res.status(500).json({ error: 'Failed to fetch photo' });
    }
});

// Get single student
router.get('/students/:id', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id)
            .select('-emailPassword')
            .populate('group', 'name maxStudents')
            .populate('addedBy', 'username email');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Try to populate season if it exists (optional field)
        if (student.season) {
            try {
                await student.populate('season', 'name startDate endDate');
            } catch (seasonError) {
                console.log('Season field not available or error populating:', seasonError.message);
            }
        }
        
        res.json({ success: true, student });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student', details: error.message });
    }
});

// Add new student
router.post('/students', 
    authenticateAdmin, 
    cinUpload.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'cinFront', maxCount: 1 },
        { name: 'cinBack', maxCount: 1 }
    ]),
    validateCINFormat,
    validateCINUpload({
        required: false,
        requireBothSides: true,
        optimize: true
    }),
    async (req, res) => {
    try {
        console.log('=== Creating Student ===');
        console.log('Request body:', req.body);
        console.log('Admin ID:', req.adminId);
        console.log('File:', req.file);
        
        const {
            fullName,
            dateOfBirth,
            address,
            cin,
            city,
            studyLevel,
            phoneNumber,
            parentPhone,
            schoolEmail,
            emailPassword,
            formation,
            filiere,
            group,
            paymentDate,
            paymentAmount,
            paymentPlan,
            reminderDaysBefore,
            notes
        } = req.body;
        
        // Validate required fields
        if (!fullName || !phoneNumber || !parentPhone || !schoolEmail || !emailPassword || !group || !paymentDate || !paymentAmount) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'All required fields must be provided' });
        }
        
        console.log('All required fields present');
        
        // Check if email already exists
        const existingStudent = await ManagedStudent.findOne({ schoolEmail });
        if (existingStudent) {
            return res.status(400).json({ error: 'School email already exists' });
        }
        
        // Validate group exists and has space
        console.log('Checking group:', group);
        const groupDoc = await Group.findById(group);
        if (!groupDoc) {
            console.log('Group not found');
            return res.status(404).json({ error: 'Group not found' });
        }
        console.log('Group found:', groupDoc.name);
        
        if (groupDoc.currentStudentCount >= groupDoc.maxStudents) {
            console.log('Group is full');
            return res.status(400).json({ error: 'Group is full' });
        }
        
        // Get admin info
        console.log('Getting admin:', req.adminId);
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            console.log('Admin not found');
            return res.status(404).json({ error: 'Admin not found' });
        }
        console.log('Admin found:', admin.username);
        
        // Parse formation and filiere (both are optional — student can have language only, branch only, or both)
        const formationArray = formation ? (Array.isArray(formation) ? formation : [formation]) : [];
        const filiereArray = filiere ? (Array.isArray(filiere) ? filiere : [filiere]) : [];
        
        console.log('Formation array:', formationArray);
        console.log('Filiere array:', filiereArray);
        
        // Handle photo upload - upload to Mega.nz instead of storing base64 in MongoDB
        let photoPath = null;
        const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
        // We'll upload photo after saving student to get the ID
        
        // Handle CIN card upload - will upload to Mega after saving
        let cinCardData = {
            front: null,
            back: null,
            uploadedAt: null,
            uploadedBy: null,
            uploadedByName: null,
            addLater: req.body.cinAddLater === 'true' || req.body.cinAddLater === true,
            reminderSent: false,
            lastReminderDate: null
        };
        
        // Don't hash password here - let the pre-save hook handle it
        console.log('Creating student object...');
        const student = new ManagedStudent({
            fullName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            address: address || '',
            cin: cin || '',
            city: city || '',
            studyLevel: studyLevel || '',
            phoneNumber,
            parentPhone,
            schoolEmail: schoolEmail.toLowerCase(),
            emailPassword, // Will be hashed by pre-save hook
            formation: formationArray,
            filiere: filiereArray,
            group,
            groupName: groupDoc.name,
            paymentPlan: paymentPlan || 'pm',
            paymentDate: new Date(paymentDate),
            paymentAmount: parseFloat(paymentAmount),
            reminderDaysBefore: reminderDaysBefore || 7,
            photoPath: photoPath,
            cinCard: cinCardData,
            notes: notes || '',
            addedBy: req.adminId,
            addedByName: admin.username
        });
        
        console.log('Saving student to database...');
        await student.save();
        console.log('Student saved successfully!');
        
        // Now upload images to Mega.nz using the student ID
        const studentId = student._id.toString();
        let needsUpdate = false;
        
        // Upload photo to Mega
        if (photoFile) {
            try {
                const optimized = await imageOptimizer.optimizeStudentPhoto(photoFile.buffer);
                student.photoPath = await imageStorageService.uploadStudentPhoto(optimized.buffer, studentId);
                needsUpdate = true;
                console.log('Photo uploaded to Mega:', student.photoPath);
            } catch (megaErr) {
                console.error('⚠️ Mega photo upload failed, falling back to base64:', megaErr.message);
                const base64Image = photoFile.buffer.toString('base64');
                student.photoPath = `data:${photoFile.mimetype};base64,${base64Image}`;
                needsUpdate = true;
            }
        }
        
        // Upload CIN cards to Mega
        if (req.cinValidation && !req.cinValidation.addLater) {
            if (req.cinValidation.front) {
                try {
                    const buffer = req.cinValidation.front.optimizedBuffer || req.cinValidation.front.buffer;
                    cinCardData.front = await imageStorageService.uploadCINImage(buffer, studentId, 'front');
                    console.log('CIN front uploaded to Mega');
                } catch (megaErr) {
                    console.error('⚠️ Mega CIN front upload failed, falling back to base64:', megaErr.message);
                    const buffer = req.cinValidation.front.optimizedBuffer || req.cinValidation.front.buffer;
                    cinCardData.front = imageOptimizer.imageToBase64(buffer, 'jpeg');
                }
            }
            if (req.cinValidation.back) {
                try {
                    const buffer = req.cinValidation.back.optimizedBuffer || req.cinValidation.back.buffer;
                    cinCardData.back = await imageStorageService.uploadCINImage(buffer, studentId, 'back');
                    console.log('CIN back uploaded to Mega');
                } catch (megaErr) {
                    console.error('⚠️ Mega CIN back upload failed, falling back to base64:', megaErr.message);
                    const buffer = req.cinValidation.back.optimizedBuffer || req.cinValidation.back.buffer;
                    cinCardData.back = imageOptimizer.imageToBase64(buffer, 'jpeg');
                }
            }
            
            if (cinCardData.front || cinCardData.back) {
                cinCardData.uploadedAt = new Date();
                cinCardData.uploadedBy = req.adminId;
                cinCardData.uploadedByName = admin.username;
                cinCardData.addLater = false;
                student.cinCard = cinCardData;
                needsUpdate = true;
            }
        }
        
        // Save again if images were uploaded
        if (needsUpdate) {
            student.markModified('cinCard');
            student.markModified('photoPath');
            await student.save();
            console.log('Student updated with image paths');
        }
        
        // Update group student count
        console.log('Updating group count...');
        groupDoc.currentStudentCount += 1;
        await groupDoc.save();
        console.log('Group count updated!');
        
        // Return student without password
        const studentResponse = student.toObject();
        delete studentResponse.emailPassword;
        
        res.json({ 
            success: true, 
            message: 'Student added successfully',
            student: studentResponse
        });
    } catch (error) {
        console.error('=== ERROR ADDING STUDENT ===');
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        console.error('Admin ID:', req.adminId);
        console.error('Admin object:', req.admin);
        if (error.errors) {
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        console.error('=========================');
        
        // Send detailed error response
        res.status(500).json({ 
            success: false,
            error: error.message || 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : undefined
        });
    }
});

// Update student
router.put('/students/:id', 
    authenticateAdmin, 
    cinUpload.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'cinFront', maxCount: 1 },
        { name: 'cinBack', maxCount: 1 }
    ]),
    validateCINFormat,
    validateCINUpload({
        required: false,
        requireBothSides: false, // Allow updating one side at a time
        optimize: true
    }),
    async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const {
            fullName,
            dateOfBirth,
            address,
            cin,
            city,
            studyLevel,
            phoneNumber,
            parentPhone,
            formation,
            filiere,
            group,
            branchSubgroup,
            paymentDate,
            paymentAmount,
            paymentPlan,
            paymentStatus,
            reminderDaysBefore,
            notes,
            status,
            newPassword
        } = req.body;
        
        // Update password if provided
        if (newPassword && newPassword.trim() !== '') {
            student.emailPassword = newPassword; // Will be hashed by pre-save hook
        }
        
        // Check if changing group
        const oldGroupId = student.group ? student.group.toString() : null;
        if (group && group !== oldGroupId) {
            const oldGroup = oldGroupId ? await Group.findById(oldGroupId) : null;
            const newGroup = await Group.findById(group);
            
            if (!newGroup) {
                return res.status(404).json({ error: 'New group not found' });
            }
            
            // Validate season consistency - new group must be in same season as old group
            if (oldGroup && oldGroup.season && newGroup.season) {
                if (oldGroup.season.toString() !== newGroup.season.toString()) {
                    return res.status(400).json({ 
                        error: `Cannot move student to a different season. Student is in ${oldGroup.seasonName}, new group is in ${newGroup.seasonName}` 
                    });
                }
            }
            
            if (newGroup.currentStudentCount >= newGroup.maxStudents) {
                return res.status(400).json({ error: 'New group is full' });
            }
            
            // Update group counts
            if (oldGroup) {
                oldGroup.currentStudentCount = Math.max(0, oldGroup.currentStudentCount - 1);
                await oldGroup.save();
            }
            
            newGroup.currentStudentCount += 1;
            await newGroup.save();
            
            student.group = group;
            student.groupName = newGroup.name;
        }
        
        // Update fields
        if (fullName) student.fullName = fullName;
        if (dateOfBirth) student.dateOfBirth = new Date(dateOfBirth);
        if (address !== undefined) student.address = address;
        if (cin !== undefined) student.cin = cin;
        if (city !== undefined) student.city = city;
        if (studyLevel !== undefined) student.studyLevel = studyLevel;
        if (phoneNumber) student.phoneNumber = phoneNumber;
        if (parentPhone) student.parentPhone = parentPhone;
        if (formation !== undefined) student.formation = formation ? (Array.isArray(formation) ? formation : [formation]) : [];
        
        // Handle filiere (branch) change - clear branchSubgroup if it no longer matches
        let branchClearedByFiliereChange = false;
        if (filiere !== undefined) {
            const newFiliereArray = filiere ? (Array.isArray(filiere) ? filiere : [filiere]) : [];
            const oldFiliereArray = student.filiere || [];
            const filiereChanged = JSON.stringify([...newFiliereArray].sort()) !== JSON.stringify([...oldFiliereArray].sort());
            
            student.filiere = newFiliereArray;
            
            // If filiere changed and student has a branch subgroup, check if it's still valid
            if (filiereChanged && student.branchSubgroup) {
                const currentSubgroup = await Group.findById(student.branchSubgroup);
                let subgroupStillValid = false;
                
                if (currentSubgroup && currentSubgroup.branchGroup) {
                    const currentBranchGroup = await BranchGroup.findById(currentSubgroup.branchGroup);
                    if (currentBranchGroup && newFiliereArray.includes(currentBranchGroup.formation)) {
                        subgroupStillValid = true;
                    }
                }
                
                if (!subgroupStillValid) {
                    // Clear the branch subgroup - student will appear in pending assignments
                    console.log(`🔄 Branch changed for ${student.fullName}: clearing branchSubgroup (was ${student.branchSubgroupName})`);
                    if (currentSubgroup) {
                        currentSubgroup.currentStudentCount = Math.max(0, currentSubgroup.currentStudentCount - 1);
                        await currentSubgroup.save();
                    }
                    student.branchSubgroup = null;
                    student.branchSubgroupName = null;
                    branchClearedByFiliereChange = true;
                }
            }
        }
        if (paymentDate) student.paymentDate = new Date(paymentDate);
        if (paymentAmount) student.paymentAmount = parseFloat(paymentAmount);
        if (paymentPlan && ['pm', 'trimestrial', 'semestriel', 'annuel'].includes(paymentPlan)) {
            const oldPlan = student.paymentPlan;
            student.paymentPlan = paymentPlan;
            // If switching plans, reset reminder flags for new cycle
            if (paymentPlan !== oldPlan) {
                student.paymentReminderSent = false;
                student.lastReminderDate = null;
                console.log(`📦 ${student.fullName}: Plan changed from ${oldPlan} to ${paymentPlan}`);
            }
        }
        if (paymentStatus) student.paymentStatus = paymentStatus;
        if (reminderDaysBefore) student.reminderDaysBefore = reminderDaysBefore;
        if (notes !== undefined) student.notes = notes;
        
        // Handle branch subgroup assignment/unassignment
        // Skip if filiere change already cleared the branch subgroup (form may still send stale value)
        if (branchSubgroup !== undefined && !branchClearedByFiliereChange) {
            const oldBranchSubgroupId = student.branchSubgroup ? student.branchSubgroup.toString() : null;
            
            if (branchSubgroup === '' || branchSubgroup === null) {
                // Unassign from branch subgroup
                if (oldBranchSubgroupId) {
                    const oldBranchGroup = await Group.findById(oldBranchSubgroupId);
                    if (oldBranchGroup) {
                        oldBranchGroup.currentStudentCount = Math.max(0, oldBranchGroup.currentStudentCount - 1);
                        await oldBranchGroup.save();
                    }
                }
                student.branchSubgroup = null;
                student.branchSubgroupName = null;
            } else if (branchSubgroup !== oldBranchSubgroupId) {
                // Changing branch subgroup - update counts
                if (oldBranchSubgroupId) {
                    const oldBranchGroup = await Group.findById(oldBranchSubgroupId);
                    if (oldBranchGroup) {
                        oldBranchGroup.currentStudentCount = Math.max(0, oldBranchGroup.currentStudentCount - 1);
                        await oldBranchGroup.save();
                    }
                }
                
                // Assign to new branch subgroup
                const newBranchGroup = await Group.findById(branchSubgroup);
                if (newBranchGroup) {
                    newBranchGroup.currentStudentCount += 1;
                    await newBranchGroup.save();
                    
                    student.branchSubgroup = branchSubgroup;
                    student.branchSubgroupName = newBranchGroup.name;
                } else {
                    return res.status(404).json({ error: 'Branch subgroup not found' });
                }
            }
        }
        
        // Handle status changes - cancel payments for inactive/dropped students
        if (status) {
            student.status = status;
            if (status === 'dropped' || status === 'inactive' || status === 'graduated') {
                student.paymentStatus = 'cancelled';
                student.paymentReminderSent = false;
                console.log(`💰 Payment cancelled for ${student.fullName} (status: ${status})`);
            }
        }
        
        // Update photo if provided - upload to Mega.nz
        const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
        if (photoFile) {
            try {
                const optimized = await imageOptimizer.optimizeStudentPhoto(photoFile.buffer);
                student.photoPath = await imageStorageService.uploadStudentPhoto(optimized.buffer, req.params.id);
                console.log('Photo uploaded to Mega:', student.photoPath);
            } catch (megaErr) {
                console.error('⚠️ Mega photo upload failed, falling back to base64:', megaErr.message);
                const base64Image = photoFile.buffer.toString('base64');
                student.photoPath = `data:${photoFile.mimetype};base64,${base64Image}`;
            }
        }
        
        // Handle CIN card update - upload to Mega.nz
        if (req.cinValidation && !req.cinValidation.addLater) {
            // Initialize cinCard if it doesn't exist
            if (!student.cinCard) {
                student.cinCard = {
                    front: null,
                    back: null,
                    uploadedAt: null,
                    uploadedBy: null,
                    uploadedByName: null,
                    addLater: false,
                    reminderSent: false,
                    lastReminderDate: null
                };
            }
            
            // Get admin info
            const admin = await Admin.findById(req.adminId);
            
            // Update front if provided
            if (req.cinValidation.front) {
                const buffer = req.cinValidation.front.optimizedBuffer || req.cinValidation.front.buffer;
                try {
                    student.cinCard.front = await imageStorageService.uploadCINImage(buffer, req.params.id, 'front');
                } catch (megaErr) {
                    console.error('⚠️ Mega CIN front upload failed, falling back to base64:', megaErr.message);
                    student.cinCard.front = imageOptimizer.imageToBase64(buffer, 'jpeg');
                }
                student.cinCard.uploadedAt = new Date();
                student.cinCard.uploadedBy = req.adminId;
                student.cinCard.uploadedByName = admin.username;
                student.cinCard.addLater = false;
                console.log('✅ CIN front updated');
            }
            
            // Update back if provided
            if (req.cinValidation.back) {
                const buffer = req.cinValidation.back.optimizedBuffer || req.cinValidation.back.buffer;
                try {
                    student.cinCard.back = await imageStorageService.uploadCINImage(buffer, req.params.id, 'back');
                } catch (megaErr) {
                    console.error('⚠️ Mega CIN back upload failed, falling back to base64:', megaErr.message);
                    student.cinCard.back = imageOptimizer.imageToBase64(buffer, 'jpeg');
                }
                student.cinCard.uploadedAt = new Date();
                student.cinCard.uploadedBy = req.adminId;
                student.cinCard.uploadedByName = admin.username;
                student.cinCard.addLater = false;
                console.log('✅ CIN back updated');
            }
        } else if (req.body.cinAddLater === 'true' || req.body.cinAddLater === true) {
            // Mark as "add later"
            if (!student.cinCard) {
                student.cinCard = {};
            }
            student.cinCard.addLater = true;
            console.log('📝 CIN marked as "Add Later"');
        }
        
        await student.save();
        
        // Return student without password
        const studentResponse = student.toObject();
        delete studentResponse.emailPassword;
        
        res.json({ 
            success: true, 
            message: 'Student updated successfully',
            student: studentResponse
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
});

// Mark student payment as paid
router.put('/students/:id/mark-paid', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Create payment history record
        const paymentHistory = new PaymentHistory({
            student: student._id,
            studentName: student.fullName,
            amount: student.paymentAmount,
            paymentDate: student.paymentDate,
            markedAsPaidDate: new Date(),
            markedBy: req.admin.id,
            markedByName: req.admin.username,
            formation: student.formation,
            branch: student.branchSubgroupName || null,
            notes: `Payment marked as paid by ${req.admin.username}`
        });
        
        await paymentHistory.save();
        
        // Update payment status to paid (allow marking as paid regardless of date)
        student.paymentStatus = 'paid';
        await student.save();
        
        console.log(`✅ Payment marked as paid for ${student.fullName} - History record created`);
        
        // Return student without password
        const studentResponse = student.toObject();
        delete studentResponse.emailPassword;
        
        res.json({ 
            success: true, 
            message: 'Payment marked as paid successfully',
            student: studentResponse
        });
    } catch (error) {
        console.error('Error marking payment as paid:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to mark payment as paid' 
        });
    }
});

// Delete student
router.delete('/students/:id', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Update group student count
        const group = await Group.findById(student.group);
        if (group) {
            group.currentStudentCount = Math.max(0, group.currentStudentCount - 1);
            await group.save();
        }
        
        // Delete student images from Mega.nz (and legacy file paths)
        if (student.photoPath) {
            if (imageStorageService.isMediaPath(student.photoPath)) {
                await imageStorageService.deleteStudentImages(req.params.id);
            } else if (!student.photoPath.startsWith('data:')) {
                try {
                    const photoPath = path.join(__dirname, '..', student.photoPath);
                    await fs.unlink(photoPath);
                    console.log('Photo file deleted from disk');
                } catch (err) {
                    console.error('Error deleting photo:', err);
                }
            }
        }
        // Also try to delete CIN images from Mega
        if (student.cinCard) {
            if (imageStorageService.isMediaPath(student.cinCard.front)) {
                await imageStorageService.deleteImage('student-cin', `${req.params.id}-front.jpg`);
            }
            if (imageStorageService.isMediaPath(student.cinCard.back)) {
                await imageStorageService.deleteImage('student-cin', `${req.params.id}-back.jpg`);
            }
        }
        
        await ManagedStudent.findByIdAndDelete(req.params.id);
        
        res.json({ 
            success: true, 
            message: 'Student deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

// ==================== PASSWORD MANAGEMENT ROUTES ====================

// Generate random password
router.get('/students/:id/generate-password', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        res.json({ success: true, password });
    } catch (error) {
        console.error('Error generating password:', error);
        res.status(500).json({ error: 'Failed to generate password' });
    }
});

// View student password (All admins can view for ID card purposes)
router.get('/students/:id/password', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id).select('+plainTextPassword');
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Return plain text password for ID card display
        res.json({ 
            success: true, 
            password: student.plainTextPassword || '********',
            hasPassword: !!student.emailPassword
        });
    } catch (error) {
        console.error('Error fetching password:', error);
        res.status(500).json({ error: 'Failed to fetch password' });
    }
});

// Update student password (Super Admin only)
router.put('/students/:id/password', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        const student = await ManagedStudent.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        student.emailPassword = newPassword; // Will be hashed by pre-save hook
        await student.save();
        
        res.json({ 
            success: true, 
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// ==================== PAYMENT REMINDER ROUTES ====================

// Get students with upcoming payment reminders
router.get('/payment-reminders', authenticateAdmin, async (req, res) => {
    try {
        const now = new Date();
        
        // Get active season to filter payment reminders
        const Season = require('../models/Season');
        const activeSeason = await Season.findOne({ status: 'active' });
        
        // Build query
        const query = {
            paymentStatus: { $ne: 'paid' },
            status: 'active'
        };
        
        // Filter by active season if available
        if (activeSeason) {
            const activeSeasonGroups = await Group.find({ season: activeSeason._id }).select('_id');
            query.group = { $in: activeSeasonGroups.map(g => g._id) };
        }
        
        // Find students who need reminders
        const students = await ManagedStudent.find(query)
        .select('-emailPassword')
        .populate('group', 'name season seasonName')
        .sort({ paymentDate: 1 });
        
        const reminders = students.map(student => {
            const reminderDate = new Date(student.paymentDate);
            reminderDate.setDate(reminderDate.getDate() - student.reminderDaysBefore);
            
            const isOverdue = now > student.paymentDate;
            const shouldRemind = now >= reminderDate && now < student.paymentDate;
            
            return {
                student,
                reminderDate,
                isOverdue,
                shouldRemind,
                daysUntilPayment: Math.ceil((student.paymentDate - now) / (1000 * 60 * 60 * 24))
            };
        });
        
        res.json({ success: true, reminders });
    } catch (error) {
        console.error('Error fetching payment reminders:', error);
        res.status(500).json({ error: 'Failed to fetch payment reminders' });
    }
});

// Mark reminder as sent
router.post('/payment-reminders/:studentId/sent', authenticateAdmin, async (req, res) => {
    try {
        const { method, notes } = req.body;
        
        const student = await ManagedStudent.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        student.paymentReminderSent = true;
        student.lastReminderDate = new Date();
        await student.save();
        
        // Create reminder record
        const reminder = new PaymentReminder({
            student: student._id,
            studentName: student.fullName,
            paymentDate: student.paymentDate,
            reminderType: new Date() > student.paymentDate ? 'overdue' : 'upcoming',
            sentBy: req.adminId,
            method: method || 'system',
            notes: notes || ''
        });
        
        await reminder.save();
        
        res.json({ 
            success: true, 
            message: 'Reminder marked as sent'
        });
    } catch (error) {
        console.error('Error marking reminder:', error);
        res.status(500).json({ error: 'Failed to mark reminder' });
    }
});

// ==================== DASHBOARD & STATISTICS ROUTES ====================

// Get dashboard statistics
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
    try {
        // Get active season to filter groups
        const Season = require('../models/Season');
        const activeSeason = await Season.findOne({ status: 'active' });
        
        // Count only groups from active season
        const groupQuery = { status: 'active' };
        if (activeSeason) {
            groupQuery.season = activeSeason._id;
        }
        
        const totalGroups = await Group.countDocuments(groupQuery);
        
        // Count only students from active season's groups
        let totalStudents = 0;
        if (activeSeason) {
            const activeSeasonGroups = await Group.find({ season: activeSeason._id }).select('_id');
            totalStudents = await ManagedStudent.countDocuments({
                group: { $in: activeSeasonGroups.map(g => g._id) },
                status: 'active'
            });
        } else {
            // Fallback: count all active students if no active season
            totalStudents = await ManagedStudent.countDocuments({ status: 'active' });
        }
        
        // Build payment query with season filter
        const paymentQuery = { status: 'active' };
        if (activeSeason) {
            const activeSeasonGroups = await Group.find({ season: activeSeason._id }).select('_id');
            paymentQuery.group = { $in: activeSeasonGroups.map(g => g._id) };
        }
        
        const paymentStats = await ManagedStudent.aggregate([
            { $match: paymentQuery },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const now = new Date();
        const upcomingPayments = await ManagedStudent.countDocuments({
            ...paymentQuery,
            paymentStatus: { $ne: 'paid' },
            paymentDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
        });
        
        const overduePayments = await ManagedStudent.countDocuments({
            ...paymentQuery,
            paymentStatus: { $ne: 'paid' },
            paymentDate: { $lt: now }
        });
        
        const formationStats = await ManagedStudent.aggregate([
            { $match: { status: 'active' } },
            { $unwind: '$formation' },
            {
                $group: {
                    _id: '$formation',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            success: true,
            stats: {
                totalGroups,
                totalStudents,
                paymentStats,
                upcomingPayments,
                overduePayments,
                formationStats
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// Export students to Excel (grouped by groups)
const ExcelJS = require('exceljs');

router.get('/students/export/csv', authenticateAdmin, async (req, res) => {
    try {
        const { group, formation, status } = req.query;
        const filter = {};
        
        if (group) filter.group = group;
        if (formation) filter.formation = { $in: [formation] };
        if (status) filter.status = status;
        
        // Get all students
        const students = await ManagedStudent.find(filter)
            .select('-emailPassword')
            .populate('group', 'name')
            .sort({ groupName: 1, fullName: 1 });
        
        // Get all groups
        const Group = require('../models/Group');
        const groups = await Group.find().sort({ name: 1 });
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Nisrine School';
        workbook.created = new Date();
        
        // Group students by their group
        const studentsByGroup = {};
        students.forEach(student => {
            const groupName = student.groupName || 'No Group';
            if (!studentsByGroup[groupName]) {
                studentsByGroup[groupName] = [];
            }
            studentsByGroup[groupName].push(student);
        });
        
        // Create a sheet for each group
        Object.keys(studentsByGroup).sort().forEach(groupName => {
            const worksheet = workbook.addWorksheet(groupName.substring(0, 31)); // Excel sheet name limit
            
            // Add title
            worksheet.mergeCells('A1:K1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `Group: ${groupName}`;
            titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2c3e50' }
            };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).height = 30;
            
            // Add headers
            const headers = [
                'Full Name',
                'Phone Number',
                'Parent Phone',
                'School Email',
                'Formation',
                'Filière',
                'Payment Date',
                'Payment Amount (MAD)',
                'Payment Status',
                'Student Status',
                'Notes'
            ];
            
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFCC00' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 25;
            
            // Add student data
            studentsByGroup[groupName].forEach(student => {
                const row = worksheet.addRow([
                    student.fullName,
                    student.phoneNumber,
                    student.parentPhone || '',
                    student.schoolEmail,
                    student.formation.join(', '),
                    student.filiere.join(', '),
                    new Date(student.paymentDate).toLocaleDateString('en-GB'),
                    student.paymentAmount,
                    student.paymentStatus,
                    student.status,
                    student.notes || ''
                ]);
                
                // Color code payment status
                const paymentStatusCell = row.getCell(9);
                if (student.paymentStatus === 'paid') {
                    paymentStatusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF10b981' }
                    };
                    paymentStatusCell.font = { color: { argb: 'FFFFFFFF' } };
                } else if (student.paymentStatus === 'overdue') {
                    paymentStatusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFef4444' }
                    };
                    paymentStatusCell.font = { color: { argb: 'FFFFFFFF' } };
                } else {
                    paymentStatusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFfbbf24' }
                    };
                }
                
                // Color code student status
                const statusCell = row.getCell(10);
                if (student.status === 'active') {
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF10b981' }
                    };
                    statusCell.font = { color: { argb: 'FFFFFFFF' } };
                } else if (student.status === 'graduated') {
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF3b82f6' }
                    };
                    statusCell.font = { color: { argb: 'FFFFFFFF' } };
                }
            });
            
            // Auto-fit columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, cell => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = Math.min(maxLength + 2, 50);
            });
            
            // Add borders to all cells
            worksheet.eachRow((row, rowNumber) => {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });
        });
        
        // Generate Excel file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=students-export-${Date.now()}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting students:', error);
        res.status(500).json({ error: 'Failed to export students' });
    }
});

// ==================== MESSAGE ROUTES ====================

// Send message to student
router.post('/students/:id/send-message', authenticateAdmin, async (req, res) => {
    try {
        const { type, message, title } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }
        
        const student = await ManagedStudent.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        // Auto-generate title based on type if not provided
        const messageType = type || 'info';
        const messageTitle = title || {
            'payment': 'Payment Reminder',
            'reminder': 'Important Reminder',
            'info': 'Information',
            'announcement': 'Announcement',
            'notification': 'Notification',
            'alert': 'Alert'
        }[messageType] || 'Message';
        
        const newMessage = new StudentMessage({
            student: req.params.id,
            type: messageType,
            title: messageTitle,
            message: message,
            sentBy: req.admin.id,
            read: false
        });
        
        await newMessage.save();
        
        // Send push notification to student
        notifyAdminMessage(req.params.id, newMessage).catch(err => 
            console.error('Failed to send admin message notification:', err)
        );
        
        // Send FCM push notification
        sendFCMNotification(req.params.id, messageTitle, message).catch(err =>
            console.error('Failed to send FCM notification:', err)
        );
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Send message to all students in a group
router.post('/groups/:groupId/send-message', authenticateAdmin, async (req, res) => {
    try {
        const { type, message } = req.body;
        const { groupId } = req.params;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }
        
        // Verify group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        
        // Find all active students in this group based on group type
        let studentQuery = { status: 'active' };
        
        if (group.groupType === 'language') {
            // Language group - check the 'group' field
            studentQuery.group = groupId;
        } else if (group.groupType === 'branch') {
            // Branch group - check the 'branchSubgroup' field
            studentQuery.branchSubgroup = groupId;
        } else {
            // Fallback - check both fields
            studentQuery.$or = [
                { group: groupId },
                { branchSubgroup: groupId }
            ];
        }
        
        const students = await ManagedStudent.find(studentQuery);
        
        console.log(`📨 Sending message to group: ${group.name} (Type: ${group.groupType})`);
        console.log(`🔍 Query used:`, studentQuery);
        console.log(`👥 Found ${students.length} students`);
        
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'No active students found in this group' });
        }
        
        // Auto-generate title based on type if not provided
        const messageType = type || 'info';
        const messageTitle = req.body.title || {
            'payment': 'Payment Reminder',
            'reminder': 'Important Reminder',
            'info': 'Information',
            'announcement': 'Announcement',
            'notification': 'Notification',
            'alert': 'Alert'
        }[messageType] || 'Message';
        
        // Create messages for all students
        const messages = students.map(student => ({
            student: student._id,
            type: messageType,
            title: messageTitle,
            message: message,
            sentBy: req.admin.id,
            read: false
        }));
        
        const createdMessages = await StudentMessage.insertMany(messages);
        
        console.log(`✅ Created ${createdMessages.length} messages for students:`, students.map(s => s.fullName));
        
        res.json({ 
            success: true, 
            message: `Message sent to ${students.length} student(s) in ${group.name}`,
            data: {
                groupName: group.name,
                groupType: group.groupType,
                studentCount: students.length,
                messagesCreated: createdMessages.length,
                studentNames: students.map(s => s.fullName)
            }
        });
    } catch (error) {
        console.error('Send group message error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== ATTENDANCE MANAGEMENT ROUTES ====================

// Clear absence history for a student
router.delete('/students/:id/clear-absences', authenticateAdmin, async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Verify student exists
        const student = await ManagedStudent.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        // Import AttendanceRecord model
        const AttendanceRecord = require('../models/AttendanceRecord');
        
        // Delete all absence records for this student
        const result = await AttendanceRecord.deleteMany({
            studentId: studentId,
            status: 'absent'
        });
        
        console.log(`🗑️ Cleared ${result.deletedCount} absence record(s) for student: ${student.fullName} (${student.schoolEmail})`);
        
        res.json({ 
            success: true, 
            message: `Absence history cleared for ${student.fullName}`,
            deletedCount: result.deletedCount,
            studentName: student.fullName
        });
    } catch (error) {
        console.error('Clear absence history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== PDF & DROPBOX ROUTES ====================

// Generate PDF for managed student
// PDF Requirements:
// - File size must not exceed 3 MB
// - All content must be fully visible and readable
// - Original layout and formatting must be preserved
// - File naming convention: StudentName_Season.pdf
router.post('/students/:id/generate-pdf', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Import PDF generator and validator
        const { generateRegistrationPDF } = require('../services/pdfGenerator');
        const pdfValidator = require('../utils/pdfValidator');
        
        // Prepare student data for PDF
        const studentData = {
            fullName: student.fullName,
            dateOfBirth: student.dateOfBirth,
            address: student.address || '',
            cin: student.cin || student._id.toString(), // Use actual CIN or ID as fallback
            city: student.city || '',
            studyLevel: student.studyLevel || '',
            phoneNumber: student.phoneNumber || student.phones?.[0] || '',
            parentPhone: student.parentPhone || student.phones?.[1] || '',
            email: student.email || student.schoolEmail,
            formation: Array.isArray(student.formation) ? student.formation : [student.formation],
            filiere: Array.isArray(student.filiere) ? student.filiere : (student.filiere ? [student.filiere] : []),
            photoPath: student.photoPath,
            paymentPlan: student.paymentPlan || 'pm'
        };
        
        // Generate PDF (returns buffer for Vercel compatibility)
        const pdfBuffer = await generateRegistrationPDF(studentData);
        
        // Generate proper filename following naming convention: StudentName_Season.pdf
        const season = student.season || 'Current';
        const fileName = pdfValidator.generateFileName(student.fullName, season);
        
        // Send PDF with proper headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Backup managed student to Mega.nz
// Ensures PDF meets all requirements before uploading:
// - File size under 3 MB
// - Proper naming convention (StudentName_Season.pdf)
// - Content integrity preserved
router.post('/students/:id/backup-dropbox', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Import services
        const { generateRegistrationPDF } = require('../services/pdfGenerator');
        const megaService = require('../services/megaService');
        const pdfValidator = require('../utils/pdfValidator');
        
        // Prepare student data for PDF
        const studentData = {
            fullName: student.fullName,
            dateOfBirth: student.dateOfBirth,
            address: student.address || '',
            cin: student.cin || student._id.toString(), // Use actual CIN or ID as fallback
            city: student.city || '',
            studyLevel: student.studyLevel || '',
            phoneNumber: student.phoneNumber || student.phones?.[0] || '',
            parentPhone: student.parentPhone || student.phones?.[1] || '',
            email: student.email || student.schoolEmail,
            formation: Array.isArray(student.formation) ? student.formation : [student.formation],
            filiere: Array.isArray(student.filiere) ? student.filiere : (student.filiere ? [student.filiere] : []),
            photoPath: student.photoPath,
            paymentPlan: student.paymentPlan || 'pm'
        };
        
        // Generate PDF
        const pdfBuffer = await generateRegistrationPDF(studentData);
        
        // Validate PDF before uploading
        const validation = pdfValidator.validateFileSize({ buffer: pdfBuffer });
        if (!validation.valid) {
            console.error('❌ PDF validation failed before Mega upload:', validation.error);
            return res.status(400).json({ 
                error: 'Generated PDF does not meet requirements',
                details: validation.error,
                size: pdfValidator.formatBytes(validation.size)
            });
        }
        
        // Upload to Mega.nz with proper naming
        const result = await megaService.uploadStudentPDF(pdfBuffer, {
            fullName: student.fullName,
            cin: student._id.toString(),
            season: student.season || 'Current'
        });
        
        if (result.success) {
            res.json({
                success: true,
                message: `Student PDF backed up to Mega.nz successfully!`,
                megaPath: result.filePath,
                fileSize: pdfValidator.formatBytes(validation.size)
            });
        } else {
            throw new Error(result.message || 'Failed to upload to Mega.nz');
        }
        
    } catch (error) {
        console.error('Error backing up to Mega.nz:', error);
        res.status(500).json({ error: error.message || 'Failed to backup to Mega.nz' });
    }
});

// ==================== CIN CARD MANAGEMENT ROUTES ====================

// Upload CIN card for student
// Supports both front and back sides with automatic optimization
router.post('/students/:id/upload-cin',
    authenticateAdmin,
    cinUpload.fields([
        { name: 'cinFront', maxCount: 1 },
        { name: 'cinBack', maxCount: 1 }
    ]),
    validateCINFormat,
    validateCINUpload({
        required: false, // Allow "add later" option
        requireBothSides: true,
        optimize: true
    }),
    async (req, res) => {
        try {
            const student = await ManagedStudent.findById(req.params.id);
            
            if (!student) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Student not found' 
                });
            }

            // Check if "add later" was selected
            if (req.cinValidation.addLater) {
                student.cinCard = {
                    ...student.cinCard,
                    addLater: true,
                    reminderSent: false
                };
                await student.save();

                return res.json({
                    success: true,
                    message: 'CIN upload deferred. Please upload as soon as available.',
                    addLater: true
                });
            }

            // Get admin info
            const admin = await Admin.findById(req.adminId);

            // Upload optimized images to Mega.nz
            let frontPath = null;
            let backPath = null;

            if (req.cinValidation.front) {
                const buffer = req.cinValidation.front.optimizedBuffer || req.cinValidation.front.buffer;
                try {
                    frontPath = await imageStorageService.uploadCINImage(buffer, req.params.id, 'front');
                } catch (megaErr) {
                    console.error('⚠️ Mega CIN front upload failed, falling back to base64:', megaErr.message);
                    frontPath = imageOptimizer.imageToBase64(buffer, 'jpeg');
                }
            }

            if (req.cinValidation.back) {
                const buffer = req.cinValidation.back.optimizedBuffer || req.cinValidation.back.buffer;
                try {
                    backPath = await imageStorageService.uploadCINImage(buffer, req.params.id, 'back');
                } catch (megaErr) {
                    console.error('⚠️ Mega CIN back upload failed, falling back to base64:', megaErr.message);
                    backPath = imageOptimizer.imageToBase64(buffer, 'jpeg');
                }
            }

            // Update student with CIN card data
            student.cinCard = {
                front: frontPath,
                back: backPath,
                uploadedAt: new Date(),
                uploadedBy: req.adminId,
                uploadedByName: admin.username,
                addLater: false,
                reminderSent: false,
                lastReminderDate: null
            };

            await student.save();

            res.json({
                success: true,
                message: 'CIN card uploaded and optimized successfully',
                optimization: {
                    front: req.cinValidation.front ? {
                        originalSize: imageOptimizer.formatBytes(req.cinValidation.front.originalSize),
                        optimizedSize: imageOptimizer.formatBytes(req.cinValidation.front.optimizedSize),
                        compressionRatio: req.cinValidation.front.compressionRatio + '%'
                    } : null,
                    back: req.cinValidation.back ? {
                        originalSize: imageOptimizer.formatBytes(req.cinValidation.back.originalSize),
                        optimizedSize: imageOptimizer.formatBytes(req.cinValidation.back.optimizedSize),
                        compressionRatio: req.cinValidation.back.compressionRatio + '%'
                    } : null,
                    totalOptimizedSize: imageOptimizer.formatBytes(req.cinValidation.totalOptimizedSize)
                }
            });

        } catch (error) {
            console.error('Error uploading CIN card:', error);
            res.status(500).json({ 
                success: false,
                error: error.message || 'Failed to upload CIN card' 
            });
        }
    }
);

// Download CIN card (combined PDF or separate images)
router.get('/students/:id/download-cin', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                error: 'Student not found' 
            });
        }

        if (!student.cinCard || (!student.cinCard.front && !student.cinCard.back)) {
            return res.status(404).json({ 
                success: false,
                error: 'CIN card not uploaded for this student',
                addLater: student.cinCard?.addLater || false
            });
        }

        const format = req.query.format || 'pdf'; // 'pdf' or 'images'

        if (format === 'pdf') {
            // Combine front and back into a single PDF
            // Handle both Mega paths and legacy base64
            let frontBuffer = null;
            let backBuffer = null;
            
            try {
                if (student.cinCard.front) {
                    frontBuffer = await imageStorageService.getImageBuffer(student.cinCard.front);
                }
            } catch (err) {
                console.error('⚠️ Could not fetch CIN front:', err.message);
            }
            
            try {
                if (student.cinCard.back) {
                    backBuffer = await imageStorageService.getImageBuffer(student.cinCard.back);
                }
            } catch (err) {
                console.error('⚠️ Could not fetch CIN back:', err.message);
            }
            
            if (!frontBuffer && !backBuffer) {
                return res.status(404).json({
                    success: false,
                    error: 'Could not retrieve CIN card images'
                });
            }

            const pdfBuffer = await imageOptimizer.combineCINToPDF(frontBuffer, backBuffer);

            // Generate filename
            const fileName = `CIN_${student.fullName.replace(/\s+/g, '_')}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.send(pdfBuffer);

        } else if (format === 'images') {
            // Return both images as JSON - return paths (URLs or base64)
            res.json({
                success: true,
                student: {
                    id: student._id,
                    fullName: student.fullName,
                    cin: student.cin
                },
                cinCard: {
                    front: student.cinCard.front,
                    back: student.cinCard.back,
                    uploadedAt: student.cinCard.uploadedAt,
                    uploadedBy: student.cinCard.uploadedByName
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid format. Use "pdf" or "images"'
            });
        }

    } catch (error) {
        console.error('Error downloading CIN card:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to download CIN card' 
        });
    }
});

// Get CIN card status for a student
router.get('/students/:id/cin-status', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                error: 'Student not found' 
            });
        }

        const hasCIN = student.cinCard && (student.cinCard.front || student.cinCard.back);
        const addLater = student.cinCard?.addLater || false;

        res.json({
            success: true,
            status: {
                hasCIN: hasCIN,
                hasFront: !!student.cinCard?.front,
                hasBack: !!student.cinCard?.back,
                addLater: addLater,
                uploadedAt: student.cinCard?.uploadedAt || null,
                uploadedBy: student.cinCard?.uploadedByName || null,
                needsUpload: !hasCIN || addLater
            }
        });

    } catch (error) {
        console.error('Error getting CIN status:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to get CIN status' 
        });
    }
});

// Get all students with missing CIN cards
router.get('/students/missing-cin/list', authenticateAdmin, async (req, res) => {
    try {
        // Find students where CIN is not uploaded or marked as "add later"
        const students = await ManagedStudent.find({
            $or: [
                { 'cinCard.front': null },
                { 'cinCard.back': null },
                { 'cinCard.addLater': true }
            ]
        })
        .select('fullName phoneNumber schoolEmail cinCard group groupName status')
        .populate('group', 'name')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: students.length,
            students: students.map(s => ({
                id: s._id,
                fullName: s.fullName,
                phoneNumber: s.phoneNumber,
                schoolEmail: s.schoolEmail,
                groupName: s.groupName || s.group?.name,
                status: s.status,
                cinStatus: {
                    hasFront: !!s.cinCard?.front,
                    hasBack: !!s.cinCard?.back,
                    addLater: s.cinCard?.addLater || false,
                    needsUpload: true
                }
            }))
        });

    } catch (error) {
        console.error('Error getting students with missing CIN:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to get students with missing CIN' 
        });
    }
});

// ==================== PAYMENT JOURNAL ROUTES ====================

// Get payment history for a student (JSON)
router.get('/students/:id/payment-history', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id)
            .select('fullName formation branchSubgroupName');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get all payment history for this student, sorted by payment date (newest first)
        const paymentHistory = await PaymentHistory.find({ student: req.params.id })
            .sort({ paymentDate: -1 })
            .lean();

        res.json({
            success: true,
            student: {
                id: student._id,
                fullName: student.fullName,
                formation: student.formation,
                branch: student.branchSubgroupName
            },
            paymentHistory: paymentHistory,
            count: paymentHistory.length
        });

    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch payment history' 
        });
    }
});

// Generate Payment Journal PDF for a student
router.get('/students/:id/payment-journal', authenticateAdmin, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.params.id)
            .select('fullName formation branchSubgroupName schoolEmail');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get all payment history for this student, sorted by payment date (newest first)
        const paymentHistory = await PaymentHistory.find({ student: req.params.id })
            .sort({ paymentDate: -1 })
            .lean();

        console.log(`📄 Generating payment journal for ${student.fullName} (${paymentHistory.length} payments)`);

        // Generate PDF
        const pdfBuffer = await generatePaymentJournalPDF(student, paymentHistory);

        // Set response headers
        const filename = `Payment-Journal-${student.fullName.replace(/\s+/g, '-')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

        console.log(`✅ Payment journal generated successfully for ${student.fullName}`);

    } catch (error) {
        console.error('Error generating payment journal:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate payment journal PDF' 
        });
    }
});

module.exports = router;
