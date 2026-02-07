const express = require('express');
const router = express.Router();
const multer = require('multer');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const CreditTransaction = require('../models/CreditTransaction');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const { logActivity, getClientIp } = require('../utils/activityLogger');
const { generateRegistrationPDF } = require('../services/pdfGenerator');
const imageStorageService = require('../services/imageStorageService');

// Configure multer for photo uploads (memory storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
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

// Credit calculation function - Simple: 1 credit per registration
function calculateCredits(formationChoisie) {
    // Every registration earns exactly 1 credit
    // Doesn't matter which courses or how many are selected
    return 1;
}

// POST /api/admin-registration/register - Admin registers a student
router.post('/register', authenticateAdmin, upload.single('photo'), async (req, res) => {
    try {
        console.log('📝 Admin registration request received');
        console.log('Admin:', req.admin.username);
        console.log('Body:', req.body);
        
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
                formationChoisie = [formationChoisie];
            }
        }
        
        if (typeof filiere === 'string') {
            try {
                filiere = JSON.parse(filiere);
            } catch (e) {
                filiere = filiere ? [filiere] : [];
            }
        }

        // Validate required fields
        if (!fullName || !dateOfBirth || !phoneNumber || !cin || !city || 
            !parentPhone || !studyLevel || !formationChoisie || formationChoisie.length === 0) {
            
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

        // Validate phone number format
        const phoneRegex = /^0[5-7][0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number must be a valid Moroccan number (format: 06XXXXXXXX)' 
            });
        }

        if (!phoneRegex.test(parentPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Parent phone number must be a valid Moroccan number (format: 06XXXXXXXX)' 
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

        // Calculate credits for this registration
        const creditsEarned = calculateCredits(formationChoisie);

        // Create new student record first to get the ID
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
            photoPath: null,
            registeredBy: req.admin.id,
            registeredByName: req.admin.username,
            creditEarned: creditsEarned
        });

        await student.save();
        
        // Upload photo to Mega.nz
        try {
            student.photoPath = await imageStorageService.uploadRegistrationPhoto(req.file.buffer, student._id.toString());
            await student.save();
            console.log('Admin registration photo uploaded to Mega');
        } catch (megaErr) {
            console.error('⚠️ Mega photo upload failed, falling back to base64:', megaErr.message);
            const photoBase64 = req.file.buffer.toString('base64');
            student.photoPath = `data:${req.file.mimetype};base64,${photoBase64}`;
            await student.save();
        }

        // Update admin's credits and registration count
        const admin = await Admin.findById(req.admin.id);
        admin.totalCredits += creditsEarned;
        admin.totalRegistrations += 1;
        await admin.save();

        // Create credit transaction record
        const transaction = new CreditTransaction({
            adminId: req.admin.id,
            adminName: req.admin.username,
            transactionType: 'registration',
            amount: creditsEarned,
            studentId: student._id,
            studentName: fullName,
            description: `Registration: ${fullName} - ${formationChoisie.join(', ')}`,
            performedBy: req.admin.id,
            performedByName: req.admin.username
        });
        await transaction.save();

        // Log activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'admin_register_student',
            targetType: 'student',
            targetId: student._id.toString(),
            targetName: fullName,
            details: `Registered student and earned ${creditsEarned} credits`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        console.log(`✅ Student registered by admin ${req.admin.username}. Credits earned: ${creditsEarned}`);

        res.status(201).json({ 
            success: true, 
            message: `Registration successful! You earned 1 credit.`,
            studentId: student._id,
            creditsEarned: 1,
            totalCredits: admin.totalCredits,
            totalRegistrations: admin.totalRegistrations
        });

    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

// GET /api/admin-registration/my-stats - Get current admin's statistics
router.get('/my-stats', authenticateAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Get monthly registration count
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const monthlyRegistrations = await Student.countDocuments({
            registeredBy: req.admin.id,
            submittedAt: { $gte: currentMonth }
        });

        // Get recent transactions
        const recentTransactions = await CreditTransaction.find({
            adminId: req.admin.id
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('studentId', 'fullName cin');

        res.json({
            success: true,
            stats: {
                totalCredits: admin.totalCredits,
                totalRegistrations: admin.totalRegistrations,
                monthlyRegistrations: monthlyRegistrations,
                recentTransactions: recentTransactions
            }
        });

    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

// GET /api/admin-registration/my-registrations - Get students registered by current admin
router.get('/my-registrations', authenticateAdmin, async (req, res) => {
    try {
        const { search, course, startDate, endDate, page = 1, limit = 20 } = req.query;
        
        let query = { registeredBy: req.admin.id };

        // Search filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { cin: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Course filter
        if (course && course !== 'all') {
            query.formationChoisie = course;
        }

        // Date range filter
        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) query.submittedAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.submittedAt.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const students = await Student.find(query)
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-photoPath'); // Exclude photo data for performance

        const total = await Student.countDocuments(query);

        res.json({
            success: true,
            students: students,
            pagination: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get my registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations'
        });
    }
});

// GET /api/admin-registration/leaderboard - Get admin leaderboard (all admins can see)
router.get('/leaderboard', authenticateAdmin, async (req, res) => {
    try {
        const { period = 'all' } = req.query;
        
        let dateFilter = {};
        
        if (period === 'month') {
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            dateFilter = { submittedAt: { $gte: currentMonth } };
        } else if (period === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateFilter = { submittedAt: { $gte: weekAgo } };
        }

        // Aggregate registrations by admin
        const leaderboard = await Student.aggregate([
            {
                $match: {
                    registeredBy: { $ne: null },
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$registeredBy',
                    adminName: { $first: '$registeredByName' },
                    totalRegistrations: { $count: {} },
                    totalCredits: { $sum: '$creditEarned' }
                }
            },
            {
                $sort: { totalCredits: -1 }
            },
            {
                $limit: 20
            }
        ]);

        res.json({
            success: true,
            leaderboard: leaderboard,
            period: period
        });

    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard'
        });
    }
});

