// Factory reset: inventory, verified backup, execution.
// The list of what is deleted is the same as the original implementation (routes/admin.js before the fix):
// 30 collections emptied, secretary (employee) accounts deleted, optional removal of the cloud (MEGA) files.
// Kept: Director and developer accounts, application settings, the security history (SecurityEvent),
// and the factory-reset backups themselves.
const zlib = require('zlib');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const COLLECTIONS = [
    ['Student', 'Online / front-desk registrations'],
    ['Message', 'Contact messages'],
    ['Notification', 'Notification bell items'],
    ['LoginSession', 'Login session history'],
    ['AdminActivity', 'Activity log'],
    ['ActivityLog', 'Old activity log'],
    ['Rating', 'Ratings / reviews'],
    ['ServiceRequest', 'CV / application / translation requests'],
    ['Appointment', 'Appointments'],
    ['AttendanceRecord', 'Attendance records'],
    ['AttendanceSession', 'Attendance sessions (QR and manual)'],
    ['CashTransaction', 'Cash register transactions'],
    ['CreditTransaction', 'Secretary credits'],
    ['Grade', 'Grades'],
    ['JobApplication', 'Job applications'],
    ['ManagedStudent', 'Students (student management)'],
    ['MonthlyNote', 'Cash register monthly notes'],
    ['PaymentHistory', 'Payment history'],
    ['PaymentReminder', 'Payment reminders'],
    ['PushSubscription', 'Push notification subscriptions'],
    ['StudentMessage', 'Messages to students'],
    ['TelcCandidate', 'TELC candidates'],
    ['TelcEmailTemplate', 'TELC email templates'],
    ['TelcExamMonth', 'TELC exam months'],
    ['UnpaidService', 'Recouvrement (unpaid services)'],
    ['Season', 'Seasons'],
    ['SeasonBackup', 'Season backup records'],
    ['Group', 'Language groups'],
    ['BranchGroup', 'Vocational branches and subgroups'],
    ['Teacher', 'Teacher accounts']
];
const MEGA_FOLDERS = ['/Nisrine Images/student-photos', '/Nisrine Images/student-cin', '/Nisrine Images/receipts',
    '/Nisrine Images/certificates', '/Nisrine Images/registration-photos', '/Nisrine School Registrations'];
const KEPT = ['Director (super admin) and developer accounts', 'Application settings', 'Security history (password recovery, temporary access, resets)', 'Factory-reset backups'];
const BUCKET = 'factoryResetBackups';
const BACKUP_MAX_AGE_MINUTES = 30;

const model = name => require('../models/' + name);
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });
const EJSON = () => mongoose.mongo.BSON.EJSON;

async function inventory() {
    const items = [];
    for (const [name, label] of COLLECTIONS) items.push({ name, label, count: await model(name).countDocuments({}) });
    const employees = await Admin.find({ role: 'employee' }).select('username email').lean();
    items.push({ name: 'Admin (employees)', label: 'Secretary accounts', count: employees.length, accounts: employees.map(e => e.username) });
    return { items, total: items.reduce((s, i) => s + i.count, 0), megaFolders: MEGA_FOLDERS, kept: KEPT };
}

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
}

// Creates the backup in the database's GridFS bucket (not touched by the reset), then reads it back and verifies it.
async function createVerifiedBackup(admin) {
    const data = { format: 'nisrine-factory-reset-backup/1', createdAt: new Date(), createdBy: admin.username, collections: {} };
    const counts = {};
    for (const [name] of COLLECTIONS) {
        const docs = await model(name).collection.find({}).toArray();
        data.collections[name] = docs; counts[name] = docs.length;
    }
    const employees = await Admin.collection.find({ role: 'employee' }).toArray();
    data.collections['Admin (employees)'] = employees; counts['Admin (employees)'] = employees.length;

    const json = Buffer.from(EJSON().stringify(data, { relaxed: false }));
    const gz = zlib.gzipSync(json);
    const sha256 = crypto.createHash('sha256').update(gz).digest('hex');
    const filename = `factory-reset-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json.gz`;
    const metadata = { createdBy: String(admin._id), createdByName: admin.username, counts, sha256, verified: false };

    const id = await new Promise((resolve, reject) => {
        const up = bucket().openUploadStream(filename, { metadata });
        up.on('error', reject); up.on('finish', () => resolve(up.id)); up.end(gz);
    });

    // Verification: read back, compare checksum, decompress, parse, compare counts
    const back = await streamToBuffer(bucket().openDownloadStream(id));
    const problems = [];
    if (crypto.createHash('sha256').update(back).digest('hex') !== sha256) problems.push('checksum differs');
    let parsed;
    try { parsed = EJSON().parse(zlib.gunzipSync(back).toString('utf8'), { relaxed: false }); } catch (e) { problems.push('cannot be read: ' + e.message); }
    if (parsed) for (const [k, n] of Object.entries(counts)) if ((parsed.collections[k] || []).length !== n) problems.push(`${k}: ${(parsed.collections[k] || []).length} ≠ ${n}`);
    const verified = problems.length === 0;
    await mongoose.connection.db.collection(`${BUCKET}.files`).updateOne({ _id: id }, { $set: { 'metadata.verified': verified, 'metadata.verifiedAt': new Date(), 'metadata.problems': problems } });
    return { id: String(id), filename, sizeBytes: gz.length, sha256, counts, verified, problems };
}

async function getBackup(id) {
    let oid; try { oid = new mongoose.Types.ObjectId(String(id)); } catch { return null; }
    return mongoose.connection.db.collection(`${BUCKET}.files`).findOne({ _id: oid });
}
function openBackupStream(id) { return bucket().openDownloadStream(new mongoose.Types.ObjectId(String(id))); }

async function execute({ includeCloudFiles, megaService }) {
    const results = { collections: {}, mega: {} };
    for (const [name] of COLLECTIONS) {
        try { results.collections[name] = (await model(name).deleteMany({})).deletedCount; }
        catch (err) { results.collections[name] = `Error: ${err.message}`; }
    }
    try { results.collections['Admin (employees)'] = (await Admin.deleteMany({ role: 'employee' })).deletedCount; }
    catch (err) { results.collections['Admin (employees)'] = `Error: ${err.message}`; }

    if (includeCloudFiles && megaService) {
        for (const folder of MEGA_FOLDERS) {
            try {
                const list = await megaService.listFiles(folder);
                let deleted = 0;
                if (list.success) for (const f of list.files) if (!f.isFolder) { await megaService.deleteFile(f.path); deleted++; }
                results.mega[folder] = `${deleted} files deleted`;
            } catch (err) { results.mega[folder] = `Error: ${err.message}`; }
        }
    } else {
        results.mega = { note: 'Cloud files were kept (option not selected).' };
    }
    return results;
}

module.exports = { COLLECTIONS, MEGA_FOLDERS, KEPT, BACKUP_MAX_AGE_MINUTES, inventory, createVerifiedBackup, getBackup, openBackupStream, execute };
