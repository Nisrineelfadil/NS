const PDFDocument = require('pdf-lib').PDFDocument;

/**
 * PDF Validation Utility for Student Documents
 * Ensures PDFs meet strict requirements for size, integrity, and naming
 */

class PDFValidator {
    constructor() {
        // Configuration
        this.MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB in bytes
        this.MIN_FILE_SIZE = 1024; // 1 KB minimum (to avoid empty files)
        this.ALLOWED_MIME_TYPES = ['application/pdf'];
    }

    /**
     * Validate PDF file size
     * @param {Buffer|Object} file - File buffer or multer file object
     * @returns {Object} - { valid: boolean, error: string|null, size: number }
     */
    validateFileSize(file) {
        const fileSize = file.size || file.length || file.buffer?.length || 0;

        if (fileSize === 0) {
            return {
                valid: false,
                error: 'PDF file is empty or corrupted',
                size: 0
            };
        }

        if (fileSize < this.MIN_FILE_SIZE) {
            return {
                valid: false,
                error: `PDF file is too small (${this.formatBytes(fileSize)}). Minimum size is ${this.formatBytes(this.MIN_FILE_SIZE)}`,
                size: fileSize
            };
        }

        if (fileSize > this.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `PDF file exceeds the maximum size limit. File size: ${this.formatBytes(fileSize)}, Maximum allowed: ${this.formatBytes(this.MAX_FILE_SIZE)}. Please compress the PDF without reducing quality.`,
                size: fileSize
            };
        }

