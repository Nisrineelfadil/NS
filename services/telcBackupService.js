/**
 * TELC Backup Service
 * Backs up locked exam months to Mega.nz cloud storage
 * Structure: /TELC Exams/YEAR/MONTH_NAME/
 */

const megaService = require('./megaService');
const TelcCandidate = require('../models/TelcCandidate');
const TelcExamMonth = require('../models/TelcExamMonth');

class TelcBackupService {
    constructor() {
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
    }

    /**
     * Backup a locked exam month to Mega.nz
     * @param {string} monthId - The exam month ID
     * @returns {object} Backup result
     */
    async backupLockedMonth(monthId) {
        try {
            // Get the exam month
            const examMonth = await TelcExamMonth.findById(monthId);
            if (!examMonth) {
                throw new Error('Exam month not found');
            }

            if (!examMonth.isLocked) {
                throw new Error('Exam month must be locked before backup');
            }

            const year = examMonth.year;
            const monthName = this.monthNames[examMonth.month - 1];
            const folderPath = `/TELC Exams/${year}/${monthName}`;

            console.log(`📦 Starting TELC backup for ${monthName} ${year}...`);

            // Get all candidates for this month
            const candidates = await TelcCandidate.find({ examMonth: monthId });

            // Categorize candidates
            const passed = candidates.filter(c => c.result?.category === 'passed');
            const failed = candidates.filter(c => c.result?.category === 'failed');
            const partial = candidates.filter(c => c.result?.category === 'partial');
            const pending = candidates.filter(c => !c.result?.category);

            // Create summary data
            const summaryData = {
                examMonth: {
                    id: examMonth._id.toString(),
                    month: monthName,
                    year: year,
                    examDate: examMonth.examDate,
                    lockedAt: examMonth.lockedAt,
                    lockedBy: examMonth.lockedBy
                },
                statistics: {
                    total: candidates.length,
                    passed: passed.length,
                    failed: failed.length,
                    partial: partial.length,
                    pending: pending.length
                },
                candidates: {
                    passed: passed.map(c => this.formatCandidateData(c)),
                    failed: failed.map(c => this.formatCandidateData(c)),
                    partial: partial.map(c => this.formatCandidateData(c)),
                    pending: pending.map(c => this.formatCandidateData(c))
                },
                backupDate: new Date().toISOString(),
                backupVersion: '1.0'
            };

            // Ensure folder exists
            const targetFolder = await megaService.ensureFolderExists(folderPath);

            // Upload summary JSON
            const summaryFileName = `${monthName}_${year}_Summary.json`;
            const summaryBuffer = Buffer.from(JSON.stringify(summaryData, null, 2), 'utf-8');
            
            console.log(`📄 Uploading summary: ${summaryFileName}`);
            const summaryUpload = await targetFolder.upload({
                name: summaryFileName,
                size: summaryBuffer.length
            }, summaryBuffer).complete;

            // Upload certificates for passed and partial candidates
            const certificateResults = [];
            const candidatesWithCerts = [...passed, ...partial].filter(c => c.certificate?.data);

            if (candidatesWithCerts.length > 0) {
                // Create certificates subfolder
                const certsFolder = await megaService.ensureFolderExists(`${folderPath}/Certificates`);

                for (const candidate of candidatesWithCerts) {
                    try {
                        const certFileName = `${candidate.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${candidate.examLevel}_Certificate.pdf`;
                        const certBuffer = Buffer.from(candidate.certificate.data, 'base64');

                        console.log(`📜 Uploading certificate: ${certFileName}`);
                        const certUpload = await certsFolder.upload({
                            name: certFileName,
                            size: certBuffer.length
                        }, certBuffer).complete;

                        certificateResults.push({
                            candidateName: candidate.fullName,
                            fileName: certFileName,
                            success: true
                        });
                    } catch (certError) {
                        console.error(`❌ Failed to upload certificate for ${candidate.fullName}:`, certError.message);
                        certificateResults.push({
                            candidateName: candidate.fullName,
                            success: false,
                            error: certError.message
                        });
                    }
                }
            }

            // Create a readable text report
            const textReport = this.generateTextReport(summaryData);
            const reportFileName = `${monthName}_${year}_Report.txt`;
            const reportBuffer = Buffer.from(textReport, 'utf-8');

            console.log(`📝 Uploading report: ${reportFileName}`);
            await targetFolder.upload({
                name: reportFileName,
                size: reportBuffer.length
            }, reportBuffer).complete;

            // Update exam month with backup info
            examMonth.cloudBackup = {
                backedUp: true,
                backupDate: new Date(),
                folderPath: folderPath,
                filesUploaded: 2 + certificateResults.filter(r => r.success).length
            };
            await examMonth.save();

            console.log(`✅ TELC backup completed for ${monthName} ${year}`);

            return {
                success: true,
                message: `Successfully backed up ${monthName} ${year} to cloud`,
                folderPath: folderPath,
                statistics: summaryData.statistics,
                certificatesUploaded: certificateResults.filter(r => r.success).length,
                certificatesFailed: certificateResults.filter(r => !r.success).length
            };

        } catch (error) {
            console.error('❌ TELC backup error:', error);
            return {
                success: false,
                message: 'Failed to backup exam month',
                error: error.message
            };
        }
    }

