// CFG-01 — attendance automation (same rule as services/attendanceService.js, split into PLAN and APPLY).
// A QR session still 'active' after its QR expiry time is closed ('expired'); every student of that session who
// never scanned (status pending/absent, no scan time) is marked absent automatically.
// Records already corrected to present/late are never touched; a closed session is never processed again.
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

async function planExpiredSessions(now = new Date()) {
    const sessions = await AttendanceSession.find({ status: 'active', qrExpiresAt: { $lt: now } })
        .select('sessionId groupName formation date qrExpiresAt').lean();
    const plans = [];
    for (const s of sessions) {
        const toMark = await AttendanceRecord.countDocuments({ sessionId: s.sessionId, status: { $in: ['pending', 'absent'] }, scanTime: null });
        const pending = await AttendanceRecord.countDocuments({ sessionId: s.sessionId, status: 'pending', scanTime: null });
        plans.push({ sessionId: s.sessionId, group: s.groupName, formation: s.formation, date: s.date, expiredAt: s.qrExpiresAt, recordsMarkedAbsent: toMark, pendingBecomingAbsent: pending });
    }
    return plans;
}

async function applyExpiredSessions(plans) {
    const done = { sessionsClosed: 0, recordsMarkedAbsent: 0, errors: [] };
    for (const p of plans) {
        try {
            // still active? (a session closed by another run is skipped)
            if (!(await AttendanceSession.exists({ sessionId: p.sessionId, status: 'active' }))) continue;
            // mark absences first (repeating this is harmless), then close the session: if anything fails in
            // between, the session stays active and is completed by the next run
            const r = await AttendanceRecord.updateMany(
                { sessionId: p.sessionId, status: { $in: ['pending', 'absent'] }, scanTime: null },
                { $set: { status: 'absent', markedAbsentAutomatically: true } }
            );
            const s = await AttendanceSession.updateOne({ sessionId: p.sessionId, status: 'active' }, { $set: { status: 'expired' } });
            if (s.modifiedCount) done.sessionsClosed++;
            done.recordsMarkedAbsent += r.modifiedCount;
        } catch (e) { done.errors.push(`${p.sessionId}: ${e.message}`); }
    }
    return done;
}

module.exports = { planExpiredSessions, applyExpiredSessions };
