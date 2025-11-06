const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema({
  customerId: { type: String, required: true, index: true },
  orgId: { type: String, required: true, index: true },
  name: String,
  email: String,
  phone: String,
  creditLimit: { type: Number, default: 100000 },
  currentRiskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Moderate' },
  behaviorCategory: { type: String, enum: ['Reliable', 'Moderate', 'Risky'], default: 'Moderate' },
  behaviorScore: { type: Number, default: 50 },
  lastBehaviorAnalysis: Date,
  lastRiskAssessment: Date,
  creditHistory: [{
    date: Date,
    oldLimit: Number,
    newLimit: Number,
    reason: String,
    riskLevel: String
  }]
}, { 
  timestamps: true,
  collection: 'customerProfiles'
});

customerProfileSchema.index({ orgId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);