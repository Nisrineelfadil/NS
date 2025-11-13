const pdfValidator = require('../utils/pdfValidator');

/**
 * Middleware for validating PDF uploads
 * Ensures PDFs meet all requirements before processing
 */

/**
 * Validate PDF file in request
 * @param {Object} options - Validation options
 * @param {boolean} options.checkIntegrity - Whether to check PDF integrity (default: true)
 * @param {boolean} options.required - Whether PDF is required (default: false)
 * @param {Function} options.getStudentName - Function to extract student name from request
 * @param {Function} options.getSeason - Function to extract season from request
 */
function validatePDFUpload(options = {}) {
    const {
        checkIntegrity = true,
        required = false,
        getStudentName = null,
        getSeason = null
    } = options;

    return async (req, res, next) => {
        try {
            // Check if file exists
            if (!req.file) {
                if (required) {
                    return res.status(400).json({
                        success: false,
                        message: 'PDF file is required',
                        requirements: pdfValidator.getRequirements()
                    });
                }
                // If not required and no file, continue
                return next();
            }

            // Check if it's a PDF
            if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
                return res.status(400).json({
                    success: false,
                    message: 'Only PDF files are allowed',
                    requirements: pdfValidator.getRequirements()
                });
            }

            // Extract student name and season if functions provided
            let studentName = null;
            let season = null;

            if (getStudentName && typeof getStudentName === 'function') {
                try {
                    studentName = await getStudentName(req);
                } catch (error) {
                    console.warn('Failed to extract student name:', error);
                }
            }

            if (getSeason && typeof getSeason === 'function') {
                try {
                    season = await getSeason(req);
                } catch (error) {
                    console.warn('Failed to extract season:', error);
                }
            }

            // Validate PDF
            const validation = await pdfValidator.validatePDF(req.file, {
                studentName,
                season,
                checkIntegrity
            });

            // If validation fails, return error
            if (!validation.valid) {
                console.error('PDF validation failed:', validation.errors);
                return res.status(400).json({
                    success: false,
                    message: 'PDF validation failed',
                    errors: validation.errors,
                    warnings: validation.warnings,
                    metadata: validation.metadata,
                    requirements: pdfValidator.getRequirements()
                });
            }

            // Attach validation results to request for later use
            req.pdfValidation = {
                valid: true,
                warnings: validation.warnings,
                metadata: validation.metadata
            };

            // Log warnings if any
            if (validation.warnings.length > 0) {
                console.warn('PDF validation warnings:', validation.warnings);
            }

            // Continue to next middleware
            next();

        } catch (error) {
            console.error('PDF validation middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to validate PDF file',
                error: error.message
            });
        }
    };
}

/**
 * Validate PDF file size only (lightweight check)
 * Useful for quick validation before heavy processing
 */
function validatePDFSize(req, res, next) {
    try {
        if (!req.file) {
            return next();
        }

        const sizeValidation = pdfValidator.validateFileSize(req.file);
        
        if (!sizeValidation.valid) {
            return res.status(400).json({
                success: false,
                message: sizeValidation.error,
                fileSize: pdfValidator.formatBytes(sizeValidation.size),
                maxSize: pdfValidator.formatBytes(pdfValidator.MAX_FILE_SIZE)
            });
        }

        next();
    } catch (error) {
        console.error('PDF size validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to validate PDF size',
            error: error.message
        });
    }
}

/**
 * Validate PDF MIME type
 */
function validatePDFType(req, res, next) {
    try {
        if (!req.file) {
            return next();
        }

        const typeValidation = pdfValidator.validateMimeType(req.file);
        
        if (!typeValidation.valid) {
            return res.status(400).json({
                success: false,
                message: typeValidation.error,
                allowedTypes: pdfValidator.ALLOWED_MIME_TYPES
            });
        }

        next();
    } catch (error) {
        console.error('PDF type validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to validate PDF type',
            error: error.message
        });
    }
}

module.exports = {
    validatePDFUpload,
    validatePDFSize,
    validatePDFType
};
