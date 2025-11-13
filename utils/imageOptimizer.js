const sharp = require('sharp');

/**
 * Image Optimization Utility for CIN Cards and Student Photos
 * Optimizes images for low file size while maintaining readability
 */

class ImageOptimizer {
    constructor() {
        // Configuration for CIN cards
        this.CIN_CONFIG = {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 75, // JPEG quality (1-100)
            format: 'jpeg',
            maxFileSize: 500 * 1024, // 500 KB target
            minQuality: 60 // Minimum acceptable quality
        };

        // Configuration for student photos
        this.PHOTO_CONFIG = {
            maxWidth: 800,
            maxHeight: 1000,
            quality: 80,
            format: 'jpeg',
            maxFileSize: 300 * 1024, // 300 KB target
            minQuality: 65
        };
    }

    /**
     * Optimize CIN card image
     * @param {Buffer} imageBuffer - Original image buffer
     * @param {string} side - 'front' or 'back'
     * @returns {Promise<Object>} - { buffer: Buffer, size: number, format: string, dimensions: object }
     */
    async optimizeCINImage(imageBuffer, side = 'front') {
        try {
            // Get original image metadata
            const metadata = await sharp(imageBuffer).metadata();
            
            console.log(`📸 Optimizing CIN ${side}:`, {
                originalSize: this.formatBytes(imageBuffer.length),
                originalDimensions: `${metadata.width}x${metadata.height}`,
                originalFormat: metadata.format
            });

            // Start with configured quality
            let quality = this.CIN_CONFIG.quality;
            let optimizedBuffer = null;
            let attempts = 0;
            const maxAttempts = 5;

            // Iteratively reduce quality until file size is acceptable
            while (attempts < maxAttempts) {
                optimizedBuffer = await sharp(imageBuffer)
                    .resize({
                        width: this.CIN_CONFIG.maxWidth,
                        height: this.CIN_CONFIG.maxHeight,
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({
                        quality: quality,
                        progressive: true,
                        mozjpeg: true // Use mozjpeg for better compression
                    })
                    .toBuffer();

                const currentSize = optimizedBuffer.length;
                
                console.log(`  Attempt ${attempts + 1}: Quality ${quality}%, Size: ${this.formatBytes(currentSize)}`);

                // Check if size is acceptable
                if (currentSize <= this.CIN_CONFIG.maxFileSize || quality <= this.CIN_CONFIG.minQuality) {
                    break;
                }

                // Reduce quality for next attempt
                quality -= 5;
                attempts++;
            }

            // Get final metadata
            const finalMetadata = await sharp(optimizedBuffer).metadata();

            const result = {
                buffer: optimizedBuffer,
                size: optimizedBuffer.length,
                format: 'jpeg',
                dimensions: {
                    width: finalMetadata.width,
                    height: finalMetadata.height
                },
                quality: quality,
                compressionRatio: ((1 - (optimizedBuffer.length / imageBuffer.length)) * 100).toFixed(2)
            };

            console.log(`✅ CIN ${side} optimized:`, {
                finalSize: this.formatBytes(result.size),
                dimensions: `${result.dimensions.width}x${result.dimensions.height}`,
                quality: `${result.quality}%`,
                compressionRatio: `${result.compressionRatio}%`
            });

            return result;

        } catch (error) {
            console.error('Error optimizing CIN image:', error);
            throw new Error(`Failed to optimize CIN image: ${error.message}`);
        }
    }

    /**
     * Optimize student photo
     * @param {Buffer} imageBuffer - Original image buffer
     * @returns {Promise<Object>} - { buffer: Buffer, size: number, format: string, dimensions: object }
     */
    async optimizeStudentPhoto(imageBuffer) {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            
            console.log(`📸 Optimizing student photo:`, {
                originalSize: this.formatBytes(imageBuffer.length),
                originalDimensions: `${metadata.width}x${metadata.height}`,
                originalFormat: metadata.format
            });

            let quality = this.PHOTO_CONFIG.quality;
            let optimizedBuffer = null;
            let attempts = 0;
            const maxAttempts = 5;

            while (attempts < maxAttempts) {
                optimizedBuffer = await sharp(imageBuffer)
                    .resize({
                        width: this.PHOTO_CONFIG.maxWidth,
                        height: this.PHOTO_CONFIG.maxHeight,
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({
                        quality: quality,
                        progressive: true,
                        mozjpeg: true
                    })
                    .toBuffer();

                const currentSize = optimizedBuffer.length;
                
                if (currentSize <= this.PHOTO_CONFIG.maxFileSize || quality <= this.PHOTO_CONFIG.minQuality) {
                    break;
                }

                quality -= 5;
                attempts++;
            }

            const finalMetadata = await sharp(optimizedBuffer).metadata();

            const result = {
                buffer: optimizedBuffer,
                size: optimizedBuffer.length,
                format: 'jpeg',
                dimensions: {
                    width: finalMetadata.width,
                    height: finalMetadata.height
                },
                quality: quality,
                compressionRatio: ((1 - (optimizedBuffer.length / imageBuffer.length)) * 100).toFixed(2)
            };

            console.log(`✅ Student photo optimized:`, {
                finalSize: this.formatBytes(result.size),
                dimensions: `${result.dimensions.width}x${result.dimensions.height}`,
                quality: `${result.quality}%`,
                compressionRatio: `${result.compressionRatio}%`
            });

            return result;

        } catch (error) {
            console.error('Error optimizing student photo:', error);
            throw new Error(`Failed to optimize student photo: ${error.message}`);
        }
    }

    /**
     * Validate image readability
     * Checks if image has sufficient quality and is not corrupted
     * @param {Buffer} imageBuffer - Image buffer to validate
     * @returns {Promise<Object>} - { valid: boolean, error: string|null, metadata: object }
     */
    async validateImageReadability(imageBuffer) {
        try {
            // Get image metadata
            const metadata = await sharp(imageBuffer).metadata();

            // Check if image is too small
            // For ID cards, accept both landscape (400x300) and portrait (300x400) orientations
            // Check that the longer side is at least 400px and shorter side is at least 250px
            const longerSide = Math.max(metadata.width, metadata.height);
            const shorterSide = Math.min(metadata.width, metadata.height);
            
            if (longerSide < 400 || shorterSide < 250) {
                return {
                    valid: false,
                    error: `Image resolution too low (${metadata.width}x${metadata.height}). Minimum recommended: 400x250 pixels for readability.`,
                    metadata: metadata
                };
            }

            // Check if image is corrupted by trying to process it
            await sharp(imageBuffer)
                .resize(100, 100)
                .toBuffer();

            // Check file size (not too small, which might indicate corruption)
            if (imageBuffer.length < 5000) { // 5 KB minimum
                return {
                    valid: false,
                    error: 'Image file size too small. File may be corrupted or empty.',
                    metadata: metadata
                };
            }

            return {
                valid: true,
                error: null,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: imageBuffer.length,
                    sizeFormatted: this.formatBytes(imageBuffer.length)
                }
            };

        } catch (error) {
            return {
                valid: false,
                error: `Image is corrupted or invalid: ${error.message}`,
                metadata: null
            };
        }
    }

    /**
     * Convert image to base64 data URL
     * @param {Buffer} imageBuffer - Image buffer
     * @param {string} format - Image format (default: 'jpeg')
     * @returns {string} - Base64 data URL
     */
    imageToBase64(imageBuffer, format = 'jpeg') {
        const base64 = imageBuffer.toString('base64');
        return `data:image/${format};base64,${base64}`;
    }

    /**
     * Convert base64 data URL to buffer
     * @param {string} dataUrl - Base64 data URL
     * @returns {Buffer} - Image buffer
     */
    base64ToBuffer(dataUrl) {
        // Remove data URL prefix
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }

    /**
     * Combine front and back CIN images into a single PDF
     * @param {Buffer} frontBuffer - Front image buffer
     * @param {Buffer} backBuffer - Back image buffer
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async combineCINToPDF(frontBuffer, backBuffer) {
        try {
            const PDFDocument = require('pdfkit');
            
            return new Promise((resolve, reject) => {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    compress: true
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', reject);

                // Add front side
                doc.fontSize(16).text('CIN Card - Front Side', { align: 'center' });
                doc.moveDown();
                doc.image(frontBuffer, {
                    fit: [500, 350],
                    align: 'center',
                    valign: 'center'
                });

                // Add new page for back side
                doc.addPage();
                doc.fontSize(16).text('CIN Card - Back Side', { align: 'center' });
                doc.moveDown();
                doc.image(backBuffer, {
                    fit: [500, 350],
                    align: 'center',
                    valign: 'center'
                });

                doc.end();
            });

        } catch (error) {
            console.error('Error combining CIN to PDF:', error);
            throw new Error(`Failed to combine CIN images to PDF: ${error.message}`);
        }
    }

    /**
     * Format bytes to human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get optimization configuration
     * @returns {Object} - Configuration object
     */
    getConfig() {
        return {
            cin: this.CIN_CONFIG,
            photo: this.PHOTO_CONFIG
        };
    }
}

// Export singleton instance
module.exports = new ImageOptimizer();