// GET /api/admin-registration/credit-history - Get credit transaction history
router.get('/credit-history', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const transactions = await CreditTransaction.find({
            adminId: req.admin.id
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('studentId', 'fullName cin');

        const total = await CreditTransaction.countDocuments({
            adminId: req.admin.id
        });

        res.json({
            success: true,
            transactions: transactions,
            pagination: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get credit history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch credit history'
        });
    }
});

// POST /api/admin-registration/adjust-credits - Super admin can adjust credits (super admin only)
router.post('/adjust-credits', authenticateAdmin, async (req, res) => {
    try {
        // Check if user is super admin or dev
        if (req.admin.role !== 'super_admin' && req.admin.role !== 'dev') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can adjust credits'
            });
        }

        const { adminId, amount, reason } = req.body;

        if (!adminId || !amount || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID, amount, and reason are required'
            });
        }

        const targetAdmin = await Admin.findById(adminId);
        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Update admin credits
        targetAdmin.totalCredits += parseInt(amount);
        await targetAdmin.save();

        // Create transaction record
        const transaction = new CreditTransaction({
            adminId: adminId,
            adminName: targetAdmin.username,
            transactionType: amount > 0 ? 'bonus' : 'penalty',
            amount: parseInt(amount),
            description: reason,
            performedBy: req.admin.id,
            performedByName: req.admin.username
        });
        await transaction.save();

        // Log activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'adjust_credits',
            targetType: 'admin',
            targetId: adminId,
            targetName: targetAdmin.username,
            details: `Adjusted credits by ${amount}. Reason: ${reason}`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'Credits adjusted successfully',
            newTotal: targetAdmin.totalCredits
        });

    } catch (error) {
        console.error('Adjust credits error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to adjust credits'
        });
    }
});

// GET /api/admin-registration/all-stats - Super admin view of all registrations (super admin only)
router.get('/all-stats', authenticateAdmin, async (req, res) => {
    try {
        // Check if user is super admin or dev
        if (req.admin.role !== 'super_admin' && req.admin.role !== 'dev') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can view all statistics'
            });
        }

        const { adminId, startDate, endDate } = req.query;
        
        let query = { registeredBy: { $ne: null } };

        // Filter by specific admin
        if (adminId) {
            query.registeredBy = adminId;
        }

        // Date range filter
        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) query.submittedAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.submittedAt.$lte = end;
            }
        }

        const students = await Student.find(query)
            .sort({ submittedAt: -1 })
            .populate('registeredBy', 'username email')
            .select('-photoPath');

        // Get admin statistics
        const adminStats = await Admin.find({ role: 'employee' })
            .select('username email totalCredits totalRegistrations')
            .sort({ totalCredits: -1 });

        res.json({
            success: true,
            students: students,
            adminStats: adminStats
        });

    } catch (error) {
        console.error('Get all stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

// POST /api/admin-registration/reset-all-credits - Super admin resets all credits (DANGEROUS)
router.post('/reset-all-credits', authenticateAdmin, async (req, res) => {
    try {
        // Only super admin or dev can reset all credits
        if (req.admin.role !== 'super_admin' && req.admin.role !== 'dev') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only super admins can reset all credits' 
            });
        }

        console.log(`🔴 RESET ALL CREDITS initiated by ${req.admin.username}`);

        // Reset all admins' credits and registrations to zero
        await Admin.updateMany(
            {},
            { 
                $set: { 
                    totalCredits: 0, 
                    totalRegistrations: 0 
                } 
            }
        );

        // Clear all students' registeredBy tracking
        await Student.updateMany(
            { registeredBy: { $ne: null } },
            { 
                $set: { 
                    registeredBy: null,
                    registeredByName: null,
                    creditEarned: 0
                } 
            }
        );

        // Delete all credit transactions
        await CreditTransaction.deleteMany({});

        // Log this critical action
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            action: 'RESET_ALL_CREDITS',
            category: 'critical',
            targetType: 'system',
            details: 'Reset all admin credits and registrations to zero',
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        console.log(`✅ All credits reset successfully by ${req.admin.username}`);

        res.json({ 
            success: true, 
            message: 'All admin credits and registrations have been reset to zero'
        });

    } catch (error) {
        console.error('Reset all credits error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

module.exports = router;
