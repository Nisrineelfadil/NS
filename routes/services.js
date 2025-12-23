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

// Configure multer for multiple file uploads (for translation service)
const uploadMultiple = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 25 // Max 25 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|txt/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error('Only PDF, DOC, DOCX, TXT, and image files are allowed'));
    }
});

// POST /api/services/upload - Create service request with file upload (public)
// Supports both single file (file) and multiple files (files) for translation
router.post('/upload', (req, res, next) => {
    // Use fields to accept both 'file' (single) and 'files' (multiple)
    uploadMultiple.fields([
        { name: 'file', maxCount: 1 },
        { name: 'files', maxCount: 25 }
    ])(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File is too large. Maximum size is 5MB per file.',
                    errorType: 'FILE_TOO_LARGE'
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Maximum is 25 files.',
                    errorType: 'TOO_MANY_FILES'
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error',
                errorType: 'UPLOAD_ERROR'
            });
        }
        next();
    });
}, async (req, res) => {
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

        // Collect all files (from both 'file' and 'files' fields)
        let allFiles = [];
        if (req.files) {
            if (req.files.file) allFiles = allFiles.concat(req.files.file);
            if (req.files.files) allFiles = allFiles.concat(req.files.files);
        }

        // Upload files to Mega.nz if provided
        let uploadedFiles = [];
        if (allFiles.length > 0) {
            console.log(`📤 Uploading ${allFiles.length} file(s) to Mega.nz...`);
            
            for (const file of allFiles) {
                try {
                    // Create folder path based on service type
                    const folderPath = `/ServiceRequests/${serviceType}`;
                    const fileName = `${Date.now()}_${fullName.replace(/\s+/g, '_')}_${file.originalname}`;
                    const megaPath = `${folderPath}/${fileName}`;
                    
                    // Upload to Mega.nz
                    const uploadResult = await megaService.uploadServiceFile(file.buffer, megaPath);
                    
                    if (uploadResult.success) {
                        console.log(`✅ File uploaded to Mega.nz: ${megaPath}`);
                        uploadedFiles.push({
                            fileName: file.originalname,
                            fileSize: file.size,
                            dropboxPath: megaPath // Keep field name for backward compatibility
                        });
                    } else {
                        console.error(`❌ Mega upload failed for ${file.originalname}`);
                    }
                } catch (uploadError) {
                    console.error(`❌ Mega upload error for ${file.originalname}:`, uploadError);
                    // Continue with other files
                }
            }
            
            // Add uploaded files info to service details
            if (uploadedFiles.length > 0) {
                if (cvDetails) {
                    // For CV, store all files
                    cvDetails.files = uploadedFiles;
                    cvDetails.documentCount = uploadedFiles.length;
                    // Keep backward compatibility with single file fields
                    cvDetails.fileName = uploadedFiles[0].fileName;
                    cvDetails.fileSize = uploadedFiles[0].fileSize;
                    cvDetails.dropboxPath = uploadedFiles[0].dropboxPath;
                }
                if (applyingDetails) {
                    applyingDetails.fileName = uploadedFiles[0].fileName;
                    applyingDetails.fileSize = uploadedFiles[0].fileSize;
                    applyingDetails.dropboxPath = uploadedFiles[0].dropboxPath;
                }
                if (translationDetails) {
                    // For translation, store all files
                    translationDetails.files = uploadedFiles;
                    translationDetails.documentCount = uploadedFiles.length;
                    // Keep backward compatibility with single file fields
                    translationDetails.fileName = uploadedFiles[0].fileName;
                    translationDetails.fileSize = uploadedFiles[0].fileSize;
                    translationDetails.dropboxPath = uploadedFiles[0].dropboxPath;
                }
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
            services,
            requests: services // Alias for frontend compatibility
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

// GET /api/services/:id/download-documents - Download all documents as ZIP (admin only)
router.get('/:id/download-documents', authenticateAdmin, async (req, res) => {
    try {
        const service = await ServiceRequest.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        const details = service.translationDetails || service.cvDetails || service.applyingDetails || {};
        const files = details.files || [];
        
        // If only one file or no files array, use single file path
        if (files.length === 0 && details.dropboxPath) {
            // Single file download
            try {
                const downloadResult = await megaService.downloadServiceFile(details.dropboxPath);
                
                if (!downloadResult.success || !downloadResult.fileBuffer) {
                    throw new Error('Download failed');
                }
                
                const ext = details.fileName ? details.fileName.split('.').pop().toLowerCase() : 'pdf';
                let contentType = 'application/octet-stream';
                if (ext === 'pdf') contentType = 'application/pdf';
                else if (ext === 'doc') contentType = 'application/msword';
                else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${details.fileName || 'document'}"`);
                res.send(downloadResult.fileBuffer);
                return;
            } catch (downloadError) {
                console.error('Single file download error:', downloadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to download document'
                });
            }
        }
        
        // Multiple files - create ZIP
        if (files.length > 0) {
            const archiver = require('archiver');
            
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            
            const clientName = service.fullName.replace(/\s+/g, '_');
            const zipFilename = `${clientName}_Documents.zip`;
            
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
            
            archive.pipe(res);
            
            // Download each file and add to archive
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    console.log(`📥 Downloading file ${i + 1}/${files.length}: ${file.fileName}`);
                    const downloadResult = await megaService.downloadServiceFile(file.dropboxPath);
                    
                    if (downloadResult.success && downloadResult.fileBuffer) {
                        archive.append(downloadResult.fileBuffer, { name: file.fileName });
                    }
                } catch (fileError) {
                    console.error(`Error downloading file ${file.fileName}:`, fileError);
                    // Continue with other files
                }
            }
            
            await archive.finalize();
        } else {
            return res.status(404).json({
                success: false,
                message: 'No documents found for this request'
            });
        }

    } catch (error) {
        console.error('Download documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download documents'
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
