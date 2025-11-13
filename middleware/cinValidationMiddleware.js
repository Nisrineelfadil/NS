const imageOptimizer = require('../utils/imageOptimizer');

/**
 * Middleware for validating CIN card uploads
 * Ensures images are readable, optimized, and meet requirements
 */

/**
 * Validate CIN card images
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether CIN is required (default: false, allows "add later")
 * @param {boolean} options.requireBothSides - Whether both front and back are required (default: true)
 * @param {boolean} options.optimize - Whether to optimize images (default: true)
 */
function validateCINUpload(options = {}) {
    const {
        required = false,
        requireBothSides = true,
        optimize = true
    } = options;

    return async (req, res, next) => {
        try {
            // Check if "add later" option is selected
            const addLater = req.body.cinAddLater === 'true' || req.body.cinAddLater === true;

            // If add later is selected, skip validation
            if (addLater) {
                console.log('📝 CIN upload deferred - "Add Later" option selected');
                req.cinValidation = {
                    addLater: true,
                    message: 'CIN upload deferred to later'
                };
                return next();
            }

            // Check if files exist
            const hasFront = req.files && req.files['cinFront'] && req.files['cinFront'][0];
            const hasBack = req.files && req.files['cinBack'] && req.files['cinBack'][0];

            // If CIN is required and no files provided
            if (required && !hasFront && !hasBack) {
                return res.status(400).json({
                    success: false,
                    message: 'CIN card upload is required. Please upload both front and back sides, or select "Add Later" option.',
                    requirements: {
                        required: true,
                        bothSides: requireBothSides,
                        formats: ['JPEG', 'PNG', 'PDF'],
                        maxSize: '500 KB per side (after optimization)',
                        instructions: 'Scan the CIN front and back, ensure readability, upload both sides'
                    }
                });
            }

            // If files provided, validate them
            if (hasFront || hasBack) {
                // Check if both sides are required
                if (requireBothSides && (!hasFront || !hasBack)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Both front and back sides of CIN card are required',
                        provided: {
                            front: !!hasFront,
                            back: !!hasBack
                        }
                    });
                }

                const validationResults = {
                    front: null,
                    back: null
                };

                // Validate front side
                if (hasFront) {
                    const frontFile = req.files['cinFront'][0];
                    
                    // Validate image readability
                    const frontValidation = await imageOptimizer.validateImageReadability(frontFile.buffer);
                    
                    if (!frontValidation.valid) {
                        return res.status(400).json({
                            success: false,
                            message: 'CIN front side validation failed',
                            error: frontValidation.error,
                            side: 'front'
                        });
                    }

                    // Optimize image if enabled
                    if (optimize) {
                        try {
                            const optimized = await imageOptimizer.optimizeCINImage(frontFile.buffer, 'front');
                            validationResults.front = {
                                valid: true,
                                originalSize: frontFile.size,
                                optimizedSize: optimized.size,
                                optimizedBuffer: optimized.buffer,
                                dimensions: optimized.dimensions,
                                quality: optimized.quality,
                                compressionRatio: optimized.compressionRatio
                            };
                        } catch (error) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to optimize CIN front image',
                                error: error.message
                            });
                        }
                    } else {
                        validationResults.front = {
                            valid: true,
                            originalSize: frontFile.size,
                            buffer: frontFile.buffer,
                            metadata: frontValidation.metadata
                        };
                    }
                }

                // Validate back side
                if (hasBack) {
                    const backFile = req.files['cinBack'][0];
                    
                    // Validate image readability
                    const backValidation = await imageOptimizer.validateImageReadability(backFile.buffer);
                    
                    if (!backValidation.valid) {
                        return res.status(400).json({
                            success: false,
                            message: 'CIN back side validation failed',
                            error: backValidation.error,
                            side: 'back'
                        });
                    }

                    // Optimize image if enabled
                    if (optimize) {
                        try {
                            const optimized = await imageOptimizer.optimizeCINImage(backFile.buffer, 'back');
                            validationResults.back = {
                                valid: true,
                                originalSize: backFile.size,
                                optimizedSize: optimized.size,
                                optimizedBuffer: optimized.buffer,
                                dimensions: optimized.dimensions,
                                quality: optimized.quality,
                                compressionRatio: optimized.compressionRatio
                            };
                        } catch (error) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to optimize CIN back image',
                                error: error.message
                            });
                        }
                    } else {
                        validationResults.back = {
                            valid: true,
                            originalSize: backFile.size,
                            buffer: backFile.buffer,
                            metadata: backValidation.metadata
                        };
                    }
                }

                // Attach validation results to request
                req.cinValidation = {
                    valid: true,
                    addLater: false,
                    front: validationResults.front,
                    back: validationResults.back,
                    totalOriginalSize: (validationResults.front?.originalSize || 0) + (validationResults.back?.originalSize || 0),
                    totalOptimizedSize: (validationResults.front?.optimizedSize || 0) + (validationResults.back?.optimizedSize || 0)
                };

                console.log('✅ CIN validation passed:', {
                    front: validationResults.front ? `${imageOptimizer.formatBytes(validationResults.front.optimizedSize || validationResults.front.originalSize)}` : 'N/A',
                    back: validationResults.back ? `${imageOptimizer.formatBytes(validationResults.back.optimizedSize || validationResults.back.originalSize)}` : 'N/A',
                    totalSize: imageOptimizer.formatBytes(req.cinValidation.totalOptimizedSize || req.cinValidation.totalOriginalSize)
                });
            }

            next();

        } catch (error) {
            console.error('CIN validation middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to validate CIN card images',
                error: error.message
            });
        }
    };
}

/**
 * Quick validation for CIN image format
 */
function validateCINFormat(req, res, next) {
    try {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        
        if (req.files) {
            const frontFile = req.files['cinFront'] ? req.files['cinFront'][0] : null;
            const backFile = req.files['cinBack'] ? req.files['cinBack'][0] : null;

            if (frontFile && !allowedMimeTypes.includes(frontFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file format for CIN front. Allowed formats: JPEG, PNG, PDF',
                    provided: frontFile.mimetype
                });
            }

            if (backFile && !allowedMimeTypes.includes(backFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file format for CIN back. Allowed formats: JPEG, PNG, PDF',
                    provided: backFile.mimetype
                });
            }
        }

        next();
    } catch (error) {
        console.error('CIN format validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to validate CIN format',
            error: error.message
        });
    }
}

module.exports = {
    validateCINUpload,
    validateCINFormat
};