    /**
     * Format candidate data for export
     */
    formatCandidateData(candidate) {
        return {
            fullName: candidate.fullName,
            email: candidate.email,
            phone: candidate.phone,
            cin: candidate.cin,
            city: candidate.city,
            examLevel: candidate.examLevel,
            registrationDate: candidate.registrationDate,
            result: candidate.result ? {
                category: candidate.result.category,
                schriftlich: candidate.result.schriftlich,
                muendlich: candidate.result.muendlich,
                notes: candidate.result.notes,
                setAt: candidate.result.setAt
            } : null,
            hasCertificate: !!candidate.certificate?.data,
            certificateUploadedAt: candidate.certificate?.uploadedAt,
            emailSent: candidate.emailSent,
            emailSentAt: candidate.emailSentAt,
            paymentStatus: candidate.paymentStatus
        };
    }

    /**
     * Generate a human-readable text report
     */
    generateTextReport(data) {
        const lines = [];
        const divider = '═'.repeat(60);
        const thinDivider = '─'.repeat(60);

        lines.push(divider);
        lines.push(`  TELC EXAM RESULTS - ${data.examMonth.month} ${data.examMonth.year}`);
        lines.push(divider);
        lines.push('');
        lines.push(`Exam Date: ${data.examMonth.examDate ? new Date(data.examMonth.examDate).toLocaleDateString('de-DE') : 'Not specified'}`);
        lines.push(`Locked At: ${new Date(data.examMonth.lockedAt).toLocaleString('de-DE')}`);
        lines.push(`Backup Date: ${new Date(data.backupDate).toLocaleString('de-DE')}`);
        lines.push('');
        lines.push(thinDivider);
        lines.push('  STATISTICS');
        lines.push(thinDivider);
        lines.push(`  Total Candidates: ${data.statistics.total}`);
        lines.push(`  ✓ Passed:         ${data.statistics.passed}`);
        lines.push(`  ✗ Failed:         ${data.statistics.failed}`);
        lines.push(`  ◐ Partial:        ${data.statistics.partial}`);
        lines.push(`  ○ Pending:        ${data.statistics.pending}`);
        lines.push('');

        // Passed candidates
        if (data.candidates.passed.length > 0) {
            lines.push(thinDivider);
            lines.push('  PASSED CANDIDATES');
            lines.push(thinDivider);
            data.candidates.passed.forEach((c, i) => {
                lines.push(`  ${i + 1}. ${c.fullName}`);
                lines.push(`     Level: ${c.examLevel} | Email: ${c.email}`);
                lines.push(`     Written: ${c.result?.schriftlich || '-'} | Oral: ${c.result?.muendlich || '-'}`);
                lines.push(`     Certificate: ${c.hasCertificate ? 'Yes' : 'No'} | Email Sent: ${c.emailSent ? 'Yes' : 'No'}`);
                lines.push('');
            });
        }

        // Failed candidates
        if (data.candidates.failed.length > 0) {
            lines.push(thinDivider);
            lines.push('  FAILED CANDIDATES');
            lines.push(thinDivider);
            data.candidates.failed.forEach((c, i) => {
                lines.push(`  ${i + 1}. ${c.fullName}`);
                lines.push(`     Level: ${c.examLevel} | Email: ${c.email}`);
                lines.push(`     Written: ${c.result?.schriftlich || '-'} | Oral: ${c.result?.muendlich || '-'}`);
                lines.push('');
            });
        }

        // Partial candidates
        if (data.candidates.partial.length > 0) {
            lines.push(thinDivider);
            lines.push('  PARTIAL PASS CANDIDATES');
            lines.push(thinDivider);
            data.candidates.partial.forEach((c, i) => {
                lines.push(`  ${i + 1}. ${c.fullName}`);
                lines.push(`     Level: ${c.examLevel} | Email: ${c.email}`);
                lines.push(`     Written: ${c.result?.schriftlich || '-'} | Oral: ${c.result?.muendlich || '-'}`);
                lines.push(`     Certificate: ${c.hasCertificate ? 'Yes' : 'No'} | Email Sent: ${c.emailSent ? 'Yes' : 'No'}`);
                lines.push('');
            });
        }

        lines.push(divider);
        lines.push('  Generated by Nisrine School TELC Management System');
        lines.push(divider);

        return lines.join('\n');
    }
}

module.exports = new TelcBackupService();
