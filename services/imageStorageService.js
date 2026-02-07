/**
 * Image Storage Service for Nisrine School
 * Handles uploading, downloading, and deleting images via Mega.nz
 * Replaces base64 storage in MongoDB to save space
 * 
 * Folder structure on Mega:
 *   /Nisrine Images/
 *     student-photos/       → ManagedStudent photos
 *     student-cin/           → CIN front/back images
 *     receipts/              → Cash transaction receipts
 *     certificates/          → TELC certificates
 *     registration-photos/   → Student registration photos
 */

const megaService = require('./megaService');

const MEGA_BASE_FOLDER = '/Nisrine Images';

// Simple in-memory LRU cache for downloaded images
class ImageCache {
    constructor(maxSize = 50, ttlMs = 5 * 60 * 1000, maxTotalBytes = 25 * 1024 * 1024) {
        this.cache = new Map();
        this.maxSize = maxSize;          // Max 50 items
        this.ttlMs = ttlMs;             // 5 min TTL
        this.maxTotalBytes = maxTotalBytes; // 25 MB max total cache
        this.currentBytes = 0;
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.currentBytes -= entry.size;
            this.cache.delete(key);
            return null;
        }
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.data;
    }

    set(key, data) {
        const size = data ? data.length : 0;
        
        // Skip caching if single item is too large (> 2 MB)
        if (size > 2 * 1024 * 1024) return;
        
        // Evict oldest entries until we have room
        while (this.cache.size >= this.maxSize || this.currentBytes + size > this.maxTotalBytes) {
            const firstKey = this.cache.keys().next().value;
            if (!firstKey) break;
            const evicted = this.cache.get(firstKey);
            this.currentBytes -= evicted.size;
            this.cache.delete(firstKey);
        }
        this.currentBytes += size;
        this.cache.set(key, { data, timestamp: Date.now(), size });
    }

    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.currentBytes -= entry.size;
            this.cache.delete(key);
        }
    }

    clear() {
        this.cache.clear();
        this.currentBytes = 0;
    }
}

const imageCache = new ImageCache();

class ImageStorageService {
    /**
     * Upload an image buffer to Mega.nz
     * @param {Buffer} buffer - Image/file buffer
     * @param {string} folder - Subfolder name (e.g., 'student-photos')
     * @param {string} filename - File name (e.g., 'abc123.jpg')
     * @returns {Promise<string>} - The stored path for the DB (e.g., '/api/media/student-photos/abc123.jpg')
     */
    async uploadImage(buffer, folder, filename) {
        const megaPath = `${MEGA_BASE_FOLDER}/${folder}/${filename}`;

        try {
            // Delete existing file first (overwrite)
            try {
                await megaService.deleteFile(megaPath);
            } catch (e) {
                // File doesn't exist yet, that's fine
            }

            const result = await megaService.uploadServiceFile(buffer, megaPath);

            if (!result.success) {
                throw new Error(result.message || 'Upload failed');
            }

            // Invalidate cache for this path
            imageCache.delete(`${folder}/${filename}`);

            console.log(`✅ Image uploaded to Mega: ${megaPath} (${buffer.length} bytes)`);

            // Return the API URL to store in MongoDB
            return `/api/media/${folder}/${filename}`;
        } catch (error) {
            console.error(`❌ Failed to upload image to Mega: ${megaPath}`, error.message);
            throw error;
        }
    }

    /**
     * Download an image from Mega.nz (with caching)
     * @param {string} folder - Subfolder name
     * @param {string} filename - File name
     * @returns {Promise<Buffer>} - The image buffer
     */
    async downloadImage(folder, filename) {
        const cacheKey = `${folder}/${filename}`;

        // Check cache first
        const cached = imageCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const megaPath = `${MEGA_BASE_FOLDER}/${folder}/${filename}`;

        try {
            const result = await megaService.downloadServiceFile(megaPath);
            const buffer = result.fileBuffer;

            // Cache the result
            imageCache.set(cacheKey, buffer);

            return buffer;
        } catch (error) {
            console.error(`❌ Failed to download image from Mega: ${megaPath}`, error.message);
            throw error;
        }
    }

