const express = require('express');
const router = express.Router();
const multer = require('multer');
const ServiceRequest = require('../models/ServiceRequest');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const { logActivity, getClientIp } = require('../utils/activityLogger');
const megaService = require('../services/megaService');
const notificationService = require('../services/notificationService');
const { validatePDFUpload } = require('../middleware/pdfValidationMiddleware');
const pdfValidator = require('../utils/pdfValidator');

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB limit for PDFs (as per requirements)
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF, DOC, DOCX files
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
        }
    }
});

// POST /api/services - Create new service request (public)
router.post('/', async (req, res) => {
    try {
        const { serviceType, fullName, phone, email, cvDetails, applyingDetails, translationDetails } = req.body;

        // Validate required fields
        if (!serviceType || !fullName || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create service request
        const serviceRequest = new ServiceRequest({
            serviceType,
            fullName,
            phone,
            email,
            cvDetails: serviceType === 'cv' ? cvDetails : undefined,
            applyingDetails: serviceType === 'applying' ? applyingDetails : undefined,
            translationDetails: serviceType === 'translation' ? translationDetails : undefined
        });

        await serviceRequest.save();

        res.status(201).json({
            success: true,
            message: 'Service request submitted successfully!',
            requestId: serviceRequest._id
        });

    } catch (error) {
        console.error('Service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit service request'
        });
    }
});

// POST /api/services/upload - Create service request with file upload (public)
router.post('/upload', upload.single('file'), 
    validatePDFUpload({
        checkIntegrity: true,
        required: false,
        getStudentName: (req) => req.body.fullName,
        getSeason: async (req) => {
            // Get current active season if available
            const Settings = require('../models/Settings');
            try {
                const settings = await Settings.getSettings();
                return settings.currentSeason || 'Current';
            } catch (error) {
                return 'Current';
            }
        }
    }),
    async (req, res) => {
    try {
        const { serviceType, fullName, phone, email } = req.body;

        // Validate required fields
        if (!serviceType || !fullName || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Parse service-specific details
        let cvDetails, applyingDetails, translationDetails;
        if (req.body.cvDetails) {
            cvDetails = JSON.parse(req.body.cvDetails);
        }
        if (req.body.applyingDetails) {
            applyingDetails = JSON.parse(req.body.applyingDetails);
        }
        if (req.body.translationDetails) {
            translationDetails = JSON.parse(req.body.translationDetails);
        }

        // Log PDF validation results if available
        if (req.file && req.file.originalname.toLowerCase().endsWith('.pdf') && req.pdfValidation) {
            console.log('✅ PDF validation passed:', req.pdfValidation.metadata);
            if (req.pdfValidation.warnings.length > 0) {
                console.warn('⚠️ PDF validation warnings:', req.pdfValidation.warnings);
            }
        }

        // Upload file to Mega.nz if provided
        let megaPath = null;
        if (req.file) {
            try {
                console.log(`📤 Uploading file to Mega.nz: ${req.file.originalname}`);
                
                // Create folder path based on service type
                const folderPath = `/ServiceRequests/${serviceType}`;
                const fileName = `${Date.now()}_${fullName.replace(/\s+/g, '_')}_${req.file.originalname}`;
                megaPath = `${folderPath}/${fileName}`;
                
                // Upload to Mega.nz
                const megaService = require('../services/megaService');
                const uploadResult = await megaService.uploadServiceFile(req.file.buffer, megaPath);
                
                if (uploadResult.success) {
                    console.log(`✅ File uploaded to Mega.nz: ${megaPath}`);
                    
                    // Add Mega path to service details ONLY if upload succeeded
                    if (cvDetails) {
                        cvDetails.fileName = req.file.originalname;
                        cvDetails.fileSize = req.file.size;
                        cvDetails.dropboxPath = megaPath; // Keep field name for backward compatibility
                    }
                    if (applyingDetails) {
                        applyingDetails.fileName = req.file.originalname;
                        applyingDetails.fileSize = req.file.size;
                        applyingDetails.dropboxPath = megaPath;
                    }
                    if (translationDetails) {
                        translationDetails.fileName = req.file.originalname;
                        translationDetails.fileSize = req.file.size;
                        translationDetails.dropboxPath = megaPath;
                    }
                } else {
                    console.error('❌ Mega upload failed - file path not saved');
                    megaPath = null; // Don't save path if upload failed
                }
            } catch (uploadError) {
                console.error('❌ Mega upload error:', uploadError);
                megaPath = null; // Don't save path if upload failed
                // Continue without file if upload fails
            }
        }

        // Create service request
        const serviceRequest = new ServiceRequest({
            serviceType,
            fullName,
            phone,
            email,
            cvDetails: serviceType === 'cv' ? cvDetails : undefined,
            applyingDetails: serviceType === 'applying' ? applyingDetails : undefined,
            translationDetails: serviceType === 'translation' ? translationDetails : undefined
        });

        await serviceRequest.save();

        // Send real-time notification to admins
        notificationService.notifyNewServiceRequest(serviceRequest).catch(err => {
            console.error('Failed to send notification:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Service request submitted successfully!',
            requestId: serviceRequest._id
        });

    } catch (error) {
        console.error('Service request upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit service request'
        });
    }
});

// GET /api/services - Get all service requests (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { serviceType, status } = req.query;
        
        let query = {};
        if (serviceType && serviceType !== 'all') {
            query.serviceType = serviceType;
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const services = await ServiceRequest.find(query)
            .sort({ createdAt: -1 })
            .populate('assignedTo', 'username');

        res.json({
            success: true,
            services
        });

    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service requests'
        });
    }
});

