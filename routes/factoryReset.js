// Protected factory reset — Director (super_admin) only. Mounted at /api/factory-reset (server.js).
// Steps: 1 preview → 2 verified backup → 3 password (+ email code when 2FA is on) → 4 typed confirmation → execute.
// Secretaries, teachers, students, the developer account and temporary-access sessions are refused by the server.
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const SecurityEvent = require('../models/SecurityEvent');
const AccountRecovery = require('../models/AccountRecovery');
const emailService = require('../services/emailService');
const megaService = require('../services/megaService');
const reset = require('../services/factoryResetService');
const { authenticateAdmin, requireDirector, denyTemporaryAccess, checkActiveStatus } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const CODE_MINUTES = 10, MAX_ATTEMPTS = 5;
const CONFIRMATION_TEXT = 'SUPPRIMER TOUTES LES DONNEES';
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
const hashCode = (id, code) => crypto.createHmac('sha256', JWT_SECRET).update(`reset:${id}:${code}`).digest('hex');
const ip = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';

async function event(type, req, details, meta) {
    try {
        await SecurityEvent.create({ type, adminId: req.adminId, adminName: req.admin?.username || '', adminRole: req.admin?.role || '',
            accountLogin: req.admin?.username || '', ipAddress: ip(req), userAgent: req.headers['user-agent'] || '', details, meta: meta || null });
    } catch (e) { console.error('Security event not recorded:', e.message); }
}

// Every route: signed-in, active, Director, not temporary access
const guard = [authenticateAdmin, checkActiveStatus, async (req, res, next) => {
    if (req.admin?.role !== 'super_admin') await event('factory_reset_denied', req, `Refused for role ${req.admin?.role} on ${req.method} ${req.originalUrl}`);
    next();
}, requireDirector, denyTemporaryAccess];

// 1. What will be deleted
router.get('/preview', guard, async (req, res) => {
    try {
        const inv = await reset.inventory();
        res.json({ success: true, ...inv, confirmationText: CONFIRMATION_TEXT, backupMaxAgeMinutes: reset.BACKUP_MAX_AGE_MINUTES,
            cloudConfigured: !!(process.env.MEGA_EMAIL && process.env.MEGA_PASSWORD) });
    } catch (e) { console.error('Reset preview error:', e.message); res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Server error' }); }
});

// 2. Verified backup
router.post('/backup', guard, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        const b = await reset.createVerifiedBackup(admin);
        await event('factory_reset_backup', req, b.verified ? 'Backup created and verified' : 'Backup verification FAILED', { backupId: b.id, counts: b.counts, sha256: b.sha256, problems: b.problems });
        res.status(b.verified ? 200 : 500).json({ success: b.verified, backup: b, code: b.verified ? 'BACKUP_OK' : 'BACKUP_NOT_VERIFIED', message: b.verified ? 'Backup created and verified.' : 'The backup could not be verified. The reset is not possible.' });
    } catch (e) { console.error('Reset backup error:', e.message); res.status(500).json({ success: false, code: 'BACKUP_FAILED', message: 'The backup could not be created. The reset is not possible.' }); }
});