    /**
     * Delete an image from Mega.nz
     * @param {string} folder - Subfolder name
     * @param {string} filename - File name
     */
    async deleteImage(folder, filename) {
        const megaPath = `${MEGA_BASE_FOLDER}/${folder}/${filename}`;
        imageCache.delete(`${folder}/${filename}`);

        try {
            await megaService.deleteFile(megaPath);
            console.log(`🗑️ Image deleted from Mega: ${megaPath}`);
        } catch (error) {
            console.error(`⚠️ Failed to delete image from Mega: ${megaPath}`, error.message);
            // Don't throw - deletion failure shouldn't break the flow
        }
    }

    /**
     * Delete all images for a student (photo + CIN)
     * @param {string} studentId - Student MongoDB ID
     */
    async deleteStudentImages(studentId) {
        await this.deleteImage('student-photos', `${studentId}.jpg`);
        await this.deleteImage('student-cin', `${studentId}-front.jpg`);
        await this.deleteImage('student-cin', `${studentId}-back.jpg`);
    }

    /**
     * Upload a student photo
     * @param {Buffer} buffer - Optimized image buffer
     * @param {string} studentId - Student MongoDB ID
     * @returns {Promise<string>} - API URL path
     */
    async uploadStudentPhoto(buffer, studentId) {
        return this.uploadImage(buffer, 'student-photos', `${studentId}.jpg`);
    }

    /**
     * Upload a CIN card image
     * @param {Buffer} buffer - Optimized image buffer
     * @param {string} studentId - Student MongoDB ID
     * @param {string} side - 'front' or 'back'
     * @returns {Promise<string>} - API URL path
     */
    async uploadCINImage(buffer, studentId, side) {
        return this.uploadImage(buffer, 'student-cin', `${studentId}-${side}.jpg`);
    }

    /**
     * Upload a cash transaction receipt
     * @param {Buffer} buffer - Image/PDF buffer
     * @param {string} transactionId - Transaction MongoDB ID
     * @param {string} ext - File extension ('jpg' or 'pdf')
     * @returns {Promise<string>} - API URL path
     */
    async uploadReceipt(buffer, transactionId, ext = 'jpg') {
        return this.uploadImage(buffer, 'receipts', `${transactionId}.${ext}`);
    }

    /**
     * Upload a TELC certificate
     * @param {Buffer} buffer - PDF buffer
     * @param {string} candidateId - Candidate MongoDB ID
     * @returns {Promise<string>} - API URL path
     */
    async uploadCertificate(buffer, candidateId) {
        return this.uploadImage(buffer, 'certificates', `${candidateId}.pdf`);
    }

    /**
     * Upload a registration photo
     * @param {Buffer} buffer - Image buffer
     * @param {string} studentId - Student MongoDB ID
     * @returns {Promise<string>} - API URL path
     */
    async uploadRegistrationPhoto(buffer, studentId) {
        return this.uploadImage(buffer, 'registration-photos', `${studentId}.jpg`);
    }

    /**
     * Check if a stored path is a Mega/API media path (vs base64 or file path)
     * @param {string} path - The stored path
     * @returns {boolean}
     */
    isMediaPath(path) {
        return path && path.startsWith('/api/media/');
    }

    /**
     * Check if a stored path is base64
     * @param {string} path - The stored path
     * @returns {boolean}
     */
    isBase64(path) {
        return path && path.startsWith('data:');
    }

    /**
     * Get the image buffer for a stored path (works for both base64 and Mega paths)
     * Useful for PDF generation that needs the actual buffer
     * @param {string} storedPath - The path stored in DB
     * @returns {Promise<Buffer|null>}
     */
    async getImageBuffer(storedPath) {
        if (!storedPath) return null;

        // Base64 data URL
        if (this.isBase64(storedPath)) {
            const base64Data = storedPath.split(',')[1];
            return Buffer.from(base64Data, 'base64');
        }

        // Mega API path
        if (this.isMediaPath(storedPath)) {
            // Extract folder and filename from '/api/media/folder/filename'
            const parts = storedPath.replace('/api/media/', '').split('/');
            const folder = parts[0];
            const filename = parts.slice(1).join('/');
            return this.downloadImage(folder, filename);
        }

        // File path (legacy) - not supported in serverless
        return null;
    }

    /**
     * Get the MIME type from a filename
     * @param {string} filename
     * @returns {string}
     */
    getMimeType(filename) {
        if (!filename) return 'application/octet-stream';
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'pdf': 'application/pdf'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Clear the image cache
     */
    clearCache() {
        imageCache.clear();
    }
}

module.exports = new ImageStorageService();
