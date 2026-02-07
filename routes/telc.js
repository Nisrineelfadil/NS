const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TelcCandidate = require('../models/TelcCandidate');
const TelcExamMonth = require('../models/TelcExamMonth');
const TelcEmailTemplate = require('../models/TelcEmailTemplate');
const Settings = require('../models/Settings');
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');
const imageStorageService = require('../services/imageStorageService');

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const admin = await Admin.findById(decoded.id);
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid or inactive admin' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Super admin check middleware
const requireSuperAdmin = (req, res, next) => {
    if (req.admin.role !== 'super_admin' && req.admin.role !== 'dev') {
        return res.status(403).json({ success: false, message: 'Super admin access required' });
    }
    next();
};

// ============================================
// SETTINGS ROUTES
// ============================================

// GET /api/telc/settings - Get TELC settings
router.get('/settings', authenticateAdmin, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({
            success: true,
            settings: {
                isTelcRegistrationOpen: settings.isTelcRegistrationOpen,
                telcSuperAdminEmail: settings.telcSuperAdminEmail,
                telcAutoOverflow: settings.telcAutoOverflow,
                telcDefaultMaxCapacity: settings.telcDefaultMaxCapacity,
                telcDefaultEmergencyReserve: settings.telcDefaultEmergencyReserve
            }
        });
    } catch (error) {
        console.error('Get TELC settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/telc/settings - Update TELC settings
router.put('/settings', authenticateAdmin, async (req, res) => {
    try {
        const {
            isTelcRegistrationOpen,
            telcSuperAdminEmail,
            telcAutoOverflow,
            telcDefaultMaxCapacity,
            telcDefaultEmergencyReserve
        } = req.body;

        const settings = await Settings.getSettings();

        if (isTelcRegistrationOpen !== undefined) {
            settings.isTelcRegistrationOpen = isTelcRegistrationOpen;
        }
        if (telcSuperAdminEmail !== undefined) {
            settings.telcSuperAdminEmail = telcSuperAdminEmail;
        }
        if (telcAutoOverflow !== undefined) {
            settings.telcAutoOverflow = telcAutoOverflow;
        }
        if (telcDefaultMaxCapacity !== undefined) {
            settings.telcDefaultMaxCapacity = telcDefaultMaxCapacity;
        }
        if (telcDefaultEmergencyReserve !== undefined) {
            settings.telcDefaultEmergencyReserve = telcDefaultEmergencyReserve;
        }

        settings.updatedAt = Date.now();
        await settings.save();

        res.json({
            success: true,
            message: 'TELC settings updated successfully',
            settings: {
                isTelcRegistrationOpen: settings.isTelcRegistrationOpen,
                telcSuperAdminEmail: settings.telcSuperAdminEmail,
                telcAutoOverflow: settings.telcAutoOverflow,
                telcDefaultMaxCapacity: settings.telcDefaultMaxCapacity,
                telcDefaultEmergencyReserve: settings.telcDefaultEmergencyReserve
            }
        });
    } catch (error) {
        console.error('Update TELC settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// EXAM MONTH ROUTES
// ============================================

// POST /api/telc/sync-counts - Sync all month counts based on actual candidates
router.post('/sync-counts', authenticateAdmin, async (req, res) => {
    try {
        const months = await TelcExamMonth.find({});
        let updated = 0;
        
        for (const month of months) {
            await TelcExamMonth.updateStats(month._id);
            updated++;
        }
        
        res.json({
            success: true,
            message: `Synced counts for ${updated} months`
        });
    } catch (error) {
        console.error('Sync counts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/telc/months - Get all exam months
router.get('/months', authenticateAdmin, async (req, res) => {
    try {
        const { year } = req.query;
        const query = {};
        
        if (year) {
            query.year = parseInt(year);
        }

        const months = await TelcExamMonth.find(query)
            .sort({ year: 1, month: 1 })
            .lean();

        // Add virtual fields
        const monthsWithVirtuals = months.map(m => ({
            ...m,
            effectiveCapacity: m.reserveUnlocked ? m.maxCapacity + m.emergencyReserve : m.maxCapacity,
            availableSlots: Math.max(0, (m.reserveUnlocked ? m.maxCapacity + m.emergencyReserve : m.maxCapacity) - m.currentCount),
            capacityPercentage: m.maxCapacity > 0 ? Math.round((m.currentCount / (m.reserveUnlocked ? m.maxCapacity + m.emergencyReserve : m.maxCapacity)) * 100) : 0,
            isAtCapacity: m.currentCount >= (m.reserveUnlocked ? m.maxCapacity + m.emergencyReserve : m.maxCapacity),
            isMainCapacityReached: m.currentCount >= m.maxCapacity
        }));

        res.json({ success: true, months: monthsWithVirtuals });
    } catch (error) {
        console.error('Get months error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/telc/months - Create a new exam month
router.post('/months', authenticateAdmin, async (req, res) => {
    try {
        const { month, year, examDate, maxCapacity, emergencyReserve, autoOverflowEnabled, notes } = req.body;

        // Check if month already exists
        const existing = await TelcExamMonth.findOne({ month, year });
        if (existing) {
            return res.status(400).json({ success: false, message: 'This month already exists' });
        }

        // Get default settings
        const settings = await Settings.getSettings();

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const newMonth = new TelcExamMonth({
            month,
            year,
            label: `${monthNames[month - 1]} ${year}`,
            examDate: examDate || null,
            maxCapacity: maxCapacity || settings.telcDefaultMaxCapacity,
            emergencyReserve: emergencyReserve || settings.telcDefaultEmergencyReserve,
            autoOverflowEnabled: autoOverflowEnabled !== undefined ? autoOverflowEnabled : settings.telcAutoOverflow,
            notes: notes || '',
            createdBy: req.admin._id,
            createdByName: req.admin.username
        });

        await newMonth.save();

        res.status(201).json({
            success: true,
            message: 'Exam month created successfully',
            month: newMonth
        });
    } catch (error) {
        console.error('Create month error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/telc/months/:id - Get a specific month
router.get('/months/:id', authenticateAdmin, async (req, res) => {
    try {
        const month = await TelcExamMonth.findById(req.params.id);
        if (!month) {
            return res.status(404).json({ success: false, message: 'Month not found' });
        }

        res.json({ success: true, month });
    } catch (error) {
        console.error('Get month error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/telc/months/:id - Update a month
router.put('/months/:id', authenticateAdmin, async (req, res) => {
    try {
        const { examDate, maxCapacity, emergencyReserve, isOpen, autoOverflowEnabled, notes } = req.body;

        const month = await TelcExamMonth.findById(req.params.id);
        if (!month) {
            return res.status(404).json({ success: false, message: 'Month not found' });
        }

        if (examDate !== undefined) month.examDate = examDate;
        if (maxCapacity !== undefined) month.maxCapacity = maxCapacity;
        if (emergencyReserve !== undefined) month.emergencyReserve = emergencyReserve;
        if (isOpen !== undefined) month.isOpen = isOpen;
        if (autoOverflowEnabled !== undefined) month.autoOverflowEnabled = autoOverflowEnabled;
        if (notes !== undefined) month.notes = notes;

        month.lastModifiedBy = req.admin._id;
        month.lastModifiedByName = req.admin.username;

        await month.save();

        res.json({
            success: true,
            message: 'Month updated successfully',
            month
        });
    } catch (error) {
        console.error('Update month error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/telc/months/:id/unlock-reserve - Unlock emergency reserve (super admin only)
router.post('/months/:id/unlock-reserve', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const month = await TelcExamMonth.findById(req.params.id);
        if (!month) {
            return res.status(404).json({ success: false, message: 'Month not found' });
        }

        if (month.reserveUnlocked) {
            return res.status(400).json({ success: false, message: 'Reserve already unlocked' });
        }

        month.reserveUnlocked = true;
        month.reserveUnlockedAt = new Date();
        month.reserveUnlockedBy = req.admin._id;
        month.reserveUnlockedByName = req.admin.username;
        month.lastModifiedBy = req.admin._id;
        month.lastModifiedByName = req.admin.username;

        await month.save();

        res.json({
            success: true,
            message: `Emergency reserve of ${month.emergencyReserve} slots unlocked`,
            month
        });
    } catch (error) {
        console.error('Unlock reserve error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/telc/months/:id/lock - Lock a month (after exam is done) and backup to cloud
router.post('/months/:id/lock', authenticateAdmin, async (req, res) => {
    try {
        const month = await TelcExamMonth.findById(req.params.id);
        if (!month) {
            return res.status(404).json({ success: false, message: 'Month not found' });
        }

        // Lock the month
        month.isLocked = true;
        month.isOpen = false;
        month.lockedAt = new Date();
        month.lockedBy = req.admin._id;
        month.lockedByName = req.admin.username;
        month.lastModifiedBy = req.admin._id;
        month.lastModifiedByName = req.admin.username;

        await month.save();

        // Backup to cloud (async - don't wait for it to complete)
        let backupResult = null;
        try {
            const telcBackupService = require('../services/telcBackupService');
            backupResult = await telcBackupService.backupLockedMonth(month._id);
            console.log('📦 TELC Cloud backup result:', backupResult);
        } catch (backupError) {
            console.error('⚠️ Cloud backup failed (month still locked):', backupError.message);
            backupResult = { success: false, error: backupError.message };
        }

        res.json({
            success: true,
            message: 'Month locked successfully',
            month,
            cloudBackup: backupResult
        });
    } catch (error) {
        console.error('Lock month error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/telc/months/:id - Delete a month (only if no candidates)
router.delete('/months/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const month = await TelcExamMonth.findById(req.params.id);
        if (!month) {
            return res.status(404).json({ success: false, message: 'Month not found' });
        }

        // Check if there are candidates
        const candidateCount = await TelcCandidate.countDocuments({ examMonth: month._id });
        if (candidateCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete month with ${candidateCount} candidates. Move or delete candidates first.`
            });
        }

        await TelcExamMonth.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Month deleted successfully'
        });
    } catch (error) {
        console.error('Delete month error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// CANDIDATE ROUTES
// ============================================

// GET /api/telc/candidates - Get all candidates with filters
router.get('/candidates', authenticateAdmin, async (req, res) => {
    try {
        const { examMonth, examLevel, resultCategory, registrationStatus, search, emailSent } = req.query;
        const query = {};

        if (examMonth) query.examMonth = examMonth;
        if (examLevel) query.examLevel = examLevel;
        if (resultCategory) query.resultCategory = resultCategory;
        if (registrationStatus) query.registrationStatus = registrationStatus;
        if (emailSent !== undefined) query.emailSent = emailSent === 'true';

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { cin: { $regex: search, $options: 'i' } }
            ];
        }

        const candidates = await TelcCandidate.find(query)
            .populate('examMonth', 'label month year')
            .sort({ createdAt: -1 })
            .lean();

        // Don't send certificate data in list (too large)
        const candidatesWithoutCertData = candidates.map(c => ({
            ...c,
            hasCertificate: !!c.certificate?.data,
            certificate: c.certificate ? {
                filename: c.certificate.filename,
                uploadedAt: c.certificate.uploadedAt,
                uploadedByName: c.certificate.uploadedByName
            } : null
        }));

        res.json({ success: true, candidates: candidatesWithoutCertData });
    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/telc/candidates - Create a new candidate
router.post('/candidates', authenticateAdmin, async (req, res) => {
    try {
        const {
            fullName, email, phoneNumber, cin, address, city,
            examLevel, examMonthId, paymentStatus, paymentAmount, notes
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !phoneNumber || !examLevel || !examMonthId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: fullName, email, phoneNumber, examLevel, examMonthId'
            });
        }

        // Get the exam month
        const examMonth = await TelcExamMonth.findById(examMonthId);
        if (!examMonth) {
            return res.status(404).json({ success: false, message: 'Exam month not found' });
        }

        // Check capacity
        if (!examMonth.canAcceptCandidate()) {
            // Check for auto-overflow
            const settings = await Settings.getSettings();
            if (examMonth.autoOverflowEnabled || settings.telcAutoOverflow) {
                const nextMonth = await TelcExamMonth.getNextAvailableMonth(examMonth.month, examMonth.year);
                if (nextMonth) {
                    return res.status(400).json({
                        success: false,
                        message: `${examMonth.label} is at capacity. Next available month is ${nextMonth.label}`,
                        suggestedMonth: nextMonth
                    });
                }
            }
            return res.status(400).json({
                success: false,
                message: `${examMonth.label} is at capacity and no overflow month is available`
            });
        }

        // Create candidate
        const candidate = new TelcCandidate({
            fullName,
            email,
            phoneNumber,
            cin: cin || '',
            address: address || '',
            city: city || '',
            examLevel,
            examMonth: examMonth._id,
            examMonthLabel: examMonth.label,
            paymentStatus: paymentStatus || 'pending',
            paymentAmount: paymentAmount || 0,
            notes: notes || '',
            addedBy: req.admin._id,
            addedByName: req.admin.username
        });

        await candidate.save();

        // Update month count
        await examMonth.incrementCount();

        // Check if capacity alert should be sent
        if (examMonth.currentCount >= examMonth.maxCapacity && !examMonth.capacityAlertSent) {
            try {
                emailService.initialize();
                await emailService.sendCapacityAlert(examMonth._id);
            } catch (emailError) {
                console.error('Failed to send capacity alert:', emailError);
            }
        }

        // Update month stats
        await TelcExamMonth.updateStats(examMonth._id);

        res.status(201).json({
            success: true,
            message: 'Candidate registered successfully',
            candidate
        });
    } catch (error) {
        console.error('Create candidate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/telc/candidates/:id - Get a specific candidate
router.get('/candidates/:id', authenticateAdmin, async (req, res) => {
    try {
        const candidate = await TelcCandidate.findById(req.params.id)
            .populate('examMonth', 'label month year');

        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        res.json({ success: true, candidate });
    } catch (error) {
        console.error('Get candidate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/telc/candidates/:id - Update a candidate
router.put('/candidates/:id', authenticateAdmin, async (req, res) => {
    try {
        const {
            fullName, email, phoneNumber, cin, address, city,
            examLevel, registrationStatus, paymentStatus, paymentAmount, notes
        } = req.body;

        const candidate = await TelcCandidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        if (fullName) candidate.fullName = fullName;
        if (email) candidate.email = email;
        if (phoneNumber) candidate.phoneNumber = phoneNumber;
        if (cin !== undefined) candidate.cin = cin;
        if (address !== undefined) candidate.address = address;
        if (city !== undefined) candidate.city = city;
        if (examLevel) candidate.examLevel = examLevel;
        if (registrationStatus) candidate.registrationStatus = registrationStatus;
        if (paymentStatus) candidate.paymentStatus = paymentStatus;
        if (paymentAmount !== undefined) candidate.paymentAmount = paymentAmount;
        if (notes !== undefined) candidate.notes = notes;

        candidate.lastModifiedBy = req.admin._id;
        candidate.lastModifiedByName = req.admin.username;

        await candidate.save();

        // Update month stats
        await TelcExamMonth.updateStats(candidate.examMonth);

        res.json({
            success: true,
            message: 'Candidate updated successfully',
            candidate
        });
    } catch (error) {
        console.error('Update candidate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/telc/candidates/:id/move - Move candidate to another month
router.post('/candidates/:id/move', authenticateAdmin, async (req, res) => {
    try {
        const { toMonthId, reason } = req.body;

        const candidate = await TelcCandidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        const fromMonth = await TelcExamMonth.findById(candidate.examMonth);
        const toMonth = await TelcExamMonth.findById(toMonthId);

        if (!toMonth) {
            return res.status(404).json({ success: false, message: 'Target month not found' });
        }

        if (!toMonth.canAcceptCandidate()) {
            return res.status(400).json({ success: false, message: 'Target month is at capacity or closed' });
        }

        // Add to movement history
        candidate.movementHistory.push({
            fromMonth: fromMonth._id,
            fromMonthLabel: fromMonth.label,
            toMonth: toMonth._id,
            toMonthLabel: toMonth.label,
            movedAt: new Date(),
            movedBy: req.admin._id,
            movedByName: req.admin.username,
            reason: reason || ''
        });

        // Update candidate
        candidate.examMonth = toMonth._id;
        candidate.examMonthLabel = toMonth.label;
        candidate.registrationStatus = 'moved';
        candidate.lastModifiedBy = req.admin._id;
        candidate.lastModifiedByName = req.admin.username;

        await candidate.save();

        // Update counts
        await fromMonth.decrementCount();
        await toMonth.incrementCount();

        // Update stats for both months
        await TelcExamMonth.updateStats(fromMonth._id);
        await TelcExamMonth.updateStats(toMonth._id);

        res.json({
            success: true,
            message: `Candidate moved from ${fromMonth.label} to ${toMonth.label}`,
            candidate
        });
    } catch (error) {
        console.error('Move candidate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/telc/candidates/:id - Delete a candidate
router.delete('/candidates/:id', authenticateAdmin, async (req, res) => {
    try {
        const candidate = await TelcCandidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        const examMonthId = candidate.examMonth;

        await TelcCandidate.findByIdAndDelete(req.params.id);

        // Update month count and stats
        const month = await TelcExamMonth.findById(examMonthId);
        if (month) {
            await month.decrementCount();
            await TelcExamMonth.updateStats(examMonthId);
        }

        res.json({
            success: true,
            message: 'Candidate deleted successfully'
        });
    } catch (error) {
        console.error('Delete candidate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// RESULTS ROUTES
// ============================================

// PUT /api/telc/candidates/:id/result - Set candidate result
router.put('/candidates/:id/result', authenticateAdmin, async (req, res) => {
    try {
        const { resultCategory, schriftlich, muendlich, resultNotes } = req.body;

        const candidate = await TelcCandidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        if (!['passed', 'failed', 'partial'].includes(resultCategory)) {
            return res.status(400).json({ success: false, message: 'Invalid result category' });
        }

        candidate.resultCategory = resultCategory;
        candidate.resultDate = new Date();
        candidate.resultNotes = resultNotes || '';

        // For partial results, set details
        if (resultCategory === 'partial') {
            candidate.resultDetails = {
                schriftlich: schriftlich || null,
                muendlich: muendlich || null
            };
        } else {
            candidate.resultDetails = {
                schriftlich: resultCategory === 'passed' ? 'passed' : 'failed',
                muendlich: resultCategory === 'passed' ? 'passed' : 'failed'
            };
        }

        candidate.lastModifiedBy = req.admin._id;
        candidate.lastModifiedByName = req.admin.username;

        await candidate.save();

        // Update month stats
        await TelcExamMonth.updateStats(candidate.examMonth);

        res.json({
            success: true,
            message: 'Result set successfully',
            candidate
        });
    } catch (error) {
        console.error('Set result error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/telc/candidates/:id/certificate - Upload certificate
router.post('/candidates/:id/certificate', authenticateAdmin, async (req, res) => {
    try {
        const { certificateData, filename } = req.body;

        if (!certificateData) {
            return res.status(400).json({ success: false, message: 'Certificate data is required' });
        }

        const candidate = await TelcCandidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        if (!candidate.requiresCertificate()) {
            return res.status(400).json({
                success: false,
                message: 'Certificate only required for passed or partial results'
            });
        }

        // Upload certificate to Mega.nz instead of storing base64 in MongoDB
        let certPath;
        try {
            const certBuffer = Buffer.from(certificateData, 'base64');
            certPath = await imageStorageService.uploadCertificate(certBuffer, req.params.id);
        } catch (megaErr) {
            console.error('⚠️ Mega certificate upload failed, falling back to base64:', megaErr.message);
            certPath = certificateData; // Fall back to base64
        }
        
        candidate.certificate = {
            data: certPath,
            filename: filename || `TELC_${candidate.examLevel}_${candidate.fullName.replace(/\s+/g, '_')}.pdf`,
            uploadedAt: new Date(),
            uploadedBy: req.admin._id,
            uploadedByName: req.admin.username
        };

        candidate.lastModifiedBy = req.admin._id;
        candidate.lastModifiedByName = req.admin.username;

        await candidate.save();

        res.json({
            success: true,
            message: 'Certificate uploaded successfully',
            certificate: {
                filename: candidate.certificate.filename,
                uploadedAt: candidate.certificate.uploadedAt,
                uploadedByName: candidate.certificate.uploadedByName
            }
        });
    } catch (error) {
        console.error('Upload certificate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/telc/candidates/:id/certificate - Download certificate
router.get('/candidates/:id/certificate', authenticateAdmin, async (req, res) => {
    try {
        const candidate = await TelcCandidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        if (!candidate.certificate?.data) {
            return res.status(404).json({ success: false, message: 'No certificate uploaded' });
        }

        // Handle both Mega paths and legacy base64
        let buffer;
        if (imageStorageService.isMediaPath(candidate.certificate.data)) {
            buffer = await imageStorageService.getImageBuffer(candidate.certificate.data);
        } else {
            buffer = Buffer.from(candidate.certificate.data, 'base64');
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${candidate.certificate.filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// EMAIL ROUTES
// ============================================

// POST /api/telc/candidates/:id/send-email - Send email to single candidate
router.post('/candidates/:id/send-email', authenticateAdmin, async (req, res) => {
    try {
        emailService.initialize();

        if (!emailService.isReady()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured. Set SMTP_USER and SMTP_PASS in .env'
            });
        }

        const result = await emailService.sendTelcResultEmail(
            req.params.id,
            req.admin._id,
            req.admin.username
        );

        res.json(result);
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/telc/months/:id/send-bulk-emails - Send bulk emails for a category
router.post('/months/:id/send-bulk-emails', authenticateAdmin, async (req, res) => {
    try {
        const { category } = req.body;

        if (!['passed', 'failed', 'partial'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        emailService.initialize();

        if (!emailService.isReady()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured. Set SMTP_USER and SMTP_PASS in .env'
            });
        }

        const result = await emailService.sendBulkTelcEmails(
            req.params.id,
            category,
            req.admin._id,
            req.admin.username
        );

        // Update month stats
        await TelcExamMonth.updateStats(req.params.id);

        // Mark results as distributed if all emails sent
        if (result.sent > 0) {
            const month = await TelcExamMonth.findById(req.params.id);
            if (month) {
                month.resultsDistributed = true;
                month.resultsDistributedAt = new Date();
                await month.save();
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Send bulk emails error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/telc/email/test - Send test email
router.post('/email/test', authenticateAdmin, async (req, res) => {
    try {
        const { toEmail } = req.body;

        if (!toEmail) {
            return res.status(400).json({ success: false, message: 'Email address required' });
        }

        emailService.initialize();

        if (!emailService.isReady()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured. Set SMTP_USER and SMTP_PASS in .env'
            });
        }

        const result = await emailService.sendTestEmail(toEmail);

        res.json({
            success: true,
            message: 'Test email sent successfully',
            ...result
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// EMAIL TEMPLATE ROUTES
// ============================================

// GET /api/telc/templates - Get all email templates
router.get('/templates', authenticateAdmin, async (req, res) => {
    try {
        // Initialize defaults if needed
        await TelcEmailTemplate.initializeDefaults();

        const templates = await TelcEmailTemplate.find().sort({ category: 1 });

        res.json({ success: true, templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/telc/templates/:category - Update a template
router.put('/templates/:category', authenticateAdmin, async (req, res) => {
    try {
        const { subject, body, isActive } = req.body;
        const { category } = req.params;

        if (!['passed', 'failed', 'partial'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        let template = await TelcEmailTemplate.findOne({ category });

        if (!template) {
            template = await TelcEmailTemplate.createDefaultTemplate(category);
        }

        if (subject) template.subject = subject;
        if (body) template.body = body;
        if (isActive !== undefined) template.isActive = isActive;

        template.lastModifiedBy = req.admin._id;
        template.lastModifiedByName = req.admin.username;

        await template.save();

        res.json({
            success: true,
            message: 'Template updated successfully',
            template
        });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/telc/templates/:category/reset - Reset template to default
router.post('/templates/:category/reset', authenticateAdmin, async (req, res) => {
    try {
        const { category } = req.params;

        if (!['passed', 'failed', 'partial'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        // Delete existing
        await TelcEmailTemplate.findOneAndDelete({ category });

        // Create default
        const template = await TelcEmailTemplate.createDefaultTemplate(category);

        res.json({
            success: true,
            message: 'Template reset to default',
            template
        });
    } catch (error) {
        console.error('Reset template error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// STATISTICS ROUTES
// ============================================

// GET /api/telc/stats - Get overall TELC statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        // Get all months for the year
        const months = await TelcExamMonth.find({ year: currentYear });

        // Aggregate stats
        const totalCandidates = await TelcCandidate.countDocuments();
        const yearCandidates = await TelcCandidate.countDocuments({
            examMonth: { $in: months.map(m => m._id) }
        });

        const resultStats = await TelcCandidate.aggregate([
            { $match: { examMonth: { $in: months.map(m => m._id) } } },
            {
                $group: {
                    _id: '$resultCategory',
                    count: { $sum: 1 }
                }
            }
        ]);

        const levelStats = await TelcCandidate.aggregate([
            { $match: { examMonth: { $in: months.map(m => m._id) } } },
            {
                $group: {
                    _id: '$examLevel',
                    count: { $sum: 1 }
                }
            }
        ]);

        const emailStats = await TelcCandidate.aggregate([
            { $match: { examMonth: { $in: months.map(m => m._id) } } },
            {
                $group: {
                    _id: '$emailSent',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                year: currentYear,
                totalCandidates,
                yearCandidates,
                months: months.length,
                results: resultStats.reduce((acc, r) => {
                    acc[r._id || 'pending'] = r.count;
                    return acc;
                }, {}),
                levels: levelStats.reduce((acc, l) => {
                    acc[l._id] = l.count;
                    return acc;
                }, {}),
                emails: {
                    sent: emailStats.find(e => e._id === true)?.count || 0,
                    pending: emailStats.find(e => e._id === false)?.count || 0
                }
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/telc/months/:id/stats - Get stats for a specific month
router.get('/months/:id/stats', authenticateAdmin, async (req, res) => {
    try {
        const month = await TelcExamMonth.findById(req.params.id);
        if (!month) {
            return res.status(404).json({ success: false, message: 'Month not found' });
        }

        // Update stats
        await TelcExamMonth.updateStats(req.params.id);

        // Get fresh data
        const updatedMonth = await TelcExamMonth.findById(req.params.id);

        // Get candidates by category for email readiness
        const readyForEmail = {
            passed: await TelcCandidate.getReadyForEmail(req.params.id, 'passed'),
            failed: await TelcCandidate.getReadyForEmail(req.params.id, 'failed'),
            partial: await TelcCandidate.getReadyForEmail(req.params.id, 'partial')
        };

        res.json({
            success: true,
            month: updatedMonth,
            readyForEmail: {
                passed: readyForEmail.passed.length,
                failed: readyForEmail.failed.length,
                partial: readyForEmail.partial.length
            }
        });
    } catch (error) {
        console.error('Get month stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// PUBLIC ROUTES (for online registration - future)
// ============================================

// GET /api/telc/registration-status - Check if TELC registration is open
router.get('/registration-status', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        // Get available months
        const availableMonths = await TelcExamMonth.find({
            isOpen: true,
            isLocked: false
        }).select('label month year maxCapacity currentCount').sort({ year: 1, month: 1 });

        // Filter to only show months with available slots
        const monthsWithSlots = availableMonths.filter(m => {
            const effectiveCapacity = m.reserveUnlocked ? m.maxCapacity + m.emergencyReserve : m.maxCapacity;
            return m.currentCount < effectiveCapacity;
        });

        res.json({
            isOpen: settings.isTelcRegistrationOpen,
            availableMonths: monthsWithSlots.map(m => ({
                id: m._id,
                label: m.label,
                availableSlots: m.maxCapacity - m.currentCount
            }))
        });
    } catch (error) {
        console.error('Registration status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
