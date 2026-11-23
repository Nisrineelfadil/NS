// Account recovery (temporary access by email code), security status, director security alerts.
// Mounted at /api/account-security (server.js).
//
// Rules (see 08-Critical-Fixes/README in the project documentation):
//  - The permanent password is never changed, reset, revealed or emailed by the recovery flow.
//  - The code goes only to the recovery email registered in the account's 2FA settings.
//  - Codes are stored as an HMAC, expire, are single-use, limited in attempts and resends, never logged.
//  - Temporary access has the same role as the account (never more), is refused for sensitive actions
//    (password, 2FA settings, factory reset) and expires after TEMP_ACCESS_HOURS.
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const LoginSession = require('../models/LoginSession');
const SecurityEvent = require('../models/SecurityEvent');
const AccountRecovery = require('../models/AccountRecovery');
const emailService = require('../services/emailService');
const { logActivity, detectPlatform } = require('../middleware/activityLogger');
const { authenticateAdmin, requireDirector } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
const SETTINGS = {
    CODE_MINUTES: num(process.env.RECOVERY_CODE_MINUTES, 10),          // code validity
    MAX_ATTEMPTS: num(process.env.RECOVERY_MAX_ATTEMPTS, 5),           // wrong codes before the code is cancelled
    RESEND_WAIT_SECONDS: num(process.env.RECOVERY_RESEND_WAIT_SECONDS, 60), // minimum wait between two codes
    MAX_CODES_PER_15_MIN: num(process.env.RECOVERY_MAX_CODES_15MIN, 3),
    MAX_EMAIL_MISMATCH_PER_HOUR: num(process.env.RECOVERY_MAX_MISMATCH_HOUR, 5),
    MAX_REQUESTS_PER_IP_15_MIN: num(process.env.RECOVERY_MAX_IP_15MIN, 20),
    TEMP_ACCESS_HOURS: num(process.env.TEMP_ACCESS_HOURS, 4),           // temporary access duration
    REPEAT_THRESHOLD: num(process.env.TEMP_ACCESS_REPEAT_THRESHOLD, 3), // temporary logins …
    REPEAT_WINDOW_DAYS: num(process.env.TEMP_ACCESS_REPEAT_DAYS, 30)    // … within this many days = repeated use
};

const MSG = {
    NO_RECOVERY_EMAIL: 'No recovery email is registered for this account. Please contact the Director.',
    TEMPORARY_ACCESS: 'You are using temporary access. Your permanent password has not changed. Please contact the Director to obtain your normal password.'
};

