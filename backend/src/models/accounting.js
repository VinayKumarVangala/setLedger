const mongoose = require('mongoose');

// Chart of Accounts Schema
const accountSchema = new mongoose.Schema({
  accountID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'], 
    required: true 
  },
  subType: { 
    type: String, 
    enum: ['current_asset', 'fixed_asset', 'current_liability', 'long_term_liability', 
           'owner_equity', 'sales_revenue', 'other_revenue', 'cogs', 'operating_expense', 'other_expense']
  },
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Journal Entry Schema
const journalEntrySchema = new mongoose.Schema({
  entryID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  entryNumber: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  reference: {
    type: { type: String, enum: ['invoice', 'purchase', 'payment', 'adjustment', 'import'] },
    id: String,
    number: String
  },
  entries: [{
    accountID: { type: String, required: true },
    accountName: { type: String, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: String
  }],
  totalDebit: { type: Number, required: true },
  totalCredit: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'posted'], default: 'posted' },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// General Ledger Schema
const ledgerSchema = new mongoose.Schema({
  ledgerID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  accountID: { type: String, required: true, index: true },
  entryID: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  reference: {
    type: String,
    id: String
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
accountSchema.index({ orgID: 1, code: 1 }, { unique: true });
journalEntrySchema.index({ orgID: 1, entryNumber: 1 }, { unique: true });
journalEntrySchema.index({ orgID: 1, date: -1 });
ledgerSchema.index({ orgID: 1, accountID: 1, date: -1 });

module.exports = {
  Account: mongoose.model('Account', accountSchema),
  JournalEntry: mongoose.model('JournalEntry', journalEntrySchema),
  Ledger: mongoose.model('Ledger', ledgerSchema)
};