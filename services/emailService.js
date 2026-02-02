const nodemailer = require('nodemailer');
const TelcEmailTemplate = require('../models/TelcEmailTemplate');
const TelcCandidate = require('../models/TelcCandidate');
const TelcExamMonth = require('../models/TelcExamMonth');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
    }

    // Initialize the email transporter
    initialize() {
        if (this.isInitialized) return;

        const smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };

        // Only initialize if credentials are provided
        if (smtpConfig.auth.user && smtpConfig.auth.pass) {
            this.transporter = nodemailer.createTransport(smtpConfig);
            this.isInitialized = true;
            console.log('✅ Email service initialized');
        } else {
            console.warn('⚠️  Email service not configured. Set SMTP_USER and SMTP_PASS in .env');
        }
    }

    // Check if email service is ready
    isReady() {
        return this.isInitialized && this.transporter !== null;
    }

    // Verify connection
    async verifyConnection() {
        if (!this.isReady()) {
            throw new Error('Email service not initialized');
        }

        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Email verification failed:', error);
            throw error;
        }
    }

    // Get school info for templates
    async getSchoolInfo() {
        const settings = await Settings.getSettings();
        return {
            schoolName: 'Nisrine School',
            schoolPhone: settings.contactPhone || '+212 6XX XXX XXX',
            schoolEmail: process.env.SMTP_USER || 'contact@nisrineschool.com'
        };
    }

    // Send a single email
    async sendEmail(to, subject, html, attachments = []) {
        if (!this.isReady()) {
            throw new Error('Email service not initialized. Configure SMTP settings in .env');
        }

        const mailOptions = {
            from: `"Nisrine School" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            attachments
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${to}: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
            throw error;
        }
    }

    // Send TELC result email to a single candidate
    async sendTelcResultEmail(candidateId, adminId, adminName) {
        const candidate = await TelcCandidate.findById(candidateId).populate('examMonth');
        if (!candidate) {
            throw new Error('Candidate not found');
        }

        if (!candidate.resultCategory) {
            throw new Error('Candidate has no result category set');
        }

        if (candidate.emailSent) {
            throw new Error('Email already sent to this candidate');
        }

        // Get template
        const template = await TelcEmailTemplate.getTemplate(candidate.resultCategory);
        if (!template) {
            throw new Error(`No template found for category: ${candidate.resultCategory}`);
        }

        // Get school info
        const schoolInfo = await this.getSchoolInfo();

        // Prepare template data
        const templateData = {
            candidateName: candidate.fullName,
            examLevel: candidate.examLevel,
            examMonth: candidate.examMonthLabel,
            schriftlichResult: candidate.resultDetails?.schriftlich === 'passed' ? 'Bestanden' : 'Nicht bestanden',
            muendlichResult: candidate.resultDetails?.muendlich === 'passed' ? 'Bestanden' : 'Nicht bestanden',
            ...schoolInfo
        };

        // Render template
        const { subject, body } = template.render(templateData);

        // Prepare attachments (certificate for passed and partial)
        const attachments = [];
        if (candidate.certificate?.data && (candidate.resultCategory === 'passed' || candidate.resultCategory === 'partial')) {
            attachments.push({
                filename: candidate.certificate.filename || `TELC_${candidate.examLevel}_Certificate_${candidate.fullName.replace(/\s+/g, '_')}.pdf`,
                content: Buffer.from(candidate.certificate.data, 'base64'),
                contentType: 'application/pdf'
            });
        }

        // Send email
        await this.sendEmail(candidate.email, subject, body, attachments);

        // Update candidate
        candidate.emailSent = true;
        candidate.emailSentAt = new Date();
        candidate.emailSentBy = adminId;
        await candidate.save();

        // Update month stats
        await TelcExamMonth.updateStats(candidate.examMonth._id || candidate.examMonth);

        return {
            success: true,
            candidateId: candidate._id,
            candidateName: candidate.fullName,
            email: candidate.email
        };
    }

    // Send bulk emails to all candidates in a category for a month
    async sendBulkTelcEmails(examMonthId, category, adminId, adminName) {
        // Get all candidates ready for email in this category
        const candidates = await TelcCandidate.getReadyForEmail(examMonthId, category);

        if (candidates.length === 0) {
            return {
                success: true,
                sent: 0,
                failed: 0,
                message: 'No candidates ready for email in this category'
            };
        }

        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };

        // Send emails one by one (to avoid rate limiting)
        for (const candidate of candidates) {
            try {
                await this.sendTelcResultEmail(candidate._id, adminId, adminName);
                results.sent++;
                
                // Small delay to avoid rate limiting (100ms between emails)
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.failed++;
                results.errors.push({
                    candidateId: candidate._id,
                    candidateName: candidate.fullName,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            ...results,
            total: candidates.length
        };
    }

    // Send capacity alert to super admin
    async sendCapacityAlert(examMonthId) {
        const examMonth = await TelcExamMonth.findById(examMonthId);
        if (!examMonth) {
            throw new Error('Exam month not found');
        }

        if (examMonth.capacityAlertSent) {
            console.log('Capacity alert already sent for this month');
            return { success: true, alreadySent: true };
        }

        // Get settings for super admin email
        const settings = await Settings.getSettings();
        const superAdminEmail = settings.telcSuperAdminEmail;

        if (!superAdminEmail) {
            console.warn('No super admin email configured for TELC capacity alerts');
            return { success: false, error: 'No super admin email configured' };
        }

        const subject = `⚠️ TELC Capacity Alert - ${examMonth.label}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ffc107;">⚠️ TELC Exam Capacity Alert</h2>
                
                <p>The TELC exam for <strong>${examMonth.label}</strong> has reached its maximum capacity of <strong>${examMonth.maxCapacity}</strong> candidates.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Month</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${examMonth.label}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current Count</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${examMonth.currentCount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Max Capacity</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${examMonth.maxCapacity}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Emergency Reserve</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${examMonth.emergencyReserve} slots available</td>
                    </tr>
                </table>
                
                <p>As Super Admin, you can unlock the emergency reserve of <strong>${examMonth.emergencyReserve}</strong> additional slots if needed.</p>
                
                <p>New registrations will ${examMonth.autoOverflowEnabled ? 'automatically overflow to the next available month' : 'be blocked until you take action'}.</p>
                
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                
                <p style="color: #666;">
                    This is an automated message from Nisrine School TELC Management System.
                </p>
            </div>
        `;

        await this.sendEmail(superAdminEmail, subject, html);

        // Mark alert as sent
        examMonth.capacityAlertSent = true;
        examMonth.capacityAlertSentAt = new Date();
        await examMonth.save();

        return { success: true };
    }

    // Test email configuration
    async sendTestEmail(toEmail) {
        const subject = 'Test Email - Nisrine School TELC System';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">✅ Email Configuration Test</h2>
                <p>This is a test email from the Nisrine School TELC Management System.</p>
                <p>If you received this email, your email configuration is working correctly!</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666;">
                    Sent at: ${new Date().toISOString()}
                </p>
            </div>
        `;

        return await this.sendEmail(toEmail, subject, html);
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
