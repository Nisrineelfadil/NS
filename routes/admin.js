const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const LoginSession = require('../models/LoginSession');
const AdminActivity = require('../models/AdminActivity');
const { logActivity, detectPlatform } = require('../middleware/activityLogger');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Settings = require('../models/Settings');
const { authenticateAdmin, requireSuperAdmin, checkActiveStatus } = require('../middleware/authMiddleware');
const { createBulkDownloadZip, getDownloadStatistics } = require('../services/bulkDownload');
const megaService = require('../services/megaService');

// Helper functions
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           req.ip || 
           'Unknown';
}

function parseUserAgent(userAgent) {
    const ua = userAgent || '';
    return {
        browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown',
        os: ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'Unknown',
        device: ua.includes('Mobile') ? 'Mobile' : 'Desktop'
    };
}

// JWT Secret (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username/Email and password are required' 
            });
        }

        // Secret passcode easter egg for super admin
        const SECRET_PASSCODE = '1122334455';
        // Secret passcode for dev team
        const DEV_SECRET_PASSCODE = 'dev06092005';
        
        let admin;
        
        // Check if it's an email (employee/dev) or username (super admin/dev)
        if (username.includes('@')) {
            // Employee or dev login with email
            admin = await Admin.findOne({ email: username, role: { $in: ['employee', 'dev'] } });
            
            if (!admin) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid email or password' 
                });
            }
            
            // Check for dev secret passcode (for dev account login with email)
            if (admin.role === 'dev' && password === DEV_SECRET_PASSCODE) {
                const token = jwt.sign(
                    { id: admin._id, username: admin.username, role: admin.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                const ipAddress = getClientIp(req);
                const userAgent = req.headers['user-agent'] || 'Unknown';
                const { browser, os, device } = parseUserAgent(userAgent);
                const platform = detectPlatform(userAgent);

                const session = new LoginSession({
                    adminId: admin._id,
                    adminName: admin.username,
                    adminRole: admin.role,
                    ipAddress,
                    userAgent,
                    browser,
                    os,
                    device,
                    platform,
                    loginMethod: 'secret_passcode'
                });
                await session.save();

                await logActivity({
                    adminId: admin._id,
                    adminUsername: admin.username,
                    action: 'login',
                    targetType: 'system',
                    details: 'Login with dev secret passcode',
                    req
                });

                return res.json({ 
                    success: true, 
                    message: 'Login successful',
                    token,
                    admin: {
                        id: admin._id,
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    }
                });
            }
        } else {
            // Super admin or dev login with username
            admin = await Admin.findOne({ username: username, role: { $in: ['super_admin', 'dev'] } });
            
            if (!admin) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid username or password' 
                });
            }
            
            // Check for dev secret passcode (for dev account login with username)
            if (admin.role === 'dev' && password === DEV_SECRET_PASSCODE) {
                const token = jwt.sign(
                    { id: admin._id, username: admin.username, role: admin.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                const ipAddress = getClientIp(req);
                const userAgent = req.headers['user-agent'] || 'Unknown';
                const { browser, os, device } = parseUserAgent(userAgent);
                const platform = detectPlatform(userAgent);

                const session = new LoginSession({
                    adminId: admin._id,
                    adminName: admin.username,
                    adminRole: admin.role,
                    ipAddress,
                    userAgent,
                    browser,
                    os,
                    device,
                    platform,
                    loginMethod: 'secret_passcode'
                });
                await session.save();

                await logActivity({
                    adminId: admin._id,
                    adminUsername: admin.username,
                    action: 'login',
                    targetType: 'system',
                    details: 'Login with dev secret passcode',
                    req
                });

                return res.json({ 
                    success: true, 
                    message: 'Login successful',
                    token,
                    admin: {
                        id: admin._id,
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    }
                });
            }
            
            // Check for secret passcode (easter egg for super admin only)
            if (admin.role === 'super_admin' && password === SECRET_PASSCODE) {
                // Secret passcode works - bypass normal password check
                const token = jwt.sign(
                    { id: admin._id, username: admin.username, role: admin.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                // Get client info
                const ipAddress = getClientIp(req);
                const userAgent = req.headers['user-agent'] || 'Unknown';
                const { browser, os, device } = parseUserAgent(userAgent);

                // Create login session with platform detection
                const platform = detectPlatform(userAgent);
                const session = new LoginSession({
                    adminId: admin._id,
                    adminName: admin.username,
                    adminRole: admin.role,
                    ipAddress,
                    userAgent,
                    browser,
                    os,
                    device,
                    platform,
                    loginMethod: 'secret_passcode'
                });
                await session.save();

                // Log activity with new system
                await logActivity({
                    adminId: admin._id,
                    adminUsername: admin.username,
                    action: 'login',
                    targetType: 'system',
                    details: 'Login with secret passcode',
                    req
                });

                return res.json({ 
                    success: true, 
                    message: 'Login successful (Secret Passcode)',
                    token,
                    admin: {
                        id: admin._id,
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    }
                });
            }
        }

        // Check if account is active
        if (!admin.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is deactivated. Contact super admin.' 
            });
        }

        // Check password (normal authentication)
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate JWT token with role
        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get client info
        const ipAddress = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const { browser, os, device } = parseUserAgent(userAgent);
        const platform = detectPlatform(userAgent);

        // Create login session with platform detection
        const session = new LoginSession({
            adminId: admin._id,
            adminName: admin.username,
            adminRole: admin.role,
            ipAddress,
            userAgent,
            browser,
            os,
            device,
            platform,
            loginMethod: 'password'
        });
        await session.save();

        // Log activity with new system
        await logActivity({
            adminId: admin._id,
            adminUsername: admin.username,
            action: 'login',
            targetType: 'system',
            details: 'Login successful',
            req
        });

        res.json({ 
            success: true, 
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET /api/admin/verify - Verify JWT token
router.get('/verify', authenticateAdmin, async (req, res) => {
    try {
        res.json({
            success: true,
            id: req.adminId,
            username: req.admin.username,
            email: req.admin.email,
            role: req.admin.role
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// POST /api/admin/setup-super-admin - One-time setup for super admin
router.post('/setup-super-admin', async (req, res) => {
    try {
        console.log('Setup super admin endpoint called');
        console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
        console.log('Mongoose connection state:', mongoose.connection.readyState);
        
        // Check if super admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
        if (existingSuperAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Super Admin already exists' 
            });
        }

        // Create super admin with predefined credentials
        const superAdmin = new Admin({
            username: 'Nisrineelfadil',
            email: 'nisrine@nisrineschool.com',
            password: 'Nisrineelfadil_2024',
            role: 'super_admin'
        });

        await superAdmin.save();

        res.status(201).json({ 
            success: true, 
            message: 'Super Admin created successfully',
            admin: {
                id: superAdmin._id,
                username: superAdmin.username,
                email: superAdmin.email,
                role: superAdmin.role
            }
        });

    } catch (error) {
        console.error('Setup super admin error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message,
            details: error.stack
        });
    }
});

// POST /api/admin/setup-dev - One-time setup for dev account (highest privilege, hidden from super admin)
router.post('/setup-dev', async (req, res) => {
    try {
        console.log('Setup dev account endpoint called');
        
        // Check if dev account already exists
        const existingDev = await Admin.findOne({ role: 'dev' });
        if (existingDev) {
            return res.status(400).json({ 
                success: false, 
                message: 'Dev account already exists' 
            });
        }

        // Create dev account with predefined credentials
        const devAdmin = new Admin({
            username: 'DevTeam',
            email: 'dev@ns.com',
            password: 'DevTeam_2024!',
            role: 'dev'
        });

        await devAdmin.save();

        res.status(201).json({ 
            success: true, 
            message: 'Dev account created successfully',
            admin: {
                id: devAdmin._id,
                username: devAdmin.username,
                email: devAdmin.email,
                role: devAdmin.role
            }
        });

    } catch (error) {
        console.error('Setup dev account error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message
        });
    }
});

// GET /api/admin/service-status - Get service status (PUBLIC - no auth required)
router.get('/service-status', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ 
            success: true, 
            settings: {
                isCvServiceOpen: settings.isCvServiceOpen,
                isApplyingServiceOpen: settings.isApplyingServiceOpen,
                isTranslationServiceOpen: settings.isTranslationServiceOpen,
                contactPhone: settings.contactPhone
            }
        });
    } catch (error) {
        console.error('Get service status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET /api/admin/settings - Get current settings
router.get('/settings', authenticateAdmin, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ 
            success: true, 
            settings 
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// PUT /api/admin/settings - Update settings
router.put('/settings', authenticateAdmin, async (req, res) => {
    try {
        const { isRegistrationOpen, contactPhone, closedMessage, isCvServiceOpen, isApplyingServiceOpen, isTranslationServiceOpen } = req.body;
        
        const settings = await Settings.getSettings();
        
        if (isRegistrationOpen !== undefined) {
            settings.isRegistrationOpen = isRegistrationOpen;
        }
        if (contactPhone) {
            settings.contactPhone = contactPhone;
        }
        if (closedMessage) {
            settings.closedMessage = closedMessage;
        }
        // Service toggles
        if (isCvServiceOpen !== undefined) {
            settings.isCvServiceOpen = isCvServiceOpen;
        }
        if (isApplyingServiceOpen !== undefined) {
            settings.isApplyingServiceOpen = isApplyingServiceOpen;
        }
        if (isTranslationServiceOpen !== undefined) {
            settings.isTranslationServiceOpen = isTranslationServiceOpen;
        }
        
        settings.updatedAt = Date.now();
        await settings.save();

        res.json({ 
            success: true, 
            message: 'Settings updated successfully',
            settings 
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET /api/admin/students - Get all students
router.get('/students', authenticateAdmin, async (req, res) => {
    try {
        const students = await Student.find()
            .sort({ submittedAt: -1 })
            .select('-__v');

        res.json({ 
            success: true, 
            count: students.length,
            students 
        });

    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET /api/admin/students/bulk-download/approved - Download all approved students as ZIP
// IMPORTANT: This route MUST be before /students/:id to avoid route conflicts
router.get('/students/bulk-download/approved', authenticateAdmin, async (req, res) => {
    try {
        console.log('📦 Bulk download request received');

        // Get all approved students
        const approvedStudents = await Student.find({ status: 'approved' })
            .sort({ submittedAt: 1 }) // Sort by submission date (oldest first)
            .lean();

        if (approvedStudents.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No approved students found' 
            });
        }

        console.log(`📊 Found ${approvedStudents.length} approved students`);

        // Log the activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'download_pdf',
            targetType: 'system',
            details: `Bulk downloaded ${approvedStudents.length} approved student PDFs`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        // Create and stream ZIP archive
        await createBulkDownloadZip(approvedStudents, res);

    } catch (error) {
        console.error('Bulk download error:', error);
        
        // Only send error response if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: 'Server error: ' + error.message 
            });
        }
    }
});

// GET /api/admin/students/bulk-download/stats - Get bulk download statistics
router.get('/students/bulk-download/stats', authenticateAdmin, async (req, res) => {
    try {
        // Get all approved students
        const approvedStudents = await Student.find({ status: 'approved' })
            .sort({ submittedAt: 1 })
            .lean();

        if (approvedStudents.length === 0) {
            return res.json({ 
                success: true, 
                stats: {
                    totalStudents: 0,
                    years: {},
                    summary: []
                }
            });
        }

        // Get statistics
        const stats = getDownloadStatistics(approvedStudents);

        res.json({ 
            success: true, 
            stats 
        });

    } catch (error) {
        console.error('Get bulk download stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// GET /api/admin/students/:id - Get single student
router.get('/students/:id', authenticateAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        res.json({ 
            success: true, 
            student 
        });

    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// PUT /api/admin/students/:id/status - Update student status
router.put('/students/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                statusChangedAt: new Date()
            },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        // Automatic Dropbox backup and ManagedStudent creation when approved
        if (status === 'approved' && !student.transferredToManagement) {
            console.log(`🔄 Starting automatic backup and transfer for ${student.fullName}...`);
            
            // Create ManagedStudent record
            const ManagedStudent = require('../models/ManagedStudent');
            const bcrypt = require('bcryptjs');
            
            // Generate school email from full name
            const generateSchoolEmail = (fullName) => {
                const cleaned = fullName.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Remove accents
                    .replace(/[^a-z0-9]/g, '');  // Remove special chars
                return `${cleaned}@nisrineschool.com`;
            };
            
            try {
                const managedStudent = new ManagedStudent({
                    fullName: student.fullName,
                    dateOfBirth: student.dateOfBirth,
                    phones: [student.phoneNumber, student.parentPhone].filter(Boolean),
                    cin: student.cin,
                    city: student.city,
                    parentName: student.parentName || '',
                    formation: student.formationChoisie,  // Languages
                    filiere: student.filiere || [],       // Branches
                    photoPath: student.photoPath,
                    schoolEmail: generateSchoolEmail(student.fullName),
                    emailPassword: await bcrypt.hash('NisrineSchool2024', 10),
                    // No group yet - will be assigned later
                    group: null,
                    groupName: 'Pending Assignment',
                    // Default payment info (to be filled later)
                    paymentDate: new Date(),
                    paymentAmount: 0,
                    paymentStatus: 'pending',
                    status: 'pending_assignment',
                    addedBy: req.admin.id,
                    addedByName: req.admin.username
                });
                
                await managedStudent.save();
                console.log(`✅ Created ManagedStudent record for ${student.fullName}`);
                
                // Mark original Student as transferred
                await Student.findByIdAndUpdate(student._id, {
                    transferredToManagement: true,
                    managedStudentId: managedStudent._id
                });
                
                console.log(`✅ Marked Student as transferred`);
            } catch (transferError) {
                console.error(`❌ Error creating ManagedStudent:`, transferError);
            }
            
            // Generate PDF and backup to Dropbox asynchronously
            (async () => {
                try {
                    console.log(`📄 Generating PDF for ${student.fullName}...`);
                    
                    // Generate PDF
                    const { generateRegistrationPDF } = require('../services/pdfGenerator');
                    const pdfBuffer = await generateRegistrationPDF(student.toObject());
                    console.log(`✅ PDF generated (${pdfBuffer.length} bytes)`);
                    
                    // Backup to Mega.nz (pass buffer directly - Vercel filesystem is read-only)
                    console.log(`☁️ Uploading to Mega.nz...`);
                    const result = await megaService.uploadStudentPDF(pdfBuffer, {
                        fullName: student.fullName,
                        cin: student.cin
                    });
                    
                    if (result.success) {
                        console.log(`✅ Mega upload successful!`);
                        console.log(`   File ID: ${result.fileId}`);
                        console.log(`   File Name: ${result.fileName}`);
                        console.log(`   File Path: ${result.filePath}`);
                        
                        // Update student record with backup info
                        await Student.findByIdAndUpdate(student._id, {
                            dropboxBackup: {
                                fileId: result.fileId,
                                fileName: result.fileName,
                                filePath: result.filePath,
                                webViewLink: result.webViewLink,
                                uploadedAt: new Date(result.uploadedAt),
                                isBackedUp: true
                            }
                        });
                        
                        console.log(`✅ Auto-backed up ${student.fullName} to Mega.nz - COMPLETE`);
                    } else {
                        console.error(`❌ Mega upload failed for ${student.fullName}:`, result.message);
                        console.error(`   Error:`, result.error);
                    }
                } catch (err) {
                    console.error(`❌ Auto-backup error for ${student.fullName}:`, err);
                    console.error(`   Stack:`, err.stack);
                }
            })();
        }

        // Log the activity
        const action = status === 'approved' ? 'approve_student' : 'reject_student';
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: action,
            targetType: 'student',
            targetId: student._id.toString(),
            targetName: student.fullName,
            details: `Changed status to ${status}`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        res.json({ 
            success: true, 
            message: status === 'approved' ? 
                'Status updated successfully. PDF will be backed up to Mega.nz automatically.' : 
                'Status updated successfully',
            student 
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// POST /api/admin/students/:id/backup-dropbox - Manual backup to Mega.nz
router.post('/students/:id/backup-dropbox', authenticateAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        console.log(`🔄 Manual backup requested for ${student.fullName}...`);
        
        // Generate PDF
        console.log(`📄 Generating PDF for ${student.fullName}...`);
        const { generateRegistrationPDF } = require('../services/pdfGenerator');
        const pdfBuffer = await generateRegistrationPDF(student.toObject());
        console.log(`✅ PDF generated (${pdfBuffer.length} bytes)`);
        
        // Backup to Mega.nz (pass buffer directly - Vercel filesystem is read-only)
        console.log(`☁️ Uploading to Mega.nz...`);
        const result = await megaService.uploadStudentPDF(pdfBuffer, {
            fullName: student.fullName,
            cin: student.cin
        });
        
        if (result.success) {
            console.log(`✅ Mega upload successful!`);
            
            // Update student record with backup info
            await Student.findByIdAndUpdate(student._id, {
                dropboxBackup: {
                    fileId: result.fileId,
                    fileName: result.fileName,
                    filePath: result.filePath,
                    webViewLink: result.webViewLink,
                    uploadedAt: new Date(result.uploadedAt),
                    isBackedUp: true
                }
            });
            
            console.log(`✅ Backed up ${student.fullName} to Mega.nz`);
            
            // Log activity
            await logActivity({
                adminId: req.admin.id,
                adminName: req.admin.username,
                adminRole: req.admin.role,
                action: 'backup_to_mega',
                targetType: 'student',
                targetId: student._id.toString(),
                targetName: student.fullName,
                details: `Manually backed up PDF to Mega.nz`,
                ipAddress: getClientIp(req),
                userAgent: req.headers['user-agent']
            });
            
            res.json({ 
                success: true, 
                message: `✅ ${student.fullName} backed up to Mega.nz successfully!`,
                backup: {
                    fileName: result.fileName,
                    fileId: result.fileId,
                    uploadedAt: result.uploadedAt
                }
            });
        } else {
            console.error(`❌ Mega upload failed:`, result.message);
            res.status(500).json({ 
                success: false, 
                message: result.message,
                error: result.error,
                fix: result.fix
            });
        }

    } catch (error) {
        console.error('Manual backup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// GET /api/admin/cloud-status - Get Mega.nz backup status
router.get('/cloud-status', authenticateAdmin, async (req, res) => {
    try {
        // Test Mega connection
        const connectionTest = await megaService.testConnection();
        
        // Get backup statistics
        const totalStudents = await Student.countDocuments();
        const approvedStudents = await Student.countDocuments({ status: 'approved' });
        const backedUpStudents = await Student.countDocuments({ 
            'dropboxBackup.isBackedUp': true 
        });
        const pendingBackup = approvedStudents - backedUpStudents;
        
        // Get list of backed up students
        const backedUpList = await Student.find(
            { 'dropboxBackup.isBackedUp': true },
            { fullName: 1, cin: 1, dropboxBackup: 1 }
        ).limit(10).sort({ 'dropboxBackup.uploadedAt': -1 });

        res.json({
            success: true,
            mega: {
                connected: connectionTest.success,
                accountEmail: connectionTest.accountEmail || null,
                storageUsed: connectionTest.storageUsed || null,
                storageTotal: connectionTest.storageTotal || null,
                storageAvailable: connectionTest.storageAvailable || null,
                message: connectionTest.success ? 'Connected to Mega.nz' : connectionTest.message,
                error: connectionTest.error || null,
                fix: connectionTest.fix || null
            },
            statistics: {
                totalStudents,
                approvedStudents,
                backedUpStudents,
                pendingBackup,
                backupPercentage: approvedStudents > 0 
                    ? Math.round((backedUpStudents / approvedStudents) * 100) 
                    : 0
            },
            recentBackups: backedUpList.map(s => ({
                name: s.fullName,
                cin: s.cin,
                fileName: s.dropboxBackup.fileName,
                uploadedAt: s.dropboxBackup.uploadedAt
            }))
        });

    } catch (error) {
        console.error('Cloud status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// GET /api/admin/students/:id/pdf - Download student PDF (generate on-demand)
router.get('/students/:id/pdf', authenticateAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        // Generate PDF on-demand (Vercel compatible - no disk write)
        const { generateRegistrationPDF } = require('../services/pdfGenerator');
        const pdfBuffer = await generateRegistrationPDF(student.toObject());

        // Log the activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'view_pdf',
            targetType: 'student',
            targetId: student._id.toString(),
            targetName: student.fullName,
            details: `Viewed PDF for ${student.cin}`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        // Send PDF as buffer directly (no disk write needed)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="registration-${student.cin}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Download PDF error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// DELETE /api/admin/students/:id - Delete student
router.delete('/students/:id', authenticateAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        // Delete photo file
        if (student.photoPath && fs.existsSync(student.photoPath)) {
            fs.unlinkSync(student.photoPath);
        }

        // Delete PDF file
        if (student.pdfPath) {
            const pdfPath = path.join(__dirname, '..', student.pdfPath);
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        }

        await Student.findByIdAndDelete(req.params.id);

        // Log the activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'delete_student',
            targetType: 'student',
            targetId: student._id.toString(),
            targetName: student.fullName,
            details: `Deleted student ${student.cin}`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        res.json({ 
            success: true, 
            message: 'Student deleted successfully' 
        });

    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const pendingStudents = await Student.countDocuments({ status: 'pending' });
        const approvedStudents = await Student.countDocuments({ status: 'approved' });
        const rejectedStudents = await Student.countDocuments({ status: 'rejected' });

        // Get registrations by formation
        const formationStats = await Student.aggregate([
            {
                $group: {
                    _id: '$formationChoisie',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent registrations
        const recentRegistrations = await Student.find()
            .sort({ submittedAt: -1 })
            .limit(5)
            .select('fullName formationChoisie submittedAt status');

        res.json({ 
            success: true, 
            stats: {
                total: totalStudents,
                pending: pendingStudents,
                approved: approvedStudents,
                rejected: rejectedStudents,
                byFormation: formationStats,
                recent: recentRegistrations
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// ==================== EMPLOYEE MANAGEMENT (Super Admin Only) ====================

// POST /api/admin/create-employee - Create new employee account
router.post('/create-employee', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Validate email format for employees (must be @nisrineschool.com)
        if (!email.endsWith('@nisrineschool.com')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee email must be in format: employee@nisrineschool.com' 
            });
        }

        // Check if employee already exists
        const existingEmployee = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existingEmployee) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee with this username or email already exists' 
            });
        }

        // Create employee
        const employee = new Admin({
            username,
            email,
            password,
            role: 'employee',
            createdBy: req.adminId
        });

        await employee.save();

        res.status(201).json({ 
            success: true, 
            message: 'Employee account created successfully',
            employee: {
                id: employee._id,
                username: employee.username,
                email: employee.email,
                role: employee.role,
                isActive: employee.isActive
            }
        });

    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET /api/admin/employees - Get all employees
router.get('/employees', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const employees = await Admin.find({ role: 'employee' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            count: employees.length,
            employees 
        });

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// PUT /api/admin/employees/:id/toggle - Toggle employee active status
router.put('/employees/:id/toggle', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const employee = await Admin.findById(req.params.id);
        
        if (!employee || employee.role !== 'employee') {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found' 
            });
        }

        employee.isActive = !employee.isActive;
        await employee.save();

        res.json({ 
            success: true, 
            message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
            employee: {
                id: employee._id,
                username: employee.username,
                isActive: employee.isActive
            }
        });

    } catch (error) {
        console.error('Toggle employee error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// DELETE /api/admin/delete-user/:username - Delete specific user by username
router.delete('/delete-user/:username', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { username } = req.params;
        
        const userToDelete = await Admin.findOne({ username });
        if (!userToDelete) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (userToDelete.role === 'super_admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot delete super admin account' 
            });
        }

        if (userToDelete.role === 'dev') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot delete dev account' 
            });
        }

        await Admin.findOneAndDelete({ username });

        res.json({ 
            success: true, 
            message: `User ${username} deleted successfully` 
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// DELETE /api/admin/employees/:id - Delete employee
router.delete('/employees/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const employee = await Admin.findById(req.params.id);
        
        if (!employee || employee.role !== 'employee') {
            return res.status(404).json({ 
                message: 'Employee not found' 
            });
        }

        await Admin.findByIdAndDelete(req.params.id);

        res.json({ 
            success: true, 
            message: 'Employee deleted successfully' 
        });

    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// ==================== CONTACT MESSAGES MANAGEMENT ====================

// GET /api/admin/messages - Get all contact messages
router.get('/messages', authenticateAdmin, async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json({ 
            success: true, 
            count: messages.length,
            messages 
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// PUT /api/admin/messages/:id/read - Mark message as read
router.put('/messages/:id/read', authenticateAdmin, async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ 
                success: false, 
                message: 'Message not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Message marked as read',
            data: message 
        });

    } catch (error) {
        console.error('Mark message as read error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// DELETE /api/admin/messages/:id - Delete message
router.delete('/messages/:id', authenticateAdmin, async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);
        
        if (!message) {
            return res.status(404).json({ 
                success: false, 
                message: 'Message not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Message deleted successfully' 
        });

    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET /api/admin/profile - Get admin profile
router.get('/profile', authenticateAdmin, checkActiveStatus, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        res.json({ 
            success: true, 
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// PUT /api/admin/change-username - Super admin changes their username
router.put('/change-username', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const { newUsername, password } = req.body;

        if (!newUsername || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'New username and password are required' 
            });
        }

        if (newUsername.length < 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username must be at least 3 characters long' 
            });
        }

        // Get the super admin
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        // Verify password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Password is incorrect' 
            });
        }

        // Check if username already exists
        const existingAdmin = await Admin.findOne({ username: newUsername });
        if (existingAdmin && existingAdmin._id.toString() !== admin._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        // Update username
        admin.username = newUsername;
        await admin.save();

        res.json({ 
            success: true, 
            message: 'Username changed successfully' 
        });

    } catch (error) {
        console.error('Change username error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// PUT /api/admin/change-password - Super admin changes their own password
router.put('/change-password', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Get the super admin
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        // Verify current password
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Update password
        admin.password = newPassword;
        await admin.save();

        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// PUT /api/admin/employees/:id/change-password - Super admin changes employee password
router.put('/employees/:id/change-password', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const employeeId = req.params.id;

        if (!newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password is required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Find the employee
        const employee = await Admin.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found' 
            });
        }

        // Ensure it's not the super admin trying to change their own password via this route
        if (employee.role === 'superadmin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot change super admin password via this route' 
            });
        }

        // Update password
        employee.password = newPassword;
        await employee.save();

        res.json({ 
            success: true, 
            message: `Password changed successfully for ${employee.username}` 
        });

    } catch (error) {
        console.error('Change employee password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// ==================== ACTIVITY LOG & SESSION HISTORY ====================

// GET /api/admin/activity-logs - Get activity logs (Super Admin Only)
router.get('/activity-logs', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const { limit = 100, skip = 0, action, adminId } = req.query;
        
        // Get dev admin IDs to exclude from results
        const devAdmins = await Admin.find({ role: 'dev' }).select('_id');
        const devAdminIds = devAdmins.map(a => a._id);
        
        // Build query - exclude dev accounts
        const query = { adminId: { $nin: devAdminIds } };
        if (action) query.action = action;
        if (adminId) query.adminId = adminId;
        
        const logs = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();
        
        const total = await ActivityLog.countDocuments(query);
        
        res.json({
            success: true,
            logs,
            total,
            hasMore: total > (parseInt(skip) + parseInt(limit))
        });
        
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/admin/login-sessions - Get login session history (Super Admin Only)
router.get('/login-sessions', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const { limit = 50, skip = 0, adminId } = req.query;
        
        // Get dev admin IDs to exclude from results
        const devAdmins = await Admin.find({ role: 'dev' }).select('_id');
        const devAdminIds = devAdmins.map(a => a._id);
        
        // Build query - exclude dev accounts
        const query = { adminId: { $nin: devAdminIds } };
        if (adminId) query.adminId = adminId;
        
        const sessions = await LoginSession.find(query)
            .sort({ loginTime: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();
        
        const total = await LoginSession.countDocuments(query);
        
        res.json({
            success: true,
            sessions,
            total,
            hasMore: total > (parseInt(skip) + parseInt(limit))
        });
        
    } catch (error) {
        console.error('Get login sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/admin/activity-stats - Get activity statistics
router.get('/activity-stats', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        // Get dev admin IDs to exclude from stats
        const devAdmins = await Admin.find({ role: 'dev' }).select('_id');
        const devAdminIds = devAdmins.map(a => a._id);
        
        const totalLogs = await ActivityLog.countDocuments({ adminId: { $nin: devAdminIds } });
        const totalSessions = await LoginSession.countDocuments({ adminId: { $nin: devAdminIds } });
        const activeSessions = await LoginSession.countDocuments({ isActive: true, adminId: { $nin: devAdminIds } });
        
        // Get action breakdown (exclude dev)
        const actionBreakdown = await ActivityLog.aggregate([
            { $match: { adminId: { $nin: devAdminIds } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        // Get most active admins (exclude dev)
        const mostActiveAdmins = await ActivityLog.aggregate([
            { $match: { adminId: { $nin: devAdminIds } } },
            { $group: { _id: '$adminId', adminName: { $first: '$adminName' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        res.json({
            success: true,
            stats: {
                totalLogs,
                totalSessions,
                activeSessions,
                actionBreakdown,
                mostActiveAdmins
            }
        });
        
    } catch (error) {
        console.error('Get activity stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/admin/employee-performance - Get employee performance metrics (Super Admin Only)
router.get('/employee-performance', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const employees = await Admin.find({ role: 'employee' }).select('_id username');
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const performance = await Promise.all(employees.map(async (employee) => {
            // Get all-time logs for action breakdown
            const logs = await ActivityLog.find({ adminId: employee._id });
            
            // Get today's login count
            const loginsToday = await LoginSession.countDocuments({
                adminId: employee._id,
                loginTime: { $gte: today, $lt: tomorrow }
            });
            
            const approved = logs.filter(log => log.action === 'approve_student').length;
            const rejected = logs.filter(log => log.action === 'reject_student').length;
            const deleted = logs.filter(log => log.action === 'delete_student').length;
            const downloads = logs.filter(log => log.action === 'download_pdf').length;
            
            return {
                employeeId: employee._id,
                employeeName: employee.username,
                loginsToday,
                approved,
                rejected,
                deleted,
                downloads
            };
        }));
        
        // Sort by logins today
        performance.sort((a, b) => b.loginsToday - a.loginsToday);
        
        res.json({
            success: true,
            performance
        });
        
    } catch (error) {
        console.error('Get employee performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/admin/employee-activity - Get employee activity dashboard (Super Admin Only)
router.get('/employee-activity', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const employees = await Admin.find({ role: 'employee' }).select('_id username');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activities = await Promise.all(employees.map(async (employee) => {
            // Get last action
            const lastAction = await ActivityLog.findOne({ adminId: employee._id })
                .sort({ timestamp: -1 })
                .lean();
            
            // Get actions today
            const actionsToday = await ActivityLog.countDocuments({
                adminId: employee._id,
                timestamp: { $gte: today }
            });
            
            return {
                employeeId: employee._id,
                employeeName: employee.username,
                lastAction,
                actionsToday
            };
        }));
        
        // Sort by most recent activity
        activities.sort((a, b) => {
            if (!a.lastAction) return 1;
            if (!b.lastAction) return -1;
            return new Date(b.lastAction.timestamp) - new Date(a.lastAction.timestamp);
        });
        
        res.json({
            success: true,
            activities
        });
        
    } catch (error) {
        console.error('Get employee activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// DELETE /api/admin/clear-activity-logs - Clear all activity logs (Super Admin Only)
router.delete('/clear-activity-logs', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const result = await ActivityLog.deleteMany({});
        
        // Log this action
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'delete_student',
            targetType: 'system',
            details: `Cleared all activity logs (${result.deletedCount} records)`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });
        
        res.json({
            success: true,
            message: `Successfully cleared ${result.deletedCount} activity logs`
        });
        
    } catch (error) {
        console.error('Clear activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// DELETE /api/admin/clear-login-sessions - Clear all login sessions (Super Admin Only)
router.delete('/clear-login-sessions', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const result = await LoginSession.deleteMany({});
        
        // Log this action
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'delete_student',
            targetType: 'system',
            details: `Cleared all login sessions (${result.deletedCount} records)`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });
        
        res.json({
            success: true,
            message: `Successfully cleared ${result.deletedCount} login sessions`
        });
        
    } catch (error) {
        console.error('Clear login sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// DELETE /api/admin/clear-employee-activity - Clear employee activity logs only (Super Admin Only)
router.delete('/clear-employee-activity', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        // Get all employees
        const employees = await Admin.find({ role: 'employee' }).select('_id');
        const employeeIds = employees.map(emp => emp._id);
        
        // Delete activity logs for employees only
        const result = await ActivityLog.deleteMany({ adminId: { $in: employeeIds } });
        
        // Log this action
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'delete_student',
            targetType: 'system',
            details: `Cleared employee activity logs (${result.deletedCount} records)`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });
        
        res.json({
            success: true,
            message: `Successfully cleared ${result.deletedCount} employee activity logs`
        });
        
    } catch (error) {
        console.error('Clear employee activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ============================================
// GOOGLE DRIVE BACKUP ENDPOINTS
// ============================================

// POST /api/admin/backup-student/:id - Backup single student PDF to Google Drive
router.post('/backup-student/:id', authenticateAdmin, checkActiveStatus, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if PDF exists
        if (!student.pdfPath || !fs.existsSync(student.pdfPath)) {
            return res.status(400).json({
                success: false,
                message: 'Student PDF not found'
            });
        }

        // Upload to Google Drive
        const result = await googleDriveService.uploadStudentPDF(student.pdfPath, {
            fullName: student.fullName,
            cin: student.cin
        });

        if (result.success) {
            // Update student record with backup info
            student.driveBackup = {
                fileId: result.fileId,
                fileName: result.fileName,
                webViewLink: result.webViewLink,
                uploadedAt: new Date(result.uploadedAt),
                isBackedUp: true
            };
            await student.save();

            // Log activity
            await logActivity(req.admin._id, 'backup_student', {
                studentId: student._id,
                studentName: student.fullName,
                driveFileId: result.fileId
            }, req);

            res.json({
                success: true,
                message: 'Student PDF backed up to Google Drive successfully',
                backup: student.driveBackup
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Backup student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to backup student PDF',
            error: error.message
        });
    }
});

// POST /api/admin/backup-all-approved - Backup all approved students to Google Drive
router.post('/backup-all-approved', authenticateAdmin, checkActiveStatus, async (req, res) => {
    try {
        // Find all approved students without backup
        const students = await Student.find({
            status: 'approved',
            'driveBackup.isBackedUp': { $ne: true }
        });

        if (students.length === 0) {
            return res.json({
                success: true,
                message: 'All approved students are already backed up',
                backedUp: 0,
                failed: 0
            });
        }

        let backedUp = 0;
        let failed = 0;
        const errors = [];

        for (const student of students) {
            try {
                if (!student.pdfPath || !fs.existsSync(student.pdfPath)) {
                    failed++;
                    errors.push({ studentId: student._id, error: 'PDF not found' });
                    continue;
                }

                const result = await googleDriveService.uploadStudentPDF(student.pdfPath, {
                    fullName: student.fullName,
                    cin: student.cin
                });

                if (result.success) {
                    student.driveBackup = {
                        fileId: result.fileId,
                        fileName: result.fileName,
                        webViewLink: result.webViewLink,
                        uploadedAt: new Date(result.uploadedAt),
                        isBackedUp: true
                    };
                    await student.save();
                    backedUp++;
                } else {
                    failed++;
                    errors.push({ studentId: student._id, error: result.error });
                }
            } catch (error) {
                failed++;
                errors.push({ studentId: student._id, error: error.message });
            }
        }

        // Log activity
        await logActivity(req.admin._id, 'backup_all_approved', {
            totalStudents: students.length,
            backedUp,
            failed
        }, req);

        res.json({
            success: true,
            message: `Backup completed: ${backedUp} successful, ${failed} failed`,
            backedUp,
            failed,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Backup all approved error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to backup approved students',
            error: error.message
        });
    }
});

// GET /api/admin/drive-status - Check Google Drive connection status
router.get('/drive-status', authenticateAdmin, async (req, res) => {
    try {
        const status = await googleDriveService.testConnection();
        
        // Get backup statistics
        const totalStudents = await Student.countDocuments();
        const approvedStudents = await Student.countDocuments({ status: 'approved' });
        const backedUpStudents = await Student.countDocuments({ 'driveBackup.isBackedUp': true });
        const pendingBackup = await Student.countDocuments({
            status: 'approved',
            'driveBackup.isBackedUp': { $ne: true }
        });

        res.json({
            success: true,
            drive: status,
            statistics: {
                totalStudents,
                approvedStudents,
                backedUpStudents,
                pendingBackup
            }
        });
    } catch (error) {
        console.error('Drive status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check Google Drive status',
            error: error.message
        });
    }
});

// GET /api/admin/test-mega - Test Mega.nz connection
router.get('/test-mega', authenticateAdmin, async (req, res) => {
    try {
        console.log('🧪 Testing Mega.nz connection...');
        
        const result = await megaService.testConnection();
        
        if (result.success) {
            console.log('✅ Mega connection successful!');
            console.log(`   Email: ${result.accountEmail}`);
            console.log(`   Storage Used: ${result.storageUsed}`);
            console.log(`   Storage Total: ${result.storageTotal}`);
            console.log(`   Storage Available: ${result.storageAvailable}`);
        } else {
            console.error('❌ Mega connection failed:', result.message);
        }
        
        res.json(result);
    } catch (error) {
        console.error('❌ Mega test error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test Mega connection',
            error: error.message
        });
    }
});

module.exports = router;