// GET /api/services/stats - Get service statistics (admin only)
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalServices = await ServiceRequest.countDocuments();
        const cvCount = await ServiceRequest.countDocuments({ serviceType: 'cv' });
        const applyingCount = await ServiceRequest.countDocuments({ serviceType: 'applying' });
        const translationCount = await ServiceRequest.countDocuments({ serviceType: 'translation' });
        const pendingCount = await ServiceRequest.countDocuments({ status: 'pending' });
        const inProgressCount = await ServiceRequest.countDocuments({ status: 'in-progress' });
        const completedCount = await ServiceRequest.countDocuments({ status: 'completed' });

        res.json({
            success: true,
            stats: {
                total: totalServices,
                cv: cvCount,
                applying: applyingCount,
                translation: translationCount,
                pending: pendingCount,
                inProgress: inProgressCount,
                completed: completedCount
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

// GET /api/services/:id - Get single service request (admin only)
router.get('/:id', authenticateAdmin, async (req, res) => {
    try {
        const service = await ServiceRequest.findById(req.params.id)
            .populate('assignedTo', 'username email');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        res.json({
            success: true,
            service
        });

    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service request'
        });
    }
});

// PATCH /api/services/:id/status - Update service status (admin only)
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;

        const service = await ServiceRequest.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        service.status = status;
        if (notes) service.notes = notes;
        if (status === 'completed') service.completedAt = new Date();

        await service.save();

        // Log activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'update_service_status',
            targetType: 'service',
            targetId: service._id.toString(),
            targetName: `${service.serviceType} - ${service.fullName}`,
            details: `Changed status to ${status}`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'Service status updated successfully',
            service
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update service status'
        });
    }
});

// PATCH /api/services/:id/assign - Assign service to admin (admin only)
router.patch('/:id/assign', authenticateAdmin, async (req, res) => {
    try {
        const { assignedTo } = req.body;

        const service = await ServiceRequest.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        service.assignedTo = assignedTo || null;
        await service.save();

        // Log activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'assign_service',
            targetType: 'service',
            targetId: service._id.toString(),
            targetName: `${service.serviceType} - ${service.fullName}`,
            details: assignedTo ? `Assigned to admin` : 'Unassigned',
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'Service assigned successfully',
            service
        });

    } catch (error) {
        console.error('Assign service error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign service'
        });
    }
});

