const mongoose = require('mongoose');

// ACT-01 / SEC-07 — permanent activity history ("who did what, when, before → after").
// Readable by the Director and the development team only (routes/auditLog.js). Entries can never be modified or
// deleted through the application: every update/delete operation on this model is refused below. When a business
// record (student, payment…) is deleted, its history stays, with a short label identifying what was deleted.
const auditEventSchema = new mongoose.Schema({
    at: { type: Date, default: Date.now, index: true },
    actor: {
        id: { type: String, default: null, index: true },
        name: { type: String, default: '' },
        role: { type: String, default: '' },          // super_admin | dev | employee | teacher | student | system | public
        temporaryAccess: { type: Boolean, default: false }
    },
    action: { type: String, required: true, index: true }, // e.g. student.created, payment.marked_paid, attendance.corrected
    module: { type: String, required: true, index: true }, // students | groups | payments | cash | attendance | grades | registrations | accounts | settings | seasons | system
    target: {
        type: { type: String, default: '' },
        id: { type: String, default: null, index: true },
        label: { type: String, default: '' }           // e.g. student name — enough to identify a deleted record
    },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, default: '' },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' }
}, { versionKey: false });

auditEventSchema.index({ module: 1, at: -1 });
auditEventSchema.index({ 'actor.id': 1, at: -1 });

// Immutable: refuse every modification or deletion made through Mongoose.
const refuse = function (next) { next(new Error('Audit history entries cannot be modified or deleted')); };
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove']) {
    auditEventSchema.pre(op, refuse);
}
auditEventSchema.pre('save', function (next) { if (!this.isNew) return next(new Error('Audit history entries cannot be modified')); next(); });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
