/**
 * Season Backup Service - Main Orchestrator
 * Coordinates the entire backup process from data extraction to MEGA upload
 * Safe for production - read-only database operations
 */

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

const SeasonBackupExtractor = require('./seasonBackupExtractor');
const SeasonBackupOrganizer = require('./seasonBackupOrganizer');
const megaService = require('./megaService');

class SeasonBackupService {
    constructor() {
        this.currentBackup = null;
        this.progressCallback = null;
    }

    /**
     * Set progress callback for real-time updates
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Emit progress event
     */
    emitProgress(data) {
        if (this.progressCallback) {
            this.progressCallback(data);
        }
    }

    /**
     * Create a complete season backup
     */
    async createBackup(seasonId, options = {}) {
        const {
            uploadToCloud = true,
            keepLocalCopy = false,
            includeServiceFiles = false
        } = options;

        const startTime = Date.now();
        const tempDir = path.join(os.tmpdir(), `season-backup-${uuidv4()}`);
        let zipPath = null;

        try {
            // Check for concurrent backups
            await this.checkLock();
            await this.createLock();

            this.emitProgress({
                phase: 'initialization',
                percent: 0,
                message: 'Initializing backup process...'
            });

            console.log('🚀 Starting season backup...');
            console.log(`📁 Temp directory: ${tempDir}`);

            // Phase 1: Initialize extractor
            this.emitProgress({
                phase: 'initialization',
                percent: 5,
                message: 'Validating season...'
            });

            const extractor = new SeasonBackupExtractor(seasonId);
            const season = await extractor.initialize();

            console.log(`📅 Backing up season: ${season.name}`);

            // Phase 2: Initialize organizer
            this.emitProgress({
                phase: 'initialization',
                percent: 10,
                message: 'Creating folder structure...'
            });

            const organizer = new SeasonBackupOrganizer(season.name, tempDir);
            await organizer.initialize();

            // Phase 3: Extract and organize language groups
            this.emitProgress({
                phase: 'extraction',
                percent: 15,
                message: 'Extracting language groups...'
            });

            const languageGroups = await extractor.getLanguageGroups();
            await this.processLanguageGroups(languageGroups, organizer, extractor);

            // Phase 4: Extract and organize branch groups
            this.emitProgress({
                phase: 'extraction',
                percent: 50,
                message: 'Extracting branch groups...'
            });

            const branchGroups = await extractor.getBranchGroups();
            await this.processBranchGroups(branchGroups, organizer, extractor);

            // Phase 5: Create metadata
            this.emitProgress({
                phase: 'metadata',
                percent: 80,
                message: 'Creating metadata files...'
            });

            const metadata = await extractor.getMetadata(languageGroups, branchGroups);
            
            // Update metadata with file stats
            metadata.seasonInfo.stats.totalFiles = organizer.getStats().filesCreated;
            metadata.seasonInfo.stats.totalSize = organizer.getStats().totalSize;
            metadata.seasonInfo.stats.totalSizeMB = Math.round(organizer.getStats().totalSize / 1024 / 1024);
            
            await organizer.createMetadata(metadata);

            // Phase 6: Compress to ZIP
            this.emitProgress({
                phase: 'compression',
                percent: 85,
                message: 'Compressing backup to ZIP...'
            });

            zipPath = path.join(os.tmpdir(), `Season_${season.name.replace(/\//g, '-')}_Backup_${Date.now()}.zip`);
            await this.compressBackup(organizer.getBaseDir(), zipPath);

            const zipStats = await fs.stat(zipPath);
            const zipSizeMB = (zipStats.size / 1024 / 1024).toFixed(2);

            console.log(`✅ ZIP created: ${zipSizeMB} MB`);

            // Phase 7: Upload to MEGA
            let uploadResult = null;
            if (uploadToCloud) {
                this.emitProgress({
                    phase: 'upload',
                    percent: 90,
                    message: 'Uploading to MEGA cloud...'
                });

                uploadResult = await this.uploadToMega(zipPath, season.name);
            }

            // Phase 8: Cleanup
            this.emitProgress({
                phase: 'cleanup',
                percent: 95,
                message: 'Cleaning up temporary files...'
            });

            await fs.remove(tempDir);

            if (!keepLocalCopy && zipPath) {
                await fs.remove(zipPath);
            }

            await this.removeLock();

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            this.emitProgress({
                phase: 'complete',
                percent: 100,
                message: 'Backup completed successfully!'
            });

            console.log(`✅ Backup completed in ${duration}s`);

            const result = {
                success: true,
                season: season.name,
                seasonId: seasonId,
                stats: {
                    totalStudents: metadata.seasonInfo.stats.totalStudents,
                    totalGroups: metadata.seasonInfo.stats.totalGroups,
                    languageGroups: metadata.seasonInfo.stats.languageGroups,
                    branchGroups: metadata.seasonInfo.stats.branchGroups,
                    totalFiles: metadata.seasonInfo.stats.totalFiles,
                    totalSize: zipStats.size,
                    totalSizeMB: parseFloat(zipSizeMB)
                },
                duration: parseFloat(duration),
                uploadResult,
                localPath: keepLocalCopy ? zipPath : null,
                completedAt: new Date()
            };

            this.currentBackup = result;
            return result;

        } catch (error) {
            console.error('❌ Backup failed:', error);

            this.emitProgress({
                phase: 'error',
                percent: 0,
                message: `Backup failed: ${error.message}`
            });

            // Cleanup on error
            await fs.remove(tempDir).catch(() => {});
            if (zipPath) {
                await fs.remove(zipPath).catch(() => {});
            }
            await this.removeLock();

            throw error;
        }
    }

