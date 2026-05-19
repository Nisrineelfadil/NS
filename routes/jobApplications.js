const express = require('express');
const router = express.Router();
const multer = require('multer');
const JobApplication = require('../models/JobApplication');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const megaService = require('../services/megaService');
const notificationService = require('../services/notificationService');
const { verifyCaptcha } = require('../middleware/captchaMiddleware');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File is too large. Maximum size is 5MB.',
                errorType: 'FILE_TOO_LARGE'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
            errorType: 'UPLOAD_ERROR'
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload failed',
            errorType: 'UPLOAD_ERROR'
        });
    }
    next();
};

// ==================== PUBLIC ROUTES ====================

// POST /api/job-applications/public - Submit application from public form (pending review)
router.post('/public', verifyCaptcha, (req, res, next) => {
    upload.single('document')(req, res, (err) => {
        if (err) {
            return handleMulterError(err, req, res, next);
        }
        next();
    });
}, async (req, res) => {
    try {
        const {
            fullName,
            phone,
            email,
            requestedJobType,
            notes
        } = req.body;

        // Validate required fields
        if (!fullName || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: fullName, phone, email'
            });
        }

        // Create application with pending_review status
        const application = new JobApplication({
            fullName,
            phone,
            email,
            requestedJobType: requestedJobType || 'Not specified',
            notes: notes || '',
            applicationType: null, // Will be set by admin during review
            jobField: null, // Will be set by admin during review
            status: 'pending_review',
            statusHistory: [{
                status: 'pending_review',
                changedAt: new Date(),
                notes: 'Application submitted via public form'
            }]
        });

        // Upload document if provided
        if (req.file) {
            try {
                const folderPath = `/JobApplications/PendingReview`;
                const fileName = `${Date.now()}_${fullName.replace(/\s+/g, '_')}_${req.file.originalname}`;
                const megaPath = `${folderPath}/${fileName}`;

                const uploadResult = await megaService.uploadServiceFile(req.file.buffer, megaPath);
                
                if (uploadResult.success) {
                    application.documents.push({
                        fileName: req.file.originalname,
                        fileSize: req.file.size,
                        filePath: megaPath,
                        uploadedAt: new Date()
                    });
                }
            } catch (uploadError) {
                console.error('Document upload error:', uploadError);
                // Continue without document
            }
        }

        await application.save();

        // Send notification to admins
        try {
            await notificationService.notifyNewJobApplication(application);
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully. Our team will review it shortly.',
            applicationId: application._id
        });

    } catch (error) {
        console.error('Error submitting public application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application'
        });
    }
});

// POST /api/job-applications - Create new application (legacy public route)
router.post('/', upload.single('document'), async (req, res) => {
    try {
        const {
            fullName,
            phone,
            email,
            applicationType,
            jobField,
            customJobField,
            experience,
            qualifications,
            languageLevel,
            additionalInfo
        } = req.body;

        // Validate required fields
        if (!fullName || !phone || !email || !applicationType || !jobField) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate applicationType
        if (!['ausbildung', 'arbeit'].includes(applicationType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application type'
            });
        }

        // Validate jobField
        const validFields = ['pflege', 'verkaufer', 'gastronomie', 'fleischer', 'maurer', 'other'];
        if (!validFields.includes(jobField)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job field'
            });
        }

        // Create application
        const application = new JobApplication({
            fullName,
            phone,
            email,
            applicationType,
            jobField,
            customJobField: jobField === 'other' ? customJobField : undefined,
            experience,
            qualifications,
            languageLevel: languageLevel || null,
            additionalInfo,
            status: 'new',
            statusHistory: [{
                status: 'new',
                changedAt: new Date(),
                notes: 'Application submitted'
            }]
        });

        // Upload document if provided
        if (req.file) {
            try {
                const folderPath = `/JobApplications/${applicationType}/${jobField}`;
                const fileName = `${Date.now()}_${fullName.replace(/\s+/g, '_')}_${req.file.originalname}`;
                const megaPath = `${folderPath}/${fileName}`;

                const uploadResult = await megaService.uploadServiceFile(req.file.buffer, megaPath);
                
                if (uploadResult.success) {
                    application.documents.push({
                        fileName: req.file.originalname,
                        fileSize: req.file.size,
                        filePath: megaPath,
                        documentType: 'cv'
                    });
                }
            } catch (uploadError) {
                console.error('Document upload error:', uploadError);
            }
        }

        await application.save();

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            applicationId: application._id
        });

    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application'
        });
    }
});

