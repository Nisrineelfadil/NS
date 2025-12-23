const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending'],
    default: 'completed'
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
  },
  receiptImage: {
    data: {
      type: String,
      default: null
    },
    mimeType: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    uploadedByName: {
      type: String,
      default: null
    }
  }
});

// Index for faster queries
cashTransactionSchema.index({ year: 1, month: 1 });
cashTransactionSchema.index({ type: 1 });
cashTransactionSchema.index({ category: 1 });
cashTransactionSchema.index({ date: -1 });

// Update the updatedAt timestamp before saving
cashTransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get monthly summary
cashTransactionSchema.statics.getMonthlySummary = async function(year, month) {
  const transactions = await this.find({ year, month });
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netResult = income - expenses;
  
  // Get top categories
  const categoryTotals = {};
  transactions.forEach(t => {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = { income: 0, expense: 0, type: t.type };
    }
    if (t.type === 'income') {
      categoryTotals[t.category].income += t.amount;
    } else {
      categoryTotals[t.category].expense += t.amount;
    }
  });
  
  const topExpenseCategory = Object.entries(categoryTotals)
    .filter(([_, data]) => data.expense > 0)
    .sort(([_, a], [__, b]) => b.expense - a.expense)[0];
  
  const topIncomeSource = Object.entries(categoryTotals)
    .filter(([_, data]) => data.income > 0)
    .sort(([_, a], [__, b]) => b.income - a.income)[0];
  
  return {
    totalIncome: income,
    totalExpenses: expenses,
    netResult,
    isProfitable: netResult >= 0,
    topExpenseCategory: topExpenseCategory ? {
      name: topExpenseCategory[0],
      amount: topExpenseCategory[1].expense
    } : null,
    topIncomeSource: topIncomeSource ? {
      name: topIncomeSource[0],
      amount: topIncomeSource[1].income
    } : null,
    categoryBreakdown: categoryTotals,
    transactionCount: transactions.length
  };
};

// Static method to get yearly overview
cashTransactionSchema.statics.getYearlyOverview = async function(year) {
  const overview = [];
  
  for (let month = 1; month <= 12; month++) {
    const summary = await this.getMonthlySummary(year, month);
    overview.push({
      month,
      ...summary
    });
  }
  
  return overview;
};

// Static method to calculate insights
cashTransactionSchema.statics.getMonthlyInsights = async function(year, month) {
  const currentMonth = await this.getMonthlySummary(year, month);
  const previousMonth = month > 1 
    ? await this.getMonthlySummary(year, month - 1)
    : await this.getMonthlySummary(year - 1, 12);
  
  const insights = [];
  
  // Income comparison
  if (previousMonth.totalIncome > 0) {
    const incomeChange = ((currentMonth.totalIncome - previousMonth.totalIncome) / previousMonth.totalIncome) * 100;
    if (Math.abs(incomeChange) > 5) {
      insights.push({
        type: incomeChange > 0 ? 'positive' : 'negative',
        message: `Income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}% compared to last month.`
      });
    } else {
      insights.push({
        type: 'neutral',
        message: 'Income remained stable.'
      });
    }
  }
  
  // Expense comparison
  if (previousMonth.totalExpenses > 0) {
    const expenseChange = ((currentMonth.totalExpenses - previousMonth.totalExpenses) / previousMonth.totalExpenses) * 100;
    if (Math.abs(expenseChange) > 5) {
      insights.push({
        type: expenseChange < 0 ? 'positive' : 'negative',
        message: `Expenses ${expenseChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`
      });
    }
  }
  
  // Profit margin comparison
  if (previousMonth.totalIncome > 0 && currentMonth.totalIncome > 0) {
    const currentMargin = (currentMonth.netResult / currentMonth.totalIncome) * 100;
    const previousMargin = (previousMonth.netResult / previousMonth.totalIncome) * 100;
    const marginChange = currentMargin - previousMargin;
    
    if (Math.abs(marginChange) > 3) {
      insights.push({
        type: marginChange > 0 ? 'positive' : 'negative',
        message: `Profit margin ${marginChange > 0 ? 'improved' : 'decreased'} by ${Math.abs(marginChange).toFixed(1)}%.`
      });
    }
  }
  
  return insights;
};

const CashTransaction = mongoose.model('CashTransaction', cashTransactionSchema);

module.exports = CashTransaction;
