// CFG-03 — keep development and production databases apart.
//
// Production (Vercel) runs with NODE_ENV=production. Everywhere else (a developer's computer, scripts, tests) the
// application refuses to connect to a non-local MongoDB, so a local run can never modify real school data.
// An approved, deliberate procedure on production data must set ALLOW_PRODUCTION_DB_ACCESS=I-UNDERSTAND for
// that one command (it is never set in .env).
const LOCAL_URI = /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//;

// Vercel always sets VERCEL=1 on its servers (production and preview deployments); NODE_ENV=production is the
// standard flag elsewhere. A developer computer has neither (the local launcher sets VERCEL to an empty value).
function isProductionRuntime() {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}
function isLocalDatabase(uri = process.env.MONGODB_URI) {
    return LOCAL_URI.test(String(uri || ''));
}
// Safe description for logs and /api/health (never contains credentials)
function describeDatabase(uri = process.env.MONGODB_URI) {
    const u = String(uri || '');
    if (!u) return { location: 'not configured', name: '' };
    const name = (u.split('?')[0].split('/').pop() || '').slice(0, 40);
    return { location: isLocalDatabase(u) ? 'local' : 'remote', name };
}
function remoteAccessApproved() {
    return process.env.ALLOW_PRODUCTION_DB_ACCESS === 'I-UNDERSTAND';
}

// Throws when a non-production process tries to use a remote database without explicit approval.
function assertDatabaseAllowed(uri = process.env.MONGODB_URI, context = 'application') {
    if (isProductionRuntime() || isLocalDatabase(uri) || remoteAccessApproved()) return describeDatabase(uri);
    const msg = `REFUSED (${context}): this ${process.env.NODE_ENV || 'development'} process would connect to a REMOTE database ` +
        `(possibly the production school data). Use the local development database (mongodb://127.0.0.1:27017/nisrine_dev), ` +
        `or run an approved procedure with ALLOW_PRODUCTION_DB_ACCESS=I-UNDERSTAND.`;
    const err = new Error(msg); err.code = 'REMOTE_DB_REFUSED'; throw err;
}

// For maintenance scripts: call at the very top. Loads .env, checks the target, exits with code 2 when refused.
function guardScript(scriptName) {
    try { require('dotenv').config(); } catch { /* dotenv optional */ }
    try {
        const d = assertDatabaseAllowed(process.env.MONGODB_URI, `script ${scriptName}`);
        console.log(`🛡️  ${scriptName}: database ${d.location}${d.name ? ' / ' + d.name : ''}`);
    } catch (e) {
        console.error('\n⛔ ' + e.message + '\n');
        process.exit(2);
    }
}

module.exports = { isProductionRuntime, isLocalDatabase, describeDatabase, assertDatabaseAllowed, guardScript };