        return {
            valid: true,
            error: null,
            size: fileSize
        };
    }

    /**
     * Validate PDF MIME type
     * @param {Object} file - Multer file object
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validateMimeType(file) {
        const mimeType = file.mimetype || '';
        const fileName = file.originalname || file.name || '';
        
        // Check MIME type
        if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
            return {
                valid: false,
                error: `Invalid file type. Expected PDF, received: ${mimeType}`
            };
        }

        // Check file extension
        if (!fileName.toLowerCase().endsWith('.pdf')) {
            return {
                valid: false,
                error: 'File must have a .pdf extension'
            };
        }

        return {
            valid: true,
            error: null
        };
    }

    /**
     * Validate PDF content integrity using pdf-lib
     * Checks if PDF can be parsed and contains readable content
     * @param {Buffer} buffer - PDF file buffer
     * @returns {Promise<Object>} - { valid: boolean, error: string|null, pageCount: number }
     */
    async validatePDFIntegrity(buffer) {
        try {
            // Attempt to load and parse the PDF
            const pdfDoc = await PDFDocument.load(buffer, {
                ignoreEncryption: true,
                throwOnInvalidObject: false
            });

            const pageCount = pdfDoc.getPageCount();

            // Check if PDF has at least one page
            if (pageCount === 0) {
                return {
                    valid: false,
                    error: 'PDF file contains no pages',
                    pageCount: 0
                };
            }

            // Verify PDF is not corrupted by checking pages
            const pages = pdfDoc.getPages();
            if (!pages || pages.length === 0) {
                return {
                    valid: false,
                    error: 'PDF file is corrupted or unreadable',
                    pageCount: 0
                };
            }

            // Check if pages have content (basic check)
            const firstPage = pages[0];
            if (!firstPage) {
                return {
                    valid: false,
                    error: 'PDF pages are corrupted',
                    pageCount: pageCount
                };
            }

            return {
                valid: true,
                error: null,
                pageCount: pageCount
            };

        } catch (error) {
            console.error('PDF integrity validation error:', error);
            
            // Provide specific error messages based on error type
            if (error.message.includes('encrypted')) {
                return {
                    valid: false,
                    error: 'PDF file is password-protected. Please remove password protection before uploading.',
                    pageCount: 0
                };
            }

            if (error.message.includes('Invalid PDF')) {
                return {
                    valid: false,
                    error: 'PDF file is corrupted or invalid. Please ensure the file is a valid PDF document.',
                    pageCount: 0
                };
            }

            return {
                valid: false,
                error: `PDF validation failed: ${error.message}`,
                pageCount: 0
            };
        }
    }

    /**
     * Validate PDF file naming convention
     * Expected format: StudentName_Season.pdf or similar
     * @param {string} fileName - Original file name
     * @param {Object} options - { studentName: string, season: string }
     * @returns {Object} - { valid: boolean, error: string|null, suggestedName: string }
     */
    validateFileName(fileName, options = {}) {
        const { studentName, season } = options;

        // Remove extension for checking
        const nameWithoutExt = fileName.replace(/\.pdf$/i, '');

        // Check for invalid characters
        const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
        if (invalidChars.test(nameWithoutExt)) {
            return {
                valid: false,
                error: 'File name contains invalid characters. Please use only letters, numbers, hyphens, and underscores.',
                suggestedName: this.generateFileName(studentName, season)
            };
        }

        // Check if name is too short
        if (nameWithoutExt.length < 3) {
            return {
                valid: false,
                error: 'File name is too short. Please use a descriptive name.',
                suggestedName: this.generateFileName(studentName, season)
            };
        }

        // Check if name is too long (Windows has 255 char limit)
        if (fileName.length > 200) {
            return {
                valid: false,
                error: 'File name is too long. Maximum 200 characters allowed.',
                suggestedName: this.generateFileName(studentName, season)
            };
        }

        // If student name and season provided, suggest proper naming
        if (studentName && season) {
            const suggestedName = this.generateFileName(studentName, season);
            
            // Check if current name follows convention (flexible check)
            const hasStudentName = nameWithoutExt.toLowerCase().includes(studentName.toLowerCase().replace(/\s+/g, ''));
            const hasSeason = nameWithoutExt.toLowerCase().includes(season.toLowerCase().replace(/\s+/g, ''));
            
            if (!hasStudentName || !hasSeason) {
                return {
                    valid: true, // Don't fail, just warn
                    warning: `Recommended file name format: ${suggestedName}`,
                    suggestedName: suggestedName
                };
            }
        }

        return {
            valid: true,
            error: null,
            suggestedName: null
        };
    }

    /**
     * Generate standardized file name
     * @param {string} studentName - Student full name
     * @param {string} season - Active season
     * @returns {string} - Formatted file name
     */
    generateFileName(studentName, season) {
        if (!studentName) return 'Student_Document.pdf';
        
        // Clean and format student name
        const cleanName = studentName
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '');

        if (season) {
            const cleanSeason = season
                .trim()
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9_-]/g, '');
            return `${cleanName}_${cleanSeason}.pdf`;
        }

        return `${cleanName}.pdf`;
    }

    /**
     * Comprehensive PDF validation
     * Runs all validation checks
     * @param {Object} file - Multer file object
     * @param {Object} options - { studentName: string, season: string, checkIntegrity: boolean }
     * @returns {Promise<Object>} - { valid: boolean, errors: Array, warnings: Array, metadata: Object }
     */
    async validatePDF(file, options = {}) {
        const { studentName, season, checkIntegrity = true } = options;
        const errors = [];
        const warnings = [];
        const metadata = {};

        // 1. Validate MIME type
        const mimeValidation = this.validateMimeType(file);
        if (!mimeValidation.valid) {
            errors.push(mimeValidation.error);
        }

        // 2. Validate file size
        const sizeValidation = this.validateFileSize(file);
        metadata.fileSize = sizeValidation.size;
        metadata.fileSizeFormatted = this.formatBytes(sizeValidation.size);
        
        if (!sizeValidation.valid) {
            errors.push(sizeValidation.error);
        }

        // 3. Validate file name
        const nameValidation = this.validateFileName(file.originalname || file.name, { studentName, season });
        if (!nameValidation.valid) {
            errors.push(nameValidation.error);
        }
        if (nameValidation.warning) {
            warnings.push(nameValidation.warning);
        }
        metadata.suggestedFileName = nameValidation.suggestedName;

        // 4. Validate PDF integrity (if enabled and no previous errors)
        if (checkIntegrity && errors.length === 0) {
            try {
                const buffer = file.buffer || file;
                const integrityValidation = await this.validatePDFIntegrity(buffer);
                metadata.pageCount = integrityValidation.pageCount;
                
                if (!integrityValidation.valid) {
                    errors.push(integrityValidation.error);
                }
            } catch (error) {
                errors.push(`Failed to validate PDF integrity: ${error.message}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            metadata: metadata
        };
    }

    /**
     * Format bytes to human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get validation requirements as a readable object
     * @returns {Object} - Validation requirements
     */
    getRequirements() {
        return {
            maxFileSize: this.formatBytes(this.MAX_FILE_SIZE),
            minFileSize: this.formatBytes(this.MIN_FILE_SIZE),
            allowedTypes: this.ALLOWED_MIME_TYPES,
            namingConvention: 'StudentName_Season.pdf',
            requirements: [
                'File size must not exceed 3 MB',
                'File must be a valid PDF document',
                'All content must be fully visible and readable',
                'Original layout and formatting must be preserved',
                'File should follow naming convention: StudentName_Season.pdf',
                'PDF must correspond to the current active season'
            ]
        };
    }
}

// Export singleton instance
module.exports = new PDFValidator();
