const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // orgID_memberID
  orgId: { type: String, required: true },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'high-contrast'], default: 'light' },
    orgTheme: { type: String, enum: ['light', 'dark', 'high-contrast'], default: 'light' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true },
    dashboardLayout: [{ type: String }] // widget order
  },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ orgId: 1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);