// ==================== ADMIN ROUTES ====================

// GET /api/job-applications - Get all applications with filters (admin)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const {
            applicationType,
            jobField,
            status,
            hasDiploma,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Filter by application type
        if (applicationType && applicationType !== 'all') {
            query.applicationType = applicationType;
        }

        // Filter by job field
        if (jobField && jobField !== 'all') {
            query.jobField = jobField;
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by diploma
        if (hasDiploma !== undefined && hasDiploma !== 'all') {
            if (hasDiploma === 'true') {
                query.hasDiploma = true;
            } else if (hasDiploma === 'false') {
                query.hasDiploma = false;
            } else if (hasDiploma === 'notReviewed') {
                query.hasDiploma = null;
            }
        }

        // Search by name, email, or phone
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const applications = await JobApplication.find(query)
            .sort(sort)
            .populate('assignedTo', 'username')
            .populate('diplomaReviewedBy', 'username');

        res.json({
            success: true,
            applications
        });

    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
});

// GET /api/job-applications/stats - Get statistics (admin)
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const { applicationType } = req.query;

        const stats = await JobApplication.getStats(applicationType || null);
        const fieldStats = applicationType 
            ? await JobApplication.getStatsByField(applicationType)
            : null;

        res.json({
            success: true,
            stats,
            fieldStats
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

// GET /api/job-applications/stats/both - Get stats for both types (admin)
router.get('/stats/both', authenticateAdmin, async (req, res) => {
    try {
        const [ausbildungStats, arbeitStats, ausbildungFields, arbeitFields, pendingCount] = await Promise.all([
            JobApplication.getStats('ausbildung'),
            JobApplication.getStats('arbeit'),
            JobApplication.getStatsByField('ausbildung'),
            JobApplication.getStatsByField('arbeit'),
            JobApplication.countDocuments({ status: 'pending_review' })
        ]);

        res.json({
            success: true,
            ausbildung: {
                ...ausbildungStats,
                byField: ausbildungFields
            },
            arbeit: {
                ...arbeitStats,
                byField: arbeitFields
            },
            pendingReview: pendingCount
        });

    } catch (error) {
        console.error('Get both stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

// GET /api/job-applications/pending - Get pending review applications (admin)
router.get('/pending', authenticateAdmin, async (req, res) => {
    try {
        const applications = await JobApplication.find({ status: 'pending_review' })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            applications,
            count: applications.length
        });

    } catch (error) {
        console.error('Get pending applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending applications'
        });
    }
});

// PATCH /api/job-applications/:id/review - Review and approve application (admin)
router.patch('/:id/review', authenticateAdmin, async (req, res) => {
    try {
        const { applicationType, jobField, customJobField, diplomaType, diplomaDetails, notes } = req.body;

        // Validate required fields
        if (!applicationType || !jobField) {
            return res.status(400).json({
                success: false,
                message: 'Application type and job field are required'
            });
        }

        // Validate applicationType
        if (!['ausbildung', 'arbeit'].includes(applicationType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application type'
            });
        }

        // Validate jobField
        const validFields = ['pflege', 'verkaufer', 'gastronomie', 'fleischer', 'maurer', 'other'];
        if (!validFields.includes(jobField)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job field'
            });
        }

        const application = await JobApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update application with review data
        application.applicationType = applicationType;
        application.jobField = jobField;
        application.customJobField = jobField === 'other' ? customJobField : undefined;
        application.status = 'new'; // Move to 'new' status after review
        
        // Set diploma status
        if (diplomaType) {
            application.hasDiploma = diplomaType === 'diploma';
            application.diplomaType = diplomaType;
            application.diplomaDetails = diplomaDetails || '';
            application.diplomaReviewedAt = new Date();
            application.diplomaReviewedBy = req.admin.id;
        }

        // Add to status history
        application.statusHistory.push({
            status: 'new',
            changedAt: new Date(),
            changedBy: req.admin.id,
            changedByName: req.admin.username,
            notes: notes || `Reviewed and classified as ${applicationType} - ${jobField}`
        });

        await application.save();

        res.json({
            success: true,
            message: 'Application reviewed and approved successfully',
            application
        });

    } catch (error) {
        console.error('Review application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to review application'
        });
    }
});

