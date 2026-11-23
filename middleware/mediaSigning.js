// SEC-05 — private media (student photos, CIN scans, receipts, certificates, registration photos).
//
// Files are stored in the database as paths like "/api/media/student-cin/<id>-front.jpg" and shown with
// <img src="…">, which cannot send a login token. Before this change the media route answered anyone.
//
// Now:
//  1. signMediaInResponses — when a SIGNED-IN user (staff, teacher or student) receives a JSON answer that
//     contains media paths, each path gets a short-lived signature: "/api/media/…?e=<expiry>&s=<signature>".
//     A user therefore only gets working links for files that appear in answers they are already allowed to
//     see (students: their own record; teachers: their own students' photos; staff: what staff pages show).
//  2. verifyMediaRequest — the media route serves a file only with a valid, unexpired signature
//     (or a signed-in staff token in the Authorization header).
//  3. stripSignedMediaParams — signatures are removed from incoming data, so a signed link sent back by a
//     form (e.g. when a student record is saved) is never stored in the database.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'your-secret-key-change-this';
const HOUR = 3600;
const MEDIA_RE = /"(\/api\/media\/[a-z-]+\/[^"?\\]+)(?:\?[^"\\]*)?"/g;

function sign(path, exp) {
    return crypto.createHmac('sha256', SECRET()).update(`media|${path}|${exp}`).digest('base64url').slice(0, 32);
}
// Expiry rounded to the hour (2–3 hours ahead) so the same link stays identical within an hour → browser caching works.
function currentExpiry() {
    return (Math.floor(Date.now() / 1000 / HOUR) + 3) * HOUR;
}
// A successful student/teacher LOGIN answer carries the person's own photo, which the portal keeps for the whole
// session (24 h): those links get the session's lifetime instead of 3 hours.
function loginExpiry() {
    return (Math.floor(Date.now() / 1000 / HOUR) + 25) * HOUR;
}
const MAX_AHEAD = 26 * HOUR;
function signedUrl(path, exp = currentExpiry()) {
    return `${path}?e=${exp}&s=${sign(path, exp)}`;
}

function isSignedIn(req) {
    return !!(req.adminId || req.teacher || req.student || req.user);
}

// The login answer itself (token + the person's own record) — the request is not signed in yet.
function isOwnLoginAnswer(body) {
    return !!(body && typeof body === 'object' && typeof body.token === 'string' && (body.student || body.teacher));
}

function signMediaInResponses(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        if (body === undefined) return originalJson(body);
        const loginAnswer = !isSignedIn(req) && isOwnLoginAnswer(body);
        if (!isSignedIn(req) && !loginAnswer) return originalJson(body);
        let text;
        try { text = JSON.stringify(body); } catch { return originalJson(body); }
        if (!text || text.indexOf('/api/media/') === -1) return originalJson(body);
        const exp = loginAnswer ? loginExpiry() : currentExpiry();
        const signed = text.replace(MEDIA_RE, (m, path) => JSON.stringify(signedUrl(path, exp)));
        if (!res.get('Content-Type')) res.set('Content-Type', 'application/json; charset=utf-8');
        return res.send(signed);
    };
    next();
}

function stripValue(v) {
    if (typeof v === 'string') return v.startsWith('/api/media/') && v.includes('?') ? v.slice(0, v.indexOf('?')) : v;
    if (Array.isArray(v)) return v.map(stripValue);
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = stripValue(v[k]); return v; }
    return v;
}
function stripSignedMediaParams(req, res, next) {
    if (req.body && typeof req.body === 'object') req.body = stripValue(req.body);
    next();
}

// For routes/media.js
function verifyMediaRequest(req) {
    const path = `/api/media/${req.params.folder}/${req.params.filename}`;
    const exp = parseInt(req.query.e, 10);
    const s = String(req.query.s || '');
    if (exp && s && exp * 1000 > Date.now() && exp - Date.now() / 1000 < MAX_AHEAD) {
        const good = sign(path, exp);
        if (s.length === good.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return { ok: true, maxAge: Math.max(60, Math.min(HOUR, exp - Math.floor(Date.now() / 1000))) };
    }
    // programmatic access by staff with the normal Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const d = jwt.verify(token, SECRET());
            if (!d.purpose && ['super_admin', 'dev', 'employee'].includes(d.role)) return { ok: true, maxAge: 0 };
        } catch { /* invalid token */ }
    }
    return { ok: false };
}

module.exports = { signMediaInResponses, stripSignedMediaParams, verifyMediaRequest, signedUrl };
