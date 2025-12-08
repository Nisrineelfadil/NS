/**
 * Season Backup API Routes
 * Endpoints for creating and managing season backups
 */

const express = require('express');
const router = express.Router();
const seasonBackupService = require('../services/seasonBackupService');
const SeasonBackup = require('../models/SeasonBackup');
const Season = require('../models/Season');
const { authenticateAdmin } = require('../middleware/authMiddleware');

/**
 * Create a new season backup
 * POST /api/season-backup/create
 */
router.post('/create', authenticateAdmin, async (req, res) => {
    try {
        const { seasonId, uploadToCloud = true, keepLocalCopy = false } = req.body;

        if (!seasonId) {
            return res.status(400).json({
                success: false,
                message: 'Season ID is required'
            });
        }

        // Verify season exists
        const season = await Season.findById(seasonId);
        if (!season) {
            return res.status(404).json({
                success: false,
                message: 'Season not found'
            });
        }

        // Create backup record
        const backupRecord = await SeasonBackup.create({
            season: seasonId,
            seasonName: season.name,
            status: 'in_progress',
            createdBy: req.admin.id || req.adminId, // Use id from middleware
            createdByName: req.admin.username
        });

        // Set up progress callback for Socket.IO
        if (req.io) {
            seasonBackupService.setProgressCallback((progress) => {
                req.io.emit('backup:progress', {
                    backupId: backupRecord._id,
                    seasonId,
                    ...progress
                });
            });
        }

        // Start backup process (async)
        seasonBackupService.createBackup(seasonId, {
            uploadToCloud,
            keepLocalCopy
        })
        .then(async (result) => {
            // Update backup record with results
            await SeasonBackup.findByIdAndUpdate(backupRecord._id, {
                status: 'completed',
                stats: result.stats,
                duration: result.duration,
                megaUpload: result.uploadResult || {},
                localPath: result.localPath,
                completedAt: result.completedAt
            });

            // Emit completion event
            if (req.io) {
                req.io.emit('backup:complete', {
                    backupId: backupRecord._id,
                    seasonId,
                    result
                });
            }

            console.log(`✅ Backup completed for season ${season.name}`);
        })
        .catch(async (error) => {
            // Update backup record with error
            await SeasonBackup.findByIdAndUpdate(backupRecord._id, {
                status: 'failed',
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });

            // Emit error event
            if (req.io) {
                req.io.emit('backup:error', {
                    backupId: backupRecord._id,
                    seasonId,
                    error: error.message
                });
            }

            console.error(`❌ Backup failed for season ${season.name}:`, error);
        });

        // Return immediately with backup ID
        res.json({
            success: true,
            message: 'Backup started',
            backupId: backupRecord._id,
            seasonName: season.name
        });

    } catch (error) {
        console.error('Error starting backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start backup',
            error: error.message
        });
    }
});

/**
 * Get backup status
 * GET /api/season-backup/status/:backupId
 */
router.get('/status/:backupId', authenticateAdmin, async (req, res) => {
    try {
        const backup = await SeasonBackup.findById(req.params.backupId)
            .populate('season', 'name startDate endDate status');

        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }

        res.json({
            success: true,
            backup
        });

    } catch (error) {
        console.error('Error getting backup status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup status',
            error: error.message
        });
    }
});

/**
 * Get backup history
 * GET /api/season-backup/history
 */
router.get('/history', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 10, seasonId } = req.query;

        let query = {};
        if (seasonId) {
            query.season = seasonId;
        }

        const backups = await SeasonBackup.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('season', 'name startDate endDate status')
            .populate('createdBy', 'username email');

        res.json({
            success: true,
            backups
        });

    } catch (error) {
        console.error('Error getting backup history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup history',
            error: error.message
        });
    }
});

/**
 * Get latest backup for a season
 * GET /api/season-backup/latest/:seasonId
 */
router.get('/latest/:seasonId', authenticateAdmin, async (req, res) => {
    try {
        const backup = await SeasonBackup.getLatestForSeason(req.params.seasonId);

        if (!backup) {
            return res.json({
                success: true,
                backup: null,
                message: 'No backup found for this season'
            });
        }

        res.json({
            success: true,
            backup
        });

    } catch (error) {
        console.error('Error getting latest backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get latest backup',
            error: error.message
        });
    }
});

/**
 * Delete a backup record
 * DELETE /api/season-backup/:backupId
 */
router.delete('/:backupId', authenticateAdmin, async (req, res) => {
    try {
        const backup = await SeasonBackup.findById(req.params.backupId);

        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }

        // Only allow deletion of failed or old completed backups
        if (backup.status === 'in_progress') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete backup in progress'
            });
        }

        await SeasonBackup.findByIdAndDelete(req.params.backupId);

        res.json({
            success: true,
            message: 'Backup record deleted'
        });

    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete backup',
            error: error.message
        });
    }
});

/**
 * Get backup statistics
 * GET /api/season-backup/stats
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalBackups = await SeasonBackup.countDocuments();
        const completedBackups = await SeasonBackup.countDocuments({ status: 'completed' });
        const failedBackups = await SeasonBackup.countDocuments({ status: 'failed' });
        const inProgressBackups = await SeasonBackup.countDocuments({ status: 'in_progress' });

        // Get total size of all backups
        const sizeAggregation = await SeasonBackup.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, totalSize: { $sum: '$stats.totalSize' } } }
        ]);

        const totalSize = sizeAggregation.length > 0 ? sizeAggregation[0].totalSize : 0;
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

        res.json({
            success: true,
            stats: {
                totalBackups,
                completedBackups,
                failedBackups,
                inProgressBackups,
                totalSize,
                totalSizeMB
            }
        });

    } catch (error) {
        console.error('Error getting backup stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup statistics',
            error: error.message
        });
    }
});

module.exports = router;
