const mongoose = require('mongoose');

const paymentScheduleSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  orgId: { type: String, required: true, index: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true, index: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'due', 'overdue', 'paid'], 
    default: 'scheduled',
    index: true 
  },
  paymentHistory: [{
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'], required: true },
    reference: String,
    notes: String
  }],
  reminderSent: { type: Boolean, default: false },
  nextReminderDate: Date
}, { 
  timestamps: true,
  collection: 'paymentSchedule'
});

paymentScheduleSchema.index({ orgId: 1, status: 1 });
paymentScheduleSchema.index({ orgId: 1, dueDate: 1 });
paymentScheduleSchema.index({ orgId: 1, nextReminderDate: 1 });

module.exports = mongoose.model('PaymentSchedule', paymentScheduleSchema);