function clientIp(req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || req.ip || 'unknown';
}
function maskEmail(email) {
    const [u, d] = String(email).split('@');
    if (!u || !d) return '';
    return (u.length <= 2 ? u[0] + '*' : u[0] + '****' + u.slice(-1)) + '@' + d;
}
function hashCode(adminId, code) {
    return crypto.createHmac('sha256', JWT_SECRET).update(`${adminId}:${code}`).digest('hex');
}
function sameHash(a, b) {
    const x = Buffer.from(String(a), 'hex'), y = Buffer.from(String(b), 'hex');
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function parseUA(ua = '') {
    return {
        browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown',
        os: ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'Unknown',
        device: ua.includes('Mobile') ? 'Mobile' : 'Desktop'
    };
}
async function record(type, admin, req, extra = {}) {
    try {
        return await SecurityEvent.create({
            type,
            adminId: admin?._id,
            adminName: admin?.username || '',
            adminRole: admin?.role || '',
            accountLogin: admin ? (admin.role === 'employee' ? admin.email : admin.username) : (extra.accountLogin || ''),
            ipAddress: req ? clientIp(req) : '',
            userAgent: req ? (req.headers['user-agent'] || '') : '',
            ...extra
        });
    } catch (e) {
        console.error('Security event not recorded:', e.message);
        return null;
    }
}
const fail = (res, status, code, message, extra = {}) => res.status(status).json({ success: false, code, message, ...extra });

async function findAccount(login) {
    const value = String(login || '').trim();
    if (!value) return null;
    if (value.includes('@')) return Admin.findOne({ email: value.toLowerCase() });
    return Admin.findOne({ username: value });
}

// ---------------------------------------------------------------------------------------------------------
// POST /api/account-security/recovery/request  { login, email }
// ---------------------------------------------------------------------------------------------------------
router.post('/recovery/request', async (req, res) => {
    try {
        const { login, email } = req.body || {};
        if (!login || !email) return fail(res, 400, 'MISSING_FIELDS', 'Please enter your username (or login email) and your recovery email.');

        const ip = clientIp(req);
        const since15 = new Date(Date.now() - 15 * 60 * 1000);
        const ipCount = await SecurityEvent.countDocuments({ ipAddress: ip, createdAt: { $gte: since15 }, type: { $in: ['recovery_code_sent', 'recovery_email_mismatch', 'recovery_no_email', 'recovery_code_failed'] } });
        if (ipCount >= SETTINGS.MAX_REQUESTS_PER_IP_15_MIN) return fail(res, 429, 'TOO_MANY_REQUESTS', 'Too many attempts. Please wait 15 minutes and try again.');

        const admin = await findAccount(login);
        if (!admin) return fail(res, 404, 'ACCOUNT_NOT_FOUND', 'No account matches this username or login email.');
        if (!admin.isActive) return fail(res, 403, 'ACCOUNT_DISABLED', 'This account is deactivated. Please contact the Director.');

        const since1h = new Date(Date.now() - 60 * 60 * 1000);
        const mismatches = await SecurityEvent.countDocuments({ adminId: admin._id, type: 'recovery_email_mismatch', createdAt: { $gte: since1h } });
        if (mismatches >= SETTINGS.MAX_EMAIL_MISMATCH_PER_HOUR) return fail(res, 429, 'TOO_MANY_REQUESTS', 'Too many attempts for this account. Please wait one hour or contact the Director.');

        if (!admin.twoFactorEmail) {
            await record('recovery_no_email', admin, req, { details: 'Recovery requested; no recovery email registered' });
            return fail(res, 400, 'NO_RECOVERY_EMAIL', MSG.NO_RECOVERY_EMAIL);
        }
        if (String(email).trim().toLowerCase() !== admin.twoFactorEmail.trim().toLowerCase()) {
            await record('recovery_email_mismatch', admin, req, { details: 'Email typed does not match the recovery email' });
            return fail(res, 400, 'EMAIL_MISMATCH', 'This email address is not the recovery email registered for this account.');
        }

        const last = await AccountRecovery.findOne({ adminId: admin._id, purpose: 'temporary_access' }).sort({ createdAt: -1 });
        if (last && Date.now() - last.createdAt.getTime() < SETTINGS.RESEND_WAIT_SECONDS * 1000) {
            const wait = Math.ceil((SETTINGS.RESEND_WAIT_SECONDS * 1000 - (Date.now() - last.createdAt.getTime())) / 1000);
            return fail(res, 429, 'WAIT_BEFORE_RESEND', `Please wait ${wait} seconds before asking for a new code.`, { waitSeconds: wait });
        }
        const recent = await AccountRecovery.countDocuments({ adminId: admin._id, purpose: 'temporary_access', createdAt: { $gte: since15 } });
        if (recent >= SETTINGS.MAX_CODES_PER_15_MIN) return fail(res, 429, 'TOO_MANY_CODES', 'Too many codes requested. Please wait 15 minutes and try again.');

        // Only the newest code can be used
        await AccountRecovery.updateMany({ adminId: admin._id, purpose: 'temporary_access', usedAt: null, invalidatedAt: null }, { invalidatedAt: new Date() });

        const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        const rec = await AccountRecovery.create({
            adminId: admin._id, purpose: 'temporary_access', codeHash: hashCode(admin._id, code),
            expiresAt: new Date(Date.now() + SETTINGS.CODE_MINUTES * 60 * 1000), ipAddress: ip
        });

        emailService.initialize();
        try {
            await emailService.sendAccountCode(admin.twoFactorEmail, code, admin.username, 'temporary_access', SETTINGS.CODE_MINUTES);
        } catch (e) {
            await AccountRecovery.updateOne({ _id: rec._id }, { invalidatedAt: new Date() });
            console.error('Recovery email could not be sent for account', String(admin._id));
            return fail(res, 503, 'EMAIL_FAILED', 'The email could not be sent. Please try again later or contact the Director.');
        }
        await record('recovery_code_sent', admin, req, { details: 'Recovery code sent to the recovery email' });

        const recoveryToken = jwt.sign({ purpose: 'account_recovery', id: admin._id, rid: rec._id }, JWT_SECRET, { expiresIn: `${SETTINGS.CODE_MINUTES + 5}m` });
        res.json({ success: true, recoveryToken, maskedEmail: maskEmail(admin.twoFactorEmail), expiresInMinutes: SETTINGS.CODE_MINUTES, resendWaitSeconds: SETTINGS.RESEND_WAIT_SECONDS });
    } catch (error) {
        console.error('Recovery request error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ---------------------------------------------------------------------------------------------------------
// POST /api/account-security/recovery/verify  { recoveryToken, code }  → temporary access token
// ---------------------------------------------------------------------------------------------------------
router.post('/recovery/verify', async (req, res) => {
    try {
        const { recoveryToken, code } = req.body || {};
        if (!recoveryToken || !code) return fail(res, 400, 'MISSING_FIELDS', 'Please enter the code you received by email.');
        let decoded;
        try { decoded = jwt.verify(recoveryToken, JWT_SECRET); } catch { return fail(res, 401, 'CODE_EXPIRED', 'This code has expired. Please ask for a new code.'); }
        if (decoded.purpose !== 'account_recovery') return fail(res, 401, 'INVALID', 'Invalid request.');

        const rec = await AccountRecovery.findById(decoded.rid);
        if (!rec || String(rec.adminId) !== String(decoded.id)) return fail(res, 401, 'INVALID', 'Invalid request.');
        if (rec.usedAt) return fail(res, 401, 'CODE_USED', 'This code has already been used. Please ask for a new code.');
        if (rec.attempts >= SETTINGS.MAX_ATTEMPTS) return fail(res, 401, 'TOO_MANY_ATTEMPTS', 'Too many wrong codes. Please ask for a new code.');
        if (rec.invalidatedAt) return fail(res, 401, 'CODE_REPLACED', 'This code is no longer valid. Use the most recent code, or ask for a new one.');
        if (rec.expiresAt <= new Date()) return fail(res, 401, 'CODE_EXPIRED', 'This code has expired. Please ask for a new code.');

        const admin = await Admin.findById(rec.adminId);
        if (!admin || !admin.isActive) return fail(res, 403, 'ACCOUNT_DISABLED', 'This account is deactivated. Please contact the Director.');

        const clean = String(code).replace(/\s/g, '');
        if (!/^\d{6}$/.test(clean) || !sameHash(hashCode(admin._id, clean), rec.codeHash)) {
            const upd = await AccountRecovery.findOneAndUpdate({ _id: rec._id }, { $inc: { attempts: 1 } }, { new: true });
            if (upd.attempts >= SETTINGS.MAX_ATTEMPTS) await AccountRecovery.updateOne({ _id: rec._id }, { invalidatedAt: new Date() });
            await record('recovery_code_failed', admin, req, { details: `Wrong recovery code (attempt ${upd.attempts}/${SETTINGS.MAX_ATTEMPTS})` });
            const left = Math.max(0, SETTINGS.MAX_ATTEMPTS - upd.attempts);
            return fail(res, 401, left ? 'WRONG_CODE' : 'TOO_MANY_ATTEMPTS', left ? `Wrong code. ${left} attempt(s) left.` : 'Too many wrong codes. Please ask for a new code.', { attemptsLeft: left });
        }

        // Consume the code atomically (a second request with the same code fails here)
        const consumed = await AccountRecovery.findOneAndUpdate({ _id: rec._id, usedAt: null, invalidatedAt: null }, { usedAt: new Date() }, { new: true });
        if (!consumed) return fail(res, 401, 'CODE_USED', 'This code has already been used. Please ask for a new code.');

        const ua = req.headers['user-agent'] || 'Unknown';
        const expiresAt = new Date(Date.now() + SETTINGS.TEMP_ACCESS_HOURS * 3600 * 1000);
        const session = await LoginSession.create({
            adminId: admin._id, adminName: admin.username, adminRole: admin.role, ipAddress: clientIp(req), userAgent: ua,
            ...parseUA(ua), platform: detectPlatform(ua), loginMethod: 'temporary_access', expiresAt
        });
        const token = jwt.sign({ id: admin._id, username: admin.username, role: admin.role, tmp: true, sid: session._id }, JWT_SECRET, { expiresIn: `${SETTINGS.TEMP_ACCESS_HOURS}h` });

        await logActivity({ adminId: admin._id, adminUsername: admin.username, action: 'login', targetType: 'system', details: 'Temporary access (email recovery code) — permanent password not used and not changed', req });

        // Director alert for this temporary login
        const loginsWindow = await SecurityEvent.find({ adminId: admin._id, type: 'temporary_access', createdAt: { $gte: new Date(Date.now() - SETTINGS.REPEAT_WINDOW_DAYS * 86400000) } }).sort({ createdAt: 1 }).select('createdAt').lean();
        const dates = [...loginsWindow.map(e => e.createdAt), new Date()];
        await record('temporary_access', admin, req, {
            details: 'Temporary access used instead of the permanent password',
            alertForDirector: true,
            meta: { sessionId: session._id, expiresAt, countInWindow: dates.length, windowDays: SETTINGS.REPEAT_WINDOW_DAYS }
        });
        let repeated = false;
        if (admin.role === 'employee' && dates.length >= SETTINGS.REPEAT_THRESHOLD) {
            repeated = true;
            await record('temporary_access_repeated', admin, req, {
                details: `Temporary access used ${dates.length} times in ${SETTINGS.REPEAT_WINDOW_DAYS} days`,
                alertForDirector: true,
                meta: { count: dates.length, dates, threshold: SETTINGS.REPEAT_THRESHOLD, windowDays: SETTINGS.REPEAT_WINDOW_DAYS }
            });
        }

        res.json({
            success: true,
            token,
            admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role },
            temporaryAccess: { expiresAt, hours: SETTINGS.TEMP_ACCESS_HOURS, message: MSG.TEMPORARY_ACCESS, countInWindow: dates.length, repeated }
        });
    } catch (error) {
        console.error('Recovery verify error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ---------------------------------------------------------------------------------------------------------
// GET /api/account-security/me  → banners shown on the dashboard (2FA reminder, temporary access, repeated use)
// ---------------------------------------------------------------------------------------------------------
router.get('/me', authenticateAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        const since = new Date(Date.now() - SETTINGS.REPEAT_WINDOW_DAYS * 86400000);
        const temps = await SecurityEvent.find({ adminId: admin._id, type: 'temporary_access', createdAt: { $gte: since } }).sort({ createdAt: -1 }).select('createdAt').lean();
        res.json({
            success: true,
            role: admin.role,
            twoFactorEnabled: !!(admin.twoFactorEnabled && admin.twoFactorEmail),
            temporaryAccess: req.isTemporaryAccess ? { active: true, expiresAt: req.temporarySession.expiresAt, message: MSG.TEMPORARY_ACCESS } : { active: false },
            temporaryLogins: { count: temps.length, dates: temps.map(t => t.createdAt), windowDays: SETTINGS.REPEAT_WINDOW_DAYS, threshold: SETTINGS.REPEAT_THRESHOLD },
            repeatedWarning: admin.role === 'employee' && temps.length >= SETTINGS.REPEAT_THRESHOLD,
            canSetNewPassword: req.isTemporaryAccess && (admin.role === 'super_admin' || admin.role === 'dev')
        });
    } catch (error) {
        console.error('Security status error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ---------------------------------------------------------------------------------------------------------
// POST /api/account-security/recovery/set-password  { newPassword }
// Director and developer only, during temporary access: they own their password and may choose a new one.
// Secretaries cannot (their permanent password stays under the Director's control).
// ---------------------------------------------------------------------------------------------------------
router.post('/recovery/set-password', authenticateAdmin, async (req, res) => {
    try {
        if (!req.isTemporaryAccess) return fail(res, 403, 'NOT_TEMPORARY', 'Use Settings → Change password with your current password.');
        const admin = await Admin.findById(req.adminId);
        if (!admin || (admin.role !== 'super_admin' && admin.role !== 'dev')) return fail(res, 403, 'FORBIDDEN', 'Only the Director can give you a new password.');
        const { newPassword } = req.body || {};
        if (!newPassword || String(newPassword).length < 8) return fail(res, 400, 'WEAK_PASSWORD', 'The new password must have at least 8 characters.');
        admin.password = String(newPassword);
        await admin.save();
        await LoginSession.updateOne({ _id: req.temporarySession._id }, { isActive: false, logoutTime: new Date() });
        // Developer password changes are recorded in the security history only (no Director alert).
        await record('password_changed', admin, req, { details: 'Permanent password changed by the account owner after email verification (temporary access)', alertForDirector: false });
        res.json({ success: true, message: 'Your new password is saved. Please log in again with it.' });
    } catch (error) {
        console.error('Set password error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/account-security/logout  → closes a temporary access session immediately
router.post('/logout', authenticateAdmin, async (req, res) => {
    try {
        if (req.isTemporaryAccess) await LoginSession.updateOne({ _id: req.temporarySession._id }, { isActive: false, logoutTime: new Date() });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ---------------------------------------------------------------------------------------------------------
// Director security alerts (Director only — not the developer, not secretaries). Alerts cannot be deleted.
// ---------------------------------------------------------------------------------------------------------
router.get('/alerts', authenticateAdmin, requireDirector, async (req, res) => {
    try {
        const unseen = await SecurityEvent.find({ alertForDirector: true, seenByDirector: false }).sort({ createdAt: -1 }).limit(100).lean();
        const history = await SecurityEvent.find({ alertForDirector: true }).sort({ createdAt: -1 }).limit(200).lean();
        const since = new Date(Date.now() - SETTINGS.REPEAT_WINDOW_DAYS * 86400000);
        const perAccount = await SecurityEvent.aggregate([
            { $match: { type: 'temporary_access', createdAt: { $gte: since } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$adminId', adminName: { $first: '$adminName' }, adminRole: { $first: '$adminRole' }, accountLogin: { $first: '$accountLogin' }, count: { $sum: 1 }, dates: { $push: '$createdAt' } } },
            { $sort: { count: -1 } }
        ]);
        const strip = e => ({ id: e._id, type: e.type, adminName: e.adminName, adminRole: e.adminRole, accountLogin: e.accountLogin, createdAt: e.createdAt, details: e.details, ipAddress: e.ipAddress, meta: e.meta, seen: e.seenByDirector });
        res.json({
            success: true,
            settings: { threshold: SETTINGS.REPEAT_THRESHOLD, windowDays: SETTINGS.REPEAT_WINDOW_DAYS, temporaryAccessHours: SETTINGS.TEMP_ACCESS_HOURS },
            unseenCount: unseen.length,
            unseen: unseen.map(strip),
            history: history.map(strip),
            temporaryLoginsByAccount: perAccount.map(a => ({ adminName: a.adminName, adminRole: a.adminRole, accountLogin: a.accountLogin, count: a.count, dates: a.dates, repeated: a.adminRole === 'employee' && a.count >= SETTINGS.REPEAT_THRESHOLD }))
        });
    } catch (error) {
        console.error('Security alerts error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/alerts/:id/seen', authenticateAdmin, requireDirector, async (req, res) => {
    try {
        await SecurityEvent.updateOne({ _id: req.params.id, alertForDirector: true }, { seenByDirector: true, seenAt: new Date() });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid alert' });
    }
});

router.post('/alerts/seen-all', authenticateAdmin, requireDirector, async (req, res) => {
    try {
        await SecurityEvent.updateMany({ alertForDirector: true, seenByDirector: false }, { seenByDirector: true, seenAt: new Date() });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.SETTINGS = SETTINGS;
router.recordSecurityEvent = record;
module.exports = router;
