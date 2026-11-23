// SEC-07 — shared rules for attendance corrections (routes/attendance.js and routes/studentManagement.js).
// Secretaries correct attendance of the ACTIVE season; the Director (and the developer) can correct any season.
const Season = require('../models/Season');
const Group = require('../models/Group');

const isDirector = req => ['super_admin', 'dev'].includes(req.admin && req.admin.role);

async function activeSeasonGroupIds() {
    const s = await Season.findOne({ status: 'active' }).select('_id');
    if (!s) return new Set();
    return new Set((await Group.find({ season: s._id }).select('_id')).map(g => String(g._id)));
}

// Date shown in the school's time zone: attendance dates are stored at local midnight (23:00 UTC the day before),
// so a UTC date would name the previous day.
const schoolDay = d => new Date(d).toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' }); // YYYY-MM-DD
const recordLabel = r => `${r.studentName || 'student'} — ${r.groupName || ''} — ${r.date ? schoolDay(r.date) : ''}`;

module.exports = { isDirector, activeSeasonGroupIds, schoolDay, recordLabel };
