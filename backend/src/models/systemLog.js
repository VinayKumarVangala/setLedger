const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: String,
  details: mongoose.Schema.Types.Mixed,
  userId: String,
  timestamp: { type: Date, default: Date.now }
}, { 
  timestamps: false,
  collection: 'systemLogs'
});

systemLogSchema.index({ orgId: 1, timestamp: -1 });
systemLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);