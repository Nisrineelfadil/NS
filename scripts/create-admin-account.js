// Offline creation of a Director (super_admin) or developer (dev) account.
// Replaces the removed public routes /api/admin/setup-super-admin and /api/admin/setup-dev.
//
// Usage (the password is chosen by the person running the script; nothing is hard-coded):
//   node scripts/create-admin-account.js --role dev --username DevTeam --email dev@example.com \
//        --password "<strong password>" [--recovery-email personal@example.com]
//
// --recovery-email registers the address used by "Forgot password?" and enables email 2FA for the account.
// The script refuses to overwrite an existing account. It connects to MONGODB_URI: check which database
// that is before running it.
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

function arg(name) {
    const i = process.argv.indexOf('--' + name);
    return i > -1 ? process.argv[i + 1] : undefined;
}

(async () => {
    const role = arg('role'), username = arg('username'), email = arg('email'), password = arg('password');
    const recoveryEmail = arg('recovery-email');
    if (!['dev', 'super_admin'].includes(role) || !username || !email || !password) {
        console.error('Usage: --role dev|super_admin --username <name> --email <login email> --password <password> [--recovery-email <email>]');
        process.exit(1);
    }
    if (password.length < 10) { console.error('Refused: the password must have at least 10 characters.'); process.exit(1); }
    await mongoose.connect(process.env.MONGODB_URI);
    const clash = await Admin.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
    if (clash) { console.error('Refused: an account with this username or email already exists.'); await mongoose.disconnect(); process.exit(1); }
    const doc = new Admin({ username, email, password, role });
    if (recoveryEmail) { doc.twoFactorEnabled = true; doc.twoFactorEmail = recoveryEmail; }
    await doc.save();
    console.log(`Created ${role} account "${username}" (${email})${recoveryEmail ? ' with a recovery email' : ''}.`);
    await mongoose.disconnect();
})().catch(async e => { console.error('Error:', e.message); try { await mongoose.disconnect(); } catch {} process.exit(1); });
