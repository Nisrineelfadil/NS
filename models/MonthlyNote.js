const mongoose = require('mongoose');

const monthlyNoteSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  addedByName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Unique index to ensure one note per month
monthlyNoteSchema.index({ year: 1, month: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
monthlyNoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MonthlyNote = mongoose.model('MonthlyNote', monthlyNoteSchema);

module.exports = MonthlyNote;
