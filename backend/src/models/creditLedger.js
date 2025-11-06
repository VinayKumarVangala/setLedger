const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'], required: true },
  reference: String,
  notes: String
}, { _id: false });

const creditLedgerSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  orgId: { type: String, required: true, index: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'partial', 'paid', 'overdue'], 
    default: 'pending',
    index: true 
  },
  paymentHistory: [paymentHistorySchema]
}, { 
  timestamps: true,
  collection: 'creditLedger'
});

// Pre-save middleware to update status based on balance
creditLedgerSchema.pre('save', function(next) {
  if (this.balanceAmount <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.dueDate < new Date() && this.balanceAmount > 0) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
  next();
});

creditLedgerSchema.index({ orgId: 1, status: 1 });
creditLedgerSchema.index({ orgId: 1, dueDate: 1 });
creditLedgerSchema.index({ orgId: 1, customerId: 1 });

module.exports = mongoose.model('CreditLedger', creditLedgerSchema);