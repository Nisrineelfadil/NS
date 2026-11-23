// ACT-01 — automatic activity history for every successful change made in the application.
//
// For important records the document is read BEFORE the change, so the history keeps "before → after" for the
// fields that matter and, for deletions, enough to identify what was deleted (name), never CIN numbers, images or
// passwords. Every other successful write is still recorded in a simpler form. The entry is written BEFORE the
// answer is sent (work started after the answer can be lost on serverless hosting). Recording never blocks the
// school's work: on failure the answer is sent anyway.
const mongoose = require('mongoose');
const { audit, changes, clean } = require('../services/audit');

const ID = '([a-f0-9]{24})';
const STUDENT_FIELDS = ['fullName', 'phoneNumber', 'parentPhone', 'schoolEmail', 'groupName', 'branchSubgroupName', 'formation', 'filiere', 'status', 'paymentPlan', 'paymentAmount', 'paymentDate', 'paymentStatus', 'reminderDaysBefore', 'notes'];

// Records read before the change (model, label, fields compared)
const RULES = [
    { re: new RegExp(`^/api/student-management/students/${ID}$`), methods: ['PUT', 'DELETE'], module: 'students', model: 'ManagedStudent', label: d => d.fullName, fields: STUDENT_FIELDS,
      action: (m, diff) => m === 'DELETE' ? 'student.deleted' : diff.changed.includes('status') ? 'student.status_changed' : (diff.changed.includes('groupName') || diff.changed.includes('branchSubgroupName')) ? 'student.group_changed' : diff.changed.some(f => f.startsWith('payment')) ? 'student.payment_details_changed' : 'student.updated' },
    { re: new RegExp(`^/api/student-management/students/${ID}/mark-paid$`), methods: ['PUT', 'POST'], module: 'payments', model: 'ManagedStudent', label: d => d.fullName, fields: ['paymentStatus', 'paymentDate', 'paymentAmount'], action: () => 'payment.marked_paid' },
    { re: new RegExp(`^/api/student-management/groups/${ID}$`), methods: ['PUT', 'DELETE'], module: 'groups', model: 'Group', label: d => d.name, fields: ['name', 'formation', 'level', 'schedule', 'status', 'maxStudents', 'teacher'], action: m => m === 'DELETE' ? 'group.deleted' : 'group.updated' },
    { re: new RegExp(`^/api/branch-groups/${ID}/subgroups/${ID}$`), methods: ['PUT', 'DELETE'], idIndex: 2, module: 'groups', model: 'Group', label: d => d.name, fields: ['name', 'status', 'maxStudents'], action: m => m === 'DELETE' ? 'subgroup.deleted' : 'subgroup.updated' },
    { re: new RegExp(`^/api/cash-register/transactions/${ID}$`), methods: ['PUT', 'DELETE'], module: 'cash', model: 'CashTransaction', label: d => `${d.type || ''} ${d.category || ''} ${d.amount || ''} MAD`.trim(), fields: ['type', 'category', 'amount', 'date', 'description', 'paymentMethod'], action: m => m === 'DELETE' ? 'cash.deleted' : 'cash.updated' },
    { re: new RegExp(`^/api/grades/teacher/grades/${ID}$`), methods: ['PUT', 'DELETE'], module: 'grades', model: 'Grade', label: d => `${d.studentName || ''} — ${d.formation || ''}`, fields: ['score', 'maxScore', 'comments', 'examDate'], action: (m, diff) => m === 'DELETE' ? 'grade.deleted' : (diff.changed.length === 1 && diff.changed[0] === 'comments') ? 'grade.comment_changed' : 'grade.updated' },
    { re: new RegExp(`^/api/admin/students/${ID}/status$`), methods: ['PUT'], module: 'registrations', model: 'Student', label: d => d.fullName, fields: ['status'], action: (m, diff, req) => req.body && req.body.status === 'approved' ? 'registration.approved' : req.body && req.body.status === 'rejected' ? 'registration.rejected' : 'registration.status_changed' },
    { re: new RegExp(`^/api/admin/students/${ID}$`), methods: ['DELETE', 'PUT'], module: 'registrations', model: 'Student', label: d => d.fullName, fields: ['fullName', 'phoneNumber', 'city', 'formationChoisie', 'status'], action: m => m === 'DELETE' ? 'registration.deleted' : 'registration.updated' },
    { re: new RegExp(`^/api/seasons/${ID}$`), methods: ['PUT', 'DELETE'], module: 'seasons', model: 'Season', label: d => d.name, fields: ['name', 'status', 'startDate', 'endDate'], action: m => m === 'DELETE' ? 'season.deleted' : 'season.updated' },
    { re: new RegExp(`^/api/seasons/${ID}/activate$`), methods: ['POST', 'PUT'], module: 'seasons', model: 'Season', label: d => d.name, fields: ['status'], action: () => 'season.activated' },
    { re: new RegExp(`^/api/admin/employees/${ID}/toggle$`), methods: ['PUT'], module: 'accounts', model: 'Admin', label: d => d.username, fields: ['isActive'], action: () => 'account.activation_changed' },
    { re: new RegExp(`^/api/admin/employees/${ID}$`), methods: ['DELETE'], module: 'accounts', model: 'Admin', label: d => d.username, fields: ['username', 'email', 'role'], action: () => 'account.deleted' },
    { re: new RegExp(`^/api/admin/employees/${ID}/change-password$`), methods: ['PUT'], module: 'accounts', model: 'Admin', label: d => d.username, fields: [], action: () => 'account.password_set' },
    { re: new RegExp(`^/api/grades/admin/teachers/${ID}$`), methods: ['PUT', 'DELETE'], module: 'accounts', model: 'Teacher', label: d => d.fullName, fields: ['fullName', 'phoneNumber', 'formations', 'status'], action: m => m === 'DELETE' ? 'teacher.deleted' : 'teacher.updated' },
    { re: /^\/api\/admin\/settings$/, methods: ['PUT'], module: 'settings', model: 'Settings', single: true, label: () => 'Réglages', fields: ['isRegistrationOpen', 'contactPhone', 'isCvServiceOpen', 'isApplyingServiceOpen', 'isTranslationServiceOpen', 'closedMessage'], action: () => 'settings.changed' }
];