    /**
     * Process language groups
     */
    async processLanguageGroups(groups, organizer, extractor) {
        console.log(`📚 Processing ${groups.length} language groups...`);

        let processedStudents = 0;
        let totalStudents = groups.reduce((sum, g) => sum + g.students.length, 0);

        for (const group of groups) {
            const groupDir = path.join(
                organizer.getLanguageDir(),
                organizer.sanitizeName(group.name)
            );
            await fs.ensureDir(groupDir);

            console.log(`  📂 ${group.name} (${group.students.length} students)`);

            for (let i = 0; i < group.students.length; i++) {
                const student = group.students[i];
                
                try {
                    const studentData = await extractor.getStudentCompleteData(student._id);
                    
                    if (studentData) {
                        await organizer.createStudentFolder(groupDir, i + 1, studentData);
                        processedStudents++;

                        // Update progress
                        const percent = 15 + Math.round((processedStudents / totalStudents) * 35);
                        this.emitProgress({
                            phase: 'extraction',
                            percent,
                            message: `Processing language groups: ${processedStudents}/${totalStudents} students`,
                            currentStudent: processedStudents,
                            totalStudents
                        });
                    }
                } catch (error) {
                    console.error(`  ❌ Error processing student ${student.fullName}:`, error.message);
                }
            }
        }

        console.log(`✅ Processed ${processedStudents} students in language groups`);
    }

