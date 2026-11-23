// ACT-01 — activity history, read-only. Mounted at /api/audit (server.js).
// Director (super_admin) and development team (dev) only. No route can modify or delete an entry.
const express = require('express');
const router = express.Router();
const AuditEvent = require('../models/AuditEvent');
const { authenticateAdmin, requireSuperAdmin, checkActiveStatus } = require('../middleware/authMiddleware');

const guard = [authenticateAdmin, checkActiveStatus, requireSuperAdmin];
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/audit?actor=&role=&module=&action=&from=&to=&q=&targetId=&page=&limit=
router.get('/', guard, async (req, res) => {
    try {
        const { actor, role, module, action, from, to, q, targetId } = req.query;
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const f = {};
        if (actor) f['actor.id'] = String(actor);
        if (role) f['actor.role'] = String(role);
        if (module) f.module = String(module);
        if (action) f.action = String(action).includes('.') ? String(action) : { $regex: '^' + esc(action) + '\\.' };
        if (targetId) f['target.id'] = String(targetId);
        if (from || to) { f.at = {}; if (from) f.at.$gte = new Date(from); if (to) { const t = new Date(to); if (/^\d{4}-\d{2}-\d{2}$/.test(to)) t.setHours(23, 59, 59, 999); f.at.$lte = t; } }
        if (q) { const rx = { $regex: esc(String(q).slice(0, 60)), $options: 'i' }; f.$or = [{ 'target.label': rx }, { 'actor.name': rx }, { reason: rx }, { details: rx }]; }
        const [events, total] = await Promise.all([
            AuditEvent.find(f).sort({ at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            AuditEvent.countDocuments(f)
        ]);
        res.json({ success: true, total, page, limit, events });
    } catch (e) {
        console.error('Audit list error:', e.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Accounts that appear in the history (for the "account" filter)
router.get('/actors', guard, async (req, res) => {
    try {
        const actors = await AuditEvent.aggregate([
            { $match: { 'actor.id': { $ne: null } } },
            { $group: { _id: '$actor.id', name: { $last: '$actor.name' }, role: { $last: '$actor.role' }, count: { $sum: 1 }, last: { $max: '$at' } } },
            { $sort: { name: 1 } }
        ]);
        res.json({ success: true, actors: actors.map(a => ({ id: a._id, name: a.name, role: a.role, count: a.count, last: a.last })) });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
