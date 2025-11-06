const mongoose = require('mongoose');

const receivablesSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  orgId: { type: String, required: true, index: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true, index: true },
  status: { 
    type: String, 
    enum: ['outstanding', 'partial', 'collected', 'written_off'], 
    default: 'outstanding',
    index: true 
  },
  paymentHistory: [{
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'], required: true },
    reference: String,
    notes: String
  }],
  agingBucket: { 
    type: String, 
    enum: ['current', '1-30', '31-60', '61-90', '90+'], 
    default: 'current',
    index: true 
  },
  collectionNotes: String
}, { 
  timestamps: true,
  collection: 'receivables'
});

receivablesSchema.index({ orgId: 1, status: 1 });
receivablesSchema.index({ orgId: 1, agingBucket: 1 });
receivablesSchema.index({ orgId: 1, dueDate: 1 });

module.exports = mongoose.model('Receivables', receivablesSchema);