// Already recorded explicitly elsewhere (no duplicates)
const SKIP = [
    /^\/api\/attendance\/admin\/(update-status|bulk-update-status|student-absences|records|clear-presences|clear-absences)/,
    /^\/api\/season-archive\/[^/]+\/archive$/,
    /^\/api\/student-management\/students\/[^/]+\/clear-absences$/, // recorded per absence by the route itself
    /^\/api\/factory-reset\//, /^\/api\/cron\//, /^\/api\/audit\//,
    /^\/api\/notifications\//, /^\/api\/account-security\/alerts/, /^\/api\/fcm\//, /^\/api\/push-notifications\//
];

const MODULES = [
    [/^\/api\/student-management\/(students\/[^/]+\/(mark-paid|payment)|payment|reminder)/, 'payments'],
    [/^\/api\/student-management\/(groups)/, 'groups'], [/^\/api\/branch-groups/, 'groups'],
    [/^\/api\/student-management\/(messages|students\/[^/]+\/message|send-message|group-message)/, 'messages'],
    [/^\/api\/student-management/, 'students'], [/^\/api\/cash-register/, 'cash'], [/^\/api\/overlapping/, 'payments'],
    [/^\/api\/attendance/, 'attendance'], [/^\/api\/grades\/(admin\/teachers)/, 'accounts'], [/^\/api\/grades/, 'grades'],
    [/^\/api\/(admin-registration|register)/, 'registrations'], [/^\/api\/admin\/students/, 'registrations'],
    [/^\/api\/seasons|^\/api\/season/, 'seasons'], [/^\/api\/admin\/(settings)/, 'settings'],
    [/^\/api\/admin|^\/api\/account-security/, 'accounts'], [/^\/api\/(services|job-applications|telc|appointments|ratings|contact)/, 'services']
];
const moduleOf = p => (MODULES.find(([re]) => re.test(p)) || [null, 'system'])[1];
const verbOf = m => ({ POST: 'created', PUT: 'updated', PATCH: 'updated', DELETE: 'deleted' }[m] || 'other');
const signedIn = req => !!(req.admin || req.teacher || req.student || req.user);