// GET /api/job-applications/:id - Get single application (admin)
router.get('/:id', authenticateAdmin, async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.id)
            .populate('assignedTo', 'username email')
            .populate('diplomaReviewedBy', 'username')
            .populate('statusHistory.changedBy', 'username');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.json({
            success: true,
            application
        });

    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application'
        });
    }
});

// PATCH /api/job-applications/:id/status - Update application status (admin)
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;

        const application = await JobApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Validate status
        const validStatuses = [
            'new', 'erstgespraech', 'vorvertrag', 'interview',
            'vertrag', 'botschaft', 'visum', 'completed', 'cancelled'
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        await application.updateStatus(status, req.admin.id, req.admin.username, notes);

        res.json({
            success: true,
            message: 'Status updated successfully',
            application
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status'
        });
    }
});

// PATCH /api/job-applications/:id/diploma - Update diploma status (admin)
router.patch('/:id/diploma', authenticateAdmin, async (req, res) => {
    try {
        const { hasDiploma, diplomaType, diplomaDetails } = req.body;

        const application = await JobApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        await application.setDiplomaStatus(
            hasDiploma,
            diplomaType,
            diplomaDetails,
            req.admin.id
        );

        res.json({
            success: true,
            message: 'Diploma status updated successfully',
            application
        });

    } catch (error) {
        console.error('Update diploma error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update diploma status'
        });
    }
});

// GET /api/job-applications/:id/download-document - Download application document (admin)
router.get('/:id/download-document', authenticateAdmin, async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (!application.documents || application.documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No documents found for this application'
            });
        }

        const doc = application.documents[0]; // Get first document
        
        // Download from Mega
        try {
            const downloadResult = await megaService.downloadServiceFile(doc.filePath);
            
            if (!downloadResult.success || !downloadResult.fileBuffer) {
                throw new Error('Download failed - no file buffer returned');
            }
            
            // Determine content type based on file extension
            const ext = doc.fileName.toLowerCase().split('.').pop();
            let contentType = 'application/octet-stream';
            if (ext === 'pdf') contentType = 'application/pdf';
            else if (ext === 'doc') contentType = 'application/msword';
            else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
            else if (ext === 'png') contentType = 'image/png';
            
            // Set headers for download
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
            res.setHeader('Content-Length', downloadResult.fileBuffer.length);
            res.send(downloadResult.fileBuffer);
        } catch (downloadError) {
            console.error('Mega download error:', downloadError);
            return res.status(500).json({
                success: false,
                message: 'Failed to download document from storage'
            });
        }

    } catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download document'
        });
    }
});

// PUT /api/job-applications/:id - Update application details (admin)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const {
            fullName,
            phone,
            email,
            applicationType,
            jobField,
            customJobField,
            experience,
            qualifications,
            languageLevel,
            additionalInfo,
            notes
        } = req.body;

        const application = await JobApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update fields
        if (fullName) application.fullName = fullName;
        if (phone) application.phone = phone;
        if (email) application.email = email;
        if (applicationType) application.applicationType = applicationType;
        if (jobField) application.jobField = jobField;
        if (customJobField !== undefined) application.customJobField = customJobField;
        if (experience !== undefined) application.experience = experience;
        if (qualifications !== undefined) application.qualifications = qualifications;
        if (languageLevel !== undefined) application.languageLevel = languageLevel;
        if (additionalInfo !== undefined) application.additionalInfo = additionalInfo;
        if (notes !== undefined) application.notes = notes;

        await application.save();

        res.json({
            success: true,
            message: 'Application updated successfully',
            application
        });

    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application'
        });
    }
});