    /**
     * Process branch groups
     */
    async processBranchGroups(branchGroups, organizer, extractor) {
        console.log(`🏢 Processing ${branchGroups.length} branch groups...`);

        let processedStudents = 0;
        let totalStudents = 0;

        // Count total students
        branchGroups.forEach(branch => {
            branch.subgroups.forEach(subgroup => {
                totalStudents += subgroup.students.length;
            });
        });

        for (const branch of branchGroups) {
            const branchDir = path.join(
                organizer.getBranchesDir(),
                organizer.sanitizeName(branch.name)
            );
            await fs.ensureDir(branchDir);

            console.log(`  📂 ${branch.name} (${branch.subgroups.length} subgroups)`);

            for (const subgroup of branch.subgroups) {
                const subgroupDir = path.join(
                    branchDir,
                    organizer.sanitizeName(subgroup.name)
                );
                await fs.ensureDir(subgroupDir);

                console.log(`    📂 ${subgroup.name} (${subgroup.students.length} students)`);

                for (let i = 0; i < subgroup.students.length; i++) {
                    const student = subgroup.students[i];
                    
                    try {
                        const studentData = await extractor.getStudentCompleteData(student._id);
                        
                        if (studentData) {
                            await organizer.createStudentFolder(subgroupDir, i + 1, studentData);
                            processedStudents++;

                            // Update progress
                            const percent = 50 + Math.round((processedStudents / totalStudents) * 30);
                            this.emitProgress({
                                phase: 'extraction',
                                percent,
                                message: `Processing branch groups: ${processedStudents}/${totalStudents} students`,
                                currentStudent: processedStudents,
                                totalStudents
                            });
                        }
                    } catch (error) {
                        console.error(`    ❌ Error processing student ${student.fullName}:`, error.message);
                    }
                }
            }
        }

        console.log(`✅ Processed ${processedStudents} students in branch groups`);
    }

    /**
     * Compress backup to ZIP
     */
    async compressBackup(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            output.on('close', () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`📦 ZIP size: ${sizeInMB} MB`);
                resolve(outputPath);
            });

            archive.on('error', reject);
            archive.on('warning', (err) => {
                if (err.code !== 'ENOENT') {
                    console.warn('Archive warning:', err);
                }
            });

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    /**
     * Upload to MEGA cloud
     */
    async uploadToMega(zipPath, seasonName) {
        try {
            // Check if MEGA is configured
            if (!megaService.isConfigured()) {
                console.warn('⚠️  MEGA not configured, skipping upload');
                return {
                    success: false,
                    message: 'MEGA not configured'
                };
            }

            console.log('☁️  Uploading to MEGA...');

            // Login to MEGA
            await megaService.login();

            // Create folder structure: /Nisrine School Backups/Seasons/2025-2026
            const folderPath = `/Nisrine School Backups/Seasons/${seasonName}`;
            const folder = await megaService.ensureFolderExists(folderPath);

            // Read ZIP file
            const fileBuffer = await fs.readFile(zipPath);
            const fileName = path.basename(zipPath);

            // Upload file
            const uploadedFile = await folder.upload({
                name: fileName,
                size: fileBuffer.length
            }, fileBuffer).complete;

            // Get shareable link
            let shareLink = null;
            try {
                shareLink = await uploadedFile.link();
            } catch (linkError) {
                console.warn('Could not create shareable link:', linkError.message);
            }

            console.log(`✅ Uploaded to MEGA: ${folderPath}/${fileName}`);

            return {
                success: true,
                fileName,
                filePath: `${folderPath}/${fileName}`,
                folder: folderPath,
                shareLink,
                size: fileBuffer.length
            };

        } catch (error) {
            console.error('❌ MEGA upload failed:', error);
            return {
                success: false,
                message: error.message,
                error: error.toString()
            };
        }
    }

    /**
     * Check for concurrent backup lock
     */
    async checkLock() {
        const lockFile = path.join(os.tmpdir(), 'season-backup.lock');
        
        if (await fs.pathExists(lockFile)) {
            const lockData = await fs.readFile(lockFile, 'utf8');
            throw new Error(`Another backup is already running (started at ${lockData})`);
        }
    }

    /**
     * Create backup lock
     */
    async createLock() {
        const lockFile = path.join(os.tmpdir(), 'season-backup.lock');
        await fs.writeFile(lockFile, new Date().toISOString());
    }

    /**
     * Remove backup lock
     */
    async removeLock() {
        const lockFile = path.join(os.tmpdir(), 'season-backup.lock');
        await fs.remove(lockFile).catch(() => {});
    }

    /**
     * Get current backup status
     */
    getCurrentBackup() {
        return this.currentBackup;
    }
}

module.exports = new SeasonBackupService();
