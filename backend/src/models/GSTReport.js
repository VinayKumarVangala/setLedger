const mongoose = require('mongoose');

const gstReportSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['GSTR1', 'GSTR3B', 'GSTR2A', 'GSTR9']
  },
  period: {
    month: { type: Number, required: true },
    year: { type: Number, required: true }
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  summary: {
    totalTaxableValue: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalInvoices: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'filed', 'amended'],
    default: 'draft'
  },
  filedAt: Date,
  filedBy: String,
  amendments: [{
    amendedAt: Date,
    amendedBy: String,
    reason: String,
    changes: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

gstReportSchema.index({ userId: 1, reportType: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });

module.exports = mongoose.model('GSTReport', gstReportSchema);