// POST /api/job-applications/:id/documents - Upload document (admin)
router.post('/:id/documents', authenticateAdmin, upload.single('document'), async (req, res) => {
    try {
        const { documentType } = req.body;

        const application = await JobApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Upload to Mega.nz
        const folderPath = `/JobApplications/${application.applicationType}/${application.jobField}/${application._id}`;
        const fileName = `${Date.now()}_${req.file.originalname}`;
        const megaPath = `${folderPath}/${fileName}`;

        try {
            const uploadResult = await megaService.uploadServiceFile(req.file.buffer, megaPath);
            
            if (uploadResult.success) {
                application.documents.push({
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    filePath: megaPath,
                    documentType: documentType || 'other'
                });

                await application.save();

                res.json({
                    success: true,
                    message: 'Document uploaded successfully',
                    document: application.documents[application.documents.length - 1]
                });
            } else {
                throw new Error('Upload failed');
            }
        } catch (uploadError) {
            console.error('Document upload error:', uploadError);
            res.status(500).json({
                success: false,
                message: 'Failed to upload document'
            });
        }

    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document'
        });
    }
});

// DELETE /api/job-applications/:id - Delete application (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const application = await JobApplication.findByIdAndDelete(req.params.id);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.json({
            success: true,
            message: 'Application deleted successfully'
        });

    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete application'
        });
    }
});

// POST /api/job-applications/admin/create - Admin creates application (admin)
router.post('/admin/create', authenticateAdmin, upload.single('document'), async (req, res) => {
    try {
        const {
            fullName,
            phone,
            email,
            applicationType,
            jobField,
            customJobField,
            experience,
            qualifications,
            languageLevel,
            additionalInfo,
            status,
            hasDiploma,
            diplomaType,
            diplomaDetails,
            notes
        } = req.body;

        // Validate required fields
        if (!fullName || !phone || !email || !applicationType || !jobField) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create application
        const application = new JobApplication({
            fullName,
            phone,
            email,
            applicationType,
            jobField,
            customJobField: jobField === 'other' ? customJobField : undefined,
            experience,
            qualifications,
            languageLevel: languageLevel || null,
            additionalInfo,
            status: status || 'new',
            hasDiploma: hasDiploma !== undefined ? hasDiploma : null,
            diplomaType: diplomaType || null,
            diplomaDetails,
            diplomaReviewedBy: hasDiploma !== undefined ? req.admin.id : null,
            diplomaReviewedAt: hasDiploma !== undefined ? new Date() : null,
            notes,
            statusHistory: [{
                status: status || 'new',
                changedAt: new Date(),
                changedBy: req.admin.id,
                changedByName: req.admin.username,
                notes: 'Application created by admin'
            }]
        });

        // Upload document if provided
        if (req.file) {
            try {
                const folderPath = `/JobApplications/${applicationType}/${jobField}`;
                const fileName = `${Date.now()}_${fullName.replace(/\s+/g, '_')}_${req.file.originalname}`;
                const megaPath = `${folderPath}/${fileName}`;

                const uploadResult = await megaService.uploadServiceFile(req.file.buffer, megaPath);
                
                if (uploadResult.success) {
                    application.documents.push({
                        fileName: req.file.originalname,
                        fileSize: req.file.size,
                        filePath: megaPath,
                        documentType: 'cv'
                    });
                }
            } catch (uploadError) {
                console.error('Document upload error:', uploadError);
            }
        }

        await application.save();

        res.status(201).json({
            success: true,
            message: 'Application created successfully',
            application
        });

    } catch (error) {
        console.error('Admin create application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create application'
        });
    }
});

module.exports = router;