// Special events (sign-in, temporary access, public registration, scans) — chosen from the URL
function special(req, body) {
    const p = req.__auditPath || req.path, b = body || {};
    if (p === '/api/admin/login' || p === '/api/admin/2fa/verify-login') {
        if (b.token && b.admin) return { action: 'account.login', module: 'accounts', actor: { id: String(b.admin.id), name: b.admin.username, role: b.admin.role }, target: { type: 'account', id: b.admin.id, label: b.admin.username }, details: p.endsWith('verify-login') ? 'Login (password + 2FA code)' : 'Login (password)' };
        return null;
    }
    { const m = /^\/api\/grades\/(teacher|student)\/(login|2fa\/verify)$/.exec(p); const who = m && b.token && (b.teacher || b.student);
      if (who) return { action: 'account.login', module: 'accounts', actor: { id: String(who.id || who._id), name: who.fullName, role: m[1] }, target: { type: 'account', id: who.id || who._id, label: who.fullName }, details: m[2] === 'login' ? 'Login (password)' : 'Login (password + 2FA code)' }; }
    if (p === '/api/account-security/recovery/verify' && b.token && b.admin) return { action: 'account.temporary_access', module: 'accounts', actor: { id: String(b.admin.id), name: b.admin.username, role: b.admin.role, temporaryAccess: true }, target: { type: 'account', id: b.admin.id, label: b.admin.username }, details: 'Temporary access after email code (permanent password not used)' };
    if (p === '/api/account-security/recovery/set-password') return { action: 'account.password_changed_after_recovery', module: 'accounts' };
    if (p === '/api/account-security/logout') return { action: 'account.logout', module: 'accounts' };
    if (p === '/api/admin/2fa/enable') return { action: 'account.2fa_enabled', module: 'accounts' };
    if (p === '/api/admin/2fa/disable') return { action: 'account.2fa_disabled', module: 'accounts' };
    if (p === '/api/admin/2fa/update-email') return { action: 'account.2fa_email_changed', module: 'accounts' };
    if (p === '/api/register') { const r = req.body || {}; return { action: 'registration.received', module: 'registrations', actor: { id: null, name: 'website visitor', role: 'public' }, target: { type: 'registration', id: (b.student && b.student._id) || b.id || null, label: r.fullName || '' }, after: { formation: r.formationChoisie, city: r.city } }; }
    if (p === '/api/attendance/scan') return { action: 'attendance.scanned', module: 'attendance', target: { type: 'attendance_session', id: null, label: (b.record && b.record.status) || b.status || '' } };
    if (p === '/api/attendance/admin/manual-attendance') return { action: 'attendance.manual_entered', module: 'attendance', details: `${(req.body.attendanceRecords || []).length} student(s)`, after: { present: (req.body.attendanceRecords || []).filter(r => r.status === 'present').length, late: (req.body.attendanceRecords || []).filter(r => r.status === 'late').length, absent: (req.body.attendanceRecords || []).filter(r => r.status === 'absent').length } };
    if (p === '/api/attendance/generate') return { action: 'attendance.qr_session_opened', module: 'attendance' };
    if (/^\/api\/attendance\/cancel\//.test(p)) return { action: 'attendance.qr_session_cancelled', module: 'attendance' };
    if (p === '/api/student-management/students' && req.method === 'POST') { const s = b.student || {}; return { action: 'student.created', module: 'students', target: { type: 'student', id: s._id || null, label: s.fullName || (req.body && req.body.fullName) || '' }, after: { group: s.groupName, formation: s.formation, paymentPlan: s.paymentPlan, paymentAmount: s.paymentAmount } }; }
    if (p === '/api/admin-registration/register') { const s = b.student || {}; return { action: 'registration.created_front_desk', module: 'registrations', target: { type: 'registration', id: s._id || s.id || null, label: (req.body && req.body.fullName) || s.fullName || '' } }; }
    if (p === '/api/grades/teacher/grades' && req.method === 'POST') { const g = b.grade || {}; return { action: 'grade.created', module: 'grades', target: { type: 'grade', id: g._id || null, label: `${g.studentName || ''} — ${g.formation || ''}` }, after: { score: g.score, maxScore: g.maxScore, comments: g.comments } }; }
    if (p === '/api/cash-register/transactions' && req.method === 'POST') { const t = b.transaction || {}; return { action: 'cash.created', module: 'cash', target: { type: 'cash_transaction', id: t._id || null, label: `${t.type || ''} ${t.category || ''} ${t.amount || ''} MAD`.trim() }, after: { type: t.type, category: t.category, amount: t.amount, date: t.date, description: t.description } }; }
    return null;
}

async function preload(req, res, next) {
    try {
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || SKIP.some(re => re.test(req.path))) return next();
        const rule = RULES.find(r => r.methods.includes(req.method) && r.re.test(req.path));
        if (rule) {
            const m = req.path.match(rule.re);
            const id = rule.single ? null : m[rule.idIndex || 1];
            const Model = mongoose.models[rule.model] || (() => { try { return require('../models/' + rule.model); } catch { return null; } })();
            if (Model) {
                await require('../config/database')(); // this runs before the route's own connection step
                const doc = rule.single ? await Model.findOne().lean() : await Model.findById(id).lean();
                req.__audit = { rule, id: id || (doc && String(doc._id)), before: doc };
            }
        }
    } catch (e) { /* never block */ }
    next();
}

