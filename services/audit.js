// ACT-01 — record an activity in the permanent history (models/AuditEvent.js).
//   audit(req, { action, module, target: { type, id, label }, before, after, reason, details })
// Never throws: a failure to record must not break the school's work (it is logged to the console instead).
// Secrets and identity numbers are never stored: passwords, codes, tokens and CIN fields are removed.
const AuditEvent = require('../models/AuditEvent');

const SECRET_KEYS = /pass(word)?|token|secret|code|otp|twoFactor|cin|emailPassword|plainText/i;

function clean(value, depth = 0) {
    if (value === null || value === undefined) return value;
    if (depth > 4) return '[…]';
    if (value instanceof Date) return value;
    if (Array.isArray(value)) return value.slice(0, 50).map(v => clean(v, depth + 1));
    if (typeof value === 'object') {
        if (value._bsontype === 'ObjectId' || value._bsontype === 'ObjectID') return String(value);
        const out = {};
        for (const [k, v] of Object.entries(typeof value.toObject === 'function' ? value.toObject() : value)) {
            if (SECRET_KEYS.test(k) || k === '__v') continue;
            if (typeof v === 'string' && v.startsWith('data:')) { out[k] = '[image]'; continue; }
            out[k] = clean(v, depth + 1);
        }
        return out;
    }
    if (typeof value === 'string' && value.length > 500) return value.slice(0, 500) + '…';
    return value;
}

function actorFromReq(req) {
    if (!req) return { id: null, name: 'system', role: 'system' };
    if (req.admin) return { id: String(req.admin.id), name: req.admin.username, role: req.admin.role, temporaryAccess: !!req.isTemporaryAccess };
    if (req.teacher) return { id: String(req.teacher._id || req.teacher.id), name: req.teacher.fullName || req.teacher.name || req.teacher.email || 'teacher', role: 'teacher' };
    if (req.student) return { id: String(req.student._id || req.student.id), name: req.student.fullName || req.student.name || 'student', role: 'student' };
    if (req.user && req.user.role) return { id: String(req.user.id || ''), name: req.user.username || req.user.fullName || req.user.email || '', role: req.user.role };
    return { id: null, name: 'public', role: 'public' };
}

// Only the fields that really changed (for "before → after")
function changes(beforeObj, afterObj, fields) {
    const b = {}, a = {};
    for (const f of fields) {
        const bv = beforeObj ? beforeObj[f] : undefined, av = afterObj ? afterObj[f] : undefined;
        const same = JSON.stringify(bv === undefined ? null : bv) === JSON.stringify(av === undefined ? null : av);
        if (!same) { b[f] = bv === undefined ? null : bv; a[f] = av === undefined ? null : av; }
    }
    return { before: clean(b), after: clean(a), changed: Object.keys(a) };
}

async function audit(req, { action, module, target = {}, before = null, after = null, reason = '', details = '', actor = null } = {}) {
    try {
        const ip = req ? ((req.headers && (req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.ip || '') : '';
        await AuditEvent.create({
            actor: actor || actorFromReq(req),
            action, module,
            target: { type: target.type || '', id: target.id ? String(target.id) : null, label: target.label ? String(target.label).slice(0, 200) : '' },
            before: clean(before), after: clean(after),
            reason: reason ? String(reason).slice(0, 500) : '',
            details: details ? String(details).slice(0, 1000) : '',
            ipAddress: ip
        });
    } catch (e) {
        console.error('Activity history not recorded:', action, e.message);
    }
}

module.exports = { audit, changes, clean, actorFromReq };
