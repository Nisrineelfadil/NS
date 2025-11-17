const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Index for efficient queries
ratingSchema.index({ status: 1, submittedAt: -1 });
ratingSchema.index({ status: 1, stars: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