function record(req, res, next) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || SKIP.some(re => re.test(req.path))) return next();
    req.__auditPath = req.path; // full path (Express shortens req.path inside mounted routers)
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        const okStatus = res.statusCode >= 200 && res.statusCode < 300;
        const ok = okStatus && !(body && body.success === false);
        if (!ok) return originalJson(body);
        const finish = () => originalJson(body);
        (async () => {
            try {
                const sp = special(req, body);
                if (sp) { await audit(req, { target: {}, ...sp }); return; }
                if (!signedIn(req)) return;
                const a = req.__audit;
                if (a) {
                    const { rule, id, before } = a;
                    let after = null;
                    if (req.method !== 'DELETE' && before) {
                        const Model = mongoose.models[rule.model];
                        after = rule.single ? await Model.findOne().lean() : await Model.findById(id).lean();
                    }
                    const diff = req.method === 'DELETE' ? { before: clean(pick(before, rule.fields)), after: null, changed: [] } : changes(before, after, rule.fields);
                    if (req.method !== 'DELETE' && rule.fields.length && diff.changed.length === 0 && !/marked_paid|password_set/.test(rule.action(req.method, diff, req))) return; // nothing changed
                    await audit(req, {
                        action: rule.action(req.method, diff, req), module: rule.module,
                        target: { type: rule.model, id, label: before ? rule.label(before) : '' },
                        before: diff.before, after: diff.after, reason: (req.body && (req.body.reason || req.body.statusReason)) || ''
                    });
                    return;
                }
                // simpler record for every other successful change
                const P = req.__auditPath, mod = moduleOf(P);
                const pid = (P.match(/[a-f0-9]{24}/) || [null])[0];
                await audit(req, {
                    action: `${mod}.${verbOf(req.method)}`, module: mod,
                    target: { type: mod, id: pid || (body && (body._id || (body.data && body.data._id))) || null, label: '' },
                    after: summarizeBody(req.body), details: `${req.method} ${P}`
                });
            } catch (e) { console.error('Activity history not recorded:', e.message); }
        })().finally(finish);
        return res;
    };
    next();
}

function pick(doc, fields) { if (!doc) return null; const o = {}; for (const f of fields) if (doc[f] !== undefined) o[f] = doc[f]; return o; }
function summarizeBody(b) {
    if (!b || typeof b !== 'object') return null;
    const c = clean(b);
    // keep it short: first 12 keys
    const out = {}; for (const k of Object.keys(c || {}).slice(0, 12)) out[k] = c[k];
    return out;
}

module.exports = { preload, record };
