// CFG-01 — runs the automatic jobs (payments, then attendance) once, safely.
//  • mode 'preview': calculates and records what WOULD change, writes nothing to students/attendance.
//  • mode 'apply'  : applies the changes.
// Production (Vercel) uses JOBS_MODE: 'apply' only after the Director has reviewed a preview and approved it;
// anything else means 'preview'. Outside production the default is 'apply' (local test database).
// Only one run at a time (database lock); every run is recorded in the JobRun collection.
const mongoose = require('mongoose');
const JobRun = require('../models/JobRun');
const payments = require('./paymentJobs');
const attendance = require('./attendanceJobs');
const { isProductionRuntime } = require('../config/environment');

function currentMode() {
    if (process.env.JOBS_MODE === 'apply') return 'apply';
    if (process.env.JOBS_MODE === 'preview') return 'preview';
    return isProductionRuntime() ? 'preview' : 'apply';
}

async function withLock(name, minutes, fn) {
    const locks = mongoose.connection.db.collection('operationlocks');
    const id = `job:${name}`;
    await locks.deleteOne({ _id: id, at: { $lt: new Date(Date.now() - minutes * 60000) } });
    try { await locks.insertOne({ _id: id, at: new Date() }); } catch (e) { if (e.code === 11000) return { skipped: true, reason: 'another run is in progress' }; throw e; }
    try { return await fn(); } finally { await locks.deleteOne({ _id: id }).catch(() => {}); }
}

async function runDaily({ trigger = 'cron', mode = currentMode(), now = new Date(), include = ['payments', 'attendance'] } = {}) {
    return withLock('daily', 10, async () => {
        const run = await JobRun.create({ job: 'daily', trigger, mode, startedAt: new Date() });
        const out = { mode, payments: null, attendance: null, errors: [] };
        try {
            if (include.includes('payments')) {
                const plans = await payments.planPayments(now);
                out.payments = { planned: payments.summarize(plans) };
                if (mode === 'apply') { out.payments.applied = await payments.applyPayments(plans, now); out.errors.push(...out.payments.applied.errors); }
                out.payments.sample = plans.slice(0, 200);
            }
            if (include.includes('attendance')) {
                const plans = await attendance.planExpiredSessions(now);
                out.attendance = { planned: { sessions: plans.length, recordsMarkedAbsent: plans.reduce((n, p) => n + p.recordsMarkedAbsent, 0) } };
                if (mode === 'apply') { out.attendance.applied = await attendance.applyExpiredSessions(plans); out.errors.push(...out.attendance.applied.errors); }
                out.attendance.sample = plans.slice(0, 200);
            }
        } catch (e) {
            out.errors.push(e.message);
        }
        await JobRun.updateOne({ _id: run._id }, { $set: {
            finishedAt: new Date(), ok: out.errors.length === 0, errors: out.errors.slice(0, 50),
            summary: { payments: out.payments && { planned: out.payments.planned, applied: out.payments.applied && { ...out.payments.applied, errors: undefined } }, attendance: out.attendance && { planned: out.attendance.planned, applied: out.attendance.applied && { ...out.attendance.applied, errors: undefined } } },
            sample: { payments: out.payments ? out.payments.sample.slice(0, 50) : [], attendance: out.attendance ? out.attendance.sample.slice(0, 50) : [] }
        } });
        out.runId = String(run._id);
        return out;
    });
}

// Light, throttled attendance closing triggered by page loads (Vercel Hobby cron runs only once a day).
let lastPageRun = 0;
async function closeExpiredSessionsSoon() {
    if (currentMode() !== 'apply' || Date.now() - lastPageRun < 2 * 60000) return;
    lastPageRun = Date.now();
    try {
        if ((await attendance.planExpiredSessions(new Date())).length === 0) return; // nothing to close: no run recorded
        await runDaily({ trigger: 'page', include: ['attendance'] });
    } catch (e) { console.error('attendance auto-close:', e.message); }
}

module.exports = { runDaily, currentMode, closeExpiredSessionsSoon };
