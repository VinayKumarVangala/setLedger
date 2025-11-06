const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  customerId: { type: String, required: true },
  customerName: String,
  invoiceId: { type: String, required: true },
  reminderDate: { type: Date, default: Date.now },
  mode: { type: String, enum: ['Email', 'Push', 'SMS'], required: true },
  status: { type: String, enum: ['Sent', 'Failed', 'Pending'], default: 'Sent' },
  details: {
    subject: String,
    recipient: String,
    errorMessage: String
  }
}, { 
  timestamps: true,
  collection: 'reminderLogs'
});

reminderLogSchema.index({ orgId: 1, reminderDate: -1 });
reminderLogSchema.index({ orgId: 1, customerId: 1 });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);