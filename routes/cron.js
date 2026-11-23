// CFG-01 — scheduled jobs for serverless hosting. Mounted at /api/cron (server.js).
//
//  GET /api/cron/daily    → called by Vercel Cron once a day (vercel.json "crons"). Vercel sends
//                           "Authorization: Bearer <CRON_SECRET>". Without CRON_SECRET configured, refused.
//                           Runs in the mode given by JOBS_MODE ('preview' until the Director approves).
//  GET /api/cron/preview  → Director / developer: what the jobs WOULD change now (nothing is written).
//  GET /api/cron/runs     → Director / developer: the last recorded runs.
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const JobRun = require('../models/JobRun');
const payments = require('../services/paymentJobs');
const attendance = require('../services/attendanceJobs');
const { runDaily, currentMode } = require('../services/jobRunner');
const { authenticateAdmin, requireSuperAdmin, checkActiveStatus } = require('../middleware/authMiddleware');

function cronAuthorized(req) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return null; // not configured
    const got = String(req.headers.authorization || '');
    const want = `Bearer ${secret}`;
    return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

router.get('/daily', async (req, res) => {
    const ok = cronAuthorized(req);
    if (ok === null) return res.status(503).json({ success: false, message: 'CRON_SECRET is not configured: scheduled jobs are disabled.' });
    if (!ok) return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const result = await runDaily({ trigger: 'cron' });
        if (result.skipped) return res.status(409).json({ success: false, message: result.reason });
        res.json({ success: result.errors.length === 0, mode: result.mode, runId: result.runId,
            payments: result.payments && { planned: result.payments.planned, applied: result.payments.applied },
            attendance: result.attendance && { planned: result.attendance.planned, applied: result.attendance.applied } });
    } catch (e) {
        console.error('Cron daily error:', e.message);
        res.status(500).json({ success: false, message: 'Job failed' });
    }
});

// Report before any production recalculation: counts, current statuses, proposed statuses and dates.
router.get('/preview', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    try {
        const now = new Date();
        const p = await payments.planPayments(now);
        const a = await attendance.planExpiredSessions(now);
        res.json({
            success: true, generatedAt: now, mode: currentMode(),
            payments: { summary: payments.summarize(p), students: p },
            attendance: { sessions: a.length, recordsMarkedAbsent: a.reduce((n, x) => n + x.recordsMarkedAbsent, 0), list: a }
        });
    } catch (e) {
        console.error('Cron preview error:', e.message);
        res.status(500).json({ success: false, message: 'Preview failed' });
    }
});

router.get('/runs', authenticateAdmin, checkActiveStatus, requireSuperAdmin, async (req, res) => {
    const runs = await JobRun.find().sort({ startedAt: -1 }).limit(30).lean();
    res.json({ success: true, mode: currentMode(), runs });
});

module.exports = router;