// Download the backup file (keep a copy outside the server)
router.get('/backup/:id/download', guard, async (req, res) => {
    try {
        const f = await reset.getBackup(req.params.id);
        if (!f) return res.status(404).json({ success: false, code: 'BACKUP_NOT_FOUND', message: 'Backup not found' });
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="${f.filename}"`);
        reset.openBackupStream(f._id).pipe(res);
    } catch (e) { res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Server error' }); }
});

// 3. Identity check: password, then email code when 2FA is enabled
router.post('/verify-identity', guard, async (req, res) => {
    try {
        const { password, backupId } = req.body || {};
        const admin = await Admin.findById(req.adminId);
        if (!password || !(await admin.comparePassword(String(password)))) {
            await event('factory_reset_denied', req, 'Wrong password at the identity check');
            return res.status(401).json({ success: false, code: 'WRONG_PASSWORD', message: 'Incorrect password.' });
        }
        const b = await reset.getBackup(backupId);
        if (!b || !b.metadata?.verified || b.metadata.createdBy !== String(admin._id)) return res.status(400).json({ success: false, code: 'BACKUP_FIRST', message: 'Create and verify a backup first (step 2).' });
        const twoFA = !!(admin.twoFactorEnabled && admin.twoFactorEmail);
        let rid = null;
        if (twoFA) {
            await AccountRecovery.updateMany({ adminId: admin._id, purpose: 'factory_reset', usedAt: null, invalidatedAt: null }, { invalidatedAt: new Date() });
            const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
            const rec = await AccountRecovery.create({ adminId: admin._id, purpose: 'factory_reset', codeHash: hashCode(admin._id, code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60000), ipAddress: ip(req) });
            emailService.initialize();
            try { await emailService.sendAccountCode(admin.twoFactorEmail, code, admin.username, 'factory_reset', CODE_MINUTES); }
            catch { await AccountRecovery.updateOne({ _id: rec._id }, { invalidatedAt: new Date() }); return res.status(503).json({ success: false, code: 'RESET_EMAIL_FAILED', message: 'The confirmation email could not be sent. The reset is not possible now.' }); }
            rid = rec._id;
            await event('factory_reset_code_sent', req, 'Factory reset confirmation code sent to the 2FA email');
        }
        const ticket = jwt.sign({ purpose: 'factory_reset', id: admin._id, backupId: String(b._id), rid }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ success: true, ticket, codeRequired: twoFA, warningCode: twoFA ? null : 'NO_2FA', warning: twoFA ? null : 'Two-factor authentication is not enabled on your account: only your password protects this action. Enabling 2FA is strongly recommended.' });
    } catch (e) { console.error('Reset identity error:', e.message); res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Server error' }); }
});

// 4. Execute
router.post('/execute', guard, async (req, res) => {
    try {
        const { ticket, code, confirmationText, includeCloudFiles } = req.body || {};
        let t;
        try { t = jwt.verify(String(ticket || ''), JWT_SECRET); } catch { return res.status(401).json({ success: false, code: 'TICKET_EXPIRED', message: 'The confirmation has expired. Start again from step 3.' }); }
        if (t.purpose !== 'factory_reset' || String(t.id) !== String(req.adminId)) return res.status(401).json({ success: false, code: 'TICKET_INVALID', message: 'Invalid confirmation.' });

        if (norm(confirmationText) !== CONFIRMATION_TEXT) return res.status(400).json({ success: false, code: 'WRONG_PHRASE', message: `Type exactly: ${CONFIRMATION_TEXT}` });

        const b = await reset.getBackup(t.backupId);
        const ageMin = b ? (Date.now() - new Date(b.uploadDate).getTime()) / 60000 : Infinity;
        if (!b || !b.metadata?.verified || b.metadata.createdBy !== String(req.adminId)) return res.status(400).json({ success: false, code: 'NO_BACKUP', message: 'No verified backup. Start again from step 2.' });
        if (ageMin > reset.BACKUP_MAX_AGE_MINUTES) return res.status(400).json({ success: false, code: 'BACKUP_TOO_OLD', minutes: reset.BACKUP_MAX_AGE_MINUTES, message: `The backup is older than ${reset.BACKUP_MAX_AGE_MINUTES} minutes. Create a new backup (step 2).` });

        if (t.rid) {
            const rec = await AccountRecovery.findById(t.rid);
            if (!rec || rec.purpose !== 'factory_reset' || rec.usedAt || rec.invalidatedAt || rec.expiresAt <= new Date() || rec.attempts >= MAX_ATTEMPTS)
                return res.status(401).json({ success: false, code: 'RESET_CODE_EXPIRED', message: 'The email code has expired or was already used. Start again from step 3.' });
            const clean = String(code || '').replace(/\s/g, '');
            const ok = /^\d{6}$/.test(clean) && crypto.timingSafeEqual(Buffer.from(hashCode(req.adminId, clean), 'hex'), Buffer.from(rec.codeHash, 'hex'));
            if (!ok) {
                const u = await AccountRecovery.findOneAndUpdate({ _id: rec._id }, { $inc: { attempts: 1 } }, { new: true });
                if (u.attempts >= MAX_ATTEMPTS) await AccountRecovery.updateOne({ _id: rec._id }, { invalidatedAt: new Date() });
                await event('factory_reset_denied', req, 'Wrong email code at the final step');
                return res.status(401).json({ success: false, code: 'WRONG_CODE', attemptsLeft: Math.max(0, MAX_ATTEMPTS - u.attempts), message: `Wrong code. ${Math.max(0, MAX_ATTEMPTS - u.attempts)} attempt(s) left.` });
            }
            const used = await AccountRecovery.findOneAndUpdate({ _id: rec._id, usedAt: null, invalidatedAt: null }, { usedAt: new Date() });
            if (!used) return res.status(401).json({ success: false, code: 'RESET_CODE_EXPIRED', message: 'The email code was already used.' });
        }

        console.log('FACTORY RESET started by the Director account', String(req.adminId));
        const results = await reset.execute({ includeCloudFiles: !!includeCloudFiles, megaService });
        await event('factory_reset_completed', req, 'Factory reset executed', { backupId: String(b._id), includeCloudFiles: !!includeCloudFiles, results });
        res.json({ success: true, message: 'Factory reset completed.', backupId: String(b._id), backupFile: b.filename, results });
    } catch (e) { console.error('Factory reset error:', e.message); res.status(500).json({ success: false, code: 'RESET_FAILED', message: 'Factory reset failed' }); }
});

module.exports = router;