// DELETE /api/services/:id - Delete service request (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const service = await ServiceRequest.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        await ServiceRequest.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'delete_service',
            targetType: 'service',
            targetId: service._id.toString(),
            targetName: `${service.serviceType} - ${service.fullName}`,
            details: 'Deleted service request',
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'Service request deleted successfully'
        });

    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete service request'
        });
    }
});

// POST /api/services/:id/backup - Backup service to cloud (organized by year/month) (admin only)
router.post('/:id/backup', authenticateAdmin, async (req, res) => {
    try {
        const service = await ServiceRequest.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        // Check if service is completed
        if (service.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Only completed services can be backed up'
            });
        }

        // Get Dropbox path and file info
        let sourceDropboxPath = null;
        let fileName = '';
        
        if (service.serviceType === 'cv' && service.cvDetails?.dropboxPath) {
            sourceDropboxPath = service.cvDetails.dropboxPath;
            fileName = service.cvDetails.fileName;
        } else if (service.serviceType === 'applying' && service.applyingDetails?.dropboxPath) {
            sourceDropboxPath = service.applyingDetails.dropboxPath;
            fileName = service.applyingDetails.fileName;
        } else if (service.serviceType === 'translation' && service.translationDetails?.dropboxPath) {
            sourceDropboxPath = service.translationDetails.dropboxPath;
            fileName = service.translationDetails.fileName;
        }

        if (!sourceDropboxPath) {
            return res.status(404).json({
                success: false,
                message: 'No file found for this service request'
            });
        }

        // Download file from current location
        const downloadResult = await megaService.downloadServiceFile(sourceDropboxPath);
        
        if (!downloadResult.success) {
            throw new Error('Failed to download file from Mega');
        }

        // Create organized backup path (Year/Month structure like registrations)
        const date = new Date(service.completedAt || service.createdAt);
        const year = date.getFullYear();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[date.getMonth()];
        
        // Backup path: /ServiceBackups/ServiceType/Year/Month/filename
        const backupPath = `/ServiceBackups/${service.serviceType}/${year}/${monthName}/${service.fullName.replace(/\s+/g, '_')}_${fileName}`;
        
        // Upload to backup location
        await megaService.uploadServiceFile(downloadResult.fileBuffer, backupPath);
        
        console.log(`✅ Service backed up to: ${backupPath}`);

        // Log activity
        await logActivity({
            adminId: req.admin.id,
            adminName: req.admin.username,
            adminRole: req.admin.role,
            action: 'backup_service',
            targetType: 'service',
            targetId: service._id.toString(),
            targetName: `${service.serviceType} - ${service.fullName}`,
            details: `Backed up to ${backupPath}`,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'Service backed up successfully',
            backupPath: backupPath
        });

    } catch (error) {
        console.error('Backup service error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to backup service'
        });
    }
});

// GET /api/services/:id/download - Download service file (admin only)
router.get('/:id/download', authenticateAdmin, async (req, res) => {
    try {
        const service = await ServiceRequest.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        // Get Dropbox path based on service type
        let dropboxPath = null;
        let fileName = 'document';
        
        if (service.serviceType === 'cv' && service.cvDetails?.dropboxPath) {
            dropboxPath = service.cvDetails.dropboxPath;
            fileName = service.cvDetails.fileName || 'cv.pdf';
        } else if (service.serviceType === 'applying' && service.applyingDetails?.dropboxPath) {
            dropboxPath = service.applyingDetails.dropboxPath;
            fileName = service.applyingDetails.fileName || 'application.pdf';
        } else if (service.serviceType === 'translation' && service.translationDetails?.dropboxPath) {
            dropboxPath = service.translationDetails.dropboxPath;
            fileName = service.translationDetails.fileName || 'document.pdf';
        }

        if (!dropboxPath) {
            return res.status(404).json({
                success: false,
                message: 'No file found for this service request'
            });
        }

        // Download from Mega
        const result = await megaService.downloadServiceFile(dropboxPath);

        if (!result.success) {
            throw new Error('Failed to download file from Mega');
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', result.fileSize);

        // Send file buffer
        res.send(result.fileBuffer);

    } catch (error) {
        console.error('Download service file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download file'
        });
    }
});

module.exports = router;
