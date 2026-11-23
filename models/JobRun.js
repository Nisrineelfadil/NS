const mongoose = require('mongoose');

// CFG-01 — one document per automatic job run (payments + attendance), for the Director and the developer.
const jobRunSchema = new mongoose.Schema({
    job: { type: String, required: true, index: true },        // 'daily'
    trigger: { type: String, default: 'cron' },                 // cron | page | manual | local-timer
    mode: { type: String, enum: ['preview', 'apply'], required: true },
    startedAt: { type: Date, default: Date.now, index: true },
    finishedAt: { type: Date, default: null },
    ok: { type: Boolean, default: false },
    summary: { type: mongoose.Schema.Types.Mixed, default: null }, // counts
    sample: { type: mongoose.Schema.Types.Mixed, default: null },  // first changes, for checking
    errors: { type: [String], default: [] }
}, { versionKey: false, suppressReservedKeysWarning: true });

module.exports = mongoose.model('JobRun', jobRunSchema);
