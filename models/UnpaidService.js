const mongoose = require('mongoose');

const unpaidServiceSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  serviceType: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  dateRequested: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'cancelled'],
    default: 'unpaid'
  },
  datePaid: {
    type: Date,
    default: null
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
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  paidByName: {
    type: String,
    default: null
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

// Indexes for faster queries
unpaidServiceSchema.index({ status: 1 });
unpaidServiceSchema.index({ dateRequested: -1 });
unpaidServiceSchema.index({ clientName: 1 });

// Update the updatedAt timestamp before saving
unpaidServiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get summary statistics
unpaidServiceSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    unpaid: { count: 0, totalAmount: 0 },
    paid: { count: 0, totalAmount: 0 },
    cancelled: { count: 0, totalAmount: 0 }
  };
  
  stats.forEach(s => {
    result[s._id] = {
      count: s.count,
      totalAmount: s.totalAmount
    };
  });
  
  return result;
};

// Static method to get age of unpaid services
unpaidServiceSchema.statics.getUnpaidWithAge = async function() {
  const unpaidServices = await this.find({ status: 'unpaid' }).sort({ dateRequested: 1 });
  
  return unpaidServices.map(service => {
    const now = new Date();
    const requested = new Date(service.dateRequested);
    const diffTime = Math.abs(now - requested);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let ageCategory = 'recent'; // < 7 days
    if (diffDays > 30) {
      ageCategory = 'very_old'; // > 30 days (red)
    } else if (diffDays > 14) {
      ageCategory = 'old'; // 14-30 days (orange)
    } else if (diffDays > 7) {
      ageCategory = 'moderate'; // 7-14 days (yellow)
    }
    
    return {
      ...service.toObject(),
      ageDays: diffDays,
      ageCategory
    };
  });
};

const UnpaidService = mongoose.model('UnpaidService', unpaidServiceSchema);

module.exports = UnpaidService;
