/**
 * Season Backup Organizer
 * Handles folder structure creation and file organization
 * Creates the exact structure requested by the user
 */

const fs = require('fs-extra');
const path = require('path');
const excelGenerator = require('./seasonBackupExcelGenerator');

class SeasonBackupOrganizer {
    constructor(seasonName, tempDir) {
        this.seasonName = seasonName;
        this.baseDir = path.join(tempDir, `Season_${seasonName.replace(/\//g, '-')}`);
        this.languageDir = path.join(this.baseDir, 'Language_Groups');
        this.branchesDir = path.join(this.baseDir, 'Branches');
        this.metadataDir = path.join(this.baseDir, 'Metadata');
        
        this.stats = {
            filesCreated: 0,
            foldersCreated: 0,
            totalSize: 0
        };
    }

    /**
     * Initialize base folder structure
     */
    async initialize() {
        console.log(`📁 Creating folder structure: ${this.baseDir}`);
        
        await fs.ensureDir(this.languageDir);
        await fs.ensureDir(this.branchesDir);
        await fs.ensureDir(this.metadataDir);
        
        this.stats.foldersCreated += 4; // Base + 3 main folders
        
        console.log('✅ Base folder structure created');
    }

    /**
     * Create student folder with all files
     */
    async createStudentFolder(groupPath, studentIndex, studentData) {
        const studentFolder = path.join(groupPath, `Student_${String(studentIndex).padStart(3, '0')}`);
        await fs.ensureDir(studentFolder);
        this.stats.foldersCreated++;

        const { student, payments, grades, attendance, journal } = studentData;

        try {
            // 1. Write payments.json
            const paymentsPath = path.join(studentFolder, 'payments.json');
            await fs.writeJSON(paymentsPath, payments, { spaces: 2 });
            this.stats.filesCreated++;
            this.stats.totalSize += await this.getFileSize(paymentsPath);

            // 2. Write grades.json
            const gradesPath = path.join(studentFolder, 'grades.json');
            await fs.writeJSON(gradesPath, grades, { spaces: 2 });
            this.stats.filesCreated++;
            this.stats.totalSize += await this.getFileSize(gradesPath);

            // 3. Write attendance.json
            const attendancePath = path.join(studentFolder, 'attendance.json');
            await fs.writeJSON(attendancePath, attendance, { spaces: 2 });
            this.stats.filesCreated++;
            this.stats.totalSize += await this.getFileSize(attendancePath);

            // 4. Write journal.json
            const journalPath = path.join(studentFolder, 'journal.json');
            await fs.writeJSON(journalPath, journal, { spaces: 2 });
            this.stats.filesCreated++;
            this.stats.totalSize += await this.getFileSize(journalPath);

            // 5. Generate Excel files (human-readable)
            await this.generateExcelFiles(studentFolder, studentData);

            // 6. Copy/Generate fiche_inscription.pdf
            await this.copyFicheInscription(student, studentFolder);

            // 7. Copy ID card images (CIN)
            await this.copyIDCard(student, studentFolder);

            // 8. Copy student photo
            await this.copyPhoto(student, studentFolder);

            return studentFolder;

        } catch (error) {
            console.error(`❌ Error creating student folder for ${student.fullName}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate Excel files for grades, payments, and attendance
     */
    async generateExcelFiles(studentFolder, studentData) {
        const { student, payments, grades, attendance } = studentData;
        
        try {
            // Generate grades.xlsx
            if (grades && grades.length > 0) {
                const gradesExcelPath = path.join(studentFolder, 'grades.xlsx');
                await excelGenerator.generateGradesExcel(grades, student, gradesExcelPath);
                this.stats.filesCreated++;
                this.stats.totalSize += await this.getFileSize(gradesExcelPath);
                console.log(`  ✅ Generated grades.xlsx for ${student.fullName}`);
            }
            
            // Generate payments.xlsx
            if (payments && payments.length > 0) {
                const paymentsExcelPath = path.join(studentFolder, 'payments.xlsx');
                await excelGenerator.generatePaymentsExcel(payments, student, paymentsExcelPath);
                this.stats.filesCreated++;
                this.stats.totalSize += await this.getFileSize(paymentsExcelPath);
                console.log(`  ✅ Generated payments.xlsx for ${student.fullName}`);
            }
            
            // Generate attendance.xlsx
            if (attendance && attendance.length > 0) {
                const attendanceExcelPath = path.join(studentFolder, 'attendance.xlsx');
                await excelGenerator.generateAttendanceExcel(attendance, student, attendanceExcelPath);
                this.stats.filesCreated++;
                this.stats.totalSize += await this.getFileSize(attendanceExcelPath);
                console.log(`  ✅ Generated attendance.xlsx for ${student.fullName}`);
            }
            
        } catch (error) {
            console.warn(`⚠️  Could not generate Excel files for ${student.fullName}:`, error.message);
        }
    }

    /**
     * Copy or generate fiche inscription PDF
     */
    async copyFicheInscription(student, studentFolder) {
        try {
            // Check if student has a fiche inscription path
            if (student.ficheInscriptionPath) {
                const sourcePath = student.ficheInscriptionPath;
                const destPath = path.join(studentFolder, 'fiche_inscription.pdf');

                if (await fs.pathExists(sourcePath)) {
                    await fs.copy(sourcePath, destPath);
                    this.stats.filesCreated++;
                    this.stats.totalSize += await this.getFileSize(destPath);
                    return;
                }
            }

            // If no PDF exists, generate one
            const pdfGenerator = require('./pdfGenerator');
            const destPath = path.join(studentFolder, 'fiche_inscription.pdf');
            
            await pdfGenerator.generateRegistrationPDF(student, destPath);
            
            if (await fs.pathExists(destPath)) {
                this.stats.filesCreated++;
                this.stats.totalSize += await this.getFileSize(destPath);
            }

        } catch (error) {
            console.warn(`⚠️  Could not create fiche inscription for ${student.fullName}:`, error.message);
        }
    }

    /**
     * Copy ID card images (front and back)
     */
    async copyIDCard(student, studentFolder) {
        if (!student.cinCard) return;

        try {
            // Copy front side
            if (student.cinCard.front) {
                const frontPath = path.join(studentFolder, 'id_card_front.jpg');
                await this.saveBase64OrFile(student.cinCard.front, frontPath);
                
                if (await fs.pathExists(frontPath)) {
                    this.stats.filesCreated++;
                    this.stats.totalSize += await this.getFileSize(frontPath);
                }
            }

            // Copy back side
            if (student.cinCard.back) {
                const backPath = path.join(studentFolder, 'id_card_back.jpg');
                await this.saveBase64OrFile(student.cinCard.back, backPath);
                
                if (await fs.pathExists(backPath)) {
                    this.stats.filesCreated++;
                    this.stats.totalSize += await this.getFileSize(backPath);
                }
            }

        } catch (error) {
            console.warn(`⚠️  Could not copy ID card for ${student.fullName}:`, error.message);
        }
    }

    /**
     * Copy student photo
     */
    async copyPhoto(student, studentFolder) {
        if (!student.photoPath) return;

        try {
            const photoPath = path.join(studentFolder, 'photo.jpg');
            await this.saveBase64OrFile(student.photoPath, photoPath);
            
            if (await fs.pathExists(photoPath)) {
                this.stats.filesCreated++;
                this.stats.totalSize += await this.getFileSize(photoPath);
            }

        } catch (error) {
            console.warn(`⚠️  Could not copy photo for ${student.fullName}:`, error.message);
        }
    }

    /**
     * Save base64 data or copy file
     */
    async saveBase64OrFile(source, destination) {
        if (!source) {
            return;
        }

        try {
            if (source.startsWith('data:')) {
                // Base64 data
                const base64Data = source.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                await fs.writeFile(destination, buffer);
            } else if (await fs.pathExists(source)) {
                // File path
                await fs.copy(source, destination);
            } else {
                // Try different path formats
                const possiblePaths = [
                    source,
                    path.join(__dirname, '..', source),
                    path.join(__dirname, '..', 'uploads', 'photos', path.basename(source))
                ];

                for (const possiblePath of possiblePaths) {
                    if (await fs.pathExists(possiblePath)) {
                        await fs.copy(possiblePath, destination);
                        return;
                    }
                }

                console.warn(`⚠️  File not found: ${source}`);
            }
        } catch (error) {
            console.warn(`⚠️  Error saving file ${destination}:`, error.message);
        }
    }

    /**
     * Create metadata files
     */
    async createMetadata(metadata) {
        const { seasonInfo, groupIndex, branchIndex } = metadata;

        try {
            // 1. Season info
            const seasonInfoPath = path.join(this.metadataDir, 'season_info.json');
            await fs.writeJSON(seasonInfoPath, seasonInfo, { spaces: 2 });
            this.stats.filesCreated++;
            this.stats.totalSize += await this.getFileSize(seasonInfoPath);

            // 2. Group index
            const groupIndexPath = path.join(this.metadataDir, 'group_index.json');
            await fs.writeJSON(groupIndexPath, groupIndex, { spaces: 2 });
            this.stats.filesCreated++;
            this.stats.totalSize += await this.getFileSize(groupIndexPath);

            // 3. Branch index
            const branchIndexPath = path.join(this.metadataDir, 'branch_index.json');
            await fs.writeJSON(branchIndexPath, branchIndex, { spaces: 2 });
            this.stats.filesCreated++;
            this.stats.totalSize += await this.getFileSize(branchIndexPath);

            console.log('✅ Metadata files created');

        } catch (error) {
            console.error('❌ Error creating metadata:', error);
            throw error;
        }
    }

    /**
     * Get file size in bytes
     */
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Sanitize folder/file name
     */
    sanitizeName(name) {
        return name.replace(/[^a-zA-Z0-9-_.\s]/g, '_');
    }

    /**
     * Get base directory
     */
    getBaseDir() {
        return this.baseDir;
    }

    /**
     * Get language groups directory
     */
    getLanguageDir() {
        return this.languageDir;
    }

    /**
     * Get branches directory
     */
    getBranchesDir() {
        return this.branchesDir;
    }

    /**
     * Get statistics
     */
    getStats() {
        return this.stats;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

module.exports = SeasonBackupOrganizer;
