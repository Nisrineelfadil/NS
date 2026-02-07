const express = require('express');
const router = express.Router();
const imageStorageService = require('../services/imageStorageService');

/**
 * Media serving route - serves images/files from Mega.nz with caching
 * 
 * GET /api/media/:folder/:filename
 * 
 * Supported folders:
 *   - student-photos       → ManagedStudent photos
 *   - student-cin          → CIN front/back images
 *   - receipts             → Cash transaction receipts
 *   - certificates         → TELC certificates
 *   - registration-photos  → Student registration photos
 */

const ALLOWED_FOLDERS = [
    'student-photos',
    'student-cin',
    'receipts',
    'certificates',
    'registration-photos'
];

// Serve media files from Mega.nz
router.get('/:folder/:filename', async (req, res) => {
    try {
        const { folder, filename } = req.params;

        // Validate folder
        if (!ALLOWED_FOLDERS.includes(folder)) {
            return res.status(400).json({ success: false, message: 'Invalid media folder' });
        }

        // Validate filename (prevent path traversal)
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ success: false, message: 'Invalid filename' });
        }

        // Download from Mega (with cache) — timeout after 15 seconds
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Download timeout')), 15000)
        );
        const buffer = await Promise.race([
            imageStorageService.downloadImage(folder, filename),
            timeoutPromise
        ]);

        if (!buffer) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Determine MIME type
        const mimeType = imageStorageService.getMimeType(filename);

        // Set caching headers (cache for 1 hour in browser, 24 hours on CDN)
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        res.setHeader('ETag', `"${Buffer.from(folder + filename).toString('base64').substring(0, 16)}"`);

        res.send(buffer);

    } catch (error) {
        console.error(`❌ Media serve error [${req.params.folder}/${req.params.filename}]:`, error.message);

        // Return a 1x1 transparent pixel for image requests that fail (prevents broken images)
        if (req.params.filename && /\.(jpg|jpeg|png|gif|webp)$/i.test(req.params.filename)) {
            const transparentPixel = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
                'base64'
            );
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-cache');
            return res.send(transparentPixel);
        }

        res.status(404).json({ success: false, message: 'File not found' });
    }
});

module.exports